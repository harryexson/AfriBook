import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  MessageCircle,
  Send,
  Bot,
  User,
  Car,
  DollarSign,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowRight,
  Loader2,
  History,
  Plus,
  Phone,
  ChevronRight,
  MapPin,
  Star,
  HelpCircle,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const QUICK_TOPICS = [
  { id: 'current_trip', icon: Car, label: 'Current Trip Issue', color: 'bg-blue-100 text-blue-700' },
  { id: 'charge', icon: DollarSign, label: 'Question About a Charge', color: 'bg-green-100 text-green-700' },
  { id: 'lost_item', icon: Package, label: 'Lost Item', color: 'bg-purple-100 text-purple-700' },
  { id: 'safety', icon: AlertTriangle, label: 'Safety Concern', color: 'bg-red-100 text-red-700' },
  { id: 'other', icon: HelpCircle, label: 'Other Questions', color: 'bg-gray-100 text-gray-700' }
];

const QUICK_MESSAGES = {
  current_trip: "I have an issue with my current trip",
  charge: "I have a question about a recent charge on my account",
  lost_item: "I left something in a car during my last ride",
  safety: "I need to report a safety concern",
  other: "I have a general question"
};

export default function Support() {
  const [user, setUser] = useState(null);
  const [recentRides, setRecentRides] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isAITyping, setIsAITyping] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [escalatedToHuman, setEscalatedToHuman] = useState(false);

  const messagesEndRef = useRef(null);
  const isMountedRef = useRef(true);
  const inputRef = useRef(null);

  useEffect(() => {
    isMountedRef.current = true;
    initializeSupport();
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAITyping]);

  const initializeSupport = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Load recent rides for context
      const rides = await base44.entities.Ride.filter(
        { rider_id: currentUser.id },
        '-created_date',
        10
      );
      setRecentRides(rides);

      // Check for active ride
      const active = rides.find(r => ['requested', 'accepted', 'arriving', 'in_progress'].includes(r.status));
      setActiveRide(active);

      // Load conversation history
      await loadConversationHistory();
    } catch (error) {
      console.error('Error initializing support:', error);
      toast.error('Could not load support');
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversationHistory = async () => {
    try {
      const history = await base44.agents.listConversations({ agent_name: "riderSupportAgent" });
      if (isMountedRef.current && Array.isArray(history)) {
        setConversations(history.slice(0, 10));
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const startNewConversation = async (topicId = null) => {
    setIsLoading(true);
    setSelectedTopic(topicId);
    setEscalatedToHuman(false);
    
    try {
      const newConversation = await base44.agents.createConversation({ 
        agent_name: "riderSupportAgent",
        metadata: {
          topic: topicId,
          user_id: user?.id,
          active_ride_id: activeRide?.id
        }
      });

      setConversation(newConversation);
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: getWelcomeMessage(topicId)
      }]);

      // If a topic was selected, send initial context
      if (topicId && QUICK_MESSAGES[topicId]) {
        await sendMessageDirect(QUICK_MESSAGES[topicId], newConversation);
      }

      loadConversationHistory();
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Could not start support chat');
    } finally {
      setIsLoading(false);
    }
  };

  const getWelcomeMessage = (topicId) => {
    const base = "Hi! I'm your Ride-ly support assistant. I have access to your trip history and account information to help you faster.";
    
    if (activeRide) {
      return `${base}\n\nI see you have an active trip right now. Is your issue related to this current ride?`;
    }
    
    if (topicId === 'lost_item') {
      return `${base}\n\nI'm sorry to hear you may have lost something. Let me help you locate it. Can you describe the item and tell me which trip this was from?`;
    }
    
    if (topicId === 'charge') {
      return `${base}\n\nI can help you understand any charges. Which trip or charge are you inquiring about?`;
    }
    
    return `${base}\n\nHow can I help you today?`;
  };

  const loadExistingConversation = async (conv) => {
    setIsLoading(true);
    setShowHistory(false);
    try {
      const fullConversation = await base44.agents.getConversation(conv.id);
      if (isMountedRef.current && fullConversation) {
        setConversation(fullConversation);
        const msgs = Array.isArray(fullConversation.messages) 
          ? fullConversation.messages.filter(Boolean)
          : [];
        setMessages(msgs);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast.error('Could not load conversation');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessageDirect = async (content, conv) => {
    if (!content.trim() || !conv) return;

    setIsSending(true);
    setIsAITyping(true);

    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: tempId,
      role: 'user',
      content: content
    }]);

    try {
      await base44.agents.addMessage(conv.id, {
        role: 'user',
        content: content
      });

      // Check if escalation is needed
      const lowerContent = content.toLowerCase();
      if (lowerContent.includes('speak to human') || 
          lowerContent.includes('talk to agent') ||
          lowerContent.includes('real person') ||
          lowerContent.includes('emergency') ||
          lowerContent.includes('accident')) {
        setEscalatedToHuman(true);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!userInput.trim() || !conversation || isSending) return;

    const currentInput = userInput;
    setUserInput('');
    await sendMessageDirect(currentInput, conversation);
  };

  const escalateToHuman = async () => {
    setEscalatedToHuman(true);
    
    try {
      // Create a support conversation for human agents
      await base44.entities.SupportConversation.create({
        user_id: user.id,
        user_type: 'rider',
        subject: selectedTopic ? QUICK_TOPICS.find(t => t.id === selectedTopic)?.label : 'Support Request',
        category: selectedTopic || 'other',
        status: 'open',
        priority: selectedTopic === 'safety' ? 'urgent' : 'high',
        last_message_at: new Date().toISOString(),
        ai_conversation_id: conversation?.id,
        escalated_from_ai: true
      });

      setMessages(prev => [...prev, {
        id: `escalate-${Date.now()}`,
        role: 'assistant',
        content: "I've connected you with our human support team. A support agent will be with you shortly. You can continue chatting here or check the Support Chat widget for updates.",
        isSystem: true
      }]);

      toast.success('Connected to human support');
    } catch (error) {
      console.error('Error escalating:', error);
      toast.error('Could not connect to human support');
    }
  };

  // Subscribe to conversation updates
  useEffect(() => {
    if (!conversation?.id) return;

    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      if (!isMountedRef.current) return;

      if (data?.messages && Array.isArray(data.messages)) {
        const validMessages = data.messages.filter(msg => msg && typeof msg === 'object');
        
        // Check if AI finished responding
        const lastMsg = validMessages[validMessages.length - 1];
        if (lastMsg?.role === 'assistant' && lastMsg.content) {
          setIsAITyping(false);
        }

        // Keep welcome message if not in response
        const hasWelcome = validMessages.some(m => m.id === 'welcome');
        if (!hasWelcome) {
          setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: getWelcomeMessage(selectedTopic)
          }, ...validMessages]);
        } else {
          setMessages(validMessages);
        }
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [conversation?.id]);

  // Message Bubble Component
  const MessageBubble = ({ message }) => {
    const isUser = message.role === 'user';
    const isSystem = message.isSystem;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}
      >
        {!isUser && (
          <div className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
            isSystem ? "bg-yellow-100" : "bg-blue-100"
          )}>
            {isSystem ? <ShieldAlert className="w-4 h-4 text-yellow-600" /> : <Bot className="w-4 h-4 text-blue-600" />}
          </div>
        )}
        
        <div className={cn("max-w-[80%]", isUser && "order-1")}>
          <div className={cn(
            "rounded-2xl px-4 py-2.5",
            isUser 
              ? "bg-blue-600 text-white" 
              : isSystem 
                ? "bg-yellow-50 border border-yellow-200 text-yellow-900"
                : "bg-white border border-gray-200 text-gray-900"
          )}>
            {isUser ? (
              <p className="text-sm">{message.content}</p>
            ) : (
              <ReactMarkdown className="text-sm prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        </div>

        {isUser && (
          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-gray-600" />
          </div>
        )}
      </motion.div>
    );
  };

  // Recent Ride Card
  const RideCard = ({ ride }) => (
    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Car className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium capitalize">{ride.ride_type}</span>
        </div>
        <Badge className={cn(
          "text-xs",
          ride.status === 'completed' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
        )}>
          {ride.status}
        </Badge>
      </div>
      <p className="text-xs text-gray-600 truncate">{ride.pickup_location?.address}</p>
      <p className="text-xs text-gray-600 truncate">→ {ride.destination?.address}</p>
      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
        <span>{format(new Date(ride.created_date), 'MMM d, h:mm a')}</span>
        {ride.fare?.total_fare && <span className="font-medium">${ride.fare.total_fare.toFixed(2)}</span>}
      </div>
    </div>
  );

  if (isLoading && !conversation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 lg:p-8">
      <Toaster richColors />
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Support</h1>
          <p className="text-gray-600 mt-1">Get help with your trips, charges, or anything else</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chat Area */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              {!conversation ? (
                // Topic Selection
                <CardContent className="flex-1 flex flex-col p-6">
                  <h2 className="text-xl font-semibold mb-6">How can we help?</h2>
                  
                  {/* Active Ride Alert */}
                  {activeRide && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Car className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-blue-900">You have an active trip</p>
                          <p className="text-sm text-blue-700">Need help with this ride?</p>
                        </div>
                        <Button
                          onClick={() => startNewConversation('current_trip')}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Get Help
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* Quick Topics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    {QUICK_TOPICS.map((topic) => (
                      <button
                        key={topic.id}
                        onClick={() => startNewConversation(topic.id)}
                        className={cn(
                          "p-4 rounded-xl border-2 border-transparent text-left transition-all hover:border-blue-300 hover:shadow-md",
                          topic.color
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <topic.icon className="w-6 h-6" />
                          <span className="font-medium">{topic.label}</span>
                          <ChevronRight className="w-5 h-5 ml-auto opacity-50" />
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Previous Conversations */}
                  {conversations.length > 0 && (
                    <div className="mt-auto">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Conversations</h3>
                      <div className="space-y-2">
                        {conversations.slice(0, 3).map((conv) => (
                          <button
                            key={conv.id}
                            onClick={() => loadExistingConversation(conv)}
                            className="w-full p-3 bg-gray-50 rounded-lg text-left hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium truncate">
                                {conv.metadata?.topic ? QUICK_TOPICS.find(t => t.id === conv.metadata.topic)?.label : 'Support Chat'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {format(new Date(conv.created_date), 'MMM d')}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              ) : (
                // Chat Interface
                <>
                  <CardHeader className="border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setConversation(null);
                            setMessages([]);
                            setSelectedTopic(null);
                          }}
                          className="text-white hover:bg-white/20 -ml-2"
                        >
                          ← Back
                        </Button>
                        <div>
                          <CardTitle className="text-lg">Support Chat</CardTitle>
                          <p className="text-xs opacity-90">
                            {escalatedToHuman ? 'Connected to human support' : 'AI-powered assistance'}
                          </p>
                        </div>
                      </div>
                      {!escalatedToHuman && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={escalateToHuman}
                          className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                        >
                          <Phone className="w-4 h-4 mr-1" />
                          Human Agent
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                      <AnimatePresence>
                        {messages.map((msg, idx) => (
                          <MessageBubble key={msg.id || idx} message={msg} />
                        ))}
                      </AnimatePresence>

                      {isAITyping && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex gap-3"
                        >
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                            <div className="flex gap-1">
                              {[0, 1, 2].map((i) => (
                                <motion.div
                                  key={i}
                                  className="w-2 h-2 bg-gray-400 rounded-full"
                                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                                />
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t bg-white">
                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <Input
                          ref={inputRef}
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          placeholder="Describe your issue..."
                          disabled={isSending}
                          className="flex-1"
                        />
                        <Button type="submit" disabled={!userInput.trim() || isSending}>
                          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </>
              )}
            </Card>
          </div>

          {/* Sidebar - Trip Context */}
          <div className="space-y-6">
            {/* Recent Trips */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="w-5 h-5 text-gray-500" />
                  Recent Trips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentRides.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No recent trips</p>
                ) : (
                  recentRides.slice(0, 3).map((ride) => (
                    <RideCard key={ride.id} ride={ride} />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Quick Help */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-gray-500" />
                  Quick Help
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <a href="#" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <p className="text-sm font-medium">How are fares calculated?</p>
                </a>
                <a href="#" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <p className="text-sm font-medium">Cancellation policy</p>
                </a>
                <a href="#" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <p className="text-sm font-medium">Lost & found process</p>
                </a>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-red-900">Emergency?</p>
                    <p className="text-sm text-red-700">Call 911 for immediate help</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
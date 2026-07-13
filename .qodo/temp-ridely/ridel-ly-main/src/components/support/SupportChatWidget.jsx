import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  MessageCircle, 
  Send, 
  X, 
  User, 
  Bot,
  Clock,
  CheckCircle2,
  Star,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const categories = [
  { value: 'account', label: 'Account Issues' },
  { value: 'payment', label: 'Payment & Billing' },
  { value: 'ride_issue', label: 'Ride Issues' },
  { value: 'driver_issue', label: 'Driver Support' },
  { value: 'technical', label: 'Technical Issues' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'other', label: 'Other' }
];

export default function SupportChatWidget({ userType = 'rider' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showNewChatForm, setShowNewChatForm] = useState(false);
  const [newChatData, setNewChatData] = useState({ subject: '', category: '' });
  const [unreadCount, setUnreadCount] = useState(0);
  const [agentsAvailable, setAgentsAvailable] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  const messagesEndRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    initializeWidget();

    const interval = setInterval(() => {
      if (isMountedRef.current && currentUser) {
        loadConversations();
        checkAgentAvailability();
      }
    }, 10000);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (activeConversation) {
      loadMessages();
      const interval = setInterval(() => {
        if (isMountedRef.current) {
          loadMessages();
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [activeConversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeWidget = async () => {
    try {
      const user = await base44.auth.me();
      if (isMountedRef.current) {
        setCurrentUser(user);
        loadConversations();
        checkAgentAvailability();
      }
    } catch (error) {
      console.error('Error initializing widget:', error);
      // Widget can still work without user data loaded initially
    }
  };

  const loadConversations = async () => {
    if (!currentUser?.id) return;

    try {
      const convos = await base44.entities.SupportConversation.filter({
        user_id: currentUser.id,
        status: { $ne: 'closed' }
      }, '-last_message_at').catch(() => []);

      if (isMountedRef.current) {
        setConversations(convos);
        
        const unread = convos.reduce((sum, conv) => sum + (conv.user_unread_count || 0), 0);
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      // Fail silently - set empty array
      if (isMountedRef.current) {
        setConversations([]);
        setUnreadCount(0);
      }
    }
  };

  const checkAgentAvailability = async () => {
    try {
      const agents = await base44.entities.SupportAgent.filter({
        status: { $in: ['online', 'away'] }
      }).catch(() => []);
      
      if (isMountedRef.current) {
        setAgentsAvailable(agents.length);
      }
    } catch (error) {
      console.error('Error checking agents:', error);
      // Fail silently - assume no agents
      if (isMountedRef.current) {
        setAgentsAvailable(0);
      }
    }
  };

  const loadMessages = async () => {
    if (!activeConversation || !currentUser?.id) return;

    try {
      const msgs = await base44.entities.SupportMessage.filter({
        conversation_id: activeConversation.id,
        is_internal: false
      }, 'created_date').catch(() => []);

      if (isMountedRef.current) {
        setMessages(msgs);
        
        const unreadMessages = msgs.filter(m => 
          m.sender_type === 'agent' && !m.is_read_by_user
        );

        if (unreadMessages.length > 0) {
          for (const msg of unreadMessages) {
            await base44.entities.SupportMessage.update(msg.id, {
              is_read_by_user: true,
              read_at: new Date().toISOString()
            }).catch(() => {});
          }

          await base44.entities.SupportConversation.update(activeConversation.id, {
            user_unread_count: 0
          }).catch(() => {});
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      if (isMountedRef.current) {
        setMessages([]);
      }
    }
  };

  const createNewConversation = async () => {
    if (!newChatData.subject || !newChatData.category) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!currentUser?.id) {
      toast.error('Please wait while we load your information');
      return;
    }

    try {
      const conversation = await base44.entities.SupportConversation.create({
        user_id: currentUser.id,
        user_type: userType,
        subject: newChatData.subject,
        category: newChatData.category,
        status: 'open',
        priority: 'medium',
        last_message_at: new Date().toISOString(),
        last_message_by: 'user',
        user_unread_count: 0,
        agent_unread_count: 1
      });

      await base44.entities.SupportMessage.create({
        conversation_id: conversation.id,
        sender_id: currentUser.id,
        sender_type: 'user',
        message_text: `Started conversation: ${newChatData.subject}`,
        is_read_by_user: true,
        is_read_by_agent: false
      });

      setActiveConversation(conversation);
      setShowNewChatForm(false);
      setNewChatData({ subject: '', category: '' });
      loadConversations();
      toast.success('Chat started! An agent will respond soon.');
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to start chat. Please try again.');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || isSending || !currentUser?.id) return;

    setIsSending(true);
    try {
      await base44.entities.SupportMessage.create({
        conversation_id: activeConversation.id,
        sender_id: currentUser.id,
        sender_type: 'user',
        message_text: newMessage,
        is_read_by_user: true,
        is_read_by_agent: false
      });

      await base44.entities.SupportConversation.update(activeConversation.id, {
        last_message_at: new Date().toISOString(),
        last_message_by: 'user',
        status: 'waiting_for_agent',
        agent_unread_count: (activeConversation.agent_unread_count || 0) + 1
      });

      setNewMessage('');
      loadMessages();
      loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const closeConversation = async () => {
    if (!activeConversation) return;

    try {
      await base44.entities.SupportConversation.update(activeConversation.id, {
        status: 'closed',
        resolved_at: new Date().toISOString()
      });

      setActiveConversation(null);
      loadConversations();
      toast.success('Conversation closed');
    } catch (error) {
      console.error('Error closing conversation:', error);
      toast.error('Failed to close conversation');
    }
  };

  const statusColors = {
    open: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    waiting_for_user: 'bg-purple-100 text-purple-800',
    waiting_for_agent: 'bg-orange-100 text-orange-800',
    resolved: 'bg-green-100 text-green-800'
  };

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-16 w-16 rounded-full shadow-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 relative"
            >
              <MessageCircle className="w-7 h-7" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white px-2 py-1 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed ${isMinimized ? 'bottom-6 right-6' : 'bottom-6 right-6'} z-50 ${isMinimized ? 'w-80' : 'w-96 h-[600px]'} shadow-2xl`}
          >
            <Card className="h-full flex flex-col">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-6 h-6" />
                    <div>
                      <CardTitle className="text-lg">Support Chat</CardTitle>
                      <p className="text-xs opacity-90 flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${agentsAvailable > 0 ? 'bg-green-400' : 'bg-gray-400'} animate-pulse`} />
                        {agentsAvailable > 0 ? `${agentsAvailable} agents online` : 'Leave a message'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsMinimized(!isMinimized)}
                      className="text-white hover:bg-white/20"
                    >
                      {isMinimized ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(false)}
                      className="text-white hover:bg-white/20"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {!isMinimized && (
                <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                  {/* Conversation List */}
                  {!activeConversation && !showNewChatForm && (
                    <div className="flex-1 flex flex-col">
                      <div className="p-4 border-b">
                        <Button
                          onClick={() => setShowNewChatForm(true)}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                          disabled={!currentUser}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Start New Chat
                        </Button>
                      </div>

                      <div className="flex-1 overflow-y-auto">
                        {conversations.length === 0 ? (
                          <div className="p-8 text-center text-gray-500">
                            <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No active conversations</p>
                            <p className="text-sm mt-1">Start a new chat to get help</p>
                          </div>
                        ) : (
                          <div className="divide-y">
                            {conversations.map((conv) => (
                              <button
                                key={conv.id}
                                onClick={() => setActiveConversation(conv)}
                                className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-semibold text-sm">{conv.subject}</h4>
                                  <Badge className={`text-xs ${statusColors[conv.status]}`}>
                                    {conv.status.replace('_', ' ')}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-500 mb-1">
                                  {categories.find(c => c.value === conv.category)?.label}
                                </p>
                                {conv.user_unread_count > 0 && (
                                  <Badge className="bg-red-500 text-white text-xs">
                                    {conv.user_unread_count} new
                                  </Badge>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* New Chat Form */}
                  {showNewChatForm && (
                    <div className="flex-1 flex flex-col p-4">
                      <Button
                        variant="ghost"
                        onClick={() => setShowNewChatForm(false)}
                        className="mb-4 self-start"
                      >
                        ← Back
                      </Button>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Subject</label>
                          <Input
                            placeholder="Brief description of your issue"
                            value={newChatData.subject}
                            onChange={(e) => setNewChatData({...newChatData, subject: e.target.value})}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Category</label>
                          <Select
                            value={newChatData.category}
                            onValueChange={(value) => setNewChatData({...newChatData, category: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat.value} value={cat.value}>
                                  {cat.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <Button
                          onClick={createNewConversation}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                          disabled={!currentUser}
                        >
                          Start Chat
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Active Conversation */}
                  {activeConversation && (
                    <div className="flex-1 flex flex-col">
                      <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
                        <div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveConversation(null)}
                            className="mb-1"
                          >
                            ← Back
                          </Button>
                          <h4 className="font-semibold text-sm">{activeConversation.subject}</h4>
                          <Badge className={`text-xs mt-1 ${statusColors[activeConversation.status]}`}>
                            {activeConversation.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={closeConversation}
                          className="text-red-600 hover:text-red-700"
                        >
                          Close Chat
                        </Button>
                      </div>

                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[80%] ${msg.sender_type === 'user' ? 'order-2' : 'order-1'}`}>
                              <div className={`rounded-2xl px-4 py-2 ${
                                msg.sender_type === 'user'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}>
                                <p className="text-sm">{msg.message_text}</p>
                              </div>
                              <p className="text-xs text-gray-500 mt-1 px-2">
                                {new Date(msg.created_date).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Input */}
                      <div className="p-3 border-t bg-gray-50">
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Type your message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            disabled={isSending || !currentUser}
                          />
                          <Button
                            onClick={sendMessage}
                            disabled={!newMessage.trim() || isSending || !currentUser}
                            size="icon"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
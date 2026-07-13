import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageCircle, 
  Send, 
  User, 
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  TrendingUp,
  Search,
  Filter,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'account', label: 'Account Issues' },
  { value: 'payment', label: 'Payment & Billing' },
  { value: 'ride_issue', label: 'Ride Issues' },
  { value: 'driver_issue', label: 'Driver Support' },
  { value: 'technical', label: 'Technical Issues' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'other', label: 'Other' }
];

const statusFilters = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting_for_user', label: 'Waiting for User' },
  { value: 'resolved', label: 'Resolved' }
];

export default function AdminSupportPanel() {
  const [user, setUser] = useState(null);
  const [agentProfile, setAgentProfile] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    avgResponseTime: 0
  });

  const messagesEndRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    initializeAgent();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (agentProfile) {
      loadConversations();
      loadStats();

      const interval = setInterval(() => {
        if (isMountedRef.current) {
          loadConversations();
          loadStats();
        }
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [agentProfile, categoryFilter, statusFilter]);

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

  const initializeAgent = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Check if user is admin or support
      if (currentUser.role !== 'admin' && currentUser.internal_role !== 'support' && currentUser.internal_role !== 'admin') {
        toast.error('Access denied. Support role required.');
        setIsLoading(false);
        return;
      }

      // Get or create agent profile
      let agents = await base44.entities.SupportAgent.filter({
        user_id: currentUser.id
      });

      let agent;
      if (agents.length === 0) {
        agent = await base44.entities.SupportAgent.create({
          user_id: currentUser.id,
          status: 'online',
          active_conversations_count: 0,
          max_concurrent_conversations: 5
        });
      } else {
        agent = agents[0];
        // Set status to online
        agent = await base44.entities.SupportAgent.update(agent.id, {
          status: 'online',
          last_active_at: new Date().toISOString()
        });
      }

      setAgentProfile(agent);
    } catch (error) {
      console.error('Error initializing agent:', error);
      toast.error('Failed to initialize support panel');
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversations = async () => {
    try {
      let query = {};
      
      if (statusFilter !== 'all') {
        query.status = statusFilter;
      }
      
      if (categoryFilter !== 'all') {
        query.category = categoryFilter;
      }

      const convos = await base44.entities.SupportConversation.filter(
        query,
        '-last_message_at',
        50
      );

      if (isMountedRef.current) {
        setConversations(convos);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadStats = async () => {
    try {
      const all = await base44.entities.SupportConversation.filter({});
      const open = all.filter(c => c.status === 'open').length;
      const inProgress = all.filter(c => c.status === 'in_progress').length;
      const resolved = all.filter(c => c.status === 'resolved').length;

      if (isMountedRef.current) {
        setStats({
          total: all.length,
          open,
          inProgress,
          resolved,
          avgResponseTime: 8
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadMessages = async () => {
    if (!activeConversation) return;

    try {
      const msgs = await base44.entities.SupportMessage.filter({
        conversation_id: activeConversation.id
      }, 'created_date');

      if (isMountedRef.current) {
        setMessages(msgs);
        
        // Mark as read by agent
        const unreadMessages = msgs.filter(m => 
          m.sender_type === 'user' && !m.is_read_by_agent
        );

        if (unreadMessages.length > 0) {
          for (const msg of unreadMessages) {
            await base44.entities.SupportMessage.update(msg.id, {
              is_read_by_agent: true,
              read_at: new Date().toISOString()
            });
          }

          await base44.entities.SupportConversation.update(activeConversation.id, {
            agent_unread_count: 0
          });
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const takeConversation = async (conversation) => {
    try {
      await base44.entities.SupportConversation.update(conversation.id, {
        assigned_agent_id: user.id,
        status: 'in_progress'
      });

      setActiveConversation({...conversation, assigned_agent_id: user.id, status: 'in_progress'});
      loadConversations();
      toast.success('Conversation assigned to you');
    } catch (error) {
      console.error('Error taking conversation:', error);
      toast.error('Failed to take conversation');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || isSending) return;

    setIsSending(true);
    try {
      await base44.entities.SupportMessage.create({
        conversation_id: activeConversation.id,
        sender_id: user.id,
        sender_type: 'agent',
        message_text: newMessage,
        is_read_by_user: false,
        is_read_by_agent: true
      });

      await base44.entities.SupportConversation.update(activeConversation.id, {
        last_message_at: new Date().toISOString(),
        last_message_by: 'agent',
        status: 'waiting_for_user',
        user_unread_count: (activeConversation.user_unread_count || 0) + 1
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

  const addInternalNote = async () => {
    if (!internalNote.trim() || !activeConversation) return;

    try {
      await base44.entities.SupportMessage.create({
        conversation_id: activeConversation.id,
        sender_id: user.id,
        sender_type: 'agent',
        message_text: internalNote,
        is_internal: true,
        is_read_by_agent: true
      });

      setInternalNote('');
      loadMessages();
      toast.success('Internal note added');
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    }
  };

  const resolveConversation = async () => {
    if (!activeConversation) return;

    try {
      await base44.entities.SupportConversation.update(activeConversation.id, {
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: user.id
      });

      setActiveConversation(null);
      loadConversations();
      toast.success('Conversation resolved');
    } catch (error) {
      console.error('Error resolving conversation:', error);
      toast.error('Failed to resolve conversation');
    }
  };

  const statusColors = {
    open: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    waiting_for_user: 'bg-purple-100 text-purple-800',
    waiting_for_agent: 'bg-orange-100 text-orange-800',
    resolved: 'bg-green-100 text-green-800'
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!agentProfile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card>
          <CardContent className="p-8 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-gray-600">You need support role to access this panel.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredConversations = conversations.filter(conv =>
    conv.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <Toaster richColors />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Support Panel</h1>
          <p className="text-gray-600 mt-2">Manage customer support conversations</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Conversations</p>
                  <p className="text-3xl font-bold mt-2">{stats.total}</p>
                </div>
                <MessageCircle className="w-10 h-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Open</p>
                  <p className="text-3xl font-bold mt-2 text-yellow-600">{stats.open}</p>
                </div>
                <AlertCircle className="w-10 h-10 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-3xl font-bold mt-2 text-blue-600">{stats.inProgress}</p>
                </div>
                <Clock className="w-10 h-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Resolved</p>
                  <p className="text-3xl font-bold mt-2 text-green-600">{stats.resolved}</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card className="h-[calc(100vh-400px)]">
              <CardHeader>
                <CardTitle>Conversations</CardTitle>
                
                {/* Filters */}
                <div className="space-y-3 mt-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusFilters.map(status => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-y-auto h-[calc(100vh-600px)]">
                  {filteredConversations.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No conversations found</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredConversations.map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => setActiveConversation(conv)}
                          className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                            activeConversation?.id === conv.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-sm line-clamp-1">{conv.subject}</h4>
                            {conv.agent_unread_count > 0 && (
                              <Badge className="bg-red-500 text-white text-xs ml-2">
                                {conv.agent_unread_count}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={`text-xs ${statusColors[conv.status]}`}>
                              {conv.status.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {categories.find(c => c.value === conv.category)?.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {conv.user_type === 'driver' ? '🚗 Driver' : '👤 Rider'}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Conversation */}
          <div className="lg:col-span-2">
            {!activeConversation ? (
              <Card className="h-[calc(100vh-400px)] flex items-center justify-center">
                <CardContent className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Select a conversation to start</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-[calc(100vh-400px)] flex flex-col">
                <CardHeader className="flex-shrink-0 border-b">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{activeConversation.subject}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={statusColors[activeConversation.status]}>
                          {activeConversation.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {categories.find(c => c.value === activeConversation.category)?.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!activeConversation.assigned_agent_id && (
                        <Button
                          onClick={() => takeConversation(activeConversation)}
                          className="bg-blue-600"
                        >
                          Take Conversation
                        </Button>
                      )}
                      <Button
                        onClick={resolveConversation}
                        variant="outline"
                        className="text-green-600"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Resolve
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto mb-4 space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_type === 'agent' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.is_internal ? (
                          <div className="max-w-[80%] bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-yellow-800 mb-1">Internal Note</p>
                            <p className="text-sm text-gray-700">{msg.message_text}</p>
                          </div>
                        ) : (
                          <div className={`max-w-[80%]`}>
                            <div className={`rounded-2xl px-4 py-2 ${
                              msg.sender_type === 'agent'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}>
                              <p className="text-sm">{msg.message_text}</p>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 px-2">
                              {new Date(msg.created_date).toLocaleTimeString()}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  <Tabs defaultValue="message" className="flex-shrink-0">
                    <TabsList className="w-full">
                      <TabsTrigger value="message" className="flex-1">Message</TabsTrigger>
                      <TabsTrigger value="note" className="flex-1">Internal Note</TabsTrigger>
                    </TabsList>

                    <TabsContent value="message" className="mt-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type your message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          disabled={isSending}
                        />
                        <Button
                          onClick={sendMessage}
                          disabled={!newMessage.trim() || isSending}
                          className="bg-blue-600"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="note" className="mt-3">
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Add internal note (only visible to agents)..."
                          value={internalNote}
                          onChange={(e) => setInternalNote(e.target.value)}
                          rows={3}
                        />
                        <Button
                          onClick={addInternalNote}
                          disabled={!internalNote.trim()}
                          className="bg-yellow-600"
                        >
                          Add Note
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
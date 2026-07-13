import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, Loader2, User, History, Plus, Check, CheckCheck } from 'lucide-react';
import { Toaster, toast } from "sonner";
import { motion, AnimatePresence } from 'framer-motion';
import AITypingIndicator from '../components/chat/AITypingIndicator';
import AIQuickReplies from '../components/chat/AIQuickReplies';
import AIMessageStatus from '../components/chat/AIMessageStatus';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

const welcomeMessage = {
    id: 'welcome_msg',
    role: 'assistant',
    content: "Hello! I'm your personal food ordering assistant. What are you in the mood for today? You can ask for a type of food, a specific restaurant, or even a particular dish.",
    timestamp: new Date().toISOString(),
    status: 'read'
};

export default function TextToOrderPage() {
    const [conversation, setConversation] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([welcomeMessage]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [isAITyping, setIsAITyping] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showQuickReplies, setShowQuickReplies] = useState(true);
    const messagesEndRef = useRef(null);
    const location = useLocation();
    const isMountedRef = useRef(true);
    const inputRef = useRef(null);

    // Load conversation history
    useEffect(() => {
        isMountedRef.current = true;
        loadConversationHistory();
        
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const loadConversationHistory = async () => {
        try {
            const history = await base44.agents.listConversations({ agent_name: "orderAgent" });
            if (isMountedRef.current && Array.isArray(history)) {
                setConversations(history.slice(0, 10));
            }
        } catch (error) {
            console.error('Error loading conversation history:', error);
        }
    };

    // Setup conversation
    useEffect(() => {
        const setupConversation = async () => {
            setIsLoading(true);
            try {
                const newConversation = await base44.agents.createConversation({ agent_name: "orderAgent" });
                
                if (!isMountedRef.current) return;
                
                setConversation(newConversation);
                
                const conversationMessages = Array.isArray(newConversation?.messages) 
                    ? newConversation.messages.filter(Boolean).map(msg => ({
                        ...msg,
                        status: 'read',
                        timestamp: msg.timestamp || new Date().toISOString()
                    }))
                    : [];
                
                setMessages([welcomeMessage, ...conversationMessages]);
                loadConversationHistory();

                // Handle prefill message
                const params = new URLSearchParams(location.search);
                const prefillMessage = params.get('prefill');
                if (prefillMessage && newConversation && isMountedRef.current) {
                    handleSendMessageDirect(prefillMessage, newConversation);
                }
            } catch (error) {
                console.error("Failed to create conversation:", error);
                if (isMountedRef.current) {
                    toast.error("Could not connect to the AI assistant.");
                }
            } finally {
                if (isMountedRef.current) {
                    setIsLoading(false);
                }
            }
        };
        
        setupConversation();
    }, [location.search]);

    // Subscribe to conversation updates
    useEffect(() => {
        if (!conversation?.id) return;

        let unsubscribe;
        
        try {
            unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
                if (!isMountedRef.current) return;
                
                setMessages(prevMessages => {
                    const current = Array.isArray(prevMessages) ? prevMessages : [welcomeMessage];
                    
                    if (!data || !Array.isArray(data.messages)) {
                        return current;
                    }
                    
                    const validMessages = data.messages.filter(msg => msg && typeof msg === 'object').map(msg => ({
                        ...msg,
                        status: msg.role === 'user' ? 'read' : 'delivered',
                        timestamp: msg.timestamp || new Date().toISOString()
                    }));
                    
                    const hasWelcome = validMessages.some(m => m.id === 'welcome_msg');
                    
                    // Check if AI is responding
                    const lastMessage = validMessages[validMessages.length - 1];
                    if (lastMessage?.role === 'assistant' && !lastMessage.content) {
                        setIsAITyping(true);
                    } else {
                        setIsAITyping(false);
                    }
                    
                    if (!hasWelcome && validMessages.length > 0) {
                        return [welcomeMessage, ...validMessages];
                    }
                    
                    return validMessages.length > 0 ? [welcomeMessage, ...validMessages.filter(m => m.id !== 'welcome_msg')] : current;
                });
            });
        } catch (error) {
            console.error('[TextToOrder] Error subscribing:', error);
        }

        return () => {
            if (typeof unsubscribe === 'function') {
                try { unsubscribe(); } catch (e) {}
            }
        };
    }, [conversation?.id]);
    
    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isAITyping]);

    const loadExistingConversation = async (conv) => {
        setIsLoading(true);
        setShowHistory(false);
        try {
            const fullConversation = await base44.agents.getConversation(conv.id);
            if (isMountedRef.current && fullConversation) {
                setConversation(fullConversation);
                const msgs = Array.isArray(fullConversation.messages) 
                    ? fullConversation.messages.filter(Boolean).map(msg => ({
                        ...msg,
                        status: 'read',
                        timestamp: msg.timestamp || new Date().toISOString()
                    }))
                    : [];
                setMessages([welcomeMessage, ...msgs]);
                setShowQuickReplies(msgs.length === 0);
            }
        } catch (error) {
            console.error('Error loading conversation:', error);
            toast.error('Could not load conversation');
        } finally {
            if (isMountedRef.current) {
                setIsLoading(false);
            }
        }
    };

    const startNewConversation = async () => {
        setIsLoading(true);
        setShowHistory(false);
        try {
            const newConversation = await base44.agents.createConversation({ agent_name: "orderAgent" });
            if (isMountedRef.current) {
                setConversation(newConversation);
                setMessages([welcomeMessage]);
                setShowQuickReplies(true);
                loadConversationHistory();
            }
        } catch (error) {
            console.error('Error creating conversation:', error);
            toast.error('Could not start new conversation');
        } finally {
            if (isMountedRef.current) {
                setIsLoading(false);
            }
        }
    };

    const handleSendMessageDirect = async (content, conv) => {
        if (!content.trim() || !conv) return;

        setIsSending(true);
        setShowQuickReplies(false);
        setIsAITyping(true);
        
        const tempId = `temp-${Date.now()}`;
        setMessages(prev => {
            const current = Array.isArray(prev) ? prev : [welcomeMessage];
            return [...current, { 
                id: tempId, 
                role: 'user', 
                content: content,
                timestamp: new Date().toISOString(),
                status: 'sending'
            }];
        });

        // Update to sent status
        setTimeout(() => {
            setMessages(prev => prev.map(m => 
                m.id === tempId ? { ...m, status: 'sent' } : m
            ));
        }, 300);

        // Update to delivered status
        setTimeout(() => {
            setMessages(prev => prev.map(m => 
                m.id === tempId ? { ...m, status: 'delivered' } : m
            ));
        }, 600);

        try {
            await base44.agents.addMessage(conv.id, {
                role: 'user',
                content: content,
            });

            // Mark as read
            setMessages(prev => prev.map(m => 
                m.id === tempId ? { ...m, status: 'read' } : m
            ));
        } catch (error) {
            console.error("Failed to send message:", error);
            toast.error("Failed to send your message. Please try again.");
            
            setMessages(prev => prev.map(m => 
                m.id === tempId ? { ...m, status: 'failed' } : m
            ));
            setIsAITyping(false);
        } finally {
            if (isMountedRef.current) {
                setIsSending(false);
            }
        }
    };

    const handleSendMessage = async (e) => {
        e?.preventDefault();
        if (!userInput.trim() || !conversation || isLoading || isSending) return;

        const currentInput = userInput;
        setUserInput('');
        await handleSendMessageDirect(currentInput, conversation);
    };

    const handleQuickReply = (text) => {
        setUserInput(text);
        inputRef.current?.focus();
    };

    // Enhanced Message Bubble with status
    const EnhancedMessageBubble = ({ message }) => {
        if (!message || typeof message !== 'object') return null;

        const isUser = message.role === 'user';
        const toolCalls = Array.isArray(message.tool_calls) ? message.tool_calls.filter(Boolean) : [];
        
        return (
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}
            >
                {!isUser && (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mt-0.5 shrink-0">
                        <Bot className="h-5 w-5 text-primary" />
                    </div>
                )}
                
                <div className={cn("max-w-[85%]", isUser && "flex flex-col items-end")}>
                    {message.content && (
                        <div className={cn(
                            "rounded-2xl px-4 py-2.5",
                            isUser ? "bg-primary text-primary-foreground" : "bg-white border border-slate-200"
                        )}>
                            {isUser ? (
                                <p className="text-sm leading-relaxed">{message.content}</p>
                            ) : (
                                <ReactMarkdown 
                                    className="text-sm prose prose-sm prose-slate max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                                    components={{
                                        code: ({ children }) => (
                                            <code className="px-1 py-0.5 rounded bg-slate-100 text-slate-700 text-xs">
                                                {children}
                                            </code>
                                        ),
                                        a: ({ children, ...props }) => (
                                            <a {...props} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                                {children}
                                            </a>
                                        ),
                                        p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                                    }}
                                >
                                    {message.content}
                                </ReactMarkdown>
                            )}
                        </div>
                    )}
                    
                    {/* Read Receipt for user messages */}
                    {isUser && message.status && (
                        <AIMessageStatus status={message.status} timestamp={message.timestamp} />
                    )}
                    
                    {/* Tool calls display */}
                    {toolCalls.length > 0 && (
                        <div className="space-y-1 w-full mt-2">
                            {toolCalls.map((toolCall, idx) => (
                                <div key={toolCall?.id || idx} className="text-xs bg-slate-50 rounded px-2 py-1 text-slate-600">
                                    {toolCall?.name || 'Processing...'}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                {isUser && (
                    <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center mt-0.5 shrink-0">
                        <User className="h-5 w-5 text-slate-600" />
                    </div>
                )}
            </motion.div>
        );
    };

    return (
        <>
            <Toaster richColors />
            <div 
                className="flex flex-col h-[calc(100vh-80px)] bg-gray-900 bg-cover bg-center"
                style={{ backgroundImage: "url('https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2')" }}
            >
                <div className="absolute inset-0 bg-black/60 z-0"></div>
                <div className="relative z-10 flex flex-col h-full">
                    {/* Header */}
                    <header className="p-4 border-b border-white/10 bg-black/30 backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-xl font-bold flex items-center gap-2 text-white">
                                    <Bot className="text-primary"/> AI Food Assistant
                                </h1>
                                <p className="text-sm text-gray-300">Tell me what you want, and I'll handle the rest.</p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowHistory(!showHistory)}
                                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                                >
                                    <History className="w-4 h-4 mr-1" />
                                    History
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={startNewConversation}
                                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    New Chat
                                </Button>
                            </div>
                        </div>

                        {/* Conversation History Dropdown */}
                        <AnimatePresence>
                            {showHistory && conversations.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-3 bg-black/50 rounded-lg p-2 max-h-48 overflow-y-auto"
                                >
                                    <p className="text-xs text-gray-400 mb-2 px-2">Recent Conversations</p>
                                    {conversations.map((conv) => (
                                        <button
                                            key={conv.id}
                                            onClick={() => loadExistingConversation(conv)}
                                            className={cn(
                                                "w-full text-left p-2 rounded text-sm text-white hover:bg-white/10 transition-colors",
                                                conversation?.id === conv.id && "bg-white/20"
                                            )}
                                        >
                                            <p className="truncate">{conv.metadata?.name || 'Conversation'}</p>
                                            <p className="text-xs text-gray-400">
                                                {new Date(conv.created_date).toLocaleDateString()}
                                            </p>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </header>

                    {/* Messages */}
                    <main className="flex-1 overflow-y-auto p-4 md:p-6">
                        <div className="max-w-3xl mx-auto space-y-4">
                            {isLoading ? (
                                <div className="flex justify-center items-center h-full pt-16">
                                    <Loader2 className="w-8 h-8 animate-spin text-white"/>
                                </div>
                            ) : (
                                <>
                                    <AnimatePresence>
                                        {Array.isArray(messages) && messages.map((msg, index) => (
                                            msg && typeof msg === 'object' && (
                                                <EnhancedMessageBubble key={msg?.id || `msg-${index}`} message={msg} />
                                            )
                                        ))}
                                    </AnimatePresence>
                                    
                                    {/* Typing Indicator */}
                                    <AnimatePresence>
                                        {isAITyping && <AITypingIndicator />}
                                    </AnimatePresence>
                                </>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </main>

                    {/* Footer with Quick Replies and Input */}
                    <footer className="p-4 bg-black/30 backdrop-blur-sm border-t border-white/10">
                        <div className="max-w-3xl mx-auto space-y-3">
                            {/* Quick Replies */}
                            <AnimatePresence>
                                {showQuickReplies && !isLoading && messages.length <= 2 && (
                                    <AIQuickReplies 
                                        onSelect={handleQuickReply} 
                                        disabled={isSending || isLoading}
                                    />
                                )}
                            </AnimatePresence>

                            {/* Input Form */}
                            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                <Input
                                    ref={inputRef}
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    placeholder="e.g., 'I want a pepperoni pizza' or 'Find a cheap lunch nearby...'"
                                    className="h-12 text-base bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:ring-primary"
                                    disabled={isLoading || !conversation || isSending}
                                    maxLength={500}
                                />
                                <Button 
                                    type="submit" 
                                    size="icon" 
                                    className="h-12 w-12 bg-primary hover:bg-primary/90" 
                                    disabled={!userInput.trim() || isLoading || isSending}
                                >
                                    {isSending ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5" />
                                    )}
                                </Button>
                            </form>
                            
                            {/* Character count */}
                            {userInput.length > 400 && (
                                <p className="text-xs text-gray-400 text-right">
                                    {userInput.length}/500
                                </p>
                            )}
                        </div>
                    </footer>
                </div>
            </div>
        </>
    );
}
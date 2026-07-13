import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, X, Loader2, Check, CheckCheck, Phone, Clock, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const QUICK_REPLIES = {
  rider: [
    { id: 1, text: "I'm on my way", icon: "🚶" },
    { id: 2, text: "Running 5 minutes late", icon: "⏰" },
    { id: 3, text: "I'll be right there", icon: "👍" },
    { id: 4, text: "Can you wait a moment?", icon: "⏸️" },
    { id: 5, text: "Thank you!", icon: "🙏" },
    { id: 6, text: "Where are you?", icon: "📍" }
  ],
  driver: [
    { id: 1, text: "I'm arriving now", icon: "🚗" },
    { id: 2, text: "I'm here!", icon: "📍" },
    { id: 3, text: "Traffic delay, ETA 5 min", icon: "🚦" },
    { id: 4, text: "Can you come to the pickup point?", icon: "👋" },
    { id: 5, text: "Thanks for riding with me!", icon: "⭐" },
    { id: 6, text: "I'll call you", icon: "📞" }
  ]
};

const MessageBubble = ({ message, isCurrentUser, otherUser }) => {
    const formattedTime = new Date(message.created_date).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });

    const getReadStatus = () => {
        if (!isCurrentUser) return null;
        
        if (message.is_read && message.read_at) {
            return (
                <div className="flex items-center gap-1 text-blue-500" title={`Read ${new Date(message.read_at).toLocaleString()}`}>
                    <CheckCheck className="w-3 h-3" />
                </div>
            );
        }
        
        if (message.delivered_at) {
            return (
                <div className="flex items-center gap-1 text-gray-400" title={`Delivered ${new Date(message.delivered_at).toLocaleString()}`}>
                    <CheckCheck className="w-3 h-3" />
                </div>
            );
        }
        
        return (
            <div className="flex items-center gap-1 text-gray-300" title="Sent">
                <Check className="w-3 h-3" />
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn("flex gap-3", isCurrentUser ? "justify-end" : "justify-start")}
        >
            {!isCurrentUser && otherUser && (
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-1">
                    {otherUser.full_name?.charAt(0) || '?'}
                </div>
            )}
            
            <div className={cn("max-w-[75%]", isCurrentUser && "flex flex-col items-end")}>
                <div
                    className={cn(
                        "rounded-2xl px-4 py-2.5 shadow-sm",
                        isCurrentUser
                            ? "bg-blue-600 text-white"
                            : "bg-white text-gray-900 border border-gray-200"
                    )}
                >
                    <p className="text-sm leading-relaxed break-words">{message.message_text}</p>
                </div>
                
                <div className={cn(
                    "flex items-center gap-1.5 mt-1 px-1",
                    isCurrentUser ? "justify-end" : "justify-start"
                )}>
                    <p className={cn(
                        "text-xs",
                        isCurrentUser ? "text-blue-600" : "text-gray-500"
                    )}>
                        {formattedTime}
                    </p>
                    {getReadStatus()}
                </div>
            </div>
        </motion.div>
    );
};

const TypingIndicator = ({ otherUser }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="flex gap-3 items-center"
    >
        {otherUser && (
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {otherUser.full_name?.charAt(0) || '?'}
            </div>
        )}
        <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
            <div className="flex gap-1">
                <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    className="w-2 h-2 bg-gray-400 rounded-full"
                />
                <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                    className="w-2 h-2 bg-gray-400 rounded-full"
                />
                <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                    className="w-2 h-2 bg-gray-400 rounded-full"
                />
            </div>
        </div>
    </motion.div>
);

export default function ChatDialog({ rideId, isOpen, onClose, userType = 'rider' }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [otherUser, setOtherUser] = useState(null);
    const [ride, setRide] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [otherUserTyping, setOtherUserTyping] = useState(false);
    const [showQuickReplies, setShowQuickReplies] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    
    const messagesEndRef = useRef(null);
    const isMountedRef = useRef(true);
    const typingTimeoutRef = useRef(null);
    const lastTypingSignalRef = useRef(0);
    const pollingIntervalRef = useRef(null);

    // Initialize chat
    useEffect(() => {
        if (!isOpen || !rideId) return;
        
        let isMounted = true;
        isMountedRef.current = true;
        
        const initializeChat = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                const user = await base44.auth.me();
                if (!isMounted) return;
                
                setCurrentUser(user);
                
                const rideData = await base44.entities.Ride.get(rideId);
                
                if (!isMounted) return;
                
                if (!rideData) {
                    setError('Ride not found');
                    setIsLoading(false);
                    return;
                }
                
                setRide(rideData);
                
                const otherUserId = userType === 'driver' ? rideData.rider_id : rideData.driver_id;
                
                if (otherUserId) {
                    try {
                        const otherUserData = await base44.entities.User.get(otherUserId);
                        if (isMounted) {
                            setOtherUser(otherUserData);
                        }
                    } catch (userError) {
                        console.log('Could not load other user:', userError.message);
                        if (isMounted) {
                            setOtherUser({ 
                                id: otherUserId, 
                                full_name: userType === 'driver' ? 'Rider' : 'Driver' 
                            });
                        }
                    }
                }
                
                if (isMounted) {
                    await loadMessages(true);
                }
                
            } catch (error) {
                console.error('Error initializing chat:', error);
                if (isMounted) {
                    setError('Could not load chat. Please try again.');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };
        
        initializeChat();
        
        return () => {
            isMounted = false;
            isMountedRef.current = false;
        };
    }, [isOpen, rideId, userType]);

    // Poll for new messages and typing status
    useEffect(() => {
        if (!isOpen || !rideId || !currentUser || isLoading) return;
        
        let isMounted = true;
        
        const pollMessages = async () => {
            if (!isMounted) return;
            
            try {
                await loadMessages(false);
                
                // Check if other user is typing (simulated via last message timestamp)
                const now = Date.now();
                if (messages.length > 0) {
                    const lastMessage = messages[messages.length - 1];
                    if (lastMessage.sender_id !== currentUser.id) {
                        const messageTime = new Date(lastMessage.created_date).getTime();
                        const isRecent = (now - messageTime) < 3000; // Last 3 seconds
                        if (isMounted) {
                            setOtherUserTyping(false); // We'll implement proper typing indicators via backend later
                        }
                    }
                }
            } catch (error) {
                console.log('Poll error:', error.message);
            }
        };
        
        // Initial poll after delay
        const initialTimeout = setTimeout(() => {
            if (isMounted) {
                pollMessages();
            }
        }, 1000);
        
        // Poll every 2 seconds for real-time feel
        pollingIntervalRef.current = setInterval(() => {
            if (isMounted) {
                pollMessages();
            }
        }, 2000);
        
        return () => {
            isMounted = false;
            clearTimeout(initialTimeout);
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };
    }, [isOpen, rideId, currentUser, isLoading]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, otherUserTyping]);

    const loadMessages = async (isInitialLoad = false) => {
        if (!isMountedRef.current || !currentUser) return;
        
        try {
            const msgs = await base44.entities.RideMessage.filter({
                ride_id: rideId
            }, 'created_date', 100);
            
            if (!isMountedRef.current) return;
            
            setMessages(msgs);
            
            // Mark unread messages as read
            const unreadMessages = msgs.filter(msg => 
                msg.sender_id !== currentUser.id && !msg.is_read
            );
            
            setUnreadCount(unreadMessages.length);
            
            if (unreadMessages.length > 0 && isOpen) {
                // Mark as read after a short delay (simulating user seeing them)
                setTimeout(() => {
                    unreadMessages.forEach(msg => {
                        base44.entities.RideMessage.update(msg.id, {
                            is_read: true,
                            read_at: new Date().toISOString()
                        }).catch(() => {});
                    });
                }, 500);
            }
        } catch (error) {
            console.log('Error loading messages:', error.message);
        }
    };

    const handleSendMessage = async (messageText = null) => {
        const textToSend = messageText || newMessage;
        
        if (!textToSend.trim() || isSending || !currentUser) return;
        
        setIsSending(true);
        if (!messageText) {
            setNewMessage('');
        }
        setShowQuickReplies(false);
        
        const optimisticMessage = {
            id: `temp-${Date.now()}`,
            ride_id: rideId,
            sender_id: currentUser.id,
            sender_type: userType,
            message_text: textToSend,
            created_date: new Date().toISOString(),
            is_read: false,
            delivered_at: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, optimisticMessage]);
        
        try {
            const createdMessage = await base44.entities.RideMessage.create({
                ride_id: rideId,
                sender_id: currentUser.id,
                sender_type: userType,
                message_text: textToSend,
                is_read: false,
                delivered_at: new Date().toISOString()
            });
            
            console.log('[CHAT] Message sent:', createdMessage);
            
            setMessages(prev => 
                prev.map(m => m.id === optimisticMessage.id ? createdMessage : m)
            );
            
            toast.success('Message sent');
            
        } catch (error) {
            console.error('Failed to send message:', error);
            setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
            if (!messageText) {
                setNewMessage(textToSend);
            }
            toast.error('Failed to send message. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    const handleQuickReply = (reply) => {
        handleSendMessage(reply.text);
    };

    const handleInputChange = (e) => {
        setNewMessage(e.target.value);
        
        // Signal typing (throttled to once per 2 seconds)
        const now = Date.now();
        if (now - lastTypingSignalRef.current > 2000) {
            setIsTyping(true);
            lastTypingSignalRef.current = now;
            
            // Clear typing indicator after 3 seconds
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            typingTimeoutRef.current = setTimeout(() => {
                setIsTyping(false);
            }, 3000);
        }
    };

    const handleCall = async () => {
        try {
            toast.info('Connecting call...');
            const result = await base44.functions.invoke('initiateMaskedCall', {
                rideId: rideId,
                callerType: userType
            });
            
            if (result.data?.success) {
                toast.success('Call initiated!');
            } else {
                toast.error(result.data?.message || 'Could not initiate call');
            }
        } catch (error) {
            console.error('Call error:', error);
            toast.error('Could not initiate call');
        }
    };

    if (!isOpen) return null;

    const quickReplies = QUICK_REPLIES[userType];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md h-[600px] flex flex-col p-0">
                {/* Header */}
                <DialogHeader className="p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {otherUser && (
                                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-white text-lg font-bold">
                                    {otherUser.full_name?.charAt(0) || '?'}
                                </div>
                            )}
                            <div>
                                <DialogTitle className="text-white text-lg">
                                    {otherUser ? otherUser.full_name : 'Chat'}
                                </DialogTitle>
                                {ride && (
                                    <p className="text-xs text-white/80 mt-0.5 flex items-center gap-1">
                                        {ride.status === 'in_progress' && (
                                            <>
                                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                                Trip in progress
                                            </>
                                        )}
                                        {ride.status === 'accepted' && (
                                            <>
                                                <Clock className="w-3 h-3" />
                                                Driver on the way
                                            </>
                                        )}
                                        {ride.status === 'arriving' && (
                                            <>
                                                <MapPin className="w-3 h-3" />
                                                Driver arriving
                                            </>
                                        )}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={handleCall}
                                className="text-white hover:bg-white/20"
                                title="Call"
                            >
                                <Phone className="w-5 h-5" />
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={onClose}
                                className="text-white hover:bg-white/20"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <p className="text-red-600 mb-2">{error}</p>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                        setError(null);
                                        setIsLoading(true);
                                        loadMessages(true);
                                    }}
                                >
                                    Retry
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {messages.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-gray-400 text-center">
                                    <div>
                                        <p className="text-lg mb-2">👋</p>
                                        <p className="text-sm">No messages yet</p>
                                        <p className="text-xs mt-1">Start the conversation!</p>
                                    </div>
                                </div>
                            ) : (
                                <AnimatePresence>
                                    {messages.map((message) => {
                                        const isCurrentUser = message.sender_id === currentUser?.id;
                                        
                                        return (
                                            <MessageBubble
                                                key={message.id}
                                                message={message}
                                                isCurrentUser={isCurrentUser}
                                                otherUser={!isCurrentUser ? otherUser : null}
                                            />
                                        );
                                    })}
                                    
                                    {/* Typing Indicator */}
                                    {otherUserTyping && (
                                        <TypingIndicator otherUser={otherUser} />
                                    )}
                                </AnimatePresence>
                            )}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* Quick Replies */}
                {showQuickReplies && quickReplies && messages.length < 3 && (
                    <div className="px-4 py-2 bg-white border-t">
                        <p className="text-xs text-gray-500 mb-2 font-medium">Quick replies:</p>
                        <div className="flex flex-wrap gap-2">
                            {quickReplies.slice(0, 3).map((reply) => (
                                <Button
                                    key={reply.id}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleQuickReply(reply)}
                                    disabled={isSending}
                                    className="text-xs h-8 px-3"
                                >
                                    <span className="mr-1">{reply.icon}</span>
                                    {reply.text}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input Area */}
                <div className="border-t p-4 bg-white">
                    {isTyping && (
                        <div className="mb-2">
                            <Badge variant="outline" className="text-xs text-blue-600 border-blue-200 bg-blue-50">
                                Typing...
                            </Badge>
                        </div>
                    )}
                    
                    <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center gap-2">
                        <Input
                            value={newMessage}
                            onChange={handleInputChange}
                            placeholder="Type a message..."
                            disabled={isSending || isLoading || !!error}
                            className="flex-1"
                            maxLength={500}
                            autoFocus
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!newMessage.trim() || isSending || isLoading || !!error}
                            className="bg-blue-600 hover:bg-blue-700 flex-shrink-0"
                        >
                            {isSending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </Button>
                    </form>
                    
                    {!showQuickReplies && quickReplies && (
                        <button
                            onClick={() => setShowQuickReplies(true)}
                            className="text-xs text-blue-600 hover:underline mt-2"
                        >
                            Show quick replies
                        </button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
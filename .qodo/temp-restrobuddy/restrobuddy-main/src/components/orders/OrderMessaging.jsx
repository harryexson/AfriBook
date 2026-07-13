import React, { useState, useEffect, useRef } from "react";
import { OrderMessage } from "@/entities/OrderMessage";
import { Notification } from "@/entities/Notification";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Clock, CheckCheck, RefreshCw } from "lucide-react";
import { format } from "date-fns";

export default function OrderMessaging({ order, isRestaurant = false }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadUser();
    loadMessages();
    
    // Auto-refresh messages every 5 seconds
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [order.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const loadMessages = async () => {
    try {
      const allMessages = await OrderMessage.filter({ order_id: order.id });
      const sorted = allMessages.sort((a, b) => 
        new Date(a.created_date) - new Date(b.created_date)
      );
      setMessages(sorted);

      // Mark messages as read if viewing
      const unreadMessages = sorted.filter(msg => 
        !msg.read && 
        ((isRestaurant && msg.sender_type === "customer") || 
         (!isRestaurant && msg.sender_type === "restaurant"))
      );

      for (const msg of unreadMessages) {
        await OrderMessage.update(msg.id, {
          read: true,
          read_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
    setIsLoading(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setIsSending(true);
    try {
      const messageData = {
        order_id: order.id,
        sender_type: isRestaurant ? "restaurant" : "customer",
        sender_name: user.full_name || user.email,
        sender_email: user.email,
        message: newMessage.trim()
      };

      await OrderMessage.create(messageData);

      // Send notification to recipient
      const recipientEmail = isRestaurant ? order.customer_email : order.created_by;
      const recipientPhone = isRestaurant ? order.customer_phone : null;

      if (recipientEmail) {
        await Notification.create({
          customer_email: recipientEmail,
          customer_phone: recipientPhone,
          title: isRestaurant ? '💬 Message from Restaurant' : '💬 Message about Your Order',
          message: `Order #${order.id.slice(-6)}: ${newMessage.substring(0, 100)}${newMessage.length > 100 ? '...' : ''}`,
          type: 'order_message',
          priority: 'high',
          status: 'unread',
          related_order_id: order.id,
          icon: 'message-circle'
        });
      }

      setNewMessage("");
      await loadMessages();
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    }
    setIsSending(false);
  };

  const unreadCount = messages.filter(msg => 
    !msg.read && 
    ((isRestaurant && msg.sender_type === "customer") || 
     (!isRestaurant && msg.sender_type === "restaurant"))
  ).length;

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          Order Communication
          {unreadCount > 0 && (
            <Badge className="bg-red-500">{unreadCount} new</Badge>
          )}
        </CardTitle>
        <p className="text-sm text-slate-600">
          {isRestaurant 
            ? "Communicate with the customer about their order" 
            : "Contact the restaurant about your order"}
        </p>
      </CardHeader>
      <CardContent>
        {/* Messages List */}
        <div className="bg-slate-50 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500">No messages yet</p>
              <p className="text-sm text-slate-400 mt-1">
                {isRestaurant 
                  ? "Start a conversation with the customer" 
                  : "Need to clarify something? Send a message!"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => {
                const isOwnMessage = (isRestaurant && msg.sender_type === "restaurant") || 
                                   (!isRestaurant && msg.sender_type === "customer");
                
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        isOwnMessage
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`text-xs font-semibold ${isOwnMessage ? 'text-blue-100' : 'text-slate-600'}`}>
                          {msg.sender_name}
                        </p>
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] ${isOwnMessage ? 'border-blue-300 text-blue-100' : 'border-slate-300'}`}
                        >
                          {msg.sender_type}
                        </Badge>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      <div className={`flex items-center gap-1 mt-2 text-xs ${isOwnMessage ? 'text-blue-200' : 'text-slate-500'}`}>
                        <Clock className="w-3 h-3" />
                        {format(new Date(msg.created_date), 'MMM d, h:mm a')}
                        {isOwnMessage && msg.read && (
                          <CheckCheck className="w-3 h-3 ml-1" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="space-y-3">
          <Textarea
            placeholder={isRestaurant 
              ? "Type a message to the customer..." 
              : "Ask about your order, delivery instructions, etc..."}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            rows={3}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isSending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </>
            )}
          </Button>
          <p className="text-xs text-slate-500 text-center">
            Press Enter to send • Shift + Enter for new line
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
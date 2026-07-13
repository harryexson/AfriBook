import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MessageCircle,
  Send,
  Bot,
  User,
  Ticket,
  CheckCircle,
  Clock,
  Mail,
  Phone,
  ArrowRight
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Support() {
  const [activeTab, setActiveTab] = useState("chat");
  
  // Chat state
  const [messages, setMessages] = useState([
    {
      role: "bot",
      content: "👋 Hi! I'm RESTROBUDDY's support assistant. How can I help you today?\n\nYou can ask me about:\n• Setting up your restaurant\n• Menu management\n• Payment processing\n• Technical issues\n• Account questions\n\nOr type 'agent' to submit a support ticket."
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Ticket state
  const [ticketForm, setTicketForm] = useState({
    name: "",
    email: "",
    subject: "",
    priority: "medium",
    description: ""
  });
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getBotResponse = async (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();

    // Check for ticket request
    if (lowerMessage.includes("agent") || lowerMessage.includes("human") || lowerMessage.includes("ticket") || lowerMessage.includes("support ticket")) {
      return "I'll help you create a support ticket! Please switch to the 'Submit Ticket' tab above, and our support team will get back to you within 24 hours at support@restrobuddy.app.";
    }

    // Simple FAQ responses
    if (lowerMessage.includes("setup") || lowerMessage.includes("start") || lowerMessage.includes("begin")) {
      return "Getting started is easy! 🚀\n\n1. Complete the onboarding wizard\n2. Add your menu items\n3. Connect Square for payments\n4. You're ready to go!\n\nThe whole process takes about 30-60 minutes. Need help with a specific step?";
    }

    if (lowerMessage.includes("payment") || lowerMessage.includes("square") || lowerMessage.includes("pay")) {
      return "RESTROBUDDY uses Square for payment processing. 💳\n\n• If you have a Square account, you can connect it in Settings\n• New to Square? We'll help you set up during onboarding\n• Payments are processed instantly with competitive rates\n\nHaving issues with payments? Type 'ticket' to reach our support team.";
    }

    if (lowerMessage.includes("menu") || lowerMessage.includes("item") || lowerMessage.includes("food")) {
      return "Managing your menu is simple! 🍔\n\n• Add items with photos, descriptions, and prices\n• Organize into categories\n• Set availability schedules\n• Update prices in real-time\n\nGo to Admin Dashboard > Menu to manage your items.";
    }

    if (lowerMessage.includes("sms") || lowerMessage.includes("text") || lowerMessage.includes("message")) {
      return "SMS ordering lets customers text to order! 📱\n\n• Set up keywords like 'BURGER' or 'PIZZA'\n• Customers text the keyword to your number\n• They receive a link to order instantly\n• No app download required!\n\nPerfect for repeat customers.";
    }

    if (lowerMessage.includes("kiosk") || lowerMessage.includes("tablet") || lowerMessage.includes("hardware")) {
      return "RESTROBUDDY works on ANY device! 📱💻\n\n• Use existing iPads or Android tablets\n• No expensive proprietary hardware\n• Just open the browser and go to Kiosk Mode\n• Full-screen touchscreen interface\n\nSave $1,000+ on hardware costs!";
    }

    if (lowerMessage.includes("price") || lowerMessage.includes("cost") || lowerMessage.includes("plan")) {
      return "Our pricing is simple and transparent! 💰\n\n• Starter: $99/mo - Perfect for single locations\n• Professional: $299/mo - Most popular!\n• Enterprise: $599/mo - Unlimited locations\n\nAll plans include a 14-day free trial. Visit our Pricing page for full details.";
    }

    if (lowerMessage.includes("help") || lowerMessage.includes("support")) {
      return "I'm here to help! Here's what I can assist with:\n\n• Setup and onboarding\n• Menu management\n• Payment processing\n• SMS ordering\n• Technical issues\n\nFor complex issues, type 'ticket' to reach our support team at support@restrobuddy.app.";
    }

    if (lowerMessage.includes("thank")) {
      return "You're welcome! 😊 Is there anything else I can help you with today?";
    }

    // Default response with LLM
    try {
      setIsTyping(true);
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a helpful support assistant for RESTROBUDDY, a restaurant management platform. 
        
The user asked: "${userMessage}"

Provide a helpful, friendly response about RESTROBUDDY features. Keep it concise (2-3 sentences max). 
If you don't know something specific, suggest they submit a support ticket by typing 'ticket'.
Available features: online ordering, SMS ordering, kiosk mode, kitchen display, inventory management, staff management, analytics, loyalty programs.`,
        response_json_schema: {
          type: "object",
          properties: {
            response: { type: "string" }
          }
        }
      });
      return response.response;
    } catch (error) {
      return "I'd be happy to help! For detailed assistance with your specific question, please submit a support ticket and our team will get back to you within 24 hours. Just type 'ticket' or switch to the Submit Ticket tab.";
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMsg = inputMessage;
    setInputMessage("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsTyping(true);

    const response = await getBotResponse(userMsg);
    setIsTyping(false);
    setMessages(prev => [...prev, { role: "bot", content: response }]);
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await base44.integrations.Core.SendEmail({
        to: "support@restrobuddy.app",
        subject: `Support Ticket: ${ticketForm.subject} [${ticketForm.priority.toUpperCase()}]`,
        body: `
New Support Ticket

Priority: ${ticketForm.priority.toUpperCase()}
Subject: ${ticketForm.subject}

Customer Information:
Name: ${ticketForm.name}
Email: ${ticketForm.email}

Description:
${ticketForm.description}

---
Sent from RESTROBUDDY Support Page
        `
      });
      setTicketSubmitted(true);
    } catch (error) {
      console.error("Error:", error);
      alert("Error submitting ticket. Please email support@restrobuddy.app directly.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Support Center</h1>
          <p className="text-xl text-emerald-100">
            Get help from our team or chat with our support assistant
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Contact Info */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Email Support</p>
                <a href="mailto:support@restrobuddy.app" className="font-semibold text-emerald-600 hover:underline text-sm">
                  support@restrobuddy.app
                </a>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Response Time</p>
                <p className="font-semibold text-slate-900 text-sm">Within 24 hours</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Hours</p>
                <p className="font-semibold text-slate-900 text-sm">Mon-Fri 9am-6pm EST</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-xl">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader className="pb-0">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" /> Chat with Assistant
                </TabsTrigger>
                <TabsTrigger value="ticket" className="flex items-center gap-2">
                  <Ticket className="w-4 h-4" /> Submit Ticket
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="p-6">
              {/* Chat Tab */}
              <TabsContent value="chat" className="mt-0">
                <div className="h-[400px] border rounded-xl flex flex-col">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, idx) => (
                      <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          msg.role === "user" ? "bg-emerald-600" : "bg-slate-200"
                        }`}>
                          {msg.role === "user" ? (
                            <User className="w-4 h-4 text-white" />
                          ) : (
                            <Bot className="w-4 h-4 text-slate-600" />
                          )}
                        </div>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                          msg.role === "user" 
                            ? "bg-emerald-600 text-white" 
                            : "bg-slate-100 text-slate-700"
                        }`}>
                          <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                          <Bot className="w-4 h-4 text-slate-600" />
                        </div>
                        <div className="bg-slate-100 rounded-2xl px-4 py-2">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type your message..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                        className="flex-1"
                      />
                      <Button onClick={handleSendMessage} className="bg-emerald-600 hover:bg-emerald-700">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Ticket Tab */}
              <TabsContent value="ticket" className="mt-0">
                {ticketSubmitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Ticket Submitted!</h3>
                    <p className="text-slate-600 mb-6">
                      We've received your request and will respond to {ticketForm.email} within 24 hours.
                    </p>
                    <Button onClick={() => { setTicketSubmitted(false); setTicketForm({ name: "", email: "", subject: "", priority: "medium", description: "" }); }}>
                      Submit Another Ticket
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitTicket} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Your Name *</Label>
                        <Input
                          id="name"
                          required
                          value={ticketForm.name}
                          onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          value={ticketForm.email}
                          onChange={(e) => setTicketForm({ ...ticketForm, email: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="subject">Subject *</Label>
                        <Input
                          id="subject"
                          required
                          value={ticketForm.subject}
                          onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                          placeholder="Brief description of your issue"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="priority">Priority</Label>
                        <Select value={ticketForm.priority} onValueChange={(value) => setTicketForm({ ...ticketForm, priority: value })}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low - General question</SelectItem>
                            <SelectItem value="medium">Medium - Need help soon</SelectItem>
                            <SelectItem value="high">High - Affecting business</SelectItem>
                            <SelectItem value="urgent">Urgent - System down</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        required
                        value={ticketForm.description}
                        onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                        placeholder="Please describe your issue in detail..."
                        className="mt-1 min-h-[150px]"
                      />
                    </div>

                    <Button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 py-6">
                      {isSubmitting ? "Submitting..." : <><Ticket className="w-5 h-5 mr-2" /> Submit Support Ticket</>}
                    </Button>
                  </form>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        {/* Help Center Link */}
        <div className="mt-8 text-center">
          <p className="text-slate-600 mb-4">Looking for self-service help?</p>
          <Button asChild variant="outline">
            <Link to={createPageUrl("HelpCenter")}>
              Visit Help Center <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">© 2024 RESTROBUDDY. All rights reserved.</p>
          <p className="text-slate-500 text-sm font-semibold mt-1">by Bold Intelligent Solutions Partners Inc. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
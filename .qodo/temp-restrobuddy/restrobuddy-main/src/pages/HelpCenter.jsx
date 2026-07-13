import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Search, 
  Settings, 
  CreditCard, 
  Users, 
  Smartphone,
  ChefHat,
  MessageSquare,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { icon: Settings, title: "Getting Started", desc: "Setup guides and first steps", count: 12 },
    { icon: Smartphone, title: "Online Ordering", desc: "Web and mobile ordering", count: 8 },
    { icon: ChefHat, title: "Kitchen Display", desc: "KDS setup and usage", count: 6 },
    { icon: MessageSquare, title: "SMS Ordering", desc: "Text-to-order features", count: 5 },
    { icon: CreditCard, title: "Payments", desc: "Payment processing help", count: 7 },
    { icon: Users, title: "Staff Management", desc: "Employee and scheduling", count: 9 }
  ];

  const faqs = [
    {
      question: "How do I set up my restaurant on RESTROBUDDY?",
      answer: "Getting started is easy! Sign up for a free trial, complete the onboarding wizard to add your restaurant details and menu items, connect your payment processor, and you're ready to accept orders. The entire process takes about 30-60 minutes."
    },
    {
      question: "What hardware do I need?",
      answer: "RESTROBUDDY works on any device with a web browser! Use your existing tablets (iPads, Android tablets), computers, or smartphones. No proprietary hardware required. For kitchen displays, any tablet or TV with a browser works great."
    },
    {
      question: "How does SMS ordering work?",
      answer: "Customers text a keyword (like 'BURGER') to your RESTROBUDDY number and receive a link to your ordering page. It's perfect for repeat customers who want quick, easy ordering without downloading an app."
    },
    {
      question: "Can I use my existing payment processor?",
      answer: "RESTROBUDDY integrates with Square for payment processing. If you already have a Square account, you can connect it in minutes. If not, we'll help you set one up during onboarding."
    },
    {
      question: "How do I train my staff?",
      answer: "RESTROBUDDY is designed to be intuitive. Most staff can learn the system in 15-30 minutes. We provide video tutorials, documentation, and our support team is always available to help."
    },
    {
      question: "What if I need help?",
      answer: "We offer multiple support channels: live chat support during business hours, email support with 24-hour response time, comprehensive documentation, and video tutorials. Enterprise customers get dedicated account managers."
    },
    {
      question: "Can I customize my menu?",
      answer: "Absolutely! Add unlimited menu items with photos, descriptions, prices, and modifiers. Organize items into categories, set availability schedules, and update in real-time."
    },
    {
      question: "How do refunds work?",
      answer: "Refunds can be processed directly through your RESTROBUDDY dashboard. The refund is sent back to the customer's original payment method through Square."
    }
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Help Center</h1>
          <p className="text-xl text-emerald-100 mb-8">
            Find answers, guides, and resources to help you succeed
          </p>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg rounded-full border-0 shadow-xl"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Categories */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Browse by Category</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {categories.map((cat, idx) => (
              <Card key={idx} className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer group">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-600 transition-colors">
                    <cat.icon className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{cat.title}</h3>
                    <p className="text-sm text-slate-600">{cat.desc}</p>
                    <Badge variant="outline" className="mt-2">{cat.count} articles</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Frequently Asked Questions</h2>
          <Card className="border-0 shadow-xl">
            <CardContent className="p-6">
              <Accordion type="single" collapsible className="w-full">
                {filteredFaqs.map((faq, idx) => (
                  <AccordionItem key={idx} value={`item-${idx}`}>
                    <AccordionTrigger className="text-left font-semibold">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-600">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Still Need Help */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white rounded-3xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Still Need Help?</h2>
          <p className="text-xl text-emerald-100 mb-8">
            Our support team is here to assist you
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 rounded-full px-8">
              <Link to={createPageUrl("Support")}>
                Contact Support <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-emerald-700 rounded-full px-8">
              <Link to={createPageUrl("Documentation")}>
                View Documentation
              </Link>
            </Button>
          </div>
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
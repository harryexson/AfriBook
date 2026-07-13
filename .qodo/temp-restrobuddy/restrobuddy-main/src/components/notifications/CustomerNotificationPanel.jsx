import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Mail, MessageSquare, Send, Loader2, CheckCircle } from "lucide-react";
import { sendSms } from "@/functions/sendSms";
import { base44 } from "@/api/base44Client";

export default function CustomerNotificationPanel({ customer, onClose }) {
  const [activeTab, setActiveTab] = useState("email");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [smsMessage, setSmsMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendEmail = async () => {
    setSending(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: customer.email || customer.customer_email,
        subject: emailSubject,
        body: emailBody
      });
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setEmailSubject("");
        setEmailBody("");
        if (onClose) onClose();
      }, 2000);
    } catch (error) {
      console.error('Email error:', error);
      alert('Failed to send email');
    }
    setSending(false);
  };

  const handleSendSMS = async () => {
    setSending(true);
    try {
      await sendSms({
        to: customer.phone || customer.customer_phone,
        message: smsMessage
      });
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setSmsMessage("");
        if (onClose) onClose();
      }, 2000);
    } catch (error) {
      console.error('SMS error:', error);
      alert('Failed to send SMS');
    }
    setSending(false);
  };

  if (sent) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-900">Message Sent!</h3>
        <p className="text-slate-600">Your message has been delivered successfully.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 p-4 rounded-lg">
        <h3 className="font-semibold text-slate-900 mb-2">Contact Information</h3>
        <p className="text-sm text-slate-600">
          <strong>Name:</strong> {customer.customer_name || customer.name || 'N/A'}
        </p>
        {customer.email || customer.customer_email ? (
          <p className="text-sm text-slate-600">
            <strong>Email:</strong> {customer.email || customer.customer_email}
          </p>
        ) : null}
        {customer.phone || customer.customer_phone ? (
          <p className="text-sm text-slate-600">
            <strong>Phone:</strong> {customer.phone || customer.customer_phone}
          </p>
        ) : null}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="email" className="flex-1" disabled={!customer.email && !customer.customer_email}>
            <Mail className="w-4 h-4 mr-2" />
            Email
          </TabsTrigger>
          <TabsTrigger value="sms" className="flex-1" disabled={!customer.phone && !customer.customer_phone}>
            <MessageSquare className="w-4 h-4 mr-2" />
            SMS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="space-y-4">
          <div>
            <Label>Subject</Label>
            <Input
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Enter email subject"
            />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              placeholder="Enter your message..."
              rows={6}
            />
          </div>
          <Button
            onClick={handleSendEmail}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={!emailSubject || !emailBody || sending}
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Email
              </>
            )}
          </Button>
        </TabsContent>

        <TabsContent value="sms" className="space-y-4">
          <div>
            <Label>Message (160 characters max)</Label>
            <Textarea
              value={smsMessage}
              onChange={(e) => setSmsMessage(e.target.value.slice(0, 160))}
              placeholder="Enter SMS message..."
              rows={4}
              maxLength={160}
            />
            <p className="text-xs text-slate-500 mt-1">
              {smsMessage.length}/160 characters
            </p>
          </div>
          <Button
            onClick={handleSendSMS}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={!smsMessage || sending}
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send SMS
              </>
            )}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
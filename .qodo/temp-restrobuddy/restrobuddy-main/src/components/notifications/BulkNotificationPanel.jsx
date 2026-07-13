import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, MessageSquare, Send, Loader2 } from "lucide-react";
import { sendSms } from "@/functions/sendSms";
import { base44 } from "@/api/base44Client";

export default function BulkNotificationPanel({ customers }) {
  const [messageType, setMessageType] = useState("email");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ sent: 0, total: 0 });

  const toggleCustomer = (customerId) => {
    setSelectedCustomers(prev =>
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const toggleAll = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map(c => c.id));
    }
  };

  const handleSend = async () => {
    if (selectedCustomers.length === 0) {
      alert('Please select at least one customer');
      return;
    }

    setSending(true);
    setProgress({ sent: 0, total: selectedCustomers.length });

    const selectedCustomerData = customers.filter(c => selectedCustomers.includes(c.id));

    for (let i = 0; i < selectedCustomerData.length; i++) {
      const customer = selectedCustomerData[i];
      try {
        if (messageType === "email" && customer.email) {
          await base44.integrations.Core.SendEmail({
            to: customer.email,
            subject,
            body: message
          });
        } else if (messageType === "sms" && customer.phone) {
          await sendSms({
            to: customer.phone,
            message
          });
        }
        setProgress({ sent: i + 1, total: selectedCustomers.length });
      } catch (error) {
        console.error(`Failed to send to ${customer.name}:`, error);
      }
    }

    setSending(false);
    alert(`Successfully sent ${messageType === 'email' ? 'emails' : 'messages'} to ${progress.sent} customers`);
    setSelectedCustomers([]);
    setSubject("");
    setMessage("");
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Button
          variant={messageType === "email" ? "default" : "outline"}
          onClick={() => setMessageType("email")}
          className="flex-1"
        >
          <Mail className="w-4 h-4 mr-2" />
          Email
        </Button>
        <Button
          variant={messageType === "sms" ? "default" : "outline"}
          onClick={() => setMessageType("sms")}
          className="flex-1"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          SMS
        </Button>
      </div>

      <div className="space-y-4">
        {messageType === "email" && (
          <div>
            <Label>Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject"
            />
          </div>
        )}
        <div>
          <Label>Message</Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={messageType === "sms" ? "SMS message (160 chars max)" : "Enter your message..."}
            rows={4}
            maxLength={messageType === "sms" ? 160 : undefined}
          />
          {messageType === "sms" && (
            <p className="text-xs text-slate-500 mt-1">{message.length}/160 characters</p>
          )}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <Label>Recipients ({selectedCustomers.length} selected)</Label>
          <Button variant="ghost" size="sm" onClick={toggleAll}>
            {selectedCustomers.length === customers.length ? 'Deselect All' : 'Select All'}
          </Button>
        </div>
        <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-3">
          {customers.map((customer) => {
            const hasContact = messageType === "email" ? customer.email : customer.phone;
            return (
              <div
                key={customer.id}
                className={`flex items-center gap-3 p-2 rounded ${!hasContact ? 'opacity-50' : ''}`}
              >
                <Checkbox
                  checked={selectedCustomers.includes(customer.id)}
                  onCheckedChange={() => toggleCustomer(customer.id)}
                  disabled={!hasContact}
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">{customer.name || customer.customer_name}</p>
                  <p className="text-xs text-slate-600">
                    {messageType === "email" ? customer.email || 'No email' : customer.phone || 'No phone'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {sending && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <div>
              <p className="font-semibold text-blue-900">Sending Messages...</p>
              <p className="text-sm text-blue-700">
                {progress.sent} of {progress.total} sent
              </p>
            </div>
          </div>
        </div>
      )}

      <Button
        onClick={handleSend}
        className="w-full bg-emerald-600 hover:bg-emerald-700"
        disabled={sending || selectedCustomers.length === 0 || !message || (messageType === "email" && !subject)}
      >
        <Send className="w-4 h-4 mr-2" />
        Send to {selectedCustomers.length} Customer{selectedCustomers.length !== 1 ? 's' : ''}
      </Button>
    </div>
  );
}
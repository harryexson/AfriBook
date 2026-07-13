
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Smartphone, Search, ShoppingCart, Send, CheckCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Removed: import { sendSms } from "@/functions/sendSms"; - now dynamically imported
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SmsOrderingGuide() {
  const [testPhone, setTestPhone] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState(null);

  const categories = [
  { name: "Appetizers", keyword: "APPETIZERS", color: "bg-blue-100 text-blue-800" },
  { name: "Entrées", keyword: "ENTREES", color: "bg-purple-100 text-purple-800" },
  { name: "Sides", keyword: "SIDES", color: "bg-green-100 text-green-800" },
  { name: "Desserts", keyword: "DESSERTS", color: "bg-pink-100 text-pink-800" },
  { name: "Beverages", keyword: "BEVERAGES", color: "bg-amber-100 text-amber-800" }];


  const exampleItems = [
  { name: "Classic Burger", keyword: "BURGER" },
  { name: "Margherita Pizza", keyword: "PIZZA" },
  { name: "Caesar Salad", keyword: "SALAD" },
  { name: "Chocolate Cake", keyword: "CAKE" }];


  const webhookUrl = `https://base44.app/api/apps/${window.location.hostname.split('.')[0].replace('preview--', '').replace('gastronomy-', '')}/functions/handleSmsOrder`;

  const handleTestSms = async () => {
    if (!testPhone) return;

    setIsSending(true);
    setResult(null);

    try {
      // Import the function dynamically
      const { sendSms } = await import("@/functions/sendSms");
      
      const response = await sendSms({
        to: testPhone,
        message: "🍽️ Welcome to Gastronomy! This is a test message. Text MENU to get started with ordering!"
      });

      if (response?.data?.success) {
        setResult({
          type: 'success',
          message: response.data.demo ?
          'Test successful! (Demo mode - configure Sinch to send real SMS)' :
          'Test SMS sent successfully! Check your phone for the message with opt-out instructions.'
        });
      } else if (response?.data?.opted_out) {
        setResult({
          type: 'error',
          message: 'This number has opted out of SMS messages. Text YES to opt back in first.'
        });
      } else {
        setResult({
          type: 'error',
          message: response?.data?.error || 'Failed to send test SMS. Please check your configuration.'
        });
      }
    } catch (error) {
      console.error('SMS error:', error);
      setResult({
        type: 'error',
        message: `Error: ${error.message || 'Failed to send SMS. Please check your Sinch configuration.'}`
      });
    }

    setIsSending(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full mb-6 shadow-lg">
            <MessageSquare className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Order by Text
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            The fastest way to order your favorites - just send a text message!
          </p>
        </div>

        <Card className="border-0 shadow-2xl mb-8 bg-gradient-to-br from-red-50 to-white border-2 border-red-200">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-3 text-red-700">
              <AlertCircle className="w-6 h-6" />
              Important: Webhook Setup Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-700 font-semibold">
              To receive SMS orders, you must configure your Sinch webhook:
            </p>
            
            <div className="bg-white rounded-xl p-6 border-2 border-slate-200">
              <h4 className="font-bold text-lg mb-4">Setup Steps:</h4>
              <ol className="space-y-3 list-decimal list-inside text-slate-700">
                <li>Go to <a href="https://dashboard.sinch.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Sinch Dashboard</a></li>
                <li>Navigate to <strong>SMS → Services → Your Service → Webhooks</strong></li>
                <li>Click <strong>"Add Webhook"</strong></li>
                <li>Set the webhook type to <strong>"Inbound SMS"</strong></li>
                <li>Copy and paste this URL:</li>
              </ol>
              
              <div className="mt-4 bg-slate-900 rounded-lg p-4 font-mono text-sm text-white break-all">
                {webhookUrl}
              </div>
              
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(webhookUrl);
                  setResult({ type: 'success', message: 'Webhook URL copied to clipboard!' });
                  setTimeout(() => setResult(null), 3000);
                }}
                variant="outline"
                className="mt-3 w-full"
              >
                📋 Copy Webhook URL
              </Button>

              <div className="mt-6 space-y-2">
                <p className="text-sm font-semibold">Additional Settings:</p>
                <ul className="text-sm text-slate-600 space-y-1 pl-4 list-disc">
                  <li>Method: <strong>POST</strong></li>
                  <li>Content Type: <strong>application/json</strong></li>
                  <li>Save and activate the webhook</li>
                </ul>
              </div>
            </div>

            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-900">
                <strong>⚠️ Note:</strong> After setting up the webhook, it may take a few minutes to activate. 
                Try sending "MENU" to your Sinch number again after setup.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Add SMS Compliance Section */}
        <Card className="border-0 shadow-2xl mb-8 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-blue-600" />
              SMS Compliance & Opt-Out
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-700">
              All SMS messages automatically include compliance text to meet regulatory requirements:
            </p>
            
            <div className="bg-white rounded-xl p-4 border-2 border-slate-200">
              <p className="text-sm font-mono text-slate-700">
                "Msg & data rates may apply. Text STOP to stop more texts. Text YES for future texts."
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <h4 className="font-bold text-red-900 mb-2">Text "STOP" to Opt-Out</h4>
                <p className="text-sm text-red-800">
                  Customers can text STOP at any time to unsubscribe. They will receive a confirmation and no future texts.
                </p>
              </div>

              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                <h4 className="font-bold text-green-900 mb-2">Text "YES" to Opt-In</h4>
                <p className="text-sm text-green-800">
                  Customers who previously opted out can text YES to resubscribe and start receiving messages again.
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mt-4">
              <p className="text-sm text-amber-900">
                <strong>⚠️ Important:</strong> Once a customer opts out, the system automatically blocks all SMS messages to that number until they opt back in. This ensures full compliance with SMS regulations.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-2xl mb-8 bg-gradient-to-br from-emerald-50 to-white">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-3">
              <Smartphone className="w-6 h-6 text-emerald-600" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-white rounded-xl shadow-sm">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-emerald-600">1</span>
                </div>
                <h3 className="font-bold text-lg mb-2">Text a Keyword</h3>
                <p className="text-slate-600 text-sm">
                  Send any menu keyword to our number
                </p>
              </div>
              <div className="text-center p-6 bg-white rounded-xl shadow-sm">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-emerald-600">2</span>
                </div>
                <h3 className="font-bold text-lg mb-2">Get Quick Link</h3>
                <p className="text-slate-600 text-sm">
                  Receive an instant link to order
                </p>
              </div>
              <div className="text-center p-6 bg-white rounded-xl shadow-sm">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-emerald-600">3</span>
                </div>
                <h3 className="font-bold text-lg mb-2">Complete Order</h3>
                <p className="text-slate-600 text-sm">
                  Finish checkout and pick up
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl mb-8 bg-gradient-to-br from-purple-50 to-white">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-3">
              <Send className="w-6 h-6 text-purple-600" />
              Test SMS Integration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">
              Send yourself a test message to verify Sinch is working:
            </p>
            <div className="flex gap-3">
              <Input
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="h-12 rounded-xl" />

              <Button
                onClick={handleTestSms}
                disabled={isSending || !testPhone}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 rounded-xl">

                {isSending ?
                <>Sending...</> :

                <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Test
                  </>
                }
              </Button>
            </div>
            {result &&
            <Alert className={`mt-4 ${
            result.type === 'success' ?
            'bg-green-50 border-green-200' :
            'bg-red-50 border-red-200'}`
            }>
                {result.type === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                <AlertDescription className={
              result.type === 'success' ? 'text-green-800' : 'text-red-800'
              }>
                  {result.message}
                </AlertDescription>
              </Alert>
            }
            
            <div className="mt-4 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-900">
                <strong>✓ This tests outgoing SMS</strong> (sending from our system to you).
                To test <strong>incoming SMS</strong> (receiving texts), you must complete the webhook setup above first.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <Search className="w-6 h-6 text-emerald-600" />
                Browse Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-6">
                Text a category keyword to see all items in that section:
              </p>
              <div className="space-y-3">
                {categories.map((cat) =>
                <div key={cat.keyword} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <span className="font-semibold text-slate-900">{cat.name}</span>
                    <Badge className={`${cat.color} font-mono font-bold text-sm px-4 py-1`}>
                      {cat.keyword}
                    </Badge>
                  </div>
                )}
                <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border-2 border-emerald-200">
                  <span className="font-semibold text-emerald-900">Full Menu</span>
                  <Badge className="bg-emerald-600 text-white font-mono font-bold text-sm px-4 py-1">
                    MENU
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <ShoppingCart className="w-6 h-6 text-emerald-600" />
                Quick Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-6">
                Text an item keyword for instant ordering:
              </p>
              <div className="space-y-3">
                {exampleItems.map((item) =>
                <div key={item.keyword} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <span className="font-semibold text-slate-900">{item.name}</span>
                    <Badge className="bg-purple-100 text-purple-800 font-mono font-bold text-sm px-4 py-1">
                      {item.keyword}
                    </Badge>
                  </div>
                )}
              </div>
              <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <p className="text-sm text-blue-900">
                  <strong>💡 Pro Tip:</strong> Keywords are shown on our online menu next to each item!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to Order?</h3>
            <p className="text-emerald-100 text-lg mb-6">
              Text any keyword to get started (after webhook setup)
            </p>
            <div className="inline-block bg-white text-emerald-600 px-8 py-4 rounded-xl shadow-lg">
              <p className="text-sm font-semibold mb-1">Text us at:</p>
              <p className="text-3xl font-bold">+1 (208) 568-6634</p>
            </div>
            <div className="mt-6 bg-emerald-700 rounded-xl p-4 max-w-2xl mx-auto">
              <p className="text-sm text-emerald-100 mb-2">
                <strong>Troubleshooting:</strong>
              </p>
              <ul className="text-xs text-emerald-100 space-y-1 text-left pl-4 list-disc">
                <li>Make sure webhook is saved and active in Sinch</li>
                <li>Verify the webhook URL matches exactly</li>
                <li>Check that your Sinch number is active</li>
                <li>Wait a few minutes after webhook setup</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>);

}

import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, CheckCircle, XCircle, Loader2, Send, 
  AlertCircle, Copy, ExternalLink 
} from "lucide-react";

export default function TestGroupOrder() {
  const [isCreating, setIsCreating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  // Test data
  const [testData, setTestData] = useState({
    restaurantId: "",
    organizerEmail: "",
    memberEmails: "",
    title: "Test Group Order - Team Lunch"
  });

  const createTestGroupOrder = async () => {
    setIsCreating(true);
    setError(null);
    setResult(null);

    try {
      const user = await base44.auth.me();
      
      // Get restaurant
      const restaurants = await base44.entities.Restaurant.filter({ 
        marketplace_enabled: true,
        status: "active" 
      });
      
      if (restaurants.length === 0) {
        throw new Error("No active restaurants found");
      }

      const restaurant = testData.restaurantId 
        ? restaurants.find(r => r.id === testData.restaurantId) || restaurants[0]
        : restaurants[0];

      // Parse member emails
      const memberEmailsList = testData.memberEmails
        .split(',')
        .map(e => e.trim())
        .filter(e => e.length > 0);

      if (memberEmailsList.length === 0) {
        throw new Error("Please provide at least one member email");
      }

      // Create party members
      const partyMembers = memberEmailsList.map((email, idx) => ({
        id: `test_member_${Date.now()}_${idx}`,
        name: email.split('@')[0],
        email: email,
        status: "pending",
        invitation_token: `token_${Date.now()}_${idx}`,
        invited_at: new Date().toISOString()
      }));

      // Create deadline (2 hours from now)
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + 2);

      // Create group order
      const groupOrder = await base44.entities.GroupOrder.create({
        title: testData.title,
        restaurant_id: restaurant.id,
        restaurant_name: restaurant.business_name,
        organizer_email: testData.organizerEmail || user.email,
        organizer_name: user.full_name || user.email.split('@')[0],
        organizer_phone: user.phone || "",
        party_members: partyMembers,
        status: "collecting",
        delivery_type: "pickup",
        deadline: deadline.toISOString(),
        total_amount: 0,
        subtotal: 0,
        tax: 0,
        share_link: `${window.location.origin}/group-order-select`
      });

      // Update share link with actual ID
      const shareLink = `${window.location.origin}/group-order-select?id=${groupOrder.id}`;
      await base44.entities.GroupOrder.update(groupOrder.id, { share_link: shareLink });

      // Update party members with proper share links
      const updatedMembers = partyMembers.map(member => ({
        ...member,
        share_link: `${shareLink}&token=${member.invitation_token}`
      }));

      await base44.entities.GroupOrder.update(groupOrder.id, { 
        party_members: updatedMembers 
      });

      // Send invitations using service role
      const inviteResult = await base44.asServiceRole.functions.invoke('sendGroupOrderInvites', {
        members: updatedMembers,
        groupOrder: {
          ...groupOrder,
          share_link: shareLink
        },
        organizerName: user.full_name || user.email.split('@')[0],
        restaurantName: restaurant.business_name
      });

      setResult({
        success: true,
        groupOrderId: groupOrder.id,
        shareLink: shareLink,
        restaurant: restaurant.business_name,
        membersCount: partyMembers.length,
        deadline: deadline.toLocaleString(),
        inviteResult: inviteResult.data
      });

    } catch (err) {
      console.error("Error creating test group order:", err);
      setError(err.message || "Failed to create test group order");
    }

    setIsCreating(false);
  };

  const testOrderStatusUpdates = async () => {
    setIsTesting(true);
    setError(null);

    try {
      const user = await base44.auth.me();

      // Create a test order
      const restaurants = await base44.entities.Restaurant.filter({ 
        marketplace_enabled: true,
        status: "active" 
      });

      if (restaurants.length === 0) {
        throw new Error("No active restaurants found");
      }

      const restaurant = restaurants[0];

      // Create test order
      const order = await base44.asServiceRole.entities.Order.create({
        restaurant_id: restaurant.id,
        restaurant_name: restaurant.business_name,
        customer_name: user.full_name || "Test Customer",
        customer_email: user.email,
        customer_phone: user.phone || "",
        items: [{
          menu_item_id: "test_item",
          name: "Test Burger",
          price: 12.99,
          quantity: 1
        }],
        total_amount: 12.99,
        subtotal: 12.99,
        tax: 0,
        status: "pending",
        payment_status: "completed",
        order_type: "web",
        delivery_type: "pickup",
        status_history: [{
          status: "pending",
          timestamp: new Date().toISOString(),
          notes: "Test order created"
        }]
      });

      // Test all status transitions
      const statuses = [
        'pending',
        'confirmed', 
        'preparing', 
        'ready',
        'completed'
      ];

      const statusResults = [];

      for (const status of statuses) {
        try {
          const result = await base44.asServiceRole.functions.invoke('notifyOrderStatusChange', {
            orderId: order.id,
            status: status,
            customerEmail: user.email,
            customerPhone: user.phone || "",
            customerName: user.full_name || "Test Customer"
          });

          statusResults.push({
            status: status,
            success: result.data?.success || false,
            notificationSent: result.data?.notificationSent || false,
            emailSent: result.data?.emailSent || false,
            smsSent: result.data?.smsSent || false
          });

          // Wait a bit between status updates
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (err) {
          statusResults.push({
            status: status,
            success: false,
            error: err.message
          });
        }
      }

      setResult({
        success: true,
        testType: "status_updates",
        orderId: order.id,
        statusResults: statusResults,
        message: "All order status notifications have been sent!"
      });

    } catch (err) {
      console.error("Error testing status updates:", err);
      setError(err.message || "Failed to test status updates");
    }

    setIsTesting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Test Group Ordering System
          </h1>
          <p className="text-slate-600">
            Test the complete group order workflow and order status notifications
          </p>
        </div>

        {/* Test Group Order Creation */}
        <Card className="mb-6 border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-6 h-6 text-purple-600" />
              Test Group Order Creation
            </CardTitle>
            <CardDescription>
              Create a test group order and send invitations to participants
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Restaurant ID (optional - will use first active restaurant)</Label>
              <Input
                value={testData.restaurantId}
                onChange={(e) => setTestData({...testData, restaurantId: e.target.value})}
                placeholder="Leave empty for auto-select"
              />
            </div>

            <div>
              <Label>Organizer Email (optional - will use your email)</Label>
              <Input
                type="email"
                value={testData.organizerEmail}
                onChange={(e) => setTestData({...testData, organizerEmail: e.target.value})}
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <Label>Member Emails (comma-separated) *</Label>
              <Input
                type="text"
                value={testData.memberEmails}
                onChange={(e) => setTestData({...testData, memberEmails: e.target.value})}
                placeholder="member1@example.com, member2@example.com"
              />
              <p className="text-xs text-slate-500 mt-1">
                Note: In test mode, emails only send to verified addresses
              </p>
            </div>

            <div>
              <Label>Order Title</Label>
              <Input
                value={testData.title}
                onChange={(e) => setTestData({...testData, title: e.target.value})}
              />
            </div>

            <Button
              onClick={createTestGroupOrder}
              disabled={isCreating || !testData.memberEmails}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Test Group Order...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Create & Send Test Group Order
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Test Order Status Updates */}
        <Card className="mb-6 border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              Test Order Status Notifications
            </CardTitle>
            <CardDescription>
              Test all order status transitions and notifications (email, SMS, in-app)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-sm text-slate-600 mb-2">
                This will create a test order and send notifications for each status:
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge>Pending</Badge>
                <Badge>Confirmed</Badge>
                <Badge>Preparing</Badge>
                <Badge>Ready</Badge>
                <Badge>Completed</Badge>
              </div>
            </div>

            <Button
              onClick={testOrderStatusUpdates}
              disabled={isTesting}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing Status Updates...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Test Order Status Notifications
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-50 to-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-900">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
                Test Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.testType === "status_updates" ? (
                <>
                  <div className="bg-white rounded-lg p-4 border">
                    <p className="text-sm text-slate-600 mb-2">
                      <strong>Test Order ID:</strong> {result.orderId}
                    </p>
                    <p className="text-emerald-700 font-semibold">{result.message}</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold">Status Update Results:</Label>
                    {result.statusResults.map((sr, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-3 border">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className="capitalize">{sr.status.replace(/_/g, ' ')}</Badge>
                          {sr.success ? (
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div className="text-xs text-slate-600 space-y-1">
                          <div>In-app: {sr.notificationSent ? '✓ Sent' : '✗ Failed'}</div>
                          <div>Email: {sr.emailSent ? '✓ Sent' : '✗ Not sent'}</div>
                          <div>SMS: {sr.smsSent ? '✓ Sent' : '✗ Not sent'}</div>
                          {sr.error && <div className="text-red-600">Error: {sr.error}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-white rounded-lg p-4 border space-y-2">
                    <p className="text-sm">
                      <strong>Group Order ID:</strong> {result.groupOrderId}
                    </p>
                    <p className="text-sm">
                      <strong>Restaurant:</strong> {result.restaurant}
                    </p>
                    <p className="text-sm">
                      <strong>Members:</strong> {result.membersCount}
                    </p>
                    <p className="text-sm">
                      <strong>Deadline:</strong> {result.deadline}
                    </p>
                  </div>

                  {result.inviteResult && (
                    <div className="bg-white rounded-lg p-4 border">
                      <Label className="font-bold mb-2 block">Invitation Results:</Label>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span>Sent: {result.inviteResult.sent || 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span>Failed: {result.inviteResult.failed || 0}</span>
                        </div>
                        {result.inviteResult.errors?.length > 0 && (
                          <div className="mt-2 p-2 bg-amber-50 rounded text-xs">
                            {result.inviteResult.errors.map((err, idx) => (
                              <div key={idx} className="text-amber-800">
                                {err.member}: {err.error}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                    <Label className="font-bold mb-2 block">Share Link:</Label>
                    <div className="flex gap-2">
                      <Input value={result.shareLink} readOnly className="text-xs" />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(result.shareLink);
                          alert("Link copied!");
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(result.shareLink, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <Alert>
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>
                      <strong>Next Steps:</strong>
                      <ol className="list-decimal ml-4 mt-2 space-y-1 text-sm">
                        <li>Check member emails for invitations</li>
                        <li>Click the share link to test member selection flow</li>
                        <li>Go to "Manage Group Order" to submit the final order</li>
                        <li>Test order status updates from Kitchen Display</li>
                      </ol>
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Key, Copy, Plus, Trash2, RefreshCw, AlertCircle, CheckCircle, Loader2, Code, BookOpen } from "lucide-react";
import { toast } from "sonner";

export default function APIManagement() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPermissions, setNewKeyPermissions] = useState([]);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.email !== "harryxson@hotmail.com" && currentUser.email !== "harryexson@hotmail.com") {
        navigate(createPageUrl("Home"));
        return;
      }
      setUser(currentUser);
      loadAPIData();
    } catch (error) {
      navigate(createPageUrl("Home"));
    }
  };

  const loadAPIData = async () => {
    setLoading(true);
    try {
      // Simulated API keys and webhooks (in production, these would come from a database)
      setApiKeys([
        {
          id: "key_1",
          name: "Production API Key",
          key: "pk_live_" + Math.random().toString(36).substr(2, 32),
          created: new Date().toISOString(),
          lastUsed: new Date().toISOString(),
          permissions: ["read", "write"],
          status: "active"
        },
        {
          id: "key_2",
          name: "Test API Key",
          key: "pk_test_" + Math.random().toString(36).substr(2, 32),
          created: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          permissions: ["read"],
          status: "active"
        }
      ]);

      setWebhooks([
        {
          id: "wh_1",
          url: "https://example.com/webhooks/orders",
          events: ["order.created", "order.updated"],
          status: "active",
          lastTriggered: new Date().toISOString(),
          successRate: 98.5
        }
      ]);
    } catch (error) {
      console.error("Failed to load API data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateAPIKey = () => {
    if (!newKeyName.trim()) {
      toast.error("Please enter a key name");
      return;
    }

    const newKey = {
      id: `key_${Date.now()}`,
      name: newKeyName,
      key: "pk_live_" + Math.random().toString(36).substr(2, 32),
      created: new Date().toISOString(),
      lastUsed: null,
      permissions: newKeyPermissions,
      status: "active"
    };

    setApiKeys([...apiKeys, newKey]);
    setDialogOpen(false);
    setNewKeyName("");
    setNewKeyPermissions([]);
    toast.success("API key created successfully");
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const revokeKey = (keyId) => {
    if (confirm("Are you sure you want to revoke this API key?")) {
      setApiKeys(apiKeys.filter(k => k.id !== keyId));
      toast.success("API key revoked");
    }
  };

  const deleteWebhook = (webhookId) => {
    if (confirm("Are you sure you want to delete this webhook?")) {
      setWebhooks(webhooks.filter(w => w.id !== webhookId));
      toast.success("Webhook deleted");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">API Management</h1>
          <p className="text-slate-600">Manage API keys, webhooks, and integrations</p>
        </div>
      </div>

      <Tabs defaultValue="keys" className="space-y-6">
        <TabsList>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="docs">Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>API Keys</CardTitle>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Create API Key
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New API Key</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Key Name</Label>
                        <Input
                          placeholder="e.g., Production Key"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Permissions</Label>
                        <div className="space-y-2 mt-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={newKeyPermissions.includes("read")}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewKeyPermissions([...newKeyPermissions, "read"]);
                                } else {
                                  setNewKeyPermissions(newKeyPermissions.filter(p => p !== "read"));
                                }
                              }}
                            />
                            Read Access
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={newKeyPermissions.includes("write")}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewKeyPermissions([...newKeyPermissions, "write"]);
                                } else {
                                  setNewKeyPermissions(newKeyPermissions.filter(p => p !== "write"));
                                }
                              }}
                            />
                            Write Access
                          </label>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={generateAPIKey} className="bg-emerald-600 hover:bg-emerald-700">
                        Generate Key
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apiKeys.map((key) => (
                  <Card key={key.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Key className="w-5 h-5 text-slate-600" />
                            <h3 className="font-semibold text-lg">{key.name}</h3>
                            <Badge variant={key.status === "active" ? "default" : "secondary"}>
                              {key.status}
                            </Badge>
                          </div>
                          <div className="bg-slate-100 rounded-lg p-3 font-mono text-sm flex items-center justify-between mb-3">
                            <span className="text-slate-600">{key.key}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(key.key)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-slate-600">Created</p>
                              <p className="font-medium">{new Date(key.created).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-slate-600">Last Used</p>
                              <p className="font-medium">
                                {key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : "Never"}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-600">Permissions</p>
                              <div className="flex gap-1 mt-1">
                                {key.permissions.map(p => (
                                  <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => revokeKey(key.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Webhooks</CardTitle>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Webhook
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {webhooks.map((webhook) => (
                  <Card key={webhook.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <RefreshCw className="w-5 h-5 text-slate-600" />
                            <h3 className="font-semibold text-lg">{webhook.url}</h3>
                            <Badge variant={webhook.status === "active" ? "default" : "secondary"}>
                              {webhook.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm mt-3">
                            <div>
                              <p className="text-slate-600">Events</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {webhook.events.map(e => (
                                  <Badge key={e} variant="outline" className="text-xs">{e}</Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-slate-600">Success Rate</p>
                              <p className="font-medium text-green-600">{webhook.successRate}%</p>
                            </div>
                            <div>
                              <p className="text-slate-600">Last Triggered</p>
                              <p className="font-medium">{new Date(webhook.lastTriggered).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => deleteWebhook(webhook.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                API Documentation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">Authentication</h3>
                <p className="text-slate-600 mb-3">
                  Include your API key in the Authorization header of all requests:
                </p>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto">
{`curl https://api.restrobuddy.com/v1/restaurants \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Endpoints</h3>
                <div className="space-y-3">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-green-600">GET</Badge>
                      <code className="text-sm">/v1/restaurants</code>
                    </div>
                    <p className="text-sm text-slate-600">List all restaurants</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-blue-600">POST</Badge>
                      <code className="text-sm">/v1/orders</code>
                    </div>
                    <p className="text-sm text-slate-600">Create a new order</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-amber-600">PUT</Badge>
                      <code className="text-sm">/v1/orders/:id</code>
                    </div>
                    <p className="text-sm text-slate-600">Update order status</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Rate Limits</h3>
                <p className="text-slate-600">
                  API requests are limited to 1000 per hour per API key. Rate limit headers are included in all responses.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
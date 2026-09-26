'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Copy, Trash2, Eye, EyeOff, Key, Shield, Zap, Globe, Link as LinkIcon, Settings, RotateCcw, Loader2, Check, AlertTriangle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { createApiKey, getApiKeys, deleteApiKey, regenerateApiKey, updateApiKey, type ApiKey, type ApiKeyScope, createWebhookEndpoint, getWebhookEndpoints, deleteWebhookEndpoint, updateWebhookEndpoint, type WebhookEndpoint, createExternalPlatformConnection, getExternalPlatformConnections, updateExternalPlatformConnection, deleteExternalPlatformConnection, type ExternalPlatformConnection } from '@/lib/vehicle-rental';

const SCOPE_OPTIONS: { value: ApiKeyScope; label: string; description: string }[] = [
  { value: 'read', label: 'Read', description: 'Read access to vehicles, bookings, availability' },
  { value: 'write', label: 'Write', description: 'Create and update vehicles, availability' },
  { value: 'bookings', label: 'Bookings', description: 'Manage bookings (confirm, cancel, complete)' },
  { value: 'vehicles', label: 'Vehicles', description: 'Full vehicle CRUD operations' },
  { value: 'availability', label: 'Availability', description: 'Read/write vehicle availability calendar' },
  { value: 'webhooks', label: 'Webhooks', description: 'Manage webhook endpoints and deliveries' },
  { value: 'admin', label: 'Admin', description: 'Full access including payouts and analytics' },
];

const WEBHOOK_EVENTS = [
  'booking.created',
  'booking.confirmed',
  'booking.cancelled',
  'booking.completed',
  'booking.no_show',
  'vehicle.created',
  'vehicle.updated',
  'vehicle.availability_changed',
  'vehicle.verification_changed',
  'review.created',
  'payout.created',
  'payout.completed',
];

export function ApiKeyManagement({ hostId }: { hostId: string }) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [platformConnections, setPlatformConnections] = useState<ExternalPlatformConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'api-keys' | 'webhooks' | 'platforms'>('api-keys');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showWebhookDialog, setShowWebhookDialog] = useState(false);
  const [showPlatformDialog, setShowPlatformDialog] = useState(false);
  const [editingApiKey, setEditingApiKey] = useState<ApiKey | null>(null);
  const [newKey, setNewKey] = useState('');
  const [regeneratingKeyId, setRegeneratingKeyId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    scopes: ['read'] as ApiKeyScope[],
    rateLimitPerMinute: 60,
    rateLimitPerDay: 10000,
    expiresAt: '',
  });

  const [webhookFormData, setWebhookFormData] = useState({
    url: '',
    events: ['booking.created', 'booking.confirmed', 'booking.cancelled', 'booking.completed'] as string[],
    isActive: true,
    apiKeyId: '',
  });

  const [platformFormData, setPlatformFormData] = useState({
    platformName: '',
    platformUrl: '',
    apiKeyId: '',
    syncEnabled: false,
    syncFrequency: 'hourly',
    fieldMapping: {},
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [keys, hooks, platforms] = await Promise.all([
        getApiKeys(hostId),
        getWebhookEndpoints(hostId),
        getExternalPlatformConnections(hostId),
      ]);
      setApiKeys(keys);
      setWebhooks(hooks);
      setPlatformConnections(platforms);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load API data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [hostId]);

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { apiKey, fullKey } = await createApiKey({
        hostId,
        ...formData,
      });
      setNewKey(fullKey);
      setApiKeys(prev => [apiKey, ...prev]);
      setShowCreateDialog(false);
      setFormData({ name: '', scopes: ['read'], rateLimitPerMinute: 60, rateLimitPerDay: 10000, expiresAt: '' });
      toast({ title: 'API Key Created', description: 'Your new API key is shown below. Save it now - you won\'t see it again!' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to create API key', variant: 'destructive' });
    }
  };

  const handleRegenerateKey = async (apiKeyId: string) => {
    setRegeneratingKeyId(apiKeyId);
    try {
      const { apiKey, fullKey } = await regenerateApiKey(apiKeyId);
      setNewKey(fullKey);
      setApiKeys(prev => prev.map(k => k.id === apiKeyId ? apiKey : k));
      toast({ title: 'Key Regenerated', description: 'Your new API key is shown below. Save it now!' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to regenerate key', variant: 'destructive' });
    } finally {
      setRegeneratingKeyId(null);
    }
  };

  const handleDeleteKey = async (apiKeyId: string) => {
    if (!confirm('Are you sure you want to delete this API key? This cannot be undone.')) return;
    try {
      await deleteApiKey(apiKeyId);
      setApiKeys(prev => prev.filter(k => k.id !== apiKeyId));
      toast({ title: 'Deleted', description: 'API key has been removed' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete key', variant: 'destructive' });
    }
  };

  const handleToggleKeyStatus = async (apiKey: ApiKey) => {
    try {
      const updated = await updateApiKey(apiKey.id, { isActive: !apiKey.isActive });
      setApiKeys(prev => prev.map(k => k.id === apiKey.id ? updated : k));
      toast({ title: updated.isActive ? 'Enabled' : 'Disabled', description: `API key has been ${updated.isActive ? 'enabled' : 'disabled'}` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update key', variant: 'destructive' });
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { webhook, secret } = await createWebhookEndpoint({
        hostId,
        ...webhookFormData,
      });
      setWebhooks(prev => [webhook, ...prev]);
      setShowWebhookDialog(false);
      setWebhookFormData({ url: '', events: ['booking.created', 'booking.confirmed', 'booking.cancelled', 'booking.completed'], isActive: true, apiKeyId: '' });
      toast({ title: 'Webhook Created', description: `Webhook secret: ${secret}. Save it for signature verification.` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to create webhook', variant: 'destructive' });
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook endpoint?')) return;
    try {
      await deleteWebhookEndpoint(webhookId);
      setWebhooks(prev => prev.filter(w => w.id !== webhookId));
      toast({ title: 'Deleted', description: 'Webhook endpoint has been removed' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete webhook', variant: 'destructive' });
    }
  };

  const handleToggleWebhookStatus = async (webhook: WebhookEndpoint) => {
    try {
      const updated = await updateWebhookEndpoint(webhook.id, { isActive: !webhook.isActive });
      setWebhooks(prev => prev.map(w => w.id === webhook.id ? updated : w));
      toast({ title: updated.isActive ? 'Enabled' : 'Disabled', description: `Webhook has been ${updated.isActive ? 'enabled' : 'disabled'}` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update webhook', variant: 'destructive' });
    }
  };

  const handleCreatePlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const connection = await createExternalPlatformConnection({
        hostId,
        ...platformFormData,
      });
      setPlatformConnections(prev => [connection, ...prev]);
      setShowPlatformDialog(false);
      setPlatformFormData({ platformName: '', platformUrl: '', apiKeyId: '', syncEnabled: false, syncFrequency: 'hourly', fieldMapping: {} });
      toast({ title: 'Platform Connected', description: 'External platform connection created' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to create connection', variant: 'destructive' });
    }
  };

  const handleDeletePlatform = async (connectionId: string) => {
    if (!confirm('Are you sure you want to remove this platform connection?')) return;
    try {
      await deleteExternalPlatformConnection(connectionId);
      setPlatformConnections(prev => prev.filter(p => p.id !== connectionId));
      toast({ title: 'Removed', description: 'Platform connection has been removed' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to remove connection', variant: 'destructive' });
    }
  };

  const handleTogglePlatformSync = async (connection: ExternalPlatformConnection) => {
    try {
      const updated = await updateExternalPlatformConnection(connection.id, { syncEnabled: !connection.syncEnabled });
      setPlatformConnections(prev => prev.map(p => p.id === connection.id ? updated : p));
      toast({ title: updated.syncEnabled ? 'Sync Enabled' : 'Sync Disabled', description: `Platform sync has been ${updated.syncEnabled ? 'enabled' : 'disabled'}` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update connection', variant: 'destructive' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: 'Copied to clipboard' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">API & Integrations</h2>
          <p className="text-muted-foreground">Manage API keys, webhooks, and external platform connections</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="api-keys">
            <Key className="mr-2 h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="webhooks">
            <Zap className="mr-2 h-4 w-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="platforms">
            <Globe className="mr-2 h-4 w-4" />
            Platforms
          </TabsTrigger>
        </TabsList>

        {/* API Keys Tab */}
        <TabsContent value="api-keys" className="mt-6">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create API Key
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New API Key</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateApiKey} className="space-y-4 py-4">
                <div>
                  <Label htmlFor="keyName">Key Name</Label>
                  <Input
                    id="keyName"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Website Integration, Mobile App"
                    required
                  />
                </div>
                <div>
                  <Label>Scopes</Label>
                  <div className="space-y-2 mt-2">
                    {SCOPE_OPTIONS.map(scope => (
                      <label key={scope.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.scopes.includes(scope.value)}
                          onChange={e => setFormData(prev => ({
                            ...prev,
                            scopes: e.target.checked
                              ? [...prev.scopes, scope.value]
                              : prev.scopes.filter(s => s !== scope.value)
                          }))}
                          className="rounded border-input"
                        />
                        <div>
                          <span className="font-medium">{scope.label}</span>
                          <p className="text-sm text-muted-foreground">{scope.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="rateLimitMin">Rate Limit (per minute)</Label>
                    <Input
                      id="rateLimitMin"
                      type="number"
                      min="1"
                      max="1000"
                      value={formData.rateLimitPerMinute}
                      onChange={e => setFormData(prev => ({ ...prev, rateLimitPerMinute: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rateLimitDay">Rate Limit (per day)</Label>
                    <Input
                      id="rateLimitDay"
                      type="number"
                      min="100"
                      max="100000"
                      value={formData.rateLimitPerDay}
                      onChange={e => setFormData(prev => ({ ...prev, rateLimitPerDay: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="expiresAt">Expires At (optional)</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={e => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                  <Button type="submit">Create API Key</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* New Key Display */}
          {newKey && (
            <Dialog open onOpenChange={setShowCreateDialog}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-green-500" />
                    API Key Created Successfully
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Alert variant="default">
                    <AlertTitle>Important: Save this key now</AlertTitle>
                    <AlertDescription>
                      This is the only time you'll see the full API key. Store it securely - it cannot be recovered later.
                    </AlertDescription>
                  </Alert>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={newKey}
                      className="flex-1 font-mono text-sm"
                    />
                    <Button variant="outline" onClick={() => { copyToClipboard(newKey); setNewKey(''); }}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                  <Button className="w-full" onClick={() => setNewKey('')}>Done</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="pt-6">
                    <div className="h-6 w-1/4 bg-muted rounded mb-4" />
                    <div className="h-4 w-1/2 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : apiKeys.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Key className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No API Keys Yet</h3>
                <p className="text-muted-foreground mb-6">Create your first API key to integrate with external platforms</p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create API Key
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {apiKeys.map(key => (
                <Card key={key.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <Key className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{key.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Badge variant={key.isActive ? 'default' : 'secondary'}>{key.isActive ? 'Active' : 'Inactive'}</Badge>
                            <span className="font-mono text-xs">{key.keyPrefix}</span>
                            <span>• Last used: {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Switch
                          checked={key.isActive}
                          onCheckedChange={() => handleToggleKeyStatus(key)}
                          disabled={regeneratingKeyId === key.id}
                        />
                        <Button variant="outline" size="sm" onClick={() => handleRegenerateKey(key.id)} disabled={regeneratingKeyId === key.id}>
                          {regeneratingKeyId === key.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteKey(key.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Scopes</Label>
                      <div className="flex flex-wrap gap-1">
                        {key.scopes.map(scope => (
                          <Badge key={scope} variant="outline">{scope}</Badge>
                        ))}
                      </div>
                    </div>
                    {key.rateLimitPerMinute && (
                      <div className="mt-4 text-sm text-muted-foreground">
                        Rate Limits: {key.rateLimitPerMinute}/min • {key.rateLimitPerDay}/day
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="mt-6">
          <Dialog open={showWebhookDialog} onOpenChange={setShowWebhookDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Webhook
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Webhook Endpoint</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateWebhook} className="space-y-4 py-4">
                <div>
                  <Label htmlFor="webhookUrl">Webhook URL</Label>
                  <Input
                    id="webhookUrl"
                    type="url"
                    value={webhookFormData.url}
                    onChange={e => setWebhookFormData(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://your-platform.com/webhooks/afribook"
                    required
                  />
                </div>
                <div>
                  <Label>Events to Subscribe</Label>
                  <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
                    {WEBHOOK_EVENTS.map(event => (
                      <label key={event} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={webhookFormData.events.includes(event)}
                          onChange={e => setWebhookFormData(prev => ({
                            ...prev,
                            events: e.target.checked
                              ? [...prev.events, event]
                              : prev.events.filter(e => e !== event)
                          }))}
                          className="rounded border-input"
                        />
                        <span className="text-sm font-mono">{event}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="webhookApiKey">Associated API Key (optional)</Label>
                  <Select value={webhookFormData.apiKeyId} onValueChange={v => setWebhookFormData(prev => ({ ...prev, apiKeyId: v }))}>
                    <SelectTrigger id="webhookApiKey">
                      <SelectValue placeholder="Select API key for authentication" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None (use webhook secret only)</SelectItem>
                      {apiKeys.filter(k => k.isActive).map(key => (
                        <SelectItem key={key.id} value={key.id}>{key.name} ({key.keyPrefix})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={webhookFormData.isActive}
                    onCheckedChange={checked => setWebhookFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label>Active</Label>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowWebhookDialog(false)}>Cancel</Button>
                  <Button type="submit">Create Webhook</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="pt-6">
                    <div className="h-6 w-1/4 bg-muted rounded mb-4" />
                    <div className="h-4 w-1/2 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : webhooks.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Zap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Webhooks Configured</h3>
                <p className="text-muted-foreground mb-6">Set up webhooks to receive real-time events from AfriBook</p>
                <Button onClick={() => setShowWebhookDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Webhook
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {webhooks.map(webhook => (
                <Card key={webhook.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple/10 rounded-lg">
                          <Zap className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{webhook.url}</h4>
                            <Badge variant={webhook.isActive ? 'default' : 'secondary'}>{webhook.isActive ? 'Active' : 'Inactive'}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1 text-xs text-muted-foreground">
                            {webhook.events.slice(0, 3).map(e => <Badge key={e} variant="outline" className="text-xs">{e}</Badge>)}
                            {webhook.events.length > 3 && <Badge variant="outline" className="text-xs">+{webhook.events.length - 3} more</Badge>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={webhook.isActive}
                          onCheckedChange={() => handleToggleWebhookStatus(webhook)}
                        />
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteWebhook(webhook.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="grid gap-2 md:grid-cols-3 text-sm text-muted-foreground">
                      <div>Success: {webhook.lastSuccessAt ? new Date(webhook.lastSuccessAt).toLocaleString() : 'Never'}</div>
                      <div>Failure: {webhook.lastFailureAt ? new Date(webhook.lastFailureAt).toLocaleString() : 'Never'}</div>
                      <div>Retries: {webhook.retryCount}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Platforms Tab */}
        <TabsContent value="platforms" className="mt-6">
          <Dialog open={showPlatformDialog} onOpenChange={setShowPlatformDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Connect Platform
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Connect External Platform</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreatePlatform} className="space-y-4 py-4">
                <div>
                  <Label htmlFor="platformName">Platform Name</Label>
                  <Input
                    id="platformName"
                    value={platformFormData.platformName}
                    onChange={e => setPlatformFormData(prev => ({ ...prev, platformName: e.target.value }))}
                    placeholder="e.g., Turo, Getaround, Custom Website"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="platformUrl">Platform URL (optional)</Label>
                  <Input
                    id="platformUrl"
                    type="url"
                    value={platformFormData.platformUrl}
                    onChange={e => setPlatformFormData(prev => ({ ...prev, platformUrl: e.target.value }))}
                    placeholder="https://partner-platform.com"
                  />
                </div>
                <div>
                  <Label htmlFor="platformApiKey">API Key to Use</Label>
                  <Select value={platformFormData.apiKeyId} onValueChange={v => setPlatformFormData(prev => ({ ...prev, apiKeyId: v }))}>
                    <SelectTrigger id="platformApiKey">
                      <SelectValue placeholder="Select an API key" />
                    </SelectTrigger>
                    <SelectContent>
                      {apiKeys.filter(k => k.isActive && k.scopes.includes('write')).map(key => (
                        <SelectItem key={key.id} value={key.id}>{key.name} ({key.keyPrefix})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={platformFormData.syncEnabled}
                    onCheckedChange={checked => setPlatformFormData(prev => ({ ...prev, syncEnabled: checked }))}
                  />
                  <Label>Enable Auto-Sync</Label>
                </div>
                {platformFormData.syncEnabled && (
                  <div>
                    <Label htmlFor="syncFrequency">Sync Frequency</Label>
                    <Select value={platformFormData.syncFrequency} onValueChange={v => setPlatformFormData(prev => ({ ...prev, syncFrequency: v }))}>
                      <SelectTrigger id="syncFrequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="manual">Manual Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowPlatformDialog(false)}>Cancel</Button>
                  <Button type="submit">Connect Platform</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {platformConnections.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Globe className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Platform Connections</h3>
                <p className="text-muted-foreground mb-6">Connect external rental platforms to sync vehicles and bookings</p>
                <Button onClick={() => setShowPlatformDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Connect Platform
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {platformConnections.map(connection => (
                <Card key={connection.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue/10 rounded-lg">
                          <Globe className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{connection.platformName}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Badge variant={connection.syncEnabled ? 'default' : 'secondary'}>
                              {connection.syncEnabled ? 'Sync Enabled' : 'Sync Disabled'}
                            </Badge>
                            <Badge variant="outline">{connection.syncFrequency}</Badge>
                            <Badge variant={connection.syncStatus === 'success' ? 'default' : connection.syncStatus === 'failed' ? 'destructive' : 'outline'}>
                              {connection.syncStatus}
                            </Badge>
                          </div>
                          {connection.platformUrl && (
                            <a href={connection.platformUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1 mt-1">
                              <LinkIcon className="h-3 w-3" />
                              Visit Platform
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={connection.syncEnabled}
                          onCheckedChange={() => handleTogglePlatformSync(connection)}
                        />
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeletePlatform(connection.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {connection.lastSyncedAt && (
                      <div className="mt-4 text-sm text-muted-foreground">
                        Last synced: {new Date(connection.lastSyncedAt).toLocaleString()}
                        {connection.syncErrorMessage && (
                          <span className="ml-4 text-red-600">Error: {connection.syncErrorMessage}</span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
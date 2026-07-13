import React, { useState, useEffect } from "react";
import { Restaurant } from "@/entities/Restaurant";
import { MenuItem } from "@/entities/MenuItem";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Store, CheckCircle, AlertCircle, Link as LinkIcon, Download, Sparkles, Info, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { importMenuFromUrl } from "@/functions/importMenuFromUrl";

export default function RestaurantSettings() {
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [orphanedMenuItems, setOrphanedMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [importUrl, setImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [previewItems, setPreviewItems] = useState([]);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Load all restaurants
      const restaurants = await Restaurant.list();
      setAllRestaurants(restaurants);

      // Find restaurant owned by current user
      const myRestaurant = restaurants.find(r => r.owner_email === currentUser.email);
      
      if (myRestaurant) {
        setRestaurant(myRestaurant);
        
        // Load menu items for this restaurant
        const items = await MenuItem.filter({ restaurant_id: myRestaurant.id });
        setMenuItems(items);
      }

      // Find orphaned menu items (with wrong restaurant_id)
      const allMenuItems = await MenuItem.list();
      const orphaned = allMenuItems.filter(item => 
        !restaurants.find(r => r.id === item.restaurant_id)
      );
      setOrphanedMenuItems(orphaned);

    } catch (error) {
      console.error("Error loading data:", error);
      setMessage({ type: "error", text: "Failed to load restaurant data" });
    }
    setIsLoading(false);
  };

  const handleUpdateRestaurant = async (updates) => {
    if (!restaurant) return;
    
    setIsSaving(true);
    try {
      await Restaurant.update(restaurant.id, updates);
      setRestaurant({ ...restaurant, ...updates });
      setMessage({ type: "success", text: "Restaurant updated successfully!" });
    } catch (error) {
      console.error("Error updating restaurant:", error);
      setMessage({ type: "error", text: "Failed to update restaurant" });
    }
    setIsSaving(false);
  };

  const handleLinkMenuItem = async (menuItemId, restaurantId) => {
    try {
      await MenuItem.update(menuItemId, { restaurant_id: restaurantId });
      setMessage({ type: "success", text: "Menu item linked successfully!" });
      loadData(); // Reload to update the lists
    } catch (error) {
      console.error("Error linking menu item:", error);
      setMessage({ type: "error", text: "Failed to link menu item" });
    }
  };

  const handleBulkLinkMenuItems = async (restaurantId) => {
    setIsSaving(true);
    try {
      for (const item of orphanedMenuItems) {
        await MenuItem.update(item.id, { restaurant_id: restaurantId });
      }
      setMessage({ 
        type: "success", 
        text: `Successfully linked ${orphanedMenuItems.length} menu items!` 
      });
      loadData();
    } catch (error) {
      console.error("Error bulk linking:", error);
      setMessage({ type: "error", text: "Failed to link menu items" });
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading restaurant settings...</p>
        </div>
      </div>
    );
  }

  if (!restaurant && allRestaurants.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-xl">
            <CardContent className="text-center py-12">
              <Store className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                No Restaurant Found
              </h2>
              <p className="text-slate-600 mb-6">
                You don't have a restaurant yet. Create one to get started!
              </p>
              <Button 
                onClick={() => window.location.href = '/dashboard'}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Restaurant Settings</h1>
          <p className="text-slate-600">Manage your restaurant profile and menu</p>
        </div>

        {message && (
          <Alert className={`mb-6 ${
            message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={
              message.type === 'success' ? 'text-green-800' : 'text-red-800'
            }>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Restaurant Profile</TabsTrigger>
            <TabsTrigger value="import">
              <Download className="w-4 h-4 mr-2" />
              Import Menu
            </TabsTrigger>
            <TabsTrigger value="menu">Menu Items ({menuItems.length})</TabsTrigger>
            {orphanedMenuItems.length > 0 && (
              <TabsTrigger value="orphaned" className="text-amber-600">
                Link Menu Items ({orphanedMenuItems.length})
              </TabsTrigger>
            )}
            <TabsTrigger value="marketplace">Marketplace Settings</TabsTrigger>
          </TabsList>

          {/* Restaurant Profile Tab */}
          <TabsContent value="profile">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-6 h-6 text-emerald-600" />
                  Restaurant Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {restaurant && (
                  <>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label>Restaurant ID</Label>
                        <div className="mt-2 p-3 bg-slate-100 rounded-lg font-mono text-sm break-all">
                          {restaurant.id}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Use this ID to link menu items
                        </p>
                      </div>
                      <div>
                        <Label>Owner Email</Label>
                        <Input
                          value={restaurant.owner_email}
                          disabled
                          className="mt-2"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Business Name</Label>
                      <Input
                        value={restaurant.business_name}
                        onChange={(e) => setRestaurant({...restaurant, business_name: e.target.value})}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={restaurant.description || ''}
                        onChange={(e) => setRestaurant({...restaurant, description: e.target.value})}
                        className="mt-2"
                        rows={4}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label>Phone Number</Label>
                        <Input
                          value={restaurant.phone || ''}
                          onChange={(e) => setRestaurant({...restaurant, phone: e.target.value})}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Average Prep Time (minutes)</Label>
                        <Input
                          type="number"
                          value={restaurant.average_prep_time}
                          onChange={(e) => setRestaurant({...restaurant, average_prep_time: parseInt(e.target.value)})}
                          className="mt-2"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={() => handleUpdateRestaurant(restaurant)}
                      disabled={isSaving}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Import Menu Tab */}
          <TabsContent value="import">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Import Menu from URL
                </CardTitle>
                <p className="text-sm text-slate-600 mt-2">
                  Automatically populate your menu by providing a URL from your website or food delivery platforms
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {importResult && (
                  <Alert className={importResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
                    {importResult.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription className={importResult.success ? "text-green-900" : "text-red-900"}>
                      {importResult.success 
                        ? `Successfully imported ${importResult.imported} menu items!`
                        : importResult.error}
                    </AlertDescription>
                  </Alert>
                )}

                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-900">
                    <strong>Supported Platforms:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Your restaurant website menu page</li>
                      <li>Uber Eats restaurant page</li>
                      <li>DoorDash restaurant page</li>
                      <li>Grubhub restaurant page</li>
                      <li>Any public menu page with visible items and prices</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="import-url">Menu URL *</Label>
                    <Input
                      id="import-url"
                      type="url"
                      placeholder="https://www.ubereats.com/store/your-restaurant..."
                      value={importUrl}
                      onChange={(e) => setImportUrl(e.target.value)}
                      disabled={isImporting}
                      className="mt-2"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Paste the full URL of your menu page
                    </p>
                  </div>

                  {previewItems.length === 0 ? (
                    <Button
                      onClick={async () => {
                        if (!importUrl) {
                          setImportResult({ success: false, error: "Please enter a valid URL" });
                          return;
                        }
                        if (!restaurant) {
                          setImportResult({ success: false, error: "No restaurant found" });
                          return;
                        }

                        setIsImporting(true);
                        setImportResult(null);
                        setPreviewItems([]);

                        try {
                          const response = await importMenuFromUrl({
                            url: importUrl,
                            restaurantId: restaurant.id,
                            previewOnly: true
                          });

                          if (response.data.success && response.data.preview) {
                            setPreviewItems(response.data.items);
                            setImportResult({
                              success: true,
                              preview: true,
                              count: response.data.count
                            });
                          } else if (response.data.error) {
                            setImportResult({
                              success: false,
                              error: response.data.error,
                              suggestions: response.data.suggestions
                            });
                          }
                        } catch (error) {
                          console.error("Import error:", error);
                          setImportResult({
                            success: false,
                            error: error.message || "Failed to extract menu. Please try again."
                          });
                        } finally {
                          setIsImporting(false);
                        }
                      }}
                      disabled={isImporting || !importUrl}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Extracting Menu...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Extract Menu Items
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <Button
                        onClick={async () => {
                          if (!restaurant || previewItems.length === 0) return;
                          
                          setIsConfirming(true);
                          try {
                            const response = await importMenuFromUrl({
                              restaurantId: restaurant.id,
                              itemsToImport: previewItems
                            });

                            if (response.data.success) {
                              setImportResult({
                                success: true,
                                imported: response.data.imported
                              });
                              setPreviewItems([]);
                              setImportUrl("");
                              await loadData();
                            }
                          } catch (error) {
                            console.error("Confirm import error:", error);
                            setImportResult({
                              success: false,
                              error: "Failed to import items"
                            });
                          } finally {
                            setIsConfirming(false);
                          }
                        }}
                        disabled={isConfirming}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {isConfirming ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Publishing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Publish {previewItems.length} Items
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          setPreviewItems([]);
                          setImportResult(null);
                        }}
                        variant="outline"
                        className="w-full"
                      >
                        Cancel & Start Over
                      </Button>
                    </div>
                  )}
                </div>

                {previewItems.length > 0 && (
                  <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-lg">Preview: {previewItems.length} Items Found</h4>
                      <Badge className="bg-purple-600">{previewItems.length} items</Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-4">
                      Review and edit items below before publishing. Click on any field to edit.
                    </p>
                    <div className="max-h-96 overflow-y-auto space-y-3">
                      {previewItems.map((item, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg border border-slate-200">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <Input
                                value={item.name}
                                onChange={(e) => {
                                  const updated = [...previewItems];
                                  updated[index].name = e.target.value;
                                  setPreviewItems(updated);
                                }}
                                className="font-semibold"
                                placeholder="Item name"
                              />
                              <Textarea
                                value={item.description}
                                onChange={(e) => {
                                  const updated = [...previewItems];
                                  updated[index].description = e.target.value;
                                  setPreviewItems(updated);
                                }}
                                placeholder="Description"
                                rows={2}
                                className="text-sm"
                              />
                              <div className="flex gap-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.price}
                                  onChange={(e) => {
                                    const updated = [...previewItems];
                                    updated[index].price = parseFloat(e.target.value) || 0;
                                    setPreviewItems(updated);
                                  }}
                                  className="w-24"
                                  placeholder="0.00"
                                />
                                <Select
                                  value={item.category}
                                  onValueChange={(value) => {
                                    const updated = [...previewItems];
                                    updated[index].category = value;
                                    setPreviewItems(updated);
                                  }}
                                >
                                  <SelectTrigger className="w-36">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="appetizers">Appetizers</SelectItem>
                                    <SelectItem value="entrees">Entrees</SelectItem>
                                    <SelectItem value="sides">Sides</SelectItem>
                                    <SelectItem value="desserts">Desserts</SelectItem>
                                    <SelectItem value="beverages">Beverages</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setPreviewItems(previewItems.filter((_, i) => i !== index));
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <AlertCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {previewItems.length === 0 && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Tips for best results:</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                        <li>Use the main menu page URL, not homepage</li>
                        <li>Ensure the menu is publicly visible (no login required)</li>
                        <li>You'll be able to review and edit items before publishing</li>
                        <li>You can import multiple times from different sources</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Menu Items Tab */}
          <TabsContent value="menu">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Menu Items</CardTitle>
                <p className="text-sm text-slate-600">
                  Items currently linked to your restaurant
                </p>
              </CardHeader>
              <CardContent>
                {menuItems.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-500 mb-4">No menu items found</p>
                    <p className="text-sm text-slate-400">
                      Link existing items or create new ones in Admin Dashboard
                    </p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {menuItems.map(item => (
                      <div key={item.id} className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold">{item.name}</h4>
                          <Badge className="bg-emerald-100 text-emerald-800">
                            ${item.price}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{item.description}</p>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="outline">{item.category}</Badge>
                          {item.keyword && (
                            <Badge className="bg-purple-100 text-purple-800">
                              {item.keyword}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orphaned Menu Items Tab */}
          {orphanedMenuItems.length > 0 && (
            <TabsContent value="orphaned">
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LinkIcon className="w-6 h-6 text-amber-600" />
                    Link Menu Items to Restaurant
                  </CardTitle>
                  <p className="text-sm text-slate-600">
                    These menu items need to be linked to a restaurant
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {restaurant && (
                    <Alert className="bg-blue-50 border-blue-200">
                      <AlertDescription className="text-blue-900">
                        <div className="flex justify-between items-center">
                          <span>
                            Found {orphanedMenuItems.length} unlinked menu items. Link them all to your restaurant?
                          </span>
                          <Button
                            onClick={() => handleBulkLinkMenuItems(restaurant.id)}
                            disabled={isSaving}
                            className="bg-blue-600 hover:bg-blue-700 ml-4"
                          >
                            {isSaving ? "Linking..." : "Link All Items"}
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-4">
                    {orphanedMenuItems.map(item => (
                      <div key={item.id} className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{item.name}</h4>
                            <p className="text-sm text-slate-600 mb-2">{item.description}</p>
                            <div className="flex gap-2 flex-wrap">
                              <Badge variant="outline">{item.category}</Badge>
                              <Badge className="bg-emerald-100 text-emerald-800">
                                ${item.price}
                              </Badge>
                              {item.keyword && (
                                <Badge className="bg-purple-100 text-purple-800">
                                  {item.keyword}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-2 font-mono">
                              Current ID: {item.restaurant_id || 'none'}
                            </p>
                          </div>
                          <div className="ml-4">
                            <Select
                              onValueChange={(value) => handleLinkMenuItem(item.id, value)}
                            >
                              <SelectTrigger className="w-48">
                                <SelectValue placeholder="Link to..." />
                              </SelectTrigger>
                              <SelectContent>
                                {allRestaurants.map(r => (
                                  <SelectItem key={r.id} value={r.id}>
                                    {r.business_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Marketplace Settings Tab */}
          <TabsContent value="marketplace">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Marketplace Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {restaurant && (
                  <>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <Label className="text-base font-semibold">Enable Marketplace</Label>
                        <p className="text-sm text-slate-600 mt-1">
                          Allow customers to find and order from your restaurant
                        </p>
                      </div>
                      <Switch
                        checked={restaurant.marketplace_enabled}
                        onCheckedChange={(checked) => 
                          handleUpdateRestaurant({ marketplace_enabled: checked })
                        }
                      />
                    </div>

                    <div>
                      <Label>Commission Rate</Label>
                      <div className="flex items-center gap-4 mt-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={restaurant.commission_rate}
                          onChange={(e) => setRestaurant({
                            ...restaurant, 
                            commission_rate: parseFloat(e.target.value)
                          })}
                          className="w-32"
                        />
                        <span className="text-slate-600">
                          ({(restaurant.commission_rate * 100).toFixed(1)}% per order)
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Standard commission: 10-15%
                      </p>
                    </div>

                    <div>
                      <Label>Restaurant Status</Label>
                      <Select
                        value={restaurant.status}
                        onValueChange={(value) => setRestaurant({...restaurant, status: value})}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="pending_approval">Pending Approval</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={() => handleUpdateRestaurant(restaurant)}
                      disabled={isSaving}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {isSaving ? "Saving..." : "Save Marketplace Settings"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
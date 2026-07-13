import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";


import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Monitor,
  Upload,
  Image,
  Trash2,
  Edit2,
  Play,
  Plus,
  Send,
  CheckCircle,
  Tv,
  LayoutGrid,
  Megaphone,
  DollarSign,
  Images,
  Download
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { DisplayContent } from "@/entities/DisplayContent";
import { MenuItem } from "@/entities/MenuItem";
import { createPageUrl } from "@/utils";

const contentTypes = [
  { id: "menu_board", name: "Menu Board", icon: LayoutGrid, description: "Display your menu items and prices" },
  { id: "promo", name: "Promotion", icon: Megaphone, description: "Special offers and deals" },
  { id: "announcement", name: "Announcement", icon: Tv, description: "Important messages and updates" },
  { id: "price_list", name: "Price List", icon: DollarSign, description: "Pricing information" },
  { id: "slideshow", name: "Slideshow", icon: Images, description: "Rotating images" },
];

const locationAreas = [
  { id: "kitchen", name: "Kitchen", icon: "🍳" },
  { id: "bar", name: "Bar", icon: "🍸" },
  { id: "dining", name: "Dining Room", icon: "🍽️" },
  { id: "patio", name: "Patio", icon: "🌿" },
  { id: "lounge", name: "Lounge", icon: "🛋️" },
  { id: "porch", name: "Porch", icon: "🏠" },
  { id: "counter", name: "Front Counter", icon: "🧾" },
  { id: "drive_thru", name: "Drive-Thru", icon: "🚗" },
  { id: "entrance", name: "Entrance", icon: "🚪" },
  { id: "waiting", name: "Waiting Area", icon: "⏳" },
];

export default function DisplayContentManager() {
  const [contents, setContents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [connectedDevices, setConnectedDevices] = useState([]);

  const [newContent, setNewContent] = useState({
    name: "",
    type: "menu_board",
    image_url: "",
    duration: 10,
    assigned_locations: [],
    active: true
  });

  useEffect(() => {
    loadContent();
    loadDevices();
  }, []);

  const loadContent = async () => {
    try {
      const data = await DisplayContent.list("-created_date");
      setContents(data);
    } catch (error) {
      console.error("Error loading content:", error);
    }
    setIsLoading(false);
  };

  const loadDevices = () => {
    const saved = localStorage.getItem('connectedPrinters');
    if (saved) {
      const devices = JSON.parse(saved);
      const displays = devices.filter(d => 
        d.type?.toLowerCase().includes('display') || 
        d.type?.toLowerCase().includes('tv') ||
        d.isDisplay
      );
      setConnectedDevices(displays);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setNewContent({ ...newContent, image_url: file_url });
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image");
    }
    setIsUploading(false);
  };

  const handleSaveContent = async () => {
    if (!newContent.name) {
      alert("Please enter a name for the content");
      return;
    }

    try {
      if (selectedContent) {
        await DisplayContent.update(selectedContent.id, newContent);
      } else {
        await DisplayContent.create(newContent);
      }
      loadContent();
      setShowAddDialog(false);
      resetForm();
    } catch (error) {
      console.error("Error saving:", error);
      alert("Failed to save content");
    }
  };

  const handleDeleteContent = async (id) => {
    if (!confirm("Delete this content?")) return;
    try {
      await DisplayContent.delete(id);
      loadContent();
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const handleToggleActive = async (content) => {
    try {
      await DisplayContent.update(content.id, { active: !content.active });
      loadContent();
    } catch (error) {
      console.error("Error updating:", error);
    }
  };

  const resetForm = () => {
    setNewContent({
      name: "",
      type: "menu_board",
      image_url: "",
      duration: 10,
      assigned_locations: [],
      active: true
    });
    setSelectedContent(null);
  };

  const handleEditContent = (content) => {
    setSelectedContent(content);
    setNewContent({
      name: content.name,
      type: content.type,
      image_url: content.image_url || "",
      duration: content.duration || 10,
      assigned_locations: content.assigned_locations || [],
      active: content.active !== false
    });
    setShowAddDialog(true);
  };

  const handlePushToDisplays = (content) => {
    // Open the display content viewer in new windows for each assigned location
    const url = `${window.location.origin}${createPageUrl("DisplayContentViewer")}?content=${content.id}`;
    window.open(url, `display-${content.id}`, 'width=1920,height=1080');
    alert(`Display content opened! Cast or mirror this window to your TV/display.`);
  };

  const handlePushAllToLocation = (locationId) => {
    const locationContents = contents.filter(c => 
      c.active && c.assigned_locations?.includes(locationId)
    );
    
    if (locationContents.length === 0) {
      alert("No active content assigned to this location");
      return;
    }

    const contentIds = locationContents.map(c => c.id).join(',');
    const url = `${window.location.origin}${createPageUrl("DisplayContentViewer")}?contents=${contentIds}&location=${locationId}`;
    window.open(url, `display-${locationId}`, 'width=1920,height=1080');
  };

  const handleDownloadMenuPPT = async () => {
    try {
      // Fetch menu items
      const menuItems = await MenuItem.list();
      
      // Group by category
      const categories = {};
      menuItems.forEach(item => {
        const cat = item.category || 'other';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(item);
      });

      // Generate HTML for PowerPoint-compatible format
      let pptHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Restaurant Menu</title>
  <style>
    @page { size: 16in 9in landscape; margin: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; }
    .slide { 
      width: 100%; 
      min-height: 100vh; 
      padding: 60px; 
      box-sizing: border-box; 
      page-break-after: always;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: white;
    }
    .slide:last-child { page-break-after: avoid; }
    .title-slide { 
      display: flex; 
      flex-direction: column; 
      justify-content: center; 
      align-items: center; 
      text-align: center;
    }
    .title-slide h1 { font-size: 72px; margin-bottom: 20px; color: #ffd700; }
    .title-slide p { font-size: 32px; color: #ccc; }
    .category-title { 
      font-size: 48px; 
      color: #ffd700; 
      text-transform: capitalize; 
      margin-bottom: 40px;
      border-bottom: 3px solid #ffd700;
      padding-bottom: 15px;
    }
    .menu-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px; }
    .menu-item { 
      background: rgba(255,255,255,0.1); 
      padding: 25px; 
      border-radius: 15px;
      border-left: 4px solid #ffd700;
    }
    .item-name { font-size: 28px; font-weight: bold; color: #fff; margin-bottom: 8px; }
    .item-desc { font-size: 18px; color: #aaa; margin-bottom: 12px; }
    .item-price { font-size: 32px; color: #4ade80; font-weight: bold; }
    .item-image { width: 100%; height: 150px; object-fit: cover; border-radius: 10px; margin-bottom: 15px; }
  </style>
</head>
<body>
  <div class="slide title-slide">
    <h1>🍽️ Our Menu</h1>
    <p>Delicious dishes crafted with care</p>
    <p style="margin-top: 40px; font-size: 24px;">Generated on ${new Date().toLocaleDateString()}</p>
  </div>
`;

      // Create a slide for each category
      const categoryNames = {
        appetizers: "🥗 Appetizers",
        entrees: "🍝 Entrées", 
        sides: "🍟 Sides",
        desserts: "🍰 Desserts",
        beverages: "🥤 Beverages",
        other: "📋 Other Items"
      };

      Object.entries(categories).forEach(([category, items]) => {
        const displayName = categoryNames[category] || category;
        
        // Category title slide
        pptHtml += `
  <div class="slide title-slide">
    <h1>${displayName}</h1>
  </div>
`;

        // One slide per item
        items.forEach(item => {
          pptHtml += `
  <div class="slide" style="display: flex; align-items: center; justify-content: center;">
    <div style="display: flex; gap: 60px; align-items: center; max-width: 90%;">
      ${item.image_url ? `<img src="${item.image_url}" style="width: 450px; height: 450px; object-fit: cover; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);" alt="${item.name}">` : '<div style="width: 450px; height: 450px; background: rgba(255,255,255,0.1); border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 120px;">🍽️</div>'}
      <div style="flex: 1;">
        <div style="font-size: 56px; font-weight: bold; color: #fff; margin-bottom: 20px;">${item.name}</div>
        ${item.description ? `<div style="font-size: 28px; color: #aaa; margin-bottom: 30px; line-height: 1.5;">${item.description}</div>` : ''}
        <div style="font-size: 64px; color: #4ade80; font-weight: bold;">$${item.price?.toFixed(2) || '0.00'}</div>
        <div style="margin-top: 20px; padding: 10px 20px; background: rgba(255,215,0,0.2); border-radius: 10px; display: inline-block;">
          <span style="color: #ffd700; font-size: 20px; text-transform: capitalize;">${category}</span>
        </div>
      </div>
    </div>
  </div>
`;
        });
      });

      // Add display content slides
      const activeContents = contents.filter(c => c.active && c.image_url);
      if (activeContents.length > 0) {
        pptHtml += `
  <div class="slide title-slide">
    <h1>📺 Promotions & Specials</h1>
  </div>
`;
        activeContents.forEach(content => {
          pptHtml += `
  <div class="slide" style="padding: 0; display: flex; align-items: center; justify-content: center;">
    <img src="${content.image_url}" style="max-width: 100%; max-height: 100vh; object-fit: contain;" alt="${content.name}">
  </div>
`;
        });
      }

      pptHtml += `
  <div class="slide title-slide">
    <h1>Thank You!</h1>
    <p>We appreciate your business</p>
  </div>
</body>
</html>
`;

      // Download as HTML file (can be opened in PowerPoint/Google Slides)
      const blob = new Blob([pptHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Menu_Presentation_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert('Menu presentation downloaded! Open the HTML file in a browser, then use File > Print > Save as PDF, or import into Google Slides/PowerPoint.');
    } catch (error) {
      console.error("Error generating presentation:", error);
      alert("Failed to generate presentation");
    }
  };

  const filteredContents = contents.filter(c => {
    if (activeTab === "all") return true;
    return c.type === activeTab;
  });

  const toggleLocation = (locationId) => {
    const current = newContent.assigned_locations || [];
    if (current.includes(locationId)) {
      setNewContent({ ...newContent, assigned_locations: current.filter(l => l !== locationId) });
    } else {
      setNewContent({ ...newContent, assigned_locations: [...current, locationId] });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Display Content Manager</h1>
            <p className="text-slate-600">Upload menus, promos, and graphics to display on your TVs and menu boards</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleDownloadMenuPPT} variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
              <Download className="w-4 h-4 mr-2" />
              Download Menu Presentation
            </Button>
            <Button onClick={() => { resetForm(); setShowAddDialog(true); }} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Content
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Total Content</p>
                  <p className="text-3xl font-bold">{contents.length}</p>
                </div>
                <Image className="w-10 h-10 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Active</p>
                  <p className="text-3xl font-bold">{contents.filter(c => c.active).length}</p>
                </div>
                <Play className="w-10 h-10 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Connected Displays</p>
                  <p className="text-3xl font-bold">{connectedDevices.length}</p>
                </div>
                <Monitor className="w-10 h-10 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm">Promos Active</p>
                  <p className="text-3xl font-bold">{contents.filter(c => c.type === 'promo' && c.active).length}</p>
                </div>
                <Megaphone className="w-10 h-10 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Push to Location */}
        <Card className="mb-8 border-2 border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Send className="w-5 h-5" />
              Quick Push to Display Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {locationAreas.map(area => {
                const areaContents = contents.filter(c => c.active && c.assigned_locations?.includes(area.id));
                return (
                  <Button
                    key={area.id}
                    variant="outline"
                    onClick={() => handlePushAllToLocation(area.id)}
                    className="flex items-center gap-2"
                    disabled={areaContents.length === 0}
                  >
                    <span>{area.icon}</span>
                    {area.name}
                    {areaContents.length > 0 && (
                      <Badge className="bg-purple-600 ml-1">{areaContents.length}</Badge>
                    )}
                  </Button>
                );
              })}
            </div>
            <p className="text-sm text-purple-700 mt-3">
              Click a location to open all assigned content in a new window, then cast/mirror to your display.
            </p>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border p-1">
            <TabsTrigger value="all">All</TabsTrigger>
            {contentTypes.map(type => (
              <TabsTrigger key={type.id} value={type.id} className="flex items-center gap-2">
                <type.icon className="w-4 h-4" />
                {type.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab}>
            {filteredContents.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="p-12 text-center">
                  <Image className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-700 mb-2">No Content Yet</h3>
                  <p className="text-slate-500 mb-4">Upload your first menu board, promo, or graphic</p>
                  <Button onClick={() => { resetForm(); setShowAddDialog(true); }} className="bg-emerald-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Content
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredContents.map(content => (
                  <Card key={content.id} className={`border-2 overflow-hidden ${!content.active ? 'opacity-60' : ''}`}>
                    {content.image_url ? (
                      <div className="h-48 bg-slate-100 relative">
                        <img 
                          src={content.image_url} 
                          alt={content.name}
                          className="w-full h-full object-cover"
                        />
                        <Badge className={`absolute top-2 right-2 ${content.active ? 'bg-green-600' : 'bg-slate-500'}`}>
                          {content.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                        <Image className="w-16 h-16 text-slate-400" />
                      </div>
                    )}
                    
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-lg">{content.name}</h3>
                          <Badge variant="outline" className="mt-1">
                            {contentTypes.find(t => t.id === content.type)?.name || content.type}
                          </Badge>
                        </div>
                        <Switch
                          checked={content.active}
                          onCheckedChange={() => handleToggleActive(content)}
                        />
                      </div>

                      {content.assigned_locations?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2 mb-3">
                          {content.assigned_locations.map(loc => {
                            const area = locationAreas.find(a => a.id === loc);
                            return (
                              <Badge key={loc} className="bg-amber-100 text-amber-800 text-xs">
                                {area?.icon} {area?.name}
                              </Badge>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleEditContent(content)}
                        >
                          <Edit2 className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-purple-600 hover:bg-purple-700"
                          onClick={() => handlePushToDisplays(content)}
                        >
                          <Send className="w-4 h-4 mr-1" />
                          Push to Display
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500"
                          onClick={() => handleDeleteContent(content.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Add/Edit Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedContent ? 'Edit Content' : 'Add Display Content'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Name */}
              <div>
                <Label>Content Name *</Label>
                <Input
                  value={newContent.name}
                  onChange={(e) => setNewContent({ ...newContent, name: e.target.value })}
                  placeholder="e.g., Lunch Menu, Happy Hour Special"
                  className="mt-1"
                />
              </div>

              {/* Type */}
              <div>
                <Label>Content Type</Label>
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {contentTypes.map(type => (
                    <Card
                      key={type.id}
                      className={`cursor-pointer p-3 text-center transition-all ${
                        newContent.type === type.id
                          ? 'border-2 border-purple-500 bg-purple-50'
                          : 'border hover:border-purple-300'
                      }`}
                      onClick={() => setNewContent({ ...newContent, type: type.id })}
                    >
                      <type.icon className="w-6 h-6 mx-auto mb-1 text-slate-600" />
                      <p className="text-xs font-medium">{type.name}</p>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <Label>Upload Image</Label>
                <div className="mt-2">
                  {newContent.image_url ? (
                    <div className="relative">
                      <img 
                        src={newContent.image_url} 
                        alt="Preview" 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2"
                        onClick={() => setNewContent({ ...newContent, image_url: "" })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {isUploading ? (
                          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-10 h-10 text-slate-400 mb-2" />
                            <p className="text-sm text-slate-500">Click to upload image</p>
                            <p className="text-xs text-slate-400">PNG, JPG up to 10MB</p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Assign to Locations */}
              <div>
                <Label>Assign to Locations</Label>
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {locationAreas.map(area => (
                    <Card
                      key={area.id}
                      className={`cursor-pointer p-2 text-center transition-all ${
                        newContent.assigned_locations?.includes(area.id)
                          ? 'border-2 border-amber-500 bg-amber-50'
                          : 'border hover:border-amber-300'
                      }`}
                      onClick={() => toggleLocation(area.id)}
                    >
                      <span className="text-xl">{area.icon}</span>
                      <p className="text-xs font-medium mt-1">{area.name}</p>
                      {newContent.assigned_locations?.includes(area.id) && (
                        <CheckCircle className="w-4 h-4 text-amber-600 mx-auto mt-1" />
                      )}
                    </Card>
                  ))}
                </div>
              </div>

              {/* Duration (for slideshows) */}
              {newContent.type === 'slideshow' && (
                <div>
                  <Label>Display Duration (seconds)</Label>
                  <Input
                    type="number"
                    value={newContent.duration}
                    onChange={(e) => setNewContent({ ...newContent, duration: parseInt(e.target.value) || 10 })}
                    min="5"
                    max="120"
                    className="mt-1 w-32"
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveContent} className="bg-emerald-600 hover:bg-emerald-700">
                {selectedContent ? 'Save Changes' : 'Add Content'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
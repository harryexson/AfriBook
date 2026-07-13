
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Restaurant } from "@/entities/Restaurant";
import { MenuItem } from "@/entities/MenuItem";
import { UploadFile } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Store, Utensils, PlusCircle, Edit, Trash2, Upload, KeyRound, Copy, FileText, ExternalLink } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { generateApiKey } from "@/functions/generateApiKey";

function MenuItemCard({ item, onEdit, onDelete }) {
    return (
        <Card className="flex flex-col">
            <CardContent className="p-4 flex gap-4">
                {item.image_url && <img src={item.image_url} alt={item.name} className="w-24 h-24 rounded-lg object-cover" />}
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-semibold">{item.name}</h4>
                            <p className="text-sm text-gray-500">{item.category}</p>
                        </div>
                        <p className="font-bold text-lg">${item.price.toFixed(2)}</p>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                </div>
            </CardContent>
            <div className="border-t p-2 flex justify-end gap-2">
                <Button variant="ghost" size="icon" onClick={() => onEdit(item)}><Edit className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)} className="text-red-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
            </div>
        </Card>
    );
}

function MenuItemForm({ item, restaurantId, onSave, onCancel }) {
    const [currentItem, setCurrentItem] = useState(item || { name: "", description: "", price: 0, category: "", image_url: "", restaurant_id: restaurantId, is_available: true });
    const [imageFile, setImageFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleSave = async () => {
        let finalItem = { ...currentItem };
        if (imageFile) {
            setIsUploading(true);
            try {
                const { file_url } = await UploadFile({ file: imageFile });
                finalItem.image_url = file_url;
            } catch (error) {
                console.error("Image upload failed:", error);
                setIsUploading(false);
                return;
            }
            setIsUploading(false);
        }
        onSave(finalItem);
    };

    return (
        <div className="space-y-4">
            <Input placeholder="Item Name" value={currentItem.name} onChange={e => setCurrentItem({...currentItem, name: e.target.value})} />
            <Textarea placeholder="Item Description" value={currentItem.description} onChange={e => setCurrentItem({...currentItem, description: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
                <Input type="number" placeholder="Price" value={currentItem.price} onChange={e => setCurrentItem({...currentItem, price: parseFloat(e.target.value) || 0})} />
                <Input placeholder="Category (e.g., Appetizer)" value={currentItem.category} onChange={e => setCurrentItem({...currentItem, category: e.target.value})} />
            </div>
            <Label htmlFor="item-image">Item Image</Label>
            <Input id="item-image" type="file" onChange={(e) => setImageFile(e.target.files[0])} />
            {currentItem.image_url && !imageFile && <img src={currentItem.image_url} alt="current" className="w-24 h-24 rounded-lg object-cover" />}
            <DialogFooter>
                <Button variant="outline" onClick={onCancel}>Cancel</Button>
                <Button onClick={handleSave} disabled={isUploading}>{isUploading ? "Uploading..." : "Save Item"}</Button>
            </DialogFooter>
        </div>
    );
}

export default function RestaurantDashboard() {
    const [user, setUser] = useState(null);
    const [restaurant, setRestaurant] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [isGeneratingKey, setIsGeneratingKey] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const currentUser = await User.me();
            setUser(currentUser);
            const restaurants = await Restaurant.filter({ owner_id: currentUser.id });
            if (restaurants.length > 0) {
                const currentRestaurant = restaurants[0];
                setRestaurant(currentRestaurant);
                const items = await MenuItem.filter({ restaurant_id: currentRestaurant.id });
                setMenuItems(items);
            }
        } catch (error) {
            console.error("Error loading restaurant data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveItem = async (itemData) => {
        if (itemData.id) { // Update
            await MenuItem.update(itemData.id, itemData);
        } else { // Create
            await MenuItem.create(itemData);
        }
        setIsFormOpen(false);
        setEditingItem(null);
        loadData();
    };

    const handleDeleteItem = async (itemId) => {
        if (window.confirm("Are you sure you want to delete this item?")) {
            await MenuItem.delete(itemId);
            loadData();
        }
    };

    const openEditForm = (item) => {
        setEditingItem(item);
        setIsFormOpen(true);
    };
    
    const openNewForm = () => {
        setEditingItem(null);
        setIsFormOpen(true);
    };

    const handleGenerateApiKey = async () => {
        setIsGeneratingKey(true);
        try {
            const response = await generateApiKey({ restaurantId: restaurant.id });
            const { apiKey } = response.data;
            setRestaurant({ ...restaurant, api_key: apiKey });
        } catch (error) {
            console.error("Failed to generate API key", error);
        } finally {
            setIsGeneratingKey(false);
        }
    };

    if (isLoading) return <div>Loading...</div>;

    if (!restaurant) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold">No Restaurant Found</h1>
                <p className="mb-4">It looks like you haven't registered a restaurant yet.</p>
                <Button asChild>
                    <Link to={createPageUrl("RestaurantOnboarding")}>Register Your Restaurant</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-8 bg-gray-50 min-h-screen space-y-8">
            <Card>
                <CardHeader className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    {restaurant.logo_url && <img src={restaurant.logo_url} alt={restaurant.name} className="w-24 h-24 rounded-lg object-cover" />}
                    <div className="flex-1">
                        <CardTitle className="text-3xl font-bold flex items-center gap-3"><Store /> {restaurant.name}</CardTitle>
                        <CardDescription>{restaurant.description}</CardDescription>
                        {restaurant.status && <Badge className="mt-2">{restaurant.status.replace(/_/g, " ")}</Badge>}
                    </div>
                    <Button asChild>
                        <Link to={createPageUrl("KitchenTerminal")} target="_blank">
                            <ExternalLink className="mr-2 h-4 w-4"/> Open Kitchen Terminal
                        </Link>
                    </Button>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
                    <CardTitle className="flex items-center gap-2"><Utensils /> Your Menu</CardTitle>
                    <div className="flex items-center gap-2">
                        <Button asChild variant="outline">
                           <Link to={createPageUrl(`RestaurantBulkImport?restaurantId=${restaurant.id}`)}><Upload className="mr-2 h-4 w-4" /> Bulk Import</Link>
                        </Button>
                        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={openNewForm}><PlusCircle className="mr-2 h-4 w-4" /> Add Menu Item</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{editingItem ? "Edit Menu Item" : "Add New Menu Item"}</DialogTitle>
                                </DialogHeader>
                                <MenuItemForm 
                                    item={editingItem} 
                                    restaurantId={restaurant.id}
                                    onSave={handleSaveItem}
                                    onCancel={() => { setIsFormOpen(false); setEditingItem(null); }}
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    {menuItems.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {menuItems.map(item => (
                                <MenuItemCard key={item.id} item={item} onEdit={openEditForm} onDelete={handleDeleteItem} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <p className="mb-4">Your menu is empty. Add your first item or import your menu from a file.</p>
                             <Button asChild variant="secondary">
                               <Link to={createPageUrl(`RestaurantBulkImport?restaurantId=${restaurant.id}`)}><Upload className="mr-2 h-4 w-4" /> Import Menu</Link>
                           </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText /> Completed Order Receipts</CardTitle>
                    <CardDescription>Receipts for completed food orders are automatically generated here for your records.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="mb-2 text-gray-500">No completed orders yet.</p>
                        <p className="text-sm text-gray-400">When you complete an order via your terminal, a receipt will appear here.</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><KeyRound/> API Integration</CardTitle>
                    <CardDescription>Connect your external restaurant system to sync your menu automatically.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="api-key">Your API Key</Label>
                        <div className="flex gap-2 mt-1">
                            <Input id="api-key" readOnly value={restaurant.api_key || "No key generated yet"} />
                            <Button variant="outline" size="icon" onClick={() => restaurant.api_key && navigator.clipboard.writeText(restaurant.api_key)}>
                                <Copy className="w-4 h-4"/>
                            </Button>
                        </div>
                        {!restaurant.api_key && (
                            <p className="text-sm text-gray-500 mt-2">Generate a key to get started.</p>
                        )}
                    </div>
                    <Button onClick={handleGenerateApiKey} disabled={isGeneratingKey || !restaurant}>
                        {isGeneratingKey ? "Generating..." : restaurant.api_key ? "Regenerate API Key" : "Generate New API Key"}
                    </Button>

                     <div className="mt-6 pt-4 border-t">
                        <h4 className="font-semibold mb-2">How to Use the API</h4>
                        <p className="text-sm text-gray-600 mb-2">Your developer can send a <code className="bg-gray-100 p-1 rounded">POST</code> request to the endpoint below with the menu items in the body. The API key must be included in the Authorization header.</p>
                        <pre className="bg-gray-800 text-white p-3 rounded-lg text-sm overflow-x-auto">
                            <p><strong>Endpoint:</strong> POST /api/v1/functions/syncMenu</p>
                            <p className="mt-2"><strong>Header:</strong> {`Authorization: Bearer <YOUR_API_KEY>`}</p>
                            <p className="mt-2"><strong>Body (JSON Array):</strong></p>
                            {`[
    {
        "external_id": "item-123",
        "name": "Classic Burger",
        "description": "Juicy and delicious.",
        "price": 12.99,
        "category": "Main Course",
        "image_url": "http://example.com/burger.jpg",
        "is_available": true
    },
    ...
]`}
                        </pre>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

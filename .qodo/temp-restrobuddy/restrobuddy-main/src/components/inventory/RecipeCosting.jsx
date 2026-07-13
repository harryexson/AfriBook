import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Plus, Trash2 } from "lucide-react";
import { Recipe } from "@/entities/Recipe";
import { MenuItem } from "@/entities/MenuItem";
import { InventoryItem } from "@/entities/InventoryItem";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RecipeCosting() {
  const [recipes, setRecipes] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const [recipeIngredients, setRecipeIngredients] = useState([]);
  const [laborCost, setLaborCost] = useState(0);
  const [overheadCost, setOverheadCost] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [recipeData, menuData, inventoryData] = await Promise.all([
      Recipe.list(),
      MenuItem.list(),
      InventoryItem.list()
    ]);
    setRecipes(recipeData);
    setMenuItems(menuData);
    setInventoryItems(inventoryData);
  };

  const addIngredient = () => {
    setRecipeIngredients([
      ...recipeIngredients,
      { inventory_item_id: "", quantity_needed: 0, unit: "" }
    ]);
  };

  const removeIngredient = (index) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index, field, value) => {
    const updated = [...recipeIngredients];
    updated[index][field] = value;

    if (field === "inventory_item_id") {
      const item = inventoryItems.find(i => i.id === value);
      if (item) {
        updated[index].inventory_item_name = item.name;
        updated[index].unit = item.unit;
        updated[index].cost_per_unit = item.cost_per_unit;
      }
    }

    setRecipeIngredients(updated);
  };

  const calculateTotalCost = () => {
    const ingredientCost = recipeIngredients.reduce(
      (sum, ing) => sum + (ing.quantity_needed * (ing.cost_per_unit || 0)), 
      0
    );
    return ingredientCost + parseFloat(laborCost || 0) + parseFloat(overheadCost || 0);
  };

  const createRecipe = async () => {
    if (!selectedMenuItem || recipeIngredients.length === 0) {
      alert("Please select a menu item and add ingredients");
      return;
    }

    const menuItem = menuItems.find(m => m.id === selectedMenuItem);
    const totalIngredientCost = recipeIngredients.reduce(
      (sum, ing) => sum + (ing.quantity_needed * ing.cost_per_unit), 
      0
    );
    const totalCost = calculateTotalCost();
    const sellingPrice = menuItem.price || 0;
    const profitMargin = sellingPrice > 0 ? ((sellingPrice - totalCost) / sellingPrice) * 100 : 0;
    const costPercentage = sellingPrice > 0 ? (totalCost / sellingPrice) * 100 : 0;

    await Recipe.create({
      menu_item_id: selectedMenuItem,
      menu_item_name: menuItem.name,
      ingredients: recipeIngredients,
      total_ingredient_cost: totalIngredientCost,
      labor_cost: parseFloat(laborCost || 0),
      overhead_cost: parseFloat(overheadCost || 0),
      total_cost: totalCost,
      selling_price: sellingPrice,
      profit_margin: profitMargin,
      cost_percentage: costPercentage,
      last_cost_update: new Date().toISOString()
    });

    setShowCreateDialog(false);
    setSelectedMenuItem(null);
    setRecipeIngredients([]);
    setLaborCost(0);
    setOverheadCost(0);
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Recipe Costing</h2>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-emerald-600">
          <Plus className="w-4 h-4 mr-2" />
          Create Recipe Cost
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map(recipe => (
          <Card key={recipe.id} className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">{recipe.menu_item_name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-slate-50 p-2 rounded">
                  <p className="text-xs text-slate-600">Ingredient Cost</p>
                  <p className="font-bold text-emerald-600">${recipe.total_ingredient_cost.toFixed(2)}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <p className="text-xs text-slate-600">Total Cost</p>
                  <p className="font-bold text-slate-900">${recipe.total_cost.toFixed(2)}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <p className="text-xs text-slate-600">Selling Price</p>
                  <p className="font-bold text-blue-600">${recipe.selling_price.toFixed(2)}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <p className="text-xs text-slate-600">Profit Margin</p>
                  <p className="font-bold text-green-600">{recipe.profit_margin.toFixed(1)}%</p>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${
                recipe.cost_percentage < 30 ? 'bg-green-50 border-2 border-green-200' :
                recipe.cost_percentage < 35 ? 'bg-amber-50 border-2 border-amber-200' :
                'bg-red-50 border-2 border-red-200'
              }`}>
                <p className="text-xs font-semibold mb-1">Food Cost %</p>
                <p className={`text-2xl font-bold ${
                  recipe.cost_percentage < 30 ? 'text-green-700' :
                  recipe.cost_percentage < 35 ? 'text-amber-700' :
                  'text-red-700'
                }`}>
                  {recipe.cost_percentage.toFixed(1)}%
                </p>
              </div>
              <div className="border-t pt-2">
                <p className="text-xs text-slate-600 mb-1">Ingredients:</p>
                <div className="space-y-1">
                  {recipe.ingredients.slice(0, 3).map((ing, idx) => (
                    <p key={idx} className="text-xs text-slate-700">
                      • {ing.inventory_item_name}: {ing.quantity_needed} {ing.unit}
                    </p>
                  ))}
                  {recipe.ingredients.length > 3 && (
                    <p className="text-xs text-slate-500">+{recipe.ingredients.length - 3} more</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Recipe Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Recipe Cost Sheet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Menu Item</Label>
              <Select value={selectedMenuItem} onValueChange={setSelectedMenuItem}>
                <SelectTrigger>
                  <SelectValue placeholder="Select menu item" />
                </SelectTrigger>
                <SelectContent>
                  {menuItems.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} - ${item.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Ingredients</Label>
                <Button size="sm" variant="outline" onClick={addIngredient}>
                  <Plus className="w-3 h-3 mr-1" />
                  Add Ingredient
                </Button>
              </div>
              <div className="space-y-2">
                {recipeIngredients.map((ing, idx) => (
                  <div key={idx} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Select
                        value={ing.inventory_item_id}
                        onValueChange={(val) => updateIngredient(idx, "inventory_item_id", val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select ingredient" />
                        </SelectTrigger>
                        <SelectContent>
                          {inventoryItems.map(item => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name} (${item.cost_per_unit}/{item.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-32">
                      <Input
                        type="number"
                        value={ing.quantity_needed}
                        onChange={(e) => updateIngredient(idx, "quantity_needed", parseFloat(e.target.value))}
                        placeholder="Quantity"
                        step="0.1"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeIngredient(idx)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Labor Cost ($)</Label>
                <Input
                  type="number"
                  value={laborCost}
                  onChange={(e) => setLaborCost(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div>
                <Label>Overhead Cost ($)</Label>
                <Input
                  type="number"
                  value={overheadCost}
                  onChange={(e) => setOverheadCost(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>

            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-emerald-900">Total Recipe Cost:</span>
                <span className="text-2xl font-bold text-emerald-700">
                  ${calculateTotalCost().toFixed(2)}
                </span>
              </div>
            </div>

            <Button onClick={createRecipe} className="w-full bg-emerald-600">
              <Calculator className="w-4 h-4 mr-2" />
              Create Recipe Cost Sheet
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
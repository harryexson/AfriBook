import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Utensils, X, Plus, Flame, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const CUISINE_OPTIONS = [
  'Italian', 'Mexican', 'Chinese', 'Japanese', 'Indian', 'Thai', 'Vietnamese',
  'Korean', 'Mediterranean', 'American', 'French', 'Greek', 'Middle Eastern',
  'Caribbean', 'Ethiopian', 'Peruvian', 'Spanish', 'Turkish'
];

const DIETARY_OPTIONS = [
  { id: 'vegetarian', label: 'Vegetarian', icon: '🥗' },
  { id: 'vegan', label: 'Vegan', icon: '🌱' },
  { id: 'gluten_free', label: 'Gluten-Free', icon: '🌾' },
  { id: 'dairy_free', label: 'Dairy-Free', icon: '🥛' },
  { id: 'nut_free', label: 'Nut-Free', icon: '🥜' },
  { id: 'halal', label: 'Halal', icon: '☪️' },
  { id: 'kosher', label: 'Kosher', icon: '✡️' },
  { id: 'pescatarian', label: 'Pescatarian', icon: '🐟' },
  { id: 'keto', label: 'Keto', icon: '🥑' },
  { id: 'low_carb', label: 'Low Carb', icon: '🍞' }
];

const ALLERGY_OPTIONS = [
  'Peanuts', 'Tree Nuts', 'Milk', 'Eggs', 'Wheat', 'Soy', 'Fish', 
  'Shellfish', 'Sesame', 'Mustard', 'Celery', 'Lupin', 'Molluscs'
];

const SPICE_LEVELS = [
  { id: 'mild', label: 'Mild', flames: 1 },
  { id: 'medium', label: 'Medium', flames: 2 },
  { id: 'hot', label: 'Hot', flames: 3 },
  { id: 'extra_hot', label: 'Extra Hot', flames: 4 }
];

export default function FoodPreferencesCard({ preferences, isEditing, onChange }) {
  const prefs = preferences || {};
  const cuisines = prefs.preferred_cuisines || [];
  const dietary = prefs.dietary_restrictions || [];
  const allergies = prefs.allergies || [];
  const spiceLevel = prefs.spice_preference || 'medium';

  const addCuisine = (cuisine) => {
    if (!cuisines.includes(cuisine)) {
      onChange({ ...prefs, preferred_cuisines: [...cuisines, cuisine] });
    }
  };

  const removeCuisine = (cuisine) => {
    onChange({ ...prefs, preferred_cuisines: cuisines.filter(c => c !== cuisine) });
  };

  const toggleDietary = (id) => {
    if (dietary.includes(id)) {
      onChange({ ...prefs, dietary_restrictions: dietary.filter(d => d !== id) });
    } else {
      onChange({ ...prefs, dietary_restrictions: [...dietary, id] });
    }
  };

  const addAllergy = (allergy) => {
    if (!allergies.includes(allergy)) {
      onChange({ ...prefs, allergies: [...allergies, allergy] });
    }
  };

  const removeAllergy = (allergy) => {
    onChange({ ...prefs, allergies: allergies.filter(a => a !== allergy) });
  };

  const setSpiceLevel = (level) => {
    onChange({ ...prefs, spice_preference: level });
  };

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Utensils className="w-5 h-5 text-orange-500" />
          Food Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preferred Cuisines */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Preferred Cuisines</h4>
          <div className="flex flex-wrap gap-2 mb-3">
            {cuisines.map((cuisine) => (
              <Badge key={cuisine} variant="secondary" className="px-3 py-1 bg-orange-100 text-orange-800">
                {cuisine}
                {isEditing && (
                  <button onClick={() => removeCuisine(cuisine)} className="ml-2 hover:text-orange-600">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </Badge>
            ))}
            {cuisines.length === 0 && (
              <p className="text-sm text-gray-500">No cuisines selected</p>
            )}
          </div>
          {isEditing && (
            <Select onValueChange={addCuisine}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Add cuisine preference" />
              </SelectTrigger>
              <SelectContent>
                {CUISINE_OPTIONS.filter(c => !cuisines.includes(c)).map((cuisine) => (
                  <SelectItem key={cuisine} value={cuisine}>{cuisine}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Dietary Restrictions */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Dietary Restrictions</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {DIETARY_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => isEditing && toggleDietary(option.id)}
                disabled={!isEditing}
                className={cn(
                  "p-3 rounded-lg border-2 text-center transition-all",
                  dietary.includes(option.id)
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-200 bg-white text-gray-600",
                  isEditing && "hover:border-green-300 cursor-pointer",
                  !isEditing && "cursor-default"
                )}
              >
                <span className="text-xl block mb-1">{option.icon}</span>
                <span className="text-xs font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Allergies */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Food Allergies
          </h4>
          <div className="flex flex-wrap gap-2 mb-3">
            {allergies.map((allergy) => (
              <Badge key={allergy} variant="destructive" className="px-3 py-1">
                {allergy}
                {isEditing && (
                  <button onClick={() => removeAllergy(allergy)} className="ml-2 hover:text-red-200">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </Badge>
            ))}
            {allergies.length === 0 && (
              <p className="text-sm text-gray-500">No allergies listed</p>
            )}
          </div>
          {isEditing && (
            <Select onValueChange={addAllergy}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Add allergy" />
              </SelectTrigger>
              <SelectContent>
                {ALLERGY_OPTIONS.filter(a => !allergies.includes(a)).map((allergy) => (
                  <SelectItem key={allergy} value={allergy}>{allergy}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Spice Preference */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Flame className="w-4 h-4 text-red-500" />
            Spice Preference
          </h4>
          <div className="flex gap-2">
            {SPICE_LEVELS.map((level) => (
              <button
                key={level.id}
                onClick={() => isEditing && setSpiceLevel(level.id)}
                disabled={!isEditing}
                className={cn(
                  "flex-1 p-3 rounded-lg border-2 text-center transition-all",
                  spiceLevel === level.id
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 bg-white",
                  isEditing && "hover:border-red-300 cursor-pointer",
                  !isEditing && "cursor-default"
                )}
              >
                <div className="flex justify-center mb-1">
                  {Array.from({ length: level.flames }).map((_, i) => (
                    <Flame key={i} className={cn(
                      "w-4 h-4",
                      spiceLevel === level.id ? "text-red-500" : "text-gray-400"
                    )} />
                  ))}
                </div>
                <span className={cn(
                  "text-xs font-medium",
                  spiceLevel === level.id ? "text-red-700" : "text-gray-600"
                )}>
                  {level.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
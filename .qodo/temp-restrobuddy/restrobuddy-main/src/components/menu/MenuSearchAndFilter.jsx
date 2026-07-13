import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, Filter } from "lucide-react";

export default function MenuSearchAndFilter({
  categories,
  dietaryOptions,
  onSearch,
  onFilterChange,
  onCategoryChange,
  activeCategory,
  priceRange,
  onPriceChange,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDietary, setSelectedDietary] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (value) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleDietaryToggle = (option) => {
    const updated = selectedDietary.includes(option)
      ? selectedDietary.filter(d => d !== option)
      : [...selectedDietary, option];
    setSelectedDietary(updated);
    onFilterChange({ dietary: updated });
  };

  const hasActiveFilters = selectedDietary.length > 0 || searchQuery;

  return (
    <div className="bg-white rounded-xl shadow-md p-4 space-y-4 sticky top-4 z-10">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search menu items..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9"
        />
        {searchQuery && (
          <button
            onClick={() => handleSearch("")}
            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Categories */}
      <div>
        <p className="text-sm font-semibold text-slate-700 mb-2">Category</p>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={activeCategory === "all" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => onCategoryChange("all")}
          >
            All Items
          </Badge>
          {categories?.map((cat) => (
            <Badge
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              className="cursor-pointer capitalize"
              onClick={() => onCategoryChange(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      </div>

      {/* Filter Toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 text-sm font-semibold text-purple-600 hover:text-purple-700"
      >
        <Filter className="w-4 h-4" />
        More Filters {hasActiveFilters && `(${selectedDietary.length})`}
      </button>

      {/* Dietary Options */}
      {showFilters && (
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2">
            Dietary Options
          </p>
          <div className="flex flex-wrap gap-2">
            {dietaryOptions?.map((option) => (
              <Badge
                key={option}
                variant={
                  selectedDietary.includes(option) ? "default" : "outline"
                }
                className="cursor-pointer capitalize"
                onClick={() => handleDietaryToggle(option)}
              >
                {option}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSearchQuery("");
            setSelectedDietary([]);
            onSearch("");
            onFilterChange({ dietary: [] });
          }}
          className="w-full"
        >
          Clear Filters
        </Button>
      )}
    </div>
  );
}
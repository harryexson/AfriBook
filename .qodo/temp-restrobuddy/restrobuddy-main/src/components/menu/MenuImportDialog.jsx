import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle } from "lucide-react";
import { importMenuFromUrl } from "@/functions/importMenuFromUrl";

export default function MenuImportDialog({ isOpen, onClose, restaurantId, onSuccess }) {
  const [url, setUrl] = useState("");
  const [source, setSource] = useState("custom");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const sources = [
    { id: "ubereats", label: "🚗 UberEats", placeholder: "ubereats.com/..." },
    { id: "doordash", label: "🚪 DoorDash", placeholder: "doordash.com/..." },
    { id: "grubhub", label: "🍕 GrubHub", placeholder: "grubhub.com/..." },
    { id: "yelp", label: "⭐ Yelp", placeholder: "yelp.com/..." },
    { id: "custom", label: "🌐 Custom Website", placeholder: "yoursite.com/menu" },
  ];

  const handleImport = async () => {
    setError("");

    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await importMenuFromUrl({
        url: url.trim(),
        restaurantId,
        source,
      });

      if (data.error) {
        throw new Error(data.error);
      }

      onSuccess(data);
      setUrl("");
      setSource("custom");
      onClose();
    } catch (err) {
      setError(err.message || "Failed to import menu");
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import Menu from URL</DialogTitle>
          <DialogDescription>
            Automatically import menu items from a restaurant website or delivery platform
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Source Selection */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">
              Select Source
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {sources.map((s) => (
                <Badge
                  key={s.id}
                  variant={source === s.id ? "default" : "outline"}
                  className="cursor-pointer text-center justify-center py-2"
                  onClick={() => setSource(s.id)}
                >
                  {s.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* URL Input */}
          <div>
            <Label htmlFor="menu-url" className="text-sm font-semibold">
              Menu URL
            </Label>
            <Input
              id="menu-url"
              placeholder={
                sources.find((s) => s.id === source)?.placeholder ||
                "https://example.com/menu"
              }
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Info */}
          <p className="text-xs text-slate-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
            💡 Paste the full URL to the restaurant's menu page. Our AI will extract all menu
            items including names, prices, descriptions, and dietary info.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={isLoading || !url.trim()}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Importing...
              </>
            ) : (
              "Import Menu"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
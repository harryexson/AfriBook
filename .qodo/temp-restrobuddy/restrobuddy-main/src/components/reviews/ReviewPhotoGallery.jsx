import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReviewPhotoGallery({ images = [] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  if (!images || images.length === 0) return null;

  const nextImage = () => {
    setSelectedIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <>
      <div className="flex gap-2 flex-wrap mt-3">
        {images.slice(0, 4).map((img, idx) => (
          <div
            key={idx}
            className="relative cursor-pointer group"
            onClick={() => {
              setSelectedIndex(idx);
              setIsOpen(true);
            }}
          >
            <img
              src={img}
              alt={`Review ${idx + 1}`}
              className="h-20 w-20 rounded-lg object-cover border border-slate-200 group-hover:border-emerald-500 transition-all"
            />
            {idx === 3 && images.length > 4 && (
              <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center group-hover:bg-black/60 transition-all">
                <span className="text-white font-bold">+{images.length - 4}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Full Screen Gallery */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl p-0">
          <div className="relative w-full h-96 bg-black flex items-center justify-center">
            <img
              src={images[selectedIndex]}
              alt={`Review ${selectedIndex + 1}`}
              className="max-h-full max-w-full object-contain"
            />

            {/* Navigation Buttons */}
            {images.length > 1 && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40"
                  onClick={prevImage}
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40"
                  onClick={nextImage}
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </Button>
              </>
            )}

            {/* Close Button */}
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/40"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-6 h-6 text-white" />
            </Button>

            {/* Counter */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                {selectedIndex + 1} / {images.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
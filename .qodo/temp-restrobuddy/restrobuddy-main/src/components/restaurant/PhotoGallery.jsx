import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X, Image as ImageIcon } from "lucide-react";

export default function PhotoGallery({ restaurant, menuItems = [] }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Collect all images
  const allImages = [
    restaurant.banner_url,
    restaurant.logo_url,
    ...menuItems.filter(item => item.image_url).map(item => item.image_url)
  ].filter(Boolean);

  if (allImages.length === 0) return null;

  const openLightbox = (index) => {
    setCurrentIndex(index);
    setSelectedImage(allImages[index]);
  };

  const nextImage = () => {
    const next = (currentIndex + 1) % allImages.length;
    setCurrentIndex(next);
    setSelectedImage(allImages[next]);
  };

  const prevImage = () => {
    const prev = (currentIndex - 1 + allImages.length) % allImages.length;
    setCurrentIndex(prev);
    setSelectedImage(allImages[prev]);
  };

  return (
    <>
      <Card className="border-0 shadow-xl p-6">
        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <ImageIcon className="w-6 h-6 text-emerald-600" />
          Photo Gallery
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {allImages.slice(0, 8).map((image, idx) => (
            <div
              key={idx}
              onClick={() => openLightbox(idx)}
              className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
            >
              <img
                src={image}
                alt=""
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </div>
          ))}
          {allImages.length > 8 && (
            <div className="aspect-square rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
              +{allImages.length - 8}
            </div>
          )}
        </div>
      </Card>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:bg-white/20 z-50"
          >
            <X className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={prevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-50"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-50"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
          <img src={selectedImage} alt="" className="w-full h-auto" />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
            {currentIndex + 1} / {allImages.length}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
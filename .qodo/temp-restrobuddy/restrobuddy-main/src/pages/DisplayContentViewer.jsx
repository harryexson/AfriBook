import React, { useState, useEffect } from "react";
import { DisplayContent } from "@/entities/DisplayContent";

export default function DisplayContentViewer() {
  const [contents, setContents] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  useEffect(() => {
    if (contents.length <= 1) return;

    const currentContent = contents[currentIndex];
    const duration = (currentContent?.duration || 10) * 1000;

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % contents.length);
    }, duration);

    return () => clearTimeout(timer);
  }, [currentIndex, contents]);

  const loadContent = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const contentId = urlParams.get('content');
    const contentIds = urlParams.get('contents');
    const locationId = urlParams.get('location');

    try {
      if (contentId) {
        // Single content
        const allContent = await DisplayContent.list();
        const content = allContent.find(c => c.id === contentId);
        if (content) {
          setContents([content]);
        }
      } else if (contentIds) {
        // Multiple contents
        const ids = contentIds.split(',');
        const allContent = await DisplayContent.list();
        const filtered = allContent.filter(c => ids.includes(c.id) && c.active);
        setContents(filtered.sort((a, b) => (a.order || 0) - (b.order || 0)));
      } else if (locationId) {
        // All content for a location
        const allContent = await DisplayContent.filter({ active: true });
        const filtered = allContent.filter(c => c.assigned_locations?.includes(locationId));
        setContents(filtered.sort((a, b) => (a.order || 0) - (b.order || 0)));
      } else {
        // Show all active content
        const allContent = await DisplayContent.filter({ active: true });
        setContents(allContent.sort((a, b) => (a.order || 0) - (b.order || 0)));
      }
    } catch (error) {
      console.error("Error loading content:", error);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-20 h-20 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (contents.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">No Content Available</h1>
          <p className="text-xl text-slate-400">Add content in the Display Content Manager</p>
        </div>
      </div>
    );
  }

  const currentContent = contents[currentIndex];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Main Content */}
      {currentContent.image_url ? (
        <img
          src={currentContent.image_url}
          alt={currentContent.name}
          className="w-full h-screen object-contain"
          style={{ backgroundColor: '#000' }}
        />
      ) : currentContent.content_html ? (
        <div 
          className="w-full h-screen flex items-center justify-center p-8"
          dangerouslySetInnerHTML={{ __html: currentContent.content_html }}
        />
      ) : (
        <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-slate-900">
          <div className="text-center text-white">
            <h1 className="text-6xl font-bold mb-4">{currentContent.name}</h1>
            <p className="text-2xl text-slate-300 capitalize">{currentContent.type?.replace('_', ' ')}</p>
          </div>
        </div>
      )}

      {/* Slideshow Indicators */}
      {contents.length > 1 && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2">
          {contents.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-3 h-3 rounded-full transition-all ${
                idx === currentIndex ? 'bg-white scale-125' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      )}

      {/* Content Counter */}
      {contents.length > 1 && (
        <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {contents.length}
        </div>
      )}
    </div>
  );
}
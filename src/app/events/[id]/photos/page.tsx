'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Upload,
  Download,
  Share2,
  X,
  ChevronLeft,
  ChevronRight,
  Camera,
  Image as ImageIcon,
  Clock,
  HardDrive,
  Plus,
  MessageCircle,
} from 'lucide-react';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const photoFilters = [
  { id: 'all', label: 'All Photos' },
  { id: 'pre', label: 'Pre-Event' },
  { id: 'during', label: 'During Event' },
  { id: 'post', label: 'Post-Event' },
];

const mockPhotos = Array.from({ length: 18 }, (_, i) => ({
  id: `photo-${i}`,
  url: `https://images.unsplash.com/photo-${1500000000000 + ((i + 1) * 11111)}?w=600&h=${400 + (i % 3) * 100}&fit=crop`,
  caption: i % 4 === 0 ? 'Great vibes at the event!' : undefined,
  uploader: `User ${i + 1}`,
  uploadedBeforeEvent: i < 4,
  createdAt: '2026-08-15',
}));

export default function PhotosPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredPhotos =
    activeFilter === 'all'
      ? mockPhotos
      : activeFilter === 'pre'
        ? mockPhotos.filter((p) => p.uploadedBeforeEvent)
        : activeFilter === 'during'
          ? mockPhotos.filter((p) => !p.uploadedBeforeEvent)
          : mockPhotos.slice(0, 3);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const navigatePhoto = (dir: 'prev' | 'next') => {
    if (selectedPhoto === null) return;
    if (dir === 'next') {
      setSelectedPhoto((selectedPhoto + 1) % filteredPhotos.length);
    } else {
      setSelectedPhoto((selectedPhoto - 1 + filteredPhotos.length) % filteredPhotos.length);
    }
  };

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Header */}
      <div className="bg-surface border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/events/evt-001"
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-heading font-bold text-text-primary">Photo Gallery</h1>
              <p className="text-text-secondary text-sm">Afrobeats Night: The Ultimate Concert</p>
            </div>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Photos
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="flex items-center gap-6 mb-6 text-sm text-text-secondary">
          <span className="flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-amber-500" />
            <strong className="text-text-primary">{mockPhotos.length}</strong> photos
          </span>
          <span className="flex items-center gap-1.5">
            <HardDrive className="w-4 h-4 text-amber-500" />
            <strong className="text-text-primary">24.5 MB</strong> / 500 MB
          </span>
        </div>

        {/* Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={() => setIsDragging(false)}
          className={`mb-8 border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer ${
            isDragging
              ? 'border-amber-500 bg-amber-500/5'
              : 'border-border hover:border-amber-500/50'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
          <p className="text-text-secondary font-medium mb-1">
            Drag & drop photos here, or click to browse
          </p>
          <p className="text-xs text-text-tertiary">PNG, JPG, WebP up to 10MB each</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
          {photoFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeFilter === filter.id
                  ? 'bg-amber-500 text-white'
                  : 'bg-surface text-text-secondary hover:bg-surface-secondary border border-border'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Masonry Grid */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="columns-2 md:columns-3 lg:columns-4 gap-3"
        >
          {filteredPhotos.map((photo, i) => (
            <motion.div
              key={photo.id}
              variants={fadeIn}
              className="break-inside-avoid mb-3"
            >
              <div
                className="relative group rounded-xl overflow-hidden cursor-pointer"
                onClick={() => setSelectedPhoto(i)}
              >
                <img
                  src={photo.url}
                  alt={photo.caption || `Photo ${i + 1}`}
                  className="w-full object-cover hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.aspectRatio = `${300}/${200 + (i % 3) * 50}`;
                    target.style.background = `linear-gradient(135deg, rgba(245,158,11,0.1), rgba(249,115,22,0.1))`;
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end">
                  <div className="w-full p-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between">
                    <div className="flex gap-1.5">
                      <button className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors">
                        <Download className="w-3.5 h-3.5 text-white" />
                      </button>
                      <button className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors">
                        <Share2 className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <p className="text-white text-xs">{photo.caption}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedPhoto !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={() => setSelectedPhoto(null)}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                navigatePhoto('prev');
              }}
              className="absolute left-4 p-2 text-white/70 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            <motion.div
              key={selectedPhoto}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-4xl max-h-[80vh] mx-8"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={filteredPhotos[selectedPhoto]?.url}
                alt="Gallery photo"
                className="max-w-full max-h-[75vh] rounded-xl object-contain"
              />
              {filteredPhotos[selectedPhoto]?.caption && (
                <p className="text-white/80 text-center mt-3">
                  {filteredPhotos[selectedPhoto]?.caption}
                </p>
              )}
              <div className="flex items-center justify-center gap-3 mt-4">
                <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-white">
                  <Download className="w-5 h-5" />
                </button>
                <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-white">
                  <Share2 className="w-5 h-5" />
                </button>
                <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-white">
                  <MessageCircle className="w-5 h-5" />
                </button>
              </div>
            </motion.div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                navigatePhoto('next');
              }}
              className="absolute right-4 p-2 text-white/70 hover:text-white transition-colors"
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            <div className="absolute bottom-4 text-white/50 text-sm">
              {selectedPhoto + 1} / {filteredPhotos.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

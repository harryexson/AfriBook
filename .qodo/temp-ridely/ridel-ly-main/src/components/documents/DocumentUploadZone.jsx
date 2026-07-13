import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileImage, FileText, X, Camera, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function DocumentUploadZone({ 
  onFileSelect, 
  accept = '.pdf,.jpg,.jpeg,.png',
  maxSize = 10, // MB
  disabled = false 
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const validateFile = (file) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a PDF or image file (JPG, PNG)');
      return false;
    }

    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSize}MB`);
      return false;
    }

    return true;
  };

  const handleFile = useCallback((file) => {
    if (!validateFile(file)) return;

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    onFileSelect(file);
  }, [onFileSelect, maxSize]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreview(null);
    onFileSelect(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const getFileIcon = () => {
    if (!selectedFile) return FileImage;
    return selectedFile.type === 'application/pdf' ? FileText : FileImage;
  };

  const FileIcon = getFileIcon();

  return (
    <div className="space-y-4">
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer",
          isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400 hover:bg-gray-50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => !disabled && fileInputRef.current?.click()}
        whileHover={{ scale: disabled ? 1 : 1.01 }}
        whileTap={{ scale: disabled ? 1 : 0.99 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />

        <AnimatePresence mode="wait">
          {selectedFile ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-4"
            >
              {preview ? (
                <div className="relative mx-auto w-48 h-48 rounded-lg overflow-hidden border shadow-lg">
                  <img 
                    src={preview} 
                    alt="Document preview" 
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearSelection();
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 mx-auto bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileIcon className="w-10 h-10 text-blue-600" />
                </div>
              )}
              
              <div>
                <p className="font-medium text-gray-900 truncate max-w-xs mx-auto">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  clearSelection();
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Remove
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                <Upload className={cn(
                  "w-8 h-8 transition-colors",
                  isDragging ? "text-blue-600" : "text-gray-400"
                )} />
              </div>
              
              <div>
                <p className="font-medium text-gray-900">
                  {isDragging ? "Drop your file here" : "Drag and drop your document"}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  or click to browse • PDF, JPG, PNG up to {maxSize}MB
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Camera capture for mobile */}
      <div className="flex gap-2">
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => cameraInputRef.current?.click()}
          disabled={disabled}
        >
          <Camera className="w-4 h-4 mr-2" />
          Take Photo
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          <FileImage className="w-4 h-4 mr-2" />
          Choose File
        </Button>
      </div>
    </div>
  );
}
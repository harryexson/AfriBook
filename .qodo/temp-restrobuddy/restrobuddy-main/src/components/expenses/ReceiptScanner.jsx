import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Upload, Loader2, CheckCircle, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ReceiptScanner({ onExpenseExtracted, onClose }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error("Camera access error:", error);
      alert("Unable to access camera. Please use file upload instead.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'receipt.jpg', { type: 'image/jpeg' });
        processReceipt(file);
      }
    }, 'image/jpeg', 0.9);
    
    stopCamera();
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      processReceipt(file);
    }
  };

  const processReceipt = async (file) => {
    setIsProcessing(true);
    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setCapturedImage(e.target.result);
      reader.readAsDataURL(file);

      // Upload receipt
      const uploadResponse = await base44.integrations.Core.UploadFile({ file });
      const receiptUrl = uploadResponse.file_url;

      // Extract data using AI
      const extractResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this receipt image and extract the following information:
- Vendor/merchant name
- Date of purchase (in YYYY-MM-DD format)
- Total amount (just the number)
- Category (food_supplies, beverages, utilities, equipment, supplies, or other)
- Description (brief summary of items purchased)
- Payment method if visible (cash, credit_card, debit_card, check)

Be accurate and only extract information that is clearly visible.`,
        file_urls: receiptUrl,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            vendor: { type: "string" },
            date: { type: "string" },
            amount: { type: "number" },
            category: { type: "string" },
            description: { type: "string" },
            payment_method: { type: "string" }
          }
        }
      });

      const extracted = {
        ...extractResponse,
        receipt_url: receiptUrl
      };

      setExtractedData(extracted);
      onExpenseExtracted(extracted);
    } catch (error) {
      console.error("Receipt processing error:", error);
      alert("Failed to process receipt. Please try again or enter manually.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="border-0 shadow-xl">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Scan Receipt</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {!isCameraActive && !capturedImage && !isProcessing && (
          <div className="space-y-4">
            <Button 
              onClick={startCamera} 
              className="w-full gap-2"
              variant="outline"
            >
              <Camera className="w-5 h-5" />
              Take Photo with Camera
            </Button>
            
            <div className="text-center text-sm text-slate-500">or</div>
            
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              className="w-full gap-2"
              variant="outline"
            >
              <Upload className="w-5 h-5" />
              Upload Receipt Image
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        )}

        {isCameraActive && (
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video 
                ref={videoRef} 
                className="w-full h-auto"
                playsInline
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="flex gap-2">
              <Button onClick={capturePhoto} className="flex-1 gap-2">
                <Camera className="w-5 h-5" />
                Capture
              </Button>
              <Button onClick={stopCamera} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
            <p className="text-slate-600">Processing receipt...</p>
            <p className="text-sm text-slate-500">AI is extracting expense data</p>
          </div>
        )}

        {capturedImage && extractedData && !isProcessing && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600 mb-4">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Receipt Processed Successfully!</span>
            </div>
            
            <img 
              src={capturedImage} 
              alt="Receipt" 
              className="w-full rounded-lg border"
            />
            
            <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Vendor:</span>
                <span className="font-semibold">{extractedData.vendor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Amount:</span>
                <span className="font-semibold">${extractedData.amount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Date:</span>
                <span className="font-semibold">{extractedData.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Category:</span>
                <span className="font-semibold capitalize">{extractedData.category?.replace(/_/g, ' ')}</span>
              </div>
            </div>
            
            <p className="text-xs text-slate-500 text-center">
              Review and edit the details in the form above before saving
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
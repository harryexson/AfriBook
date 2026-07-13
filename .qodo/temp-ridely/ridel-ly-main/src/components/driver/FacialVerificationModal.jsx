import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { 
  Camera, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Shield, 
  AlertTriangle,
  Loader2,
  User,
  Scan
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function FacialVerificationModal({ isOpen, onVerified, onClose, user }) {
  const [step, setStep] = useState('intro'); // intro, camera, processing, success, failed
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const MAX_ATTEMPTS = 3;

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStep('camera');
    } catch (err) {
      console.error('Camera error:', err);
      setError('Could not access camera. Please enable camera permissions.');
      toast.error('Camera access denied. Please enable permissions.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageData);
    
    // Stop camera
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    verifyFace(imageData);
  };

  const verifyFace = async (imageData) => {
    setStep('processing');
    setAttempts(prev => prev + 1);

    try {
      // Upload the captured image
      const blob = await fetch(imageData).then(r => r.blob());
      const file = new File([blob], 'face-verification.jpg', { type: 'image/jpeg' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Call facial verification function
      const result = await base44.functions.invoke('verifyDriverFace', {
        capturedImageUrl: file_url,
        driverId: user.id
      });

      if (result.data?.verified) {
        setVerificationResult({ success: true, confidence: result.data.confidence });
        setStep('success');
        
        // Update user verification status
        await base44.auth.updateMe({
          facial_verification: {
            verified: true,
            verified_at: new Date().toISOString(),
            session_id: result.data.session_id
          }
        });

        setTimeout(() => {
          onVerified();
        }, 2000);
      } else {
        setVerificationResult({ 
          success: false, 
          reason: result.data?.reason || 'Face does not match driver license photo'
        });
        setStep('failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationResult({ 
        success: false, 
        reason: 'Verification service error. Please try again.'
      });
      setStep('failed');
    }
  };

  const retryVerification = () => {
    if (attempts >= MAX_ATTEMPTS) {
      toast.error('Maximum attempts reached. Please contact support.');
      return;
    }
    setCapturedImage(null);
    setVerificationResult(null);
    startCamera();
  };

  const renderContent = () => {
    switch (step) {
      case 'intro':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
              <Shield className="w-12 h-12 text-white" />
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Identity Verification Required</h3>
              <p className="text-gray-600">
                For security, we need to verify your identity matches your driver's license photo.
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 text-left space-y-3">
              <h4 className="font-semibold text-blue-900">How it works:</h4>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  We'll take a photo of your face
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  Compare it to your driver's license photo
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  Verification takes just a few seconds
                </li>
              </ul>
            </div>

            <div className="bg-amber-50 rounded-xl p-4 text-left">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-800">
                    <strong>Tips for best results:</strong> Good lighting, face the camera directly, remove sunglasses/hats
                  </p>
                </div>
              </div>
            </div>

            <Button 
              onClick={startCamera}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Camera className="w-5 h-5 mr-2" />
              Start Verification
            </Button>

            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}
          </motion.div>
        );

      case 'camera':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {/* Face Guide Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-60 border-4 border-white/50 rounded-full" />
              </div>
              
              <div className="absolute bottom-4 left-4 right-4 text-center">
                <p className="text-white text-sm bg-black/50 rounded-lg px-3 py-2">
                  Position your face within the oval
                </p>
              </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <Button 
              onClick={capturePhoto}
              className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Scan className="w-5 h-5 mr-2" />
              Capture & Verify
            </Button>

            <p className="text-center text-sm text-gray-500">
              Attempt {attempts + 1} of {MAX_ATTEMPTS}
            </p>
          </motion.div>
        );

      case 'processing':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-6 py-8"
          >
            <div className="relative w-32 h-32 mx-auto">
              {capturedImage && (
                <img 
                  src={capturedImage} 
                  alt="Captured" 
                  className="w-full h-full rounded-full object-cover border-4 border-blue-200"
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Verifying Identity...</h3>
              <p className="text-gray-600">Comparing with your driver's license photo</p>
            </div>

            <div className="flex items-center justify-center gap-2 text-blue-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing facial recognition</span>
            </div>
          </motion.div>
        );

      case 'success':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6 py-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto"
            >
              <CheckCircle2 className="w-12 h-12 text-white" />
            </motion.div>
            
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Identity Verified!</h3>
              <p className="text-gray-600">Your face matches your driver's license</p>
            </div>

            {verificationResult?.confidence && (
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-green-800 font-medium">
                  Match Confidence: {(verificationResult.confidence * 100).toFixed(1)}%
                </p>
              </div>
            )}

            <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
          </motion.div>
        );

      case 'failed':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-6 py-4"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-12 h-12 text-white" />
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Verification Failed</h3>
              <p className="text-gray-600">{verificationResult?.reason}</p>
            </div>

            {attempts < MAX_ATTEMPTS ? (
              <div className="space-y-3">
                <div className="bg-amber-50 rounded-xl p-4 text-left">
                  <p className="text-sm text-amber-800">
                    <strong>Tips:</strong> Ensure good lighting, face the camera directly, and remove any accessories covering your face.
                  </p>
                </div>
                
                <Button 
                  onClick={retryVerification}
                  className="w-full h-12"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Try Again ({MAX_ATTEMPTS - attempts} attempts left)
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-red-50 rounded-xl p-4">
                  <p className="text-sm text-red-800">
                    Maximum verification attempts reached. Please contact support for assistance.
                  </p>
                </div>
                
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/Support'}
                  className="w-full"
                >
                  Contact Support
                </Button>
              </div>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Driver Identity Verification
          </DialogTitle>
          <DialogDescription>
            Secure facial recognition to protect your account
          </DialogDescription>
        </DialogHeader>
        
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
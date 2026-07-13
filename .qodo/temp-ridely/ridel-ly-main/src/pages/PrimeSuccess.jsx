import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

export default function PrimeSuccess() {
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    // Trigger confetti animation
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#FFD700', '#FFA500', '#FF6347']
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#FFD700', '#FFA500', '#FF6347']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();

    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
    }, 2000);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full"
      >
        <Card className="border-0 shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 p-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="text-center"
            >
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                {isProcessing ? (
                  <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                )}
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {isProcessing ? 'Processing...' : 'Welcome to Prime!'}
              </h1>
              <p className="text-white/90 text-lg">
                {isProcessing ? 'Setting up your membership' : 'Your subscription is now active'}
              </p>
            </motion.div>
          </div>

          <CardContent className="p-8">
            {!isProcessing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-6"
              >
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-yellow-200">
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-600" />
                    Your Prime Benefits
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>20% off all rides, every time</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Priority driver matching</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Free delivery on food orders</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>24/7 priority customer support</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Exclusive Prime-only promotions</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <Button 
                    onClick={() => window.location.href = createPageUrl('BookRide')}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white h-12 text-lg font-semibold"
                  >
                    Book Your First Prime Ride
                  </Button>
                  <Button 
                    onClick={() => window.location.href = createPageUrl('Prime')}
                    variant="outline"
                    className="w-full"
                  >
                    View Membership Details
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Home, Receipt, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const session = params.get('session_id');
    setSessionId(session || '');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="max-w-md w-full shadow-2xl">
          <CardContent className="p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
            </motion.div>

            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Payment Successful!
            </h1>
            
            <p className="text-gray-600 mb-8">
              Your payment has been processed successfully. You'll receive a confirmation email shortly.
            </p>

            {sessionId && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
                <p className="text-sm font-mono text-gray-700 break-all">{sessionId}</p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button
                onClick={() => navigate(createPageUrl('MyRides'))}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Receipt className="w-4 h-4 mr-2" />
                View My Rides
              </Button>
              
              <Button
                onClick={() => navigate(createPageUrl('Dashboard'))}
                variant="outline"
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
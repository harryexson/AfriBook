import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, Home, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PaymentCancel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
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
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
            </motion.div>

            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Payment Cancelled
            </h1>
            
            <p className="text-gray-600 mb-8">
              Your payment was cancelled. No charges have been made to your account.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-blue-800">
                <strong>💡 Need help?</strong>
                <br />
                If you encountered any issues, please contact our support team.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={() => navigate(-1)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Try Again
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
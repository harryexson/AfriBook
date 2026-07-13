import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Clock, 
  XCircle, 
  ChevronRight,
  Bell,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { differenceInDays, parseISO, format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function ExpiryNotificationBanner({ documents, onDocumentClick }) {
  // Filter documents that are expiring or expired
  const expiringDocuments = documents.filter(doc => {
    if (!doc.expiry_date) return false;
    const daysUntilExpiry = differenceInDays(parseISO(doc.expiry_date), new Date());
    return daysUntilExpiry <= 30;
  }).sort((a, b) => {
    return parseISO(a.expiry_date) - parseISO(b.expiry_date);
  });

  if (expiringDocuments.length === 0) return null;

  const getUrgencyLevel = (expiryDate) => {
    const daysUntilExpiry = differenceInDays(parseISO(expiryDate), new Date());
    
    if (daysUntilExpiry < 0) {
      return { level: 'expired', color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
    } else if (daysUntilExpiry <= 7) {
      return { level: 'critical', color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
    } else if (daysUntilExpiry <= 14) {
      return { level: 'high', color: 'bg-orange-500', textColor: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' };
    } else {
      return { level: 'warning', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' };
    }
  };

  const getExpiryText = (expiryDate) => {
    const daysUntilExpiry = differenceInDays(parseISO(expiryDate), new Date());
    
    if (daysUntilExpiry < 0) {
      return `Expired ${Math.abs(daysUntilExpiry)} days ago`;
    } else if (daysUntilExpiry === 0) {
      return 'Expires today!';
    } else if (daysUntilExpiry === 1) {
      return 'Expires tomorrow!';
    } else {
      return `Expires in ${daysUntilExpiry} days`;
    }
  };

  const getIcon = (level) => {
    switch (level) {
      case 'expired': return XCircle;
      case 'critical': return AlertTriangle;
      case 'high': return AlertTriangle;
      default: return Clock;
    }
  };

  // Get overall urgency based on most urgent document
  const mostUrgent = expiringDocuments[0];
  const overallUrgency = getUrgencyLevel(mostUrgent.expiry_date);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-6"
      >
        <Card className={cn("border-2", overallUrgency.borderColor, overallUrgency.bgColor)}>
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", overallUrgency.color)}>
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className={cn("font-bold text-lg", overallUrgency.textColor)}>
                  {expiringDocuments.length} Document{expiringDocuments.length > 1 ? 's' : ''} Need{expiringDocuments.length === 1 ? 's' : ''} Attention
                </h3>
                <p className="text-sm text-gray-600">
                  Update these documents to maintain your active driver status
                </p>
              </div>
            </div>

            {/* Document List */}
            <div className="space-y-2">
              {expiringDocuments.map((doc, index) => {
                const urgency = getUrgencyLevel(doc.expiry_date);
                const Icon = getIcon(urgency.level);
                
                const documentNames = {
                  drivers_license: "Driver's License",
                  vehicle_registration: "Vehicle Registration",
                  vehicle_insurance: "Vehicle Insurance",
                  vehicle_inspection: "Vehicle Inspection",
                  commercial_permit: "Commercial Permit",
                  background_check: "Background Check",
                  medical_certificate: "Medical Certificate"
                };

                return (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <button
                      onClick={() => onDocumentClick?.(doc)}
                      className="w-full p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all flex items-center gap-3 text-left"
                    >
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", urgency.color)}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {documentNames[doc.document_type] || doc.document_type}
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className={urgency.textColor}>
                            {getExpiryText(doc.expiry_date)}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-500">
                            {format(parseISO(doc.expiry_date), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                      
                      <Badge className={cn("flex-shrink-0", urgency.color, "text-white")}>
                        {urgency.level === 'expired' ? 'EXPIRED' : 'RENEW'}
                      </Badge>
                      
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                  </motion.div>
                );
              })}
            </div>

            {/* Action */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Expired or missing documents may affect your ability to accept rides
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
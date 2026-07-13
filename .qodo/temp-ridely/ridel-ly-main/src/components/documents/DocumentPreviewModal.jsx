import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  ExternalLink, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  FileText,
  Calendar,
  Hash,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending Review' },
  approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Approved' },
  rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' },
  expired: { color: 'bg-gray-100 text-gray-800', icon: AlertTriangle, label: 'Expired' },
  expiring_soon: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle, label: 'Expiring Soon' }
};

const DOCUMENT_NAMES = {
  drivers_license: "Driver's License",
  vehicle_registration: "Vehicle Registration",
  vehicle_insurance: "Vehicle Insurance",
  vehicle_inspection: "Vehicle Inspection",
  commercial_permit: "Commercial Permit",
  background_check: "Background Check",
  medical_certificate: "Medical Certificate",
  vehicle_photos: "Vehicle Photos"
};

export default function DocumentPreviewModal({ document, isOpen, onClose }) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!document) return null;

  const isImage = document.mime_type?.startsWith('image/');
  const isPdf = document.mime_type === 'application/pdf';
  const StatusIcon = STATUS_CONFIG[document.status]?.icon || Clock;

  const getExpiryInfo = () => {
    if (!document.expiry_date) return null;
    const daysUntilExpiry = differenceInDays(parseISO(document.expiry_date), new Date());
    
    if (daysUntilExpiry < 0) {
      return { text: `Expired ${Math.abs(daysUntilExpiry)} days ago`, color: 'text-red-600' };
    } else if (daysUntilExpiry <= 7) {
      return { text: `Expires in ${daysUntilExpiry} days`, color: 'text-red-600' };
    } else if (daysUntilExpiry <= 30) {
      return { text: `Expires in ${daysUntilExpiry} days`, color: 'text-orange-600' };
    }
    return { text: `Expires in ${daysUntilExpiry} days`, color: 'text-gray-600' };
  };

  const expiryInfo = getExpiryInfo();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileText className="w-5 h-5" />
            {DOCUMENT_NAMES[document.document_type] || document.document_type}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
          {/* Preview Area */}
          <div className="lg:col-span-2 bg-gray-100 rounded-lg overflow-hidden relative min-h-[300px]">
            {isImage ? (
              <div className="absolute inset-0 flex items-center justify-center overflow-auto p-4">
                <img
                  src={document.file_url}
                  alt="Document preview"
                  className="max-w-full max-h-full object-contain transition-transform duration-200"
                  style={{ 
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transformOrigin: 'center center'
                  }}
                />
              </div>
            ) : isPdf ? (
              <iframe
                src={`${document.file_url}#toolbar=0`}
                className="w-full h-full min-h-[400px]"
                title="PDF Preview"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <FileText className="w-16 h-16 text-gray-400 mb-4" />
                <p className="text-gray-500">Preview not available</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => window.open(document.file_url, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in New Tab
                </Button>
              </div>
            )}

            {/* Image Controls */}
            {isImage && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 backdrop-blur rounded-full px-3 py-2 shadow-lg">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600 min-w-[60px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <div className="w-px h-6 bg-gray-300" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setRotation((rotation + 90) % 360)}
                >
                  <RotateCw className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Details Panel */}
          <div className="space-y-4 overflow-y-auto">
            {/* Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Status</p>
              <Badge className={cn("text-sm", STATUS_CONFIG[document.status]?.color)}>
                <StatusIcon className="w-4 h-4 mr-2" />
                {STATUS_CONFIG[document.status]?.label}
              </Badge>
            </div>

            {/* Document Details */}
            <div className="space-y-3">
              {document.document_number && (
                <div className="flex items-start gap-3">
                  <Hash className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Document Number</p>
                    <p className="font-medium">{document.document_number}</p>
                  </div>
                </div>
              )}

              {document.issue_date && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Issue Date</p>
                    <p className="font-medium">
                      {format(parseISO(document.issue_date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
              )}

              {document.expiry_date && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Expiry Date</p>
                    <p className={cn("font-medium", expiryInfo?.color)}>
                      {format(parseISO(document.expiry_date), 'MMMM d, yyyy')}
                    </p>
                    {expiryInfo && (
                      <p className={cn("text-sm", expiryInfo.color)}>
                        {expiryInfo.text}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">File Info</p>
                  <p className="font-medium truncate max-w-[200px]">{document.file_name}</p>
                  <p className="text-sm text-gray-500">
                    {(document.file_size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Uploaded</p>
                  <p className="font-medium">
                    {format(new Date(document.created_date), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>

              {document.version > 1 && (
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Version</p>
                    <p className="font-medium">Version {document.version}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Rejection Reason */}
            {document.status === 'rejected' && document.rejection_reason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs text-red-600 uppercase tracking-wider mb-1">Rejection Reason</p>
                <p className="text-sm text-red-800">{document.rejection_reason}</p>
              </div>
            )}

            {/* Notes */}
            {document.notes && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-600 uppercase tracking-wider mb-1">Notes</p>
                <p className="text-sm text-blue-800">{document.notes}</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => {
              const link = window.document.createElement('a');
              link.href = document.file_url;
              link.download = document.file_name;
              link.click();
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open(document.file_url, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in New Tab
          </Button>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
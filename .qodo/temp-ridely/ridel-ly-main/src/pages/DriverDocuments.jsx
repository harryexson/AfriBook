import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Eye,
  Clock,
  XCircle,
  History,
  AlertTriangle,
  FileUp,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { format, parseISO, differenceInDays, isBefore, addDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import DocumentUploadZone from '../components/documents/DocumentUploadZone';
import ExpiryNotificationBanner from '../components/documents/ExpiryNotificationBanner';
import DocumentPreviewModal from '../components/documents/DocumentPreviewModal';
import CheckrVerificationCard from '../components/driver/CheckrVerificationCard';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const DOCUMENT_TYPES = {
  identity: [
    { id: 'drivers_license', name: "Driver's License", required: true },
    { id: 'background_check', name: 'Background Check', required: true }
  ],
  vehicle: [
    { id: 'vehicle_registration', name: 'Vehicle Registration', required: true },
    { id: 'vehicle_insurance', name: 'Vehicle Insurance', required: true },
    { id: 'vehicle_inspection', name: 'Vehicle Inspection', required: false },
    { id: 'vehicle_photos', name: 'Vehicle Photos', required: false }
  ],
  certification: [
    { id: 'commercial_permit', name: 'Commercial Permit', required: false },
    { id: 'medical_certificate', name: 'Medical Certificate', required: false }
  ]
};

const STATUS_CONFIG = {
  pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending Review' },
  approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Approved' },
  rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' },
  expired: { color: 'bg-gray-100 text-gray-800', icon: AlertCircle, label: 'Expired' },
  expiring_soon: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle, label: 'Expiring Soon' }
};

export default function DriverDocuments() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [documentHistory, setDocumentHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('identity');
  
  const [uploadForm, setUploadForm] = useState({
    document_type: '',
    document_category: '',
    document_number: '',
    issue_date: '',
    expiry_date: '',
    notes: '',
    file: null
  });
  const [previewDoc, setPreviewDoc] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      // Load current documents
      const driverDocs = await base44.entities.DriverDocument.filter({
        driver_id: currentUser.id,
        is_current_version: true
      });
      
      setDocuments(driverDocs);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e, docType, category) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a PDF or image file (JPG, PNG).');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB.');
      return;
    }

    setUploadForm({
      ...uploadForm,
      document_type: docType,
      document_category: category,
      file: file
    });
    
    setShowUploadDialog(true);
  };

  const handleUploadDocument = async () => {
    if (!uploadForm.file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(prev => ({ ...prev, [uploadForm.document_type]: true }));

    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file: uploadForm.file });

      // Check if document already exists
      const existing = documents.find(d => d.document_type === uploadForm.document_type);
      
      // Calculate status based on expiry date
      let status = 'pending';
      if (uploadForm.expiry_date) {
        const expiryDate = parseISO(uploadForm.expiry_date);
        const today = new Date();
        const daysUntilExpiry = differenceInDays(expiryDate, today);
        
        if (daysUntilExpiry < 0) {
          status = 'expired';
        } else if (daysUntilExpiry <= 30) {
          status = 'expiring_soon';
        }
      }

      const documentData = {
        driver_id: user.id,
        document_type: uploadForm.document_type,
        document_category: uploadForm.document_category,
        file_url: file_url,
        file_name: uploadForm.file.name,
        file_size: uploadForm.file.size,
        mime_type: uploadForm.file.type,
        document_number: uploadForm.document_number,
        issue_date: uploadForm.issue_date || null,
        expiry_date: uploadForm.expiry_date || null,
        notes: uploadForm.notes,
        status: status,
        review_status: 'not_reviewed',
        version: existing ? existing.version + 1 : 1,
        previous_version_id: existing ? existing.id : null,
        is_current_version: true
      };

      // If replacing, mark old version as not current
      if (existing) {
        await base44.entities.DriverDocument.update(existing.id, {
          is_current_version: false
        });
      }

      await base44.entities.DriverDocument.create(documentData);
      
      toast.success('Document uploaded successfully!');
      setShowUploadDialog(false);
      resetUploadForm();
      loadData();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document. Please try again.');
    } finally {
      setUploading(prev => ({ ...prev, [uploadForm.document_type]: false }));
    }
  };

  const resetUploadForm = () => {
    setUploadForm({
      document_type: '',
      document_category: '',
      document_number: '',
      issue_date: '',
      expiry_date: '',
      notes: '',
      file: null
    });
  };

  const viewDocumentHistory = async (docType) => {
    try {
      const history = await base44.entities.DriverDocument.filter({
        driver_id: user.id,
        document_type: docType
      }, '-created_date');
      
      setDocumentHistory(history);
      setShowHistoryDialog(true);
    } catch (error) {
      console.error('Error loading history:', error);
      toast.error('Failed to load document history');
    }
  };

  const getExpiryWarning = (expiryDate) => {
    if (!expiryDate) return null;
    
    const today = new Date();
    const expiry = parseISO(expiryDate);
    const daysUntilExpiry = differenceInDays(expiry, today);
    
    if (daysUntilExpiry < 0) {
      return { type: 'expired', message: 'Expired', color: 'text-red-600' };
    } else if (daysUntilExpiry <= 7) {
      return { type: 'critical', message: `Expires in ${daysUntilExpiry} days`, color: 'text-red-600' };
    } else if (daysUntilExpiry <= 30) {
      return { type: 'warning', message: `Expires in ${daysUntilExpiry} days`, color: 'text-orange-600' };
    }
    return null;
  };

  const getDocumentsByCategory = (category) => {
    return DOCUMENT_TYPES[category].map(docType => {
      const doc = documents.find(d => d.document_type === docType.id);
      return { ...docType, document: doc };
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="w-12 h-12 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!user || user.user_type === 'rider') {
    return (
      <div className="p-8 text-center">
        <Card>
          <CardContent className="p-8">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-gray-600">This page is only accessible to drivers.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const approvedDocs = documents.filter(d => d.status === 'approved').length;
  const pendingDocs = documents.filter(d => d.status === 'pending').length;
  const expiringDocs = documents.filter(d => d.status === 'expiring_soon' || d.status === 'expired').length;
  const totalRequired = Object.values(DOCUMENT_TYPES).flat().filter(d => d.required).length;

  return (
    <div className="p-4 lg:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <Toaster richColors />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
              <p className="text-gray-600 mt-2">
                Upload and manage your driver documents. All required documents must be approved before you can start driving.
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate(createPageUrl('DriverDashboard'))}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Approved</p>
                  <p className="text-3xl font-bold text-green-600">{approvedDocs}</p>
                </div>
                <CheckCircle2 className="w-12 h-12 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pending Review</p>
                  <p className="text-3xl font-bold text-yellow-600">{pendingDocs}</p>
                </div>
                <Clock className="w-12 h-12 text-yellow-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Expiring/Expired</p>
                  <p className="text-3xl font-bold text-orange-600">{expiringDocs}</p>
                </div>
                <AlertTriangle className="w-12 h-12 text-orange-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Completion</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {Math.round((approvedDocs / totalRequired) * 100)}%
                  </p>
                </div>
                <FileText className="w-12 h-12 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expiry Notification Banner */}
        <ExpiryNotificationBanner 
          documents={documents}
          onDocumentClick={(doc) => {
            setPreviewDoc(doc);
            setShowPreviewModal(true);
          }}
        />

        {/* Checkr Background Check Status */}
        <div className="mb-6">
          <CheckrVerificationCard user={user} onUpdate={loadData} />
        </div>

        {/* Alert for missing documents */}
        {approvedDocs < totalRequired && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-yellow-900">Action Required</p>
                  <p className="text-sm text-yellow-800">
                    You need {totalRequired - approvedDocs} more approved document{totalRequired - approvedDocs !== 1 ? 's' : ''} to activate your driver account.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Document Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Your Documents</CardTitle>
            <CardDescription>Upload and manage your driver documents by category</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="identity">Identity</TabsTrigger>
                <TabsTrigger value="vehicle">Vehicle</TabsTrigger>
                <TabsTrigger value="certification">Certification</TabsTrigger>
              </TabsList>

              {Object.keys(DOCUMENT_TYPES).map((category) => (
                <TabsContent key={category} value={category} className="space-y-4">
                  {getDocumentsByCategory(category).map((item) => {
                    const doc = item.document;
                    const StatusIcon = doc ? STATUS_CONFIG[doc.status].icon : FileText;
                    const warning = doc?.expiry_date ? getExpiryWarning(doc.expiry_date) : null;

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Card className={doc ? '' : 'border-dashed border-2'}>
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-4 flex-1">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${doc ? STATUS_CONFIG[doc.status].color : 'bg-gray-100'}`}>
                                  <StatusIcon className="w-6 h-6" />
                                </div>
                                
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-lg">{item.name}</h3>
                                    {item.required && (
                                      <Badge variant="outline" className="text-xs">Required</Badge>
                                    )}
                                  </div>
                                  
                                  {doc ? (
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <Badge className={STATUS_CONFIG[doc.status].color}>
                                          {STATUS_CONFIG[doc.status].label}
                                        </Badge>
                                        {doc.version > 1 && (
                                          <Badge variant="outline" className="text-xs">
                                            v{doc.version}
                                          </Badge>
                                        )}
                                      </div>
                                      
                                      <div className="text-sm text-gray-600 space-y-1">
                                        {doc.document_number && (
                                          <p>Number: {doc.document_number}</p>
                                        )}
                                        {doc.expiry_date && (
                                          <p className={warning ? warning.color : ''}>
                                            <Calendar className="w-4 h-4 inline mr-1" />
                                            Expires: {format(parseISO(doc.expiry_date), 'MMM d, yyyy')}
                                            {warning && ` • ${warning.message}`}
                                          </p>
                                        )}
                                        <p className="text-xs text-gray-500">
                                          Uploaded: {format(new Date(doc.created_date), 'MMM d, yyyy')}
                                        </p>
                                      </div>

                                      {doc.status === 'rejected' && doc.rejection_reason && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                                          <p className="text-sm font-medium text-red-900">Rejection Reason:</p>
                                          <p className="text-sm text-red-800">{doc.rejection_reason}</p>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-gray-500">No document uploaded yet</p>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col gap-2">
                                {doc && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setPreviewDoc(doc);
                                        setShowPreviewModal(true);
                                      }}
                                    >
                                      <Eye className="w-4 h-4 mr-2" />
                                      View
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => viewDocumentHistory(item.id)}
                                    >
                                      <History className="w-4 h-4 mr-2" />
                                      History
                                    </Button>
                                  </>
                                )}
                                
                                <Label htmlFor={`upload-${item.id}`} className="cursor-pointer">
                                  <Button
                                    variant={doc ? "outline" : "default"}
                                    size="sm"
                                    className="w-full"
                                    asChild
                                  >
                                    <div>
                                      <Upload className="w-4 h-4 mr-2" />
                                      {doc ? 'Replace' : 'Upload'}
                                    </div>
                                  </Button>
                                </Label>
                                <Input
                                  id={`upload-${item.id}`}
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  className="hidden"
                                  onChange={(e) => handleFileSelect(e, item.id, category)}
                                  disabled={uploading[item.id]}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {!uploadForm.file ? (
              <DocumentUploadZone
                onFileSelect={(file) => setUploadForm({ ...uploadForm, file })}
                maxSize={10}
              />
            ) : (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">{uploadForm.file.name}</p>
                      <p className="text-sm text-green-700">
                        {(uploadForm.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUploadForm({ ...uploadForm, file: null })}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Change
                  </Button>
                </div>
              </div>
            )}

            <div>
              <Label>Document Number (Optional)</Label>
              <Input
                placeholder="e.g., License number, Policy number"
                value={uploadForm.document_number}
                onChange={(e) => setUploadForm({ ...uploadForm, document_number: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Issue Date (Optional)</Label>
                <Input
                  type="date"
                  value={uploadForm.issue_date}
                  onChange={(e) => setUploadForm({ ...uploadForm, issue_date: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Expiry Date (Optional)</Label>
                <Input
                  type="date"
                  value={uploadForm.expiry_date}
                  onChange={(e) => setUploadForm({ ...uploadForm, expiry_date: e.target.value })}
                  className="mt-1"
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
            </div>

            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Add any additional information..."
                value={uploadForm.notes}
                onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                rows={3}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUploadDocument} disabled={uploading[uploadForm.document_type]}>
              {uploading[uploadForm.document_type] ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <FileUp className="w-4 h-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Document History</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {documentHistory.length > 0 ? (
              documentHistory.map((doc, index) => {
                const StatusIcon = STATUS_CONFIG[doc.status].icon;
                
                return (
                  <Card key={doc.id} className={!doc.is_current_version ? 'opacity-60' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${STATUS_CONFIG[doc.status].color}`}>
                            <StatusIcon className="w-5 h-5" />
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">Version {doc.version}</span>
                              {doc.is_current_version && (
                                <Badge className="bg-blue-600 text-white text-xs">Current</Badge>
                              )}
                              <Badge className={STATUS_CONFIG[doc.status].color}>
                                {STATUS_CONFIG[doc.status].label}
                              </Badge>
                            </div>
                            
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>Uploaded: {format(new Date(doc.created_date), 'MMM d, yyyy h:mm a')}</p>
                              {doc.reviewed_at && (
                                <p>Reviewed: {format(new Date(doc.reviewed_at), 'MMM d, yyyy h:mm a')}</p>
                              )}
                              {doc.expiry_date && (
                                <p>Expires: {format(parseISO(doc.expiry_date), 'MMM d, yyyy')}</p>
                              )}
                              {doc.rejection_reason && (
                                <p className="text-red-600">Reason: {doc.rejection_reason}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(doc.file_url, '_blank')}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-8">
                <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No document history found</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowHistoryDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        document={previewDoc}
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setPreviewDoc(null);
        }}
      />
    </div>
  );
}
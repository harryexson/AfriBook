import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Eye,
  Search,
  Filter,
  AlertTriangle,
  User,
  Calendar,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { format, parseISO, differenceInDays } from 'date-fns';
import { motion } from 'framer-motion';

const DOCUMENT_TYPE_LABELS = {
  drivers_license: "Driver's License",
  vehicle_registration: 'Vehicle Registration',
  vehicle_insurance: 'Vehicle Insurance',
  vehicle_inspection: 'Vehicle Inspection',
  commercial_permit: 'Commercial Permit',
  background_check: 'Background Check',
  medical_certificate: 'Medical Certificate',
  vehicle_photos: 'Vehicle Photos'
};

const STATUS_CONFIG = {
  pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
  approved: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2 },
  rejected: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
  expired: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: AlertTriangle },
  expiring_soon: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertTriangle }
};

export default function AdminDocumentReview() {
  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [drivers, setDrivers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDocType, setFilterDocType] = useState('all');
  const [isReviewing, setIsReviewing] = useState(false);
  
  const [reviewForm, setReviewForm] = useState({
    action: '',
    rejection_reason: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.internal_role !== 'admin')) {
        toast.error('Unauthorized access');
        return;
      }
      setUser(currentUser);

      // Build filter based on active tab
      let filter = { is_current_version: true };
      
      if (activeTab === 'pending') {
        filter.status = 'pending';
      } else if (activeTab === 'approved') {
        filter.status = 'approved';
      } else if (activeTab === 'rejected') {
        filter.status = 'rejected';
      } else if (activeTab === 'expiring') {
        filter.status = { $in: ['expiring_soon', 'expired'] };
      }

      const docs = await base44.entities.DriverDocument.filter(filter, '-created_date', 100);
      setDocuments(docs);

      // Load driver information
      const driverIds = [...new Set(docs.map(d => d.driver_id))];
      const driverData = {};
      
      for (const driverId of driverIds) {
        try {
          const driver = await base44.entities.User.get(driverId);
          driverData[driverId] = driver;
        } catch (error) {
          console.error(`Failed to load driver ${driverId}:`, error);
        }
      }
      
      setDrivers(driverData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewDocument = (doc) => {
    setSelectedDoc(doc);
    setReviewForm({
      action: '',
      rejection_reason: '',
      notes: ''
    });
    setShowReviewDialog(true);
  };

  const submitReview = async () => {
    if (!reviewForm.action) {
      toast.error('Please select an action');
      return;
    }

    if (reviewForm.action === 'reject' && !reviewForm.rejection_reason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setIsReviewing(true);

    try {
      const updateData = {
        status: reviewForm.action === 'approve' ? 'approved' : 'rejected',
        review_status: 'reviewed',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString()
      };

      if (reviewForm.action === 'reject') {
        updateData.rejection_reason = reviewForm.rejection_reason;
      }

      if (reviewForm.notes) {
        updateData.notes = reviewForm.notes;
      }

      await base44.entities.DriverDocument.update(selectedDoc.id, updateData);

      // Send notification to driver
      const driver = drivers[selectedDoc.driver_id];
      if (driver) {
        const action = reviewForm.action === 'approve' ? 'approved' : 'rejected';
        const docName = DOCUMENT_TYPE_LABELS[selectedDoc.document_type];
        
        await base44.integrations.Core.SendEmail({
          to: driver.email,
          subject: `Document ${action.charAt(0).toUpperCase() + action.slice(1)}: ${docName}`,
          body: `Hi ${driver.full_name},\n\nYour ${docName} has been ${action}.\n\n${
            reviewForm.action === 'reject' 
              ? `Reason: ${reviewForm.rejection_reason}\n\nPlease upload a corrected document.`
              : 'You are one step closer to driving with Ride-ly!'
          }\n\nBest regards,\nRide-ly Team`
        });
      }

      toast.success(`Document ${reviewForm.action}d successfully`);
      setShowReviewDialog(false);
      loadData();
    } catch (error) {
      console.error('Error reviewing document:', error);
      toast.error('Failed to submit review');
    } finally {
      setIsReviewing(false);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const driver = drivers[doc.driver_id];
    const matchesSearch = !searchQuery || 
      driver?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.document_number?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterDocType === 'all' || doc.document_type === filterDocType;
    
    return matchesSearch && matchesType;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-gray-500" />
      </div>
    );
  }

  const pendingCount = documents.filter(d => d.status === 'pending').length;
  const approvedCount = documents.filter(d => d.status === 'approved').length;
  const rejectedCount = documents.filter(d => d.status === 'rejected').length;
  const expiringCount = documents.filter(d => d.status === 'expiring_soon' || d.status === 'expired').length;

  return (
    <div className="p-4 lg:p-8 bg-gradient-to-br from-gray-50 to-purple-50 min-h-screen">
      <Toaster richColors />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Document Review</h1>
          <p className="text-gray-600 mt-2">Review and approve driver documents</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pending Review</p>
                  <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
                </div>
                <Clock className="w-12 h-12 text-yellow-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Approved</p>
                  <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
                </div>
                <CheckCircle2 className="w-12 h-12 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Rejected</p>
                  <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
                </div>
                <XCircle className="w-12 h-12 text-red-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Expiring/Expired</p>
                  <p className="text-3xl font-bold text-orange-600">{expiringCount}</p>
                </div>
                <AlertTriangle className="w-12 h-12 text-orange-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by driver name, email, or document number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterDocType} onValueChange={setFilterDocType}>
                <SelectTrigger className="w-full lg:w-64">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Document Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Document List */}
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5 mb-6">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">
                  Pending {pendingCount > 0 && `(${pendingCount})`}
                </TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
                <TabsTrigger value="expiring">
                  Expiring {expiringCount > 0 && `(${expiringCount})`}
                </TabsTrigger>
              </TabsList>

              <div className="space-y-4">
                {filteredDocuments.length > 0 ? (
                  filteredDocuments.map((doc) => {
                    const driver = drivers[doc.driver_id];
                    const StatusIcon = STATUS_CONFIG[doc.status].icon;
                    const daysUntilExpiry = doc.expiry_date 
                      ? differenceInDays(parseISO(doc.expiry_date), new Date())
                      : null;

                    return (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Card className="hover:shadow-lg transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-4 flex-1">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center border-2 ${STATUS_CONFIG[doc.status].color}`}>
                                  <StatusIcon className="w-6 h-6" />
                                </div>
                                
                                <div className="flex-1">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <h3 className="font-semibold text-lg">
                                        {DOCUMENT_TYPE_LABELS[doc.document_type]}
                                      </h3>
                                      <div className="flex items-center gap-2 mt-1">
                                        <User className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm text-gray-600">
                                          {driver?.full_name || 'Loading...'}
                                        </span>
                                        <span className="text-sm text-gray-400">•</span>
                                        <span className="text-sm text-gray-600">{driver?.email}</span>
                                      </div>
                                    </div>
                                    <Badge className={STATUS_CONFIG[doc.status].color}>
                                      {doc.status.replace('_', ' ').toUpperCase()}
                                    </Badge>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                                    {doc.document_number && (
                                      <div>
                                        <span className="text-gray-500">Number:</span> {doc.document_number}
                                      </div>
                                    )}
                                    <div>
                                      <span className="text-gray-500">Version:</span> {doc.version}
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Uploaded:</span>{' '}
                                      {format(new Date(doc.created_date), 'MMM d, yyyy')}
                                    </div>
                                    {doc.expiry_date && (
                                      <div className={daysUntilExpiry !== null && daysUntilExpiry < 30 ? 'text-orange-600 font-medium' : ''}>
                                        <Calendar className="w-4 h-4 inline mr-1" />
                                        Expires: {format(parseISO(doc.expiry_date), 'MMM d, yyyy')}
                                        {daysUntilExpiry !== null && daysUntilExpiry < 30 && (
                                          <span className="ml-1">
                                            ({daysUntilExpiry < 0 ? 'Expired' : `${daysUntilExpiry} days left`})
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {doc.rejection_reason && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                      <p className="text-sm font-medium text-red-900">Previous Rejection:</p>
                                      <p className="text-sm text-red-800">{doc.rejection_reason}</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col gap-2 ml-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(doc.file_url, '_blank')}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View
                                </Button>
                                {doc.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleReviewDocument(doc)}
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Review
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                    <p className="text-gray-500">
                      {searchQuery || filterDocType !== 'all'
                        ? 'Try adjusting your filters'
                        : 'No documents to review at this time'}
                    </p>
                  </div>
                )}
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Document</DialogTitle>
          </DialogHeader>

          {selectedDoc && (
            <div className="space-y-4">
              {/* Document Preview */}
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Document Type:</span>
                      <p className="font-medium">{DOCUMENT_TYPE_LABELS[selectedDoc.document_type]}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Driver:</span>
                      <p className="font-medium">{drivers[selectedDoc.driver_id]?.full_name}</p>
                    </div>
                    {selectedDoc.document_number && (
                      <div>
                        <span className="text-gray-500">Document Number:</span>
                        <p className="font-medium">{selectedDoc.document_number}</p>
                      </div>
                    )}
                    {selectedDoc.expiry_date && (
                      <div>
                        <span className="text-gray-500">Expiry Date:</span>
                        <p className="font-medium">{format(parseISO(selectedDoc.expiry_date), 'MMM d, yyyy')}</p>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => window.open(selectedDoc.file_url, '_blank')}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Document in New Tab
                  </Button>
                </CardContent>
              </Card>

              {/* Review Form */}
              <div>
                <Label>Decision *</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <Button
                    variant={reviewForm.action === 'approve' ? 'default' : 'outline'}
                    onClick={() => setReviewForm({ ...reviewForm, action: 'approve' })}
                    className={reviewForm.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant={reviewForm.action === 'reject' ? 'default' : 'outline'}
                    onClick={() => setReviewForm({ ...reviewForm, action: 'reject' })}
                    className={reviewForm.action === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>

              {reviewForm.action === 'reject' && (
                <div>
                  <Label>Rejection Reason *</Label>
                  <Textarea
                    placeholder="Please provide a clear reason for rejection..."
                    value={reviewForm.rejection_reason}
                    onChange={(e) => setReviewForm({ ...reviewForm, rejection_reason: e.target.value })}
                    rows={3}
                    className="mt-2"
                  />
                </div>
              )}

              <div>
                <Label>Additional Notes (Optional)</Label>
                <Textarea
                  placeholder="Add any additional notes or comments..."
                  value={reviewForm.notes}
                  onChange={(e) => setReviewForm({ ...reviewForm, notes: e.target.value })}
                  rows={3}
                  className="mt-2"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={submitReview} 
              disabled={isReviewing || !reviewForm.action}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isReviewing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Review'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
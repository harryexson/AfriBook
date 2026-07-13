import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  CheckCircle2, 
  Upload, 
  User as UserIcon,
  Car,
  CreditCard,
  BookOpen,
  FileText,
  Camera,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Info,
  Shield,
  DollarSign,
  Clock,
  Star,
  Phone,
  MapPin,
  TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { useNavigate } from "react-router-dom";
import CheckrBackgroundCheckForm from '../components/driver/CheckrBackgroundCheckForm';
import ReferralCodeInput from '../components/driver/ReferralCodeInput';

const ONBOARDING_STEPS = [
  { id: 0, title: 'Welcome', icon: Sparkles, description: 'Get started as a driver' },
  { id: 1, title: 'Documents', icon: FileText, description: 'Upload required documents' },
  { id: 2, title: 'Vehicle Info', icon: Car, description: 'Tell us about your vehicle' },
  { id: 3, title: 'Profile', icon: UserIcon, description: 'Create your driver profile' },
  { id: 4, title: 'Payout Setup', icon: CreditCard, description: 'Set up your earnings' },
  { id: 5, title: 'Responsibilities', icon: Shield, description: 'Understand your role' },
  { id: 6, title: 'App Tutorial', icon: BookOpen, description: 'Learn how to use the app' },
  { id: 7, title: 'Final Review', icon: CheckCircle2, description: 'Complete onboarding' }
];

const REQUIRED_DOCUMENTS = [
  { 
    id: 'drivers_license', 
    name: "Driver's License", 
    category: 'identity', 
    required: true,
    description: 'Valid government-issued driver\'s license',
    tips: ['Must be current and not expired', 'Clear photo of both sides', 'All text must be readable']
  },
  { 
    id: 'vehicle_registration', 
    name: 'Vehicle Registration', 
    category: 'vehicle', 
    required: true,
    description: 'Current vehicle registration certificate',
    tips: ['Must match your vehicle details', 'Registration must be current', 'Owner name should match']
  },
  { 
    id: 'vehicle_insurance', 
    name: 'Vehicle Insurance', 
    category: 'vehicle', 
    required: true,
    description: 'Proof of vehicle insurance coverage',
    tips: ['Must have at least minimum coverage', 'Policy must be active', 'Include all pages']
  },
  { 
    id: 'background_check', 
    name: 'Background Check Authorization', 
    category: 'identity', 
    required: true,
    description: 'Authorization for background screening',
    tips: ['Sign the consent form', 'Provide accurate information', 'Processing takes 3-5 days']
  }
];

const VEHICLE_CLASSES = [
  { 
    id: 'RideShare', 
    name: 'RideShare', 
    description: 'Standard vehicle, 4 passengers', 
    capacity: 4,
    requirements: ['4-door sedan or similar', '2010 or newer', 'Good condition'],
    earning: '$15-25/hour'
  },
  { 
    id: 'Comfort', 
    name: 'Comfort', 
    description: 'Newer, higher-rated vehicle', 
    capacity: 4,
    requirements: ['Luxury sedan or premium SUV', '2015 or newer', 'Leather seats'],
    earning: '$20-35/hour'
  },
  { 
    id: 'RideShare XL', 
    name: 'RideShare XL', 
    description: 'SUV or van, 6+ passengers', 
    capacity: 6,
    requirements: ['SUV or minivan', '2012 or newer', '6+ passenger seats'],
    earning: '$18-30/hour'
  },
  { 
    id: 'Premium', 
    name: 'Premium', 
    description: 'Luxury vehicle', 
    capacity: 4,
    requirements: ['High-end luxury vehicle', '2018 or newer', 'Top condition'],
    earning: '$25-45/hour'
  }
];

const RESPONSIBILITIES = [
  {
    title: 'Safety First',
    icon: Shield,
    items: [
      'Always follow traffic laws and drive safely',
      'Maintain your vehicle in excellent condition',
      'Ensure passengers wear seatbelts',
      'Never drive under the influence',
      'Report any safety concerns immediately'
    ]
  },
  {
    title: 'Professional Service',
    icon: Star,
    items: [
      'Be courteous and respectful to all riders',
      'Maintain a clean vehicle interior and exterior',
      'Arrive on time for pickups',
      'Follow rider preferences when possible',
      'Communicate clearly and professionally'
    ]
  },
  {
    title: 'App Guidelines',
    icon: Phone,
    items: [
      'Keep the app open when available',
      'Accept or decline requests promptly',
      'Update your location regularly',
      'End trips only when complete',
      'Report any app issues or bugs'
    ]
  }
];

const APP_FEATURES = [
  {
    title: 'Accepting Rides',
    icon: Car,
    steps: [
      '1. Go online by toggling your status',
      '2. Receive ride requests with pickup location',
      '3. You have 15 seconds to accept or decline',
      '4. Navigate to pickup using in-app directions',
      '5. Confirm passenger identity before starting'
    ]
  },
  {
    title: 'During the Trip',
    icon: MapPin,
    steps: [
      '1. Start the trip when passenger is in the car',
      '2. Follow GPS navigation to destination',
      '3. Communicate with rider via in-app chat',
      '4. Adjust route if requested by rider',
      '5. End trip when you arrive at destination'
    ]
  },
  {
    title: 'Earnings & Payouts',
    icon: DollarSign,
    steps: [
      '1. Track earnings in real-time on dashboard',
      '2. View detailed breakdown of each trip',
      '3. Request instant payout anytime (small fee)',
      '4. Automatic weekly deposits to your account',
      '5. Access earnings history and reports'
    ]
  },
  {
    title: 'Maximizing Income',
    icon: TrendingUp,
    steps: [
      '1. Drive during peak hours for surge pricing',
      '2. Schedule shifts in high-demand areas',
      '3. Maintain high ratings for priority access',
      '4. Accept consecutive rides for bonuses',
      '5. Complete challenges for extra earnings'
    ]
  }
];

export default function DriverOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Step 1: Documents
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [docData, setDocData] = useState({});
  
  // Step 2: Vehicle Info
  const [vehicleInfo, setVehicleInfo] = useState({
    vehicle_make: '',
    vehicle_model: '',
    vehicle_year: new Date().getFullYear(),
    vehicle_color: '',
    license_plate: '',
    vehicle_class: 'RideShare',
    vehicle_capacity: 4
  });
  const [vehiclePhoto, setVehiclePhoto] = useState(null);
  const [vehiclePhotoPreview, setVehiclePhotoPreview] = useState(null);
  
  // Step 3: Profile
  const [profileInfo, setProfileInfo] = useState({
    full_name: '',
    phone: '',
    bio: '',
    profile_photo: null
  });
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  
  // Step 4: Payout Setup
  const [payoutInfo, setPayoutInfo] = useState({
    account_type: 'debit_card',
    account_holder_name: '',
    account_number: '',
    routing_number: '',
    bank_name: ''
  });
  
  // Step 5 & 6: Responsibilities & Tutorial (acknowledgment)
  const [responsibilitiesAcknowledged, setResponsibilitiesAcknowledged] = useState(false);
  const [tutorialComplete, setTutorialComplete] = useState(false);
  
  // Referral code
  const [referralCodeApplied, setReferralCodeApplied] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      // Pre-fill profile info
      setProfileInfo({
        full_name: currentUser.full_name || '',
        phone: currentUser.phone || '',
        bio: currentUser.driver_info?.bio || '',
        profile_photo: currentUser.profile_photo || null
      });
      
      if (currentUser.profile_photo) {
        setProfilePhotoPreview(currentUser.profile_photo);
      }
      
      // Pre-fill vehicle info if exists
      if (currentUser.driver_info) {
        setVehicleInfo({
          vehicle_make: currentUser.driver_info.vehicle_make || '',
          vehicle_model: currentUser.driver_info.vehicle_model || '',
          vehicle_year: currentUser.driver_info.vehicle_year || new Date().getFullYear(),
          vehicle_color: currentUser.driver_info.vehicle_color || '',
          license_plate: currentUser.driver_info.license_plate || '',
          vehicle_class: currentUser.driver_info.vehicle_class || 'RideShare',
          vehicle_capacity: currentUser.driver_info.vehicle_capacity || 4
        });
        if (currentUser.driver_info.vehicle_photo) {
          setVehiclePhotoPreview(currentUser.driver_info.vehicle_photo);
        }
      }
      
      // Pre-fill payout info
      if (currentUser.driver_info?.payout_method) {
        setPayoutInfo({
          account_type: currentUser.driver_info.payout_method.type || 'debit_card',
          account_holder_name: currentUser.driver_info.payout_method.account_holder_name || '',
          account_number: '',
          routing_number: '',
          bank_name: ''
        });
      }
      
      // Load existing documents
      const docs = await base44.entities.DriverDocument.filter({
        driver_id: currentUser.id,
        is_current_version: true
      });
      
      const docsMap = {};
      docs.forEach(doc => {
        docsMap[doc.document_type] = doc;
      });
      setUploadedDocs(docsMap);
      
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentUpload = async (docType, file) => {
    if (!file) return;

    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a PDF or image file (JPG, PNG)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploadingDoc(docType);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const docInfo = docData[docType] || {};
      const existing = uploadedDocs[docType];
      
      const docRecord = await base44.entities.DriverDocument.create({
        driver_id: user.id,
        document_type: docType,
        document_category: REQUIRED_DOCUMENTS.find(d => d.id === docType).category,
        file_url: file_url,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        document_number: docInfo.number || '',
        expiry_date: docInfo.expiry || null,
        notes: docInfo.notes || '',
        status: 'pending',
        review_status: 'not_reviewed',
        version: existing ? existing.version + 1 : 1,
        previous_version_id: existing ? existing.id : null,
        is_current_version: true
      });

      if (existing) {
        await base44.entities.DriverDocument.update(existing.id, {
          is_current_version: false
        });
      }

      setUploadedDocs(prev => ({
        ...prev,
        [docType]: docRecord
      }));

      toast.success(`${REQUIRED_DOCUMENTS.find(d => d.id === docType).name} uploaded successfully!`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document. Please try again.');
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleVehiclePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setVehiclePhoto(file);
    const preview = URL.createObjectURL(file);
    setVehiclePhotoPreview(preview);
  };

  const handleProfilePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const preview = URL.createObjectURL(file);
    setProfilePhotoPreview(preview);
    setProfileInfo(prev => ({ ...prev, profile_photo: file }));
  };

  const canProceed = (step) => {
    switch (step) {
      case 0: return true; // Welcome
      case 1: // Documents
        return REQUIRED_DOCUMENTS
          .filter(doc => doc.required)
          .every(doc => uploadedDocs[doc.id]);
      case 2: // Vehicle
        return vehicleInfo.vehicle_make && 
               vehicleInfo.vehicle_model && 
               vehicleInfo.vehicle_year && 
               vehicleInfo.license_plate;
      case 3: // Profile
        return profileInfo.full_name && profileInfo.phone;
      case 4: // Payout
        return payoutInfo.account_holder_name && 
               ((payoutInfo.account_type === 'debit_card' && payoutInfo.account_number) ||
                (payoutInfo.account_type === 'bank_transfer' && payoutInfo.routing_number && payoutInfo.account_number));
      case 5: // Responsibilities
        return responsibilitiesAcknowledged;
      case 6: // Tutorial
        return tutorialComplete;
      case 7: return true; // Final review
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (!canProceed(currentStep)) {
      toast.error('Please complete all required fields before continuing');
      return;
    }

    // Save data at certain steps
    if (currentStep === 2) {
      const saved = await saveVehicleInfo();
      if (!saved) return;
    } else if (currentStep === 3) {
      const saved = await saveProfile();
      if (!saved) return;
    } else if (currentStep === 4) {
      const saved = await savePayoutInfo();
      if (!saved) return;
    }

    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      await completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const saveVehicleInfo = async () => {
    setIsSaving(true);
    try {
      let vehiclePhotoUrl = null;
      
      if (vehiclePhoto) {
        try {
          const { file_url } = await base44.integrations.Core.UploadFile({ file: vehiclePhoto });
          vehiclePhotoUrl = file_url;
        } catch (uploadError) {
          console.error('Error uploading vehicle photo:', uploadError);
        }
      }

      const currentDriverInfo = user.driver_info || {};
      const existingPhoto = currentDriverInfo.vehicle_photo || null;

      const updatedDriverInfo = {
        ...currentDriverInfo,
        ...vehicleInfo,
        vehicle_photo: vehiclePhotoUrl || existingPhoto,
        is_available: false,
        onboarding_completed: false
      };

      await base44.auth.updateMe({
        driver_info: updatedDriverInfo
      });

      const refreshedUser = await base44.auth.me();
      setUser(refreshedUser);

      toast.success('Vehicle information saved!');
      return true;
    } catch (error) {
      console.error('Error saving vehicle info:', error);
      toast.error(`Failed to save vehicle information: ${error.message || 'Please try again'}`);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      let profilePhotoUrl = user.profile_photo;
      
      if (profileInfo.profile_photo && typeof profileInfo.profile_photo !== 'string') {
        try {
          const { file_url } = await base44.integrations.Core.UploadFile({ file: profileInfo.profile_photo });
          profilePhotoUrl = file_url;
        } catch (uploadError) {
          console.error('Error uploading profile photo:', uploadError);
        }
      }

      const currentDriverInfo = user.driver_info || {};

      await base44.auth.updateMe({
        full_name: profileInfo.full_name,
        phone: profileInfo.phone,
        profile_photo: profilePhotoUrl,
        driver_info: {
          ...currentDriverInfo,
          bio: profileInfo.bio
        }
      });

      const refreshedUser = await base44.auth.me();
      setUser(refreshedUser);

      toast.success('Profile saved!');
      return true;
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error(`Failed to save profile: ${error.message || 'Please try again'}`);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const savePayoutInfo = async () => {
    setIsSaving(true);
    try {
      const currentDriverInfo = user.driver_info || {};
      
      const payoutMethod = {
        type: payoutInfo.account_type,
        account_details: payoutInfo.account_type === 'debit_card' 
          ? `****${payoutInfo.account_number.slice(-4)}`
          : `${payoutInfo.bank_name} ****${payoutInfo.account_number.slice(-4)}`,
        account_holder_name: payoutInfo.account_holder_name,
        is_verified: false
      };

      await base44.auth.updateMe({
        driver_info: {
          ...currentDriverInfo,
          payout_method: payoutMethod
        }
      });

      const refreshedUser = await base44.auth.me();
      setUser(refreshedUser);

      toast.success('Payout information saved!');
      return true;
    } catch (error) {
      console.error('Error saving payout info:', error);
      toast.error(`Failed to save payout information: ${error.message || 'Please try again'}`);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const completeOnboarding = async () => {
    setIsSaving(true);
    try {
      const currentDriverInfo = user.driver_info || {};

      await base44.auth.updateMe({
        user_type: user.user_type === 'rider' ? 'both' : 'driver',
        driver_info: {
          ...currentDriverInfo,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString()
        }
      });

      toast.success('🎉 Onboarding complete! Welcome to Ride-ly!');
      
      setTimeout(() => {
        navigate(createPageUrl('DriverDashboard'));
      }, 2000);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error(`Failed to complete onboarding: ${error.message || 'Please try again'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Welcome
        return (
          <div className="space-y-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.8 }}
            >
              <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Sparkles className="w-16 h-16 text-white" />
              </div>
            </motion.div>

            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Ride-ly!</h2>
              <p className="text-xl text-gray-600 mb-8">Start your journey as a driver partner</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                  <DollarSign className="w-12 h-12 text-blue-600 mb-4" />
                  <h3 className="font-bold text-lg mb-2">Earn on Your Schedule</h3>
                  <p className="text-sm text-gray-600">Drive when you want, earn what you deserve. Average $20-35/hour.</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200 bg-green-50">
                <CardContent className="p-6">
                  <Clock className="w-12 h-12 text-green-600 mb-4" />
                  <h3 className="font-bold text-lg mb-2">Flexible Hours</h3>
                  <p className="text-sm text-gray-600">Work full-time or part-time. You're in control of your schedule.</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-200 bg-purple-50">
                <CardContent className="p-6">
                  <Star className="w-12 h-12 text-purple-600 mb-4" />
                  <h3 className="font-bold text-lg mb-2">Build Your Rating</h3>
                  <p className="text-sm text-gray-600">Provide great service, earn high ratings, get priority access to rides.</p>
                </CardContent>
              </Card>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-4">What's Next?</h3>
              <p className="text-lg mb-6">Complete 7 simple steps to start earning:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {ONBOARDING_STEPS.filter(s => s.id > 0).map((step) => (
                  <div key={step.id} className="bg-white/20 rounded-lg p-3">
                    <step.icon className="w-6 h-6 mb-2 mx-auto" />
                    <p className="font-semibold">{step.title}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-left bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <Info className="w-6 h-6 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-yellow-900 mb-2">Before You Start</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>✓ Have your driver's license ready</li>
                    <li>✓ Prepare vehicle registration and insurance documents</li>
                    <li>✓ Ensure your vehicle meets requirements (2010 or newer)</li>
                    <li>✓ Have your banking information for payouts</li>
                    <li>✓ Allocate 15-20 minutes to complete the process</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 1: // Documents
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <FileText className="w-16 h-16 mx-auto mb-4 text-blue-600" />
              <h2 className="text-2xl font-bold mb-2">Upload Required Documents</h2>
              <p className="text-gray-600">We need to verify your documents before you can start driving</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Document Guidelines</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>All documents must be current and not expired</li>
                    <li>Upload clear, readable photos or scans</li>
                    <li>Documents are typically reviewed within 24-48 hours</li>
                    <li>You'll receive email notifications about approval status</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {REQUIRED_DOCUMENTS.map((doc) => {
                const uploaded = uploadedDocs[doc.id];
                const isUploading = uploadingDoc === doc.id;

                return (
                  <Card key={doc.id} className={`${uploaded ? 'border-green-200 bg-green-50' : 'border-gray-200'} transition-all`}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          uploaded ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          {uploaded ? (
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                          ) : (
                            <FileText className="w-6 h-6 text-gray-400" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{doc.name}</h3>
                            {doc.required && <Badge variant="outline" className="text-xs">Required</Badge>}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3">{doc.description}</p>

                          {!uploaded && (
                            <>
                              <div className="bg-white rounded-lg p-3 mb-3 text-xs text-gray-600">
                                <p className="font-semibold mb-1">📋 Tips:</p>
                                <ul className="list-disc list-inside space-y-1">
                                  {doc.tips.map((tip, idx) => (
                                    <li key={idx}>{tip}</li>
                                  ))}
                                </ul>
                              </div>

                              <div className="grid grid-cols-2 gap-2 mb-3">
                                <Input
                                  placeholder="Document #"
                                  value={docData[doc.id]?.number || ''}
                                  onChange={(e) => setDocData(prev => ({
                                    ...prev,
                                    [doc.id]: { ...prev[doc.id], number: e.target.value }
                                  }))}
                                  className="text-sm"
                                />
                                <Input
                                  type="date"
                                  placeholder="Expiry Date"
                                  value={docData[doc.id]?.expiry || ''}
                                  onChange={(e) => setDocData(prev => ({
                                    ...prev,
                                    [doc.id]: { ...prev[doc.id], expiry: e.target.value }
                                  }))}
                                  className="text-sm"
                                />
                              </div>
                              
                              <Label htmlFor={`upload-${doc.id}`} className="cursor-pointer">
                                <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                                  isUploading ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                                }`}>
                                  {isUploading ? (
                                    <>
                                      <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin text-blue-600" />
                                      <p className="text-sm font-medium text-blue-600">Uploading...</p>
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                                      <p className="text-sm font-medium">Click to upload</p>
                                      <p className="text-xs text-gray-500">PDF, JPG, or PNG (max 10MB)</p>
                                    </>
                                  )}
                                </div>
                              </Label>
                              <Input
                                id={`upload-${doc.id}`}
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="hidden"
                                onChange={(e) => handleDocumentUpload(doc.id, e.target.files[0])}
                                disabled={isUploading}
                              />
                            </>
                          )}

                          {uploaded && (
                            <div className="space-y-2">
                              <Badge className="bg-green-100 text-green-800">
                                ✓ Uploaded Successfully
                              </Badge>
                              <p className="text-xs text-gray-500">{uploaded.file_name}</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(uploaded.file_url, '_blank')}
                                className="text-xs"
                              >
                                <FileText className="w-3 h-3 mr-1" />
                                View Document
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 2: // Vehicle Info
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Car className="w-16 h-16 mx-auto mb-4 text-blue-600" />
              <h2 className="text-2xl font-bold mb-2">Vehicle Information</h2>
              <p className="text-gray-600">Tell us about the vehicle you'll be driving</p>
            </div>

            {/* Vehicle Class Selection */}
            <div className="mb-6">
              <Label className="text-lg font-semibold mb-4 block">Select Vehicle Class</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {VEHICLE_CLASSES.map((vc) => (
                  <Card 
                    key={vc.id}
                    className={`cursor-pointer transition-all ${
                      vehicleInfo.vehicle_class === vc.id 
                        ? 'border-2 border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => setVehicleInfo(prev => ({
                      ...prev,
                      vehicle_class: vc.id,
                      vehicle_capacity: vc.capacity
                    }))}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-lg">{vc.name}</h3>
                          <p className="text-sm text-gray-600">{vc.description}</p>
                        </div>
                        {vehicleInfo.vehicle_class === vc.id && (
                          <CheckCircle2 className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-2">
                        <p className="text-xs font-semibold text-green-800">💰 {vc.earning}</p>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        {vc.requirements.map((req, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-gray-400" />
                            <span>{req}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Vehicle Make *</Label>
                <Input
                  placeholder="e.g., Toyota"
                  value={vehicleInfo.vehicle_make}
                  onChange={(e) => setVehicleInfo(prev => ({ ...prev, vehicle_make: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Vehicle Model *</Label>
                <Input
                  placeholder="e.g., Camry"
                  value={vehicleInfo.vehicle_model}
                  onChange={(e) => setVehicleInfo(prev => ({ ...prev, vehicle_model: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Year *</Label>
                <Input
                  type="number"
                  placeholder="2020"
                  value={vehicleInfo.vehicle_year}
                  onChange={(e) => setVehicleInfo(prev => ({ ...prev, vehicle_year: parseInt(e.target.value) }))}
                  min="2010"
                  max={new Date().getFullYear() + 1}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Color *</Label>
                <Input
                  placeholder="e.g., Black"
                  value={vehicleInfo.vehicle_color}
                  onChange={(e) => setVehicleInfo(prev => ({ ...prev, vehicle_color: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div className="md:col-span-2">
                <Label>License Plate *</Label>
                <Input
                  placeholder="ABC123"
                  value={vehicleInfo.license_plate}
                  onChange={(e) => setVehicleInfo(prev => ({ ...prev, license_plate: e.target.value.toUpperCase() }))}
                  className="mt-1 uppercase"
                />
              </div>
            </div>

            {/* Vehicle Photo */}
            <div>
              <Label>Vehicle Photo (Recommended)</Label>
              <p className="text-xs text-gray-500 mb-2">Upload a clear photo of your vehicle</p>
              
              {vehiclePhotoPreview ? (
                <div className="relative">
                  <img 
                    src={vehiclePhotoPreview} 
                    alt="Vehicle" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setVehiclePhoto(null);
                      setVehiclePhotoPreview(null);
                    }}
                    className="absolute top-2 right-2"
                  >
                    Change Photo
                  </Button>
                </div>
              ) : (
                <Label htmlFor="vehicle-photo" className="cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors">
                    <Camera className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                    <p className="font-medium text-sm">Click to upload vehicle photo</p>
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG (max 5MB)</p>
                  </div>
                </Label>
              )}
              <Input
                id="vehicle-photo"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleVehiclePhotoUpload}
              />
            </div>
          </div>
        );

      case 3: // Profile
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <UserIcon className="w-16 h-16 mx-auto mb-4 text-purple-600" />
              <h2 className="text-2xl font-bold mb-2">Create Your Profile</h2>
              <p className="text-gray-600">Riders will see this information</p>
            </div>

            {/* Profile Photo */}
            <div>
              <Label>Profile Photo (Recommended)</Label>
              <p className="text-xs text-gray-500 mb-3">A friendly photo helps build trust with riders</p>
              
              <div className="flex items-center gap-6">
                {profilePhotoPreview ? (
                  <div className="relative">
                    <img 
                      src={profilePhotoPreview} 
                      alt="Profile" 
                      className="w-32 h-32 rounded-full object-cover border-4 border-blue-200"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setProfileInfo(prev => ({ ...prev, profile_photo: null }));
                        setProfilePhotoPreview(null);
                      }}
                      className="absolute -bottom-2 -right-2 rounded-full"
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <Label htmlFor="profile-photo" className="cursor-pointer">
                    <div className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors">
                      <Camera className="w-8 h-8 text-gray-400" />
                    </div>
                  </Label>
                )}
                
                <div className="flex-1">
                  <Label htmlFor="profile-photo" className="cursor-pointer">
                    <Button variant="outline" className="w-full" asChild>
                      <div>
                        <Camera className="w-4 h-4 mr-2" />
                        Upload Photo
                      </div>
                    </Button>
                  </Label>
                  <p className="text-xs text-gray-500 mt-2">JPG or PNG (max 5MB)</p>
                  <p className="text-xs text-gray-600 mt-2">💡 Tip: Use a clear, well-lit photo where your face is visible</p>
                </div>
              </div>
              <Input
                id="profile-photo"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePhotoUpload}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Full Name *</Label>
                <Input
                  placeholder="Your full name"
                  value={profileInfo.full_name}
                  onChange={(e) => setProfileInfo(prev => ({ ...prev, full_name: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Phone Number *</Label>
                <Input
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={profileInfo.phone}
                  onChange={(e) => setProfileInfo(prev => ({ ...prev, phone: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Bio (Optional but Recommended)</Label>
              <p className="text-xs text-gray-500 mb-2">Introduce yourself to riders (max 200 characters)</p>
              <Textarea
                placeholder="e.g., Friendly driver with 5 years of experience. Love meeting new people and ensuring safe, comfortable rides!"
                value={profileInfo.bio}
                onChange={(e) => setProfileInfo(prev => ({ ...prev, bio: e.target.value }))}
                rows={4}
                maxLength={200}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                {profileInfo.bio.length}/200 characters
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-purple-800">
                  <p className="font-semibold mb-1">Profile Tips for Higher Ratings</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Use a clear, friendly photo with good lighting</li>
                    <li>Keep your bio professional and welcoming</li>
                    <li>Highlight your experience or unique qualities</li>
                    <li>Mention languages you speak if multilingual</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 4: // Payout Setup
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <CreditCard className="w-16 h-16 mx-auto mb-4 text-green-600" />
              <h2 className="text-2xl font-bold mb-2">Payout Setup</h2>
              <p className="text-gray-600">How would you like to receive your earnings?</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h3 className="font-bold text-green-900 mb-3">💰 Flexible Payout Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800">
                <div>
                  <p className="font-semibold mb-1">⚡ Instant Payout</p>
                  <p className="text-xs">Get paid immediately anytime with debit card ($0.50 fee)</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">📅 Weekly Auto-Deposit</p>
                  <p className="text-xs">Free automatic deposits every Monday to your bank</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Payout Method *</Label>
                <Select
                  value={payoutInfo.account_type}
                  onValueChange={(value) => setPayoutInfo(prev => ({ ...prev, account_type: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debit_card">
                      <div className="flex items-center gap-2">
                        <span>💳 Debit Card</span>
                        <Badge className="bg-blue-100 text-blue-800 text-xs">Instant</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="bank_transfer">
                      <div className="flex items-center gap-2">
                        <span>🏦 Bank Account</span>
                        <Badge className="bg-gray-100 text-gray-800 text-xs">1-3 days</Badge>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Account Holder Name *</Label>
                <Input
                  placeholder="Full name on account"
                  value={payoutInfo.account_holder_name}
                  onChange={(e) => setPayoutInfo(prev => ({ ...prev, account_holder_name: e.target.value }))}
                  className="mt-1"
                />
              </div>

              {payoutInfo.account_type === 'debit_card' ? (
                <div>
                  <Label>Debit Card Number *</Label>
                  <Input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={payoutInfo.account_number}
                    onChange={(e) => setPayoutInfo(prev => ({ 
                      ...prev, 
                      account_number: e.target.value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim()
                    }))}
                    maxLength="19"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ⚡ Instant payouts available with $0.50 fee
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <Label>Bank Name *</Label>
                    <Input
                      placeholder="e.g., Chase Bank"
                      value={payoutInfo.bank_name}
                      onChange={(e) => setPayoutInfo(prev => ({ ...prev, bank_name: e.target.value }))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Routing Number *</Label>
                    <Input
                      placeholder="9 digits"
                      value={payoutInfo.routing_number}
                      onChange={(e) => setPayoutInfo(prev => ({ ...prev, routing_number: e.target.value }))}
                      maxLength="9"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Account Number *</Label>
                    <Input
                      placeholder="Account number"
                      value={payoutInfo.account_number}
                      onChange={(e) => setPayoutInfo(prev => ({ ...prev, account_number: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">🔒 Secure & Encrypted</p>
                  <p className="text-xs">Your banking information is encrypted and stored securely. We never share your details with anyone.</p>
                </div>
              </div>
            </div>

            {/* Checkr Background Check */}
            <CheckrBackgroundCheckForm user={user} onComplete={loadUserData} />
            
            {/* Driver Referral Code Input */}
            <ReferralCodeInput 
              user={user} 
              onApplied={() => {
                setReferralCodeApplied(true);
                loadUserData();
              }} 
            />
          </div>
        );

      case 5: // Responsibilities
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Shield className="w-16 h-16 mx-auto mb-4 text-red-600" />
              <h2 className="text-2xl font-bold mb-2">Driver Responsibilities</h2>
              <p className="text-gray-600">Understanding your role as a driver partner</p>
            </div>

            <div className="space-y-6">
              {RESPONSIBILITIES.map((section, idx) => (
                <Card key={idx} className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <section.icon className="w-6 h-6 text-white" />
                      </div>
                      <span>{section.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {section.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-gradient-to-r from-red-600 to-orange-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={responsibilitiesAcknowledged}
                    onCheckedChange={setResponsibilitiesAcknowledged}
                    className="mt-1 border-white"
                    id="responsibilities-check"
                  />
                  <Label htmlFor="responsibilities-check" className="text-white cursor-pointer">
                    <p className="font-bold text-lg mb-2">I understand and agree to these responsibilities</p>
                    <p className="text-sm opacity-90">
                      By checking this box, I confirm that I have read and understood all driver responsibilities. 
                      I commit to following these guidelines and providing safe, professional service to all riders.
                    </p>
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 6: // App Tutorial
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-orange-600" />
              <h2 className="text-2xl font-bold mb-2">How to Use the App</h2>
              <p className="text-gray-600">Master the basics to start earning quickly</p>
            </div>

            <div className="space-y-6">
              {APP_FEATURES.map((feature, idx) => (
                <Card key={idx} className="border-2 hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50">
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                      <span>{feature.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {feature.steps.map((step, stepIdx) => (
                        <div key={stepIdx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {stepIdx + 1}
                          </div>
                          <p className="text-sm text-gray-700">{step}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
              <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                <Star className="w-6 h-6" />
                Pro Tips for Success
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Keep your phone charged and GPS enabled</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Have phone chargers available for riders</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Keep water bottles and mints in your car</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Greet riders warmly and confirm their name</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Drive safely and follow traffic rules</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Be patient during pickup and dropoff</span>
                </div>
              </div>
            </div>

            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={tutorialComplete}
                    onCheckedChange={setTutorialComplete}
                    className="mt-1 border-white"
                    id="tutorial-check"
                  />
                  <Label htmlFor="tutorial-check" className="text-white cursor-pointer">
                    <p className="font-bold text-lg mb-2">I'm ready to start driving!</p>
                    <p className="text-sm opacity-90">
                      I have reviewed the app features and best practices. I understand how to accept rides, 
                      navigate during trips, manage my earnings, and provide excellent service.
                    </p>
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 7: // Final Review
        return (
          <div className="space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.8 }}
            >
              <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-16 h-16 text-white" />
              </div>
            </motion.div>

            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">You're Almost Ready!</h2>
              <p className="text-xl text-gray-600">Review your information before completing onboarding</p>
            </div>

            <div className="space-y-4">
              {/* Documents Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {REQUIRED_DOCUMENTS.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between">
                        <span className="text-sm">{doc.name}</span>
                        {uploadedDocs[doc.id] ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Uploaded
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-600">Pending</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Vehicle Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="w-5 h-5 text-blue-600" />
                    Vehicle Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Make & Model</p>
                      <p className="font-semibold">{vehicleInfo.vehicle_make} {vehicleInfo.vehicle_model}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Year</p>
                      <p className="font-semibold">{vehicleInfo.vehicle_year}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Color</p>
                      <p className="font-semibold">{vehicleInfo.vehicle_color}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">License Plate</p>
                      <p className="font-semibold">{vehicleInfo.license_plate}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Class</p>
                      <p className="font-semibold">{vehicleInfo.vehicle_class}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Capacity</p>
                      <p className="font-semibold">{vehicleInfo.vehicle_capacity} passengers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Profile Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-blue-600" />
                    Profile
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    {profilePhotoPreview ? (
                      <img src={profilePhotoPreview} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                        <UserIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-lg">{profileInfo.full_name}</p>
                      <p className="text-sm text-gray-600">{profileInfo.phone}</p>
                      {profileInfo.bio && (
                        <p className="text-xs text-gray-500 mt-1 italic">"{profileInfo.bio}"</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payout Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    Payout Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">
                        {payoutInfo.account_type === 'debit_card' ? '💳 Debit Card' : '🏦 Bank Account'}
                      </p>
                      <p className="text-sm text-gray-600">{payoutInfo.account_holder_name}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Configured
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl p-8 text-center">
              <Sparkles className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">What Happens Next?</h3>
              <div className="space-y-3 text-left max-w-md mx-auto">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">Your documents will be reviewed within 24-48 hours</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">You'll receive email notifications about approval status</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">Once approved, you can start accepting rides immediately</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">Access your driver dashboard to go online and start earning</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">Important Notes</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Keep your documents up to date - you'll receive expiry reminders</li>
                    <li>Maintain your vehicle in good condition for safety and ratings</li>
                    <li>Check your email for document review status updates</li>
                    <li>Contact support if you have any questions or issues</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4 md:p-8">
      <Toaster richColors />
      
      <div className="max-w-4xl mx-auto">
        {/* Header with Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Driver Onboarding</h1>
              <p className="text-gray-600 mt-1">Complete your profile to start earning</p>
            </div>
            <Badge className="bg-blue-600 text-white text-lg px-4 py-2">
              Step {currentStep + 1} of {ONBOARDING_STEPS.length}
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="space-y-3">
            <Progress value={progress} className="h-3" />
            
            {/* Step Indicators - Desktop */}
            <div className="hidden md:flex items-center justify-between">
              {ONBOARDING_STEPS.map((step) => {
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;
                const StepIcon = step.icon;

                return (
                  <div key={step.id} className="flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${
                      isCompleted ? 'bg-green-500 text-white' :
                      isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-200' :
                      'bg-gray-200 text-gray-400'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                    </div>
                    <p className={`text-xs font-medium text-center ${
                      isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Current Step Info - Mobile */}
            <div className="md:hidden text-center">
              <p className="text-sm font-medium text-gray-700">
                {ONBOARDING_STEPS[currentStep].title}
              </p>
              <p className="text-xs text-gray-500">
                {ONBOARDING_STEPS[currentStep].description}
              </p>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <Card className="shadow-xl border-2 border-gray-200">
          <CardContent className="p-6 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || isSaving}
            className="min-w-[120px]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed(currentStep) || isSaving}
            className="min-w-[140px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : currentStep === ONBOARDING_STEPS.length - 1 ? (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Complete Onboarding
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Help Text */}
        {!canProceed(currentStep) && currentStep > 0 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-orange-600 flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Please complete all required fields to continue
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
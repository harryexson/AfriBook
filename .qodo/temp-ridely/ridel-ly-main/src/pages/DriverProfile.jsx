import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Car,
  User,
  Star,
  Save,
  Edit,
  X,
  CheckCircle,
  Shield,
  TrendingUp,
  Calendar,
  Phone,
  Mail,
  Camera,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { motion } from 'framer-motion';

const vehicleClasses = [
  { id: 'RideShare', name: 'RideShare', description: 'Standard vehicle, 4 passengers', capacity: 4 },
  { id: 'Comfort', name: 'Comfort', description: 'Newer, higher-rated vehicle', capacity: 4 },
  { id: 'RideShare XL', name: 'RideShare XL', description: 'SUV or van, 6+ passengers', capacity: 6 },
  { id: 'Premium', name: 'Premium', description: 'Luxury vehicle', capacity: 4 }
];

export default function DriverProfile() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editedData, setEditedData] = useState({
    personal: {},
    vehicle: {},
    settings: {}
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(null);

  useEffect(() => {
    loadDriverData();
  }, []);

  const loadDriverData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      setEditedData({
        personal: {
          full_name: currentUser.full_name || '',
          phone: currentUser.phone || '',
          email: currentUser.email || ''
        },
        vehicle: {
          vehicle_make: currentUser.driver_info?.vehicle_make || '',
          vehicle_model: currentUser.driver_info?.vehicle_model || '',
          vehicle_year: currentUser.driver_info?.vehicle_year || '',
          vehicle_color: currentUser.driver_info?.vehicle_color || '',
          license_plate: currentUser.driver_info?.license_plate || '',
          vehicle_class: currentUser.driver_info?.vehicle_class || 'RideShare',
          vehicle_capacity: currentUser.driver_info?.vehicle_capacity || 4
        },
        settings: {
          license_number: currentUser.driver_info?.license_number || '',
          license_expiry: currentUser.driver_info?.license_expiry || '',
          insurance_policy: currentUser.driver_info?.insurance_policy || ''
        }
      });
    } catch (error) {
      console.error('Error loading driver data:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await base44.auth.updateMe({
        full_name: editedData.personal.full_name,
        phone: editedData.personal.phone,
        driver_info: {
          ...user.driver_info,
          ...editedData.vehicle,
          ...editedData.settings
        }
      });

      toast.success('Profile updated successfully!');
      setIsEditing(false);
      await loadDriverData();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    loadDriverData();
  };

  const handlePhotoUpload = async (type, file) => {
    if (!file) return;
    
    setUploadingPhoto(type);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      if (type === 'profile') {
        await base44.auth.updateMe({ profile_photo: file_url });
      } else if (type === 'vehicle') {
        await base44.auth.updateMe({
          driver_info: {
            ...user.driver_info,
            vehicle_photo: file_url
          }
        });
      }
      
      toast.success(`${type === 'profile' ? 'Profile' : 'Vehicle'} photo updated!`);
      await loadDriverData();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || user.user_type === 'rider') {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-gray-600">This page is only accessible to drivers.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      <Toaster richColors />
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Driver Profile</h1>
            <p className="text-gray-600 mt-2">Manage your profile and vehicle information</p>
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700">
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>

        {/* Profile & Vehicle Photos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                {/* Profile Photo Section */}
                <div className="flex-1 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-200">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                      {user.profile_photo ? (
                        <img 
                          src={user.profile_photo} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl font-bold text-white">
                          {user.full_name?.charAt(0) || 'D'}
                        </span>
                      )}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handlePhotoUpload('profile', e.target.files[0])}
                        disabled={uploadingPhoto === 'profile'}
                      />
                      {uploadingPhoto === 'profile' ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                      ) : (
                        <Camera className="w-6 h-6 text-white" />
                      )}
                    </label>
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-gray-900">{user.full_name}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{user.average_rating?.toFixed(1) || 'N/A'}</span>
                    <span className="text-gray-500 text-sm">({user.total_rides || 0} trips)</span>
                  </div>
                  <Badge className="mt-2 bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified Driver
                  </Badge>
                </div>

                {/* Vehicle Photo Section */}
                <div className="flex-1 p-6 flex flex-col items-center justify-center bg-gray-50">
                  <div className="relative group w-full max-w-xs">
                    <div className="aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shadow-lg">
                      {user.driver_info?.vehicle_photo ? (
                        <img 
                          src={user.driver_info.vehicle_photo} 
                          alt="Vehicle" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Car className="w-16 h-16 text-gray-400" />
                      )}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handlePhotoUpload('vehicle', e.target.files[0])}
                        disabled={uploadingPhoto === 'vehicle'}
                      />
                      {uploadingPhoto === 'vehicle' ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                      ) : (
                        <div className="text-center text-white">
                          <Upload className="w-6 h-6 mx-auto mb-1" />
                          <span className="text-xs">Upload Vehicle Photo</span>
                        </div>
                      )}
                    </label>
                  </div>
                  {user.driver_info?.vehicle_make && (
                    <div className="text-center mt-4">
                      <p className="font-bold text-gray-900">
                        {user.driver_info.vehicle_color} {user.driver_info.vehicle_make} {user.driver_info.vehicle_model}
                      </p>
                      <p className="text-sm text-gray-500">{user.driver_info.vehicle_year}</p>
                      <Badge className="mt-2 bg-blue-100 text-blue-800 font-mono">
                        {user.driver_info.license_plate || 'No Plate'}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Rating</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <p className="text-3xl font-bold">{user.average_rating?.toFixed(2) || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div>
                <p className="text-green-100 text-sm">Total Trips</p>
                <p className="text-3xl font-bold mt-2">{user.total_rides || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div>
                <p className="text-purple-100 text-sm">Vehicle Class</p>
                <p className="text-xl font-bold mt-2">{user.driver_info?.vehicle_class || 'Not Set'}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div>
                <p className="text-orange-100 text-sm">Account Status</p>
                <div className="flex items-center gap-2 mt-2">
                  <CheckCircle className="w-5 h-5" />
                  <p className="text-xl font-bold">{user.status || 'Active'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Profile Tabs */}
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="vehicle">Vehicle Details</TabsTrigger>
            <TabsTrigger value="settings">Driver Settings</TabsTrigger>
          </TabsList>

          {/* Personal Information */}
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Full Name</Label>
                    {isEditing ? (
                      <Input
                        value={editedData.personal.full_name}
                        onChange={(e) => setEditedData({
                          ...editedData,
                          personal: { ...editedData.personal, full_name: e.target.value }
                        })}
                        className="mt-2"
                      />
                    ) : (
                      <p className="text-gray-900 py-2 font-medium">{user.full_name}</p>
                    )}
                  </div>

                  <div>
                    <Label>Email Address</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-500">{user.email} (cannot be changed)</p>
                    </div>
                  </div>

                  <div>
                    <Label>Phone Number</Label>
                    {isEditing ? (
                      <Input
                        value={editedData.personal.phone}
                        onChange={(e) => setEditedData({
                          ...editedData,
                          personal: { ...editedData.personal, phone: e.target.value }
                        })}
                        className="mt-2"
                      />
                    ) : (
                      <div className="flex items-center gap-2 mt-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <p className="text-gray-900 font-medium">{user.phone || 'Not set'}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Driver Since</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900 font-medium">
                        {new Date(user.created_date).toLocaleDateString('en-US', { 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vehicle Details */}
          <TabsContent value="vehicle">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  Vehicle Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Vehicle Make</Label>
                    {isEditing ? (
                      <Input
                        value={editedData.vehicle.vehicle_make}
                        onChange={(e) => setEditedData({
                          ...editedData,
                          vehicle: { ...editedData.vehicle, vehicle_make: e.target.value }
                        })}
                        placeholder="e.g., Toyota"
                        className="mt-2"
                      />
                    ) : (
                      <p className="text-gray-900 py-2 font-medium">{user.driver_info?.vehicle_make || 'Not set'}</p>
                    )}
                  </div>

                  <div>
                    <Label>Vehicle Model</Label>
                    {isEditing ? (
                      <Input
                        value={editedData.vehicle.vehicle_model}
                        onChange={(e) => setEditedData({
                          ...editedData,
                          vehicle: { ...editedData.vehicle, vehicle_model: e.target.value }
                        })}
                        placeholder="e.g., Camry"
                        className="mt-2"
                      />
                    ) : (
                      <p className="text-gray-900 py-2 font-medium">{user.driver_info?.vehicle_model || 'Not set'}</p>
                    )}
                  </div>

                  <div>
                    <Label>Vehicle Year</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editedData.vehicle.vehicle_year}
                        onChange={(e) => setEditedData({
                          ...editedData,
                          vehicle: { ...editedData.vehicle, vehicle_year: parseInt(e.target.value) }
                        })}
                        placeholder="2020"
                        className="mt-2"
                      />
                    ) : (
                      <p className="text-gray-900 py-2 font-medium">{user.driver_info?.vehicle_year || 'Not set'}</p>
                    )}
                  </div>

                  <div>
                    <Label>Vehicle Color</Label>
                    {isEditing ? (
                      <Input
                        value={editedData.vehicle.vehicle_color}
                        onChange={(e) => setEditedData({
                          ...editedData,
                          vehicle: { ...editedData.vehicle, vehicle_color: e.target.value }
                        })}
                        placeholder="e.g., Black"
                        className="mt-2"
                      />
                    ) : (
                      <p className="text-gray-900 py-2 font-medium">{user.driver_info?.vehicle_color || 'Not set'}</p>
                    )}
                  </div>

                  <div>
                    <Label>License Plate</Label>
                    {isEditing ? (
                      <Input
                        value={editedData.vehicle.license_plate}
                        onChange={(e) => setEditedData({
                          ...editedData,
                          vehicle: { ...editedData.vehicle, license_plate: e.target.value.toUpperCase() }
                        })}
                        placeholder="ABC123"
                        className="mt-2 uppercase"
                      />
                    ) : (
                      <p className="text-gray-900 py-2 font-medium font-mono">{user.driver_info?.license_plate || 'Not set'}</p>
                    )}
                  </div>

                  <div>
                    <Label>Vehicle Class</Label>
                    {isEditing ? (
                      <Select
                        value={editedData.vehicle.vehicle_class}
                        onValueChange={(value) => {
                          const selectedClass = vehicleClasses.find(c => c.id === value);
                          setEditedData({
                            ...editedData,
                            vehicle: { 
                              ...editedData.vehicle, 
                              vehicle_class: value,
                              vehicle_capacity: selectedClass.capacity
                            }
                          });
                        }}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {vehicleClasses.map((vc) => (
                            <SelectItem key={vc.id} value={vc.id}>
                              {vc.name} - {vc.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-gray-900 py-2 font-medium">{user.driver_info?.vehicle_class || 'Not set'}</p>
                    )}
                  </div>

                  <div>
                    <Label>Passenger Capacity</Label>
                    <p className="text-gray-900 py-2 font-medium">{editedData.vehicle.vehicle_capacity || user.driver_info?.vehicle_capacity || 4} passengers</p>
                  </div>
                </div>

                {!isEditing && user.driver_info?.vehicle_make && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                    <h4 className="font-semibold text-blue-900 mb-2">Your Vehicle</h4>
                    <p className="text-blue-800 text-lg">
                      {user.driver_info.vehicle_color} {user.driver_info.vehicle_year} {user.driver_info.vehicle_make} {user.driver_info.vehicle_model}
                    </p>
                    <p className="text-blue-700 text-sm mt-1">License: {user.driver_info.license_plate}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Driver Settings */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  License & Insurance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Driver's License Number</Label>
                    {isEditing ? (
                      <Input
                        value={editedData.settings.license_number}
                        onChange={(e) => setEditedData({
                          ...editedData,
                          settings: { ...editedData.settings, license_number: e.target.value }
                        })}
                        placeholder="DL12345678"
                        className="mt-2"
                      />
                    ) : (
                      <p className="text-gray-900 py-2 font-medium font-mono">{user.driver_info?.license_number || 'Not set'}</p>
                    )}
                  </div>

                  <div>
                    <Label>License Expiry Date</Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={editedData.settings.license_expiry}
                        onChange={(e) => setEditedData({
                          ...editedData,
                          settings: { ...editedData.settings, license_expiry: e.target.value }
                        })}
                        className="mt-2"
                      />
                    ) : (
                      <p className="text-gray-900 py-2 font-medium">
                        {user.driver_info?.license_expiry 
                          ? new Date(user.driver_info.license_expiry).toLocaleDateString()
                          : 'Not set'}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label>Insurance Policy Number</Label>
                    {isEditing ? (
                      <Input
                        value={editedData.settings.insurance_policy}
                        onChange={(e) => setEditedData({
                          ...editedData,
                          settings: { ...editedData.settings, insurance_policy: e.target.value }
                        })}
                        placeholder="POL123456"
                        className="mt-2"
                      />
                    ) : (
                      <p className="text-gray-900 py-2 font-medium font-mono">{user.driver_info?.insurance_policy || 'Not set'}</p>
                    )}
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> Keep your license and insurance information up to date. 
                    Expired documents may result in account suspension.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MoreHorizontal, Edit, UserX, UserCheck, Search, Car, User, Star, Mail, Phone, FileText, Eye, Filter } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast, Toaster } from 'sonner';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const statusColors = {
    active: "bg-green-100 text-green-800",
    suspended: "bg-red-100 text-red-800",
    pending_approval: "bg-yellow-100 text-yellow-800",
};

const roleColors = {
    admin: "bg-purple-200 text-purple-900",
    support: "bg-blue-200 text-blue-900",
    finance: "bg-green-200 text-green-900",
    marketing: "bg-pink-200 text-pink-900",
    hr: "bg-indigo-200 text-indigo-900",
    none: "bg-gray-200 text-gray-900",
};

const EditUserDialog = ({ user, isOpen, onClose }) => {
    const queryClient = useQueryClient();
    const [role, setRole] = useState(user?.internal_role || 'none');
    const [status, setStatus] = useState(user?.status || 'active');

    const mutation = useMutation({
        mutationFn: (updatedData) => base44.entities.User.update(user.id, updatedData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
            toast.success(`User ${user.full_name} updated successfully.`);
            onClose();
        },
        onError: (error) => {
            toast.error(`Failed to update user: ${error.message}`);
        }
    });

    const handleSave = () => {
        mutation.mutate({ internal_role: role, status });
    };

    if (!user) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit User: {user.full_name}</DialogTitle>
                    <DialogDescription>{user.email}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">
                            Internal Role
                        </Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None (Regular User)</SelectItem>
                                <SelectItem value="admin">Administrator</SelectItem>
                                <SelectItem value="support">Support</SelectItem>
                                <SelectItem value="finance">Finance</SelectItem>
                                <SelectItem value="marketing">Marketing</SelectItem>
                                <SelectItem value="hr">Human Resources</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">
                            Account Status
                        </Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={mutation.isLoading}>
                        {mutation.isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default function AdminUserManagement() {
    const [filter, setFilter] = useState('');
    const [editingUser, setEditingUser] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserDetails, setShowUserDetails] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');

    const { data: users, isLoading } = useQuery({
        queryKey: ['adminUsers'],
        queryFn: () => base44.entities.User.list('-created_date', 500)
    });
    
    const queryClient = useQueryClient();
    const updateUserStatus = useMutation({
        mutationFn: ({ userId, status }) => base44.entities.User.update(userId, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
            toast.success("User status updated.");
        },
        onError: (error) => {
            toast.error(`Error: ${error.message}`);
        }
    });

    const filteredUsers = useMemo(() => {
        if (!users) return [];
        return users.filter(user => {
            const matchesSearch = !filter || 
                user.full_name?.toLowerCase().includes(filter.toLowerCase()) ||
                user.email?.toLowerCase().includes(filter.toLowerCase());
            
            const matchesType = typeFilter === 'all' || user.user_type === typeFilter;
            
            const matchesTab = activeTab === 'all' ||
                (activeTab === 'riders' && (!user.user_type || user.user_type === 'rider')) ||
                (activeTab === 'drivers' && (user.user_type === 'driver' || user.user_type === 'both')) ||
                (activeTab === 'admins' && (user.role === 'admin' || user.internal_role));
            
            return matchesSearch && matchesType && matchesTab;
        });
    }, [users, filter, typeFilter, activeTab]);

    const stats = useMemo(() => {
        if (!users) return { total: 0, riders: 0, drivers: 0, admins: 0 };
        return {
            total: users.length,
            riders: users.filter(u => !u.user_type || u.user_type === 'rider').length,
            drivers: users.filter(u => u.user_type === 'driver' || u.user_type === 'both').length,
            admins: users.filter(u => u.role === 'admin' || u.internal_role).length
        };
    }, [users]);

    const handleSuspend = (user) => {
        if (window.confirm(`Are you sure you want to suspend ${user.full_name}?`)) {
            updateUserStatus.mutate({ userId: user.id, status: 'suspended' });
        }
    };
    
    const handleReactivate = (user) => {
        if (window.confirm(`Are you sure you want to reactivate ${user.full_name}?`)) {
            updateUserStatus.mutate({ userId: user.id, status: 'active' });
        }
    };

    return (
        <div className="p-4 lg:p-8 bg-gradient-to-br from-gray-50 to-purple-50 min-h-screen">
            <Toaster richColors />
            
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-600 mt-1">Manage riders, drivers, and admin users</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            <p className="text-sm text-gray-500">Total Users</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-blue-600">{stats.riders}</p>
                            <p className="text-sm text-gray-500">Riders</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-green-600">{stats.drivers}</p>
                            <p className="text-sm text-gray-500">Drivers</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
                            <p className="text-sm text-gray-500">Admins</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col lg:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Search by name or email..."
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-full lg:w-48">
                                    <Filter className="w-4 h-4 mr-2" />
                                    <SelectValue placeholder="User Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="rider">Riders Only</SelectItem>
                                    <SelectItem value="driver">Drivers Only</SelectItem>
                                    <SelectItem value="both">Both (Driver + Rider)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Users Table */}
                <Card>
                    <CardHeader>
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="all">All Users</TabsTrigger>
                                <TabsTrigger value="riders">Riders</TabsTrigger>
                                <TabsTrigger value="drivers">Drivers</TabsTrigger>
                                <TabsTrigger value="admins">Admins</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </CardHeader>
                    <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Account Type</TableHead>
                            <TableHead>Internal Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Registered</TableHead>
                            <TableHead><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={6} className="text-center">Loading users...</TableCell></TableRow>
                        ) : filteredUsers.length > 0 ? (
                            filteredUsers.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="font-medium">{user.full_name}</div>
                                        <div className="text-sm text-muted-foreground">{user.email}</div>
                                    </TableCell>
                                    <TableCell className="capitalize">{user.user_type || 'rider'}</TableCell>
                                    <TableCell>
                                        <Badge className={roleColors[user.internal_role || 'none']}>
                                            {user.internal_role || 'None'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={statusColors[user.status]}>
                                            {user.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(user.created_date).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => {
                                                    setSelectedUser(user);
                                                    setShowUserDetails(true);
                                                }}>
                                                    <Eye className="mr-2 h-4 w-4"/>
                                                    View Profile
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setEditingUser(user)}>
                                                    <Edit className="mr-2 h-4 w-4"/>
                                                    Edit Role & Status
                                                </DropdownMenuItem>
                                                {(user.user_type === 'driver' || user.user_type === 'both') && (
                                                    <DropdownMenuItem asChild>
                                                        <Link to={`${createPageUrl('AdminDocumentReview')}?driver=${user.id}`}>
                                                            <FileText className="mr-2 h-4 w-4"/>
                                                            View Documents
                                                        </Link>
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                {user.status === 'active' ? (
                                                    <DropdownMenuItem onClick={() => handleSuspend(user)} className="text-red-600">
                                                        <UserX className="mr-2 h-4 w-4"/>
                                                        Suspend Account
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem onClick={() => handleReactivate(user)} className="text-green-600">
                                                        <UserCheck className="mr-2 h-4 w-4"/>
                                                        Reactivate Account
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={6} className="text-center">No users found.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
                    </CardContent>
                </Card>

                {editingUser && (
                    <EditUserDialog 
                        user={editingUser}
                        isOpen={!!editingUser}
                        onClose={() => setEditingUser(null)}
                    />
                )}

                {/* User Details Dialog */}
                <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>User Profile</DialogTitle>
                        </DialogHeader>
                        
                        {selectedUser && (
                            <div className="space-y-4">
                                {/* Basic Info */}
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                                        <User className="w-8 h-8 text-gray-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">{selectedUser.full_name}</h3>
                                        <p className="text-gray-600">{selectedUser.email}</p>
                                        <div className="flex gap-2 mt-1">
                                            <Badge className={statusColors[selectedUser.status]}>
                                                {selectedUser.status}
                                            </Badge>
                                            <Badge variant="outline" className="capitalize">
                                                {selectedUser.user_type || 'rider'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Card>
                                        <CardContent className="p-4">
                                            <p className="text-xs text-gray-500">Joined</p>
                                            <p className="font-medium">
                                                {format(new Date(selectedUser.created_date), 'MMM d, yyyy')}
                                            </p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-4">
                                            <p className="text-xs text-gray-500">Rating</p>
                                            <p className="font-medium flex items-center gap-1">
                                                <Star className="w-4 h-4 text-yellow-500" />
                                                {selectedUser.average_rating?.toFixed(1) || 'N/A'}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Driver Info */}
                                {(selectedUser.user_type === 'driver' || selectedUser.user_type === 'both') && selectedUser.driver_info && (
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm flex items-center gap-2">
                                                <Car className="w-4 h-4" />
                                                Driver Information
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2 text-sm">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-gray-500">Vehicle</p>
                                                    <p className="font-medium">
                                                        {selectedUser.driver_info.vehicle_color} {selectedUser.driver_info.vehicle_make} {selectedUser.driver_info.vehicle_model}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">License Plate</p>
                                                    <p className="font-medium">{selectedUser.driver_info.license_plate || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Status</p>
                                                    <Badge className={selectedUser.driver_info.is_available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                                        {selectedUser.driver_info.is_available ? 'Online' : 'Offline'}
                                                    </Badge>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Total Rides</p>
                                                    <p className="font-medium">{selectedUser.total_rides || 0}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowUserDetails(false)}>Close</Button>
                            <Button onClick={() => {
                                setShowUserDetails(false);
                                setEditingUser(selectedUser);
                            }}>
                                Edit User
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
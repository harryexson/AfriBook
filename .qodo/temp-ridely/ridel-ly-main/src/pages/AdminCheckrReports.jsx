import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle2, XCircle, Clock, AlertTriangle, RefreshCw, Eye, User, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { format } from 'date-fns';

export default function AdminCheckrReports() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState({});

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const allUsers = await base44.entities.User.filter({
        user_type: { $in: ['driver', 'both'] }
      }, '-created_date', 500);
      
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load drivers');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCheckrStatus = async (userId) => {
    setRefreshing(prev => ({ ...prev, [userId]: true }));
    try {
      const result = await base44.functions.invoke('checkBackgroundStatus', {});
      
      if (result.data?.success) {
        toast.success('Status updated');
        loadUsers();
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error refreshing status:', error);
      toast.error('Failed to refresh status');
    } finally {
      setRefreshing(prev => ({ ...prev, [userId]: false }));
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (user) => {
    if (!user.checkr_report_id) {
      return <Badge className="bg-gray-100 text-gray-800">Not Initiated</Badge>;
    }

    const result = user.background_check_result;
    const status = user.background_check_status;

    if (result === 'clear') {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />Cleared</Badge>;
    } else if (result === 'consider') {
      return <Badge className="bg-orange-100 text-orange-800"><AlertTriangle className="w-3 h-3 mr-1" />Review</Badge>;
    } else if (status === 'pending') {
      return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }

    return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="w-12 h-12 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <Toaster richColors />
      
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkr Background Reports</h1>
          <p className="text-gray-600">Monitor driver background check statuses and results</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-500">Total Drivers</p>
              <p className="text-3xl font-bold">{users.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-500">Cleared</p>
              <p className="text-3xl font-bold text-green-600">
                {users.filter(u => u.background_check_result === 'clear').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">
                {users.filter(u => u.background_check_status === 'pending').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-500">Review Required</p>
              <p className="text-3xl font-bold text-orange-600">
                {users.filter(u => u.background_check_result === 'consider').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search drivers by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Drivers List */}
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {user.full_name?.charAt(0) || 'D'}
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{user.full_name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{user.email}</p>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(user)}
                        
                        {user.license_verification_status === 'complete' && (
                          <Badge className="bg-blue-100 text-blue-800">
                            MVR: {user.license_verification_result || 'Complete'}
                          </Badge>
                        )}
                      </div>

                      {user.checkr_candidate_id && (
                        <div className="mt-3 text-xs text-gray-500 space-y-1">
                          <p>Candidate ID: <span className="font-mono">{user.checkr_candidate_id}</span></p>
                          {user.checkr_report_id && (
                            <p>Report ID: <span className="font-mono">{user.checkr_report_id}</span></p>
                          )}
                          {user.background_check_completed_at && (
                            <p>Completed: {format(new Date(user.background_check_completed_at), 'MMM d, yyyy')}</p>
                          )}
                        </div>
                      )}

                      {user.background_check_issues && (
                        <div className="mt-2 bg-orange-50 border border-orange-200 rounded p-2 text-xs text-orange-800">
                          <strong>Note:</strong> {user.background_check_issues}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {user.checkr_report_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refreshCheckrStatus(user.id)}
                        disabled={refreshing[user.id]}
                      >
                        {refreshing[user.id] ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {filteredUsers.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No drivers found</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
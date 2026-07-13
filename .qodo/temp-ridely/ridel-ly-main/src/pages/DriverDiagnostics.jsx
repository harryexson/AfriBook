import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function DriverDiagnostics() {
    const [user, setUser] = useState(null);
    const [driverLocation, setDriverLocation] = useState(null);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadDiagnostics = async () => {
        setIsLoading(true);
        try {
            const currentUser = await base44.auth.me();
            setUser(currentUser);

            // Check for DriverLocation records
            const locations = await base44.entities.DriverLocation.filter({
                driver_id: currentUser.id
            });
            setDriverLocation(locations[0] || null);

            // Check for pending ride requests
            const requests = await base44.entities.RideRequest.filter({
                driver_id: currentUser.id,
                status: 'pending'
            });
            setPendingRequests(requests);

        } catch (error) {
            console.error('Error loading diagnostics:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadDiagnostics();
    }, []);

    const StatusIndicator = ({ status, text }) => {
        const icons = {
            success: <CheckCircle className="w-5 h-5 text-green-600" />,
            error: <XCircle className="w-5 h-5 text-red-600" />,
            warning: <AlertCircle className="w-5 h-5 text-yellow-600" />
        };

        const colors = {
            success: 'bg-green-50 border-green-200',
            error: 'bg-red-50 border-red-200',
            warning: 'bg-yellow-50 border-yellow-200'
        };

        return (
            <div className={`flex items-center gap-3 p-4 rounded-lg border ${colors[status]}`}>
                {icons[status]}
                <span className="font-medium">{text}</span>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
                    <p>Loading diagnostics...</p>
                </div>
            </div>
        );
    }

    const isOnline = user?.driver_info?.is_available;
    const hasLocation = user?.driver_info?.current_location?.latitude;
    const hasDriverLocationRecord = !!driverLocation;
    const hasH3Index = !!driverLocation?.h3_index;
    const hasPendingRequests = pendingRequests.length > 0;

    const allSystemsGo = isOnline && hasLocation && hasDriverLocationRecord && hasH3Index;

    return (
        <div className="p-4 lg:p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Driver Diagnostics</h1>
                    <p className="text-gray-600 mt-2">Check if your system is ready to receive ride requests</p>
                </div>
                <Button onClick={loadDiagnostics} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Overall Status */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        {allSystemsGo ? (
                            <>
                                <CheckCircle className="w-6 h-6 text-green-600" />
                                <span className="text-green-600">All Systems Operational</span>
                            </>
                        ) : (
                            <>
                                <XCircle className="w-6 h-6 text-red-600" />
                                <span className="text-red-600">Issues Detected</span>
                            </>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {allSystemsGo ? (
                        <p className="text-gray-600">Your driver account is configured correctly and ready to receive ride requests!</p>
                    ) : (
                        <p className="text-gray-600">There are some issues preventing you from receiving ride requests. See details below.</p>
                    )}
                </CardContent>
            </Card>

            {/* Detailed Checks */}
            <div className="space-y-6">
                {/* Check 1: Driver Account */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">1. Driver Account Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-600 mb-2">Email:</p>
                            <Badge variant="outline">{user?.email}</Badge>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 mb-2">Account Type:</p>
                            <Badge variant="outline" className="capitalize">{user?.user_type || 'rider'}</Badge>
                        </div>
                        {user?.user_type !== 'driver' && user?.user_type !== 'both' && (
                            <StatusIndicator 
                                status="error" 
                                text="❌ Your account is not registered as a driver. Please complete driver onboarding first."
                            />
                        )}
                    </CardContent>
                </Card>

                {/* Check 2: Online Status */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">2. Driver Mode (Online/Offline)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {isOnline ? (
                            <StatusIndicator 
                                status="success" 
                                text="✅ You are ONLINE and ready to receive requests"
                            />
                        ) : (
                            <StatusIndicator 
                                status="error" 
                                text="❌ You are OFFLINE. Toggle the switch to go online."
                            />
                        )}
                        <p className="text-sm text-gray-600">
                            Current Status: <Badge className={isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                {isOnline ? 'Online' : 'Offline'}
                            </Badge>
                        </p>
                    </CardContent>
                </Card>

                {/* Check 3: Location Tracking */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">3. GPS Location</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {hasLocation ? (
                            <>
                                <StatusIndicator 
                                    status="success" 
                                    text="✅ Your location is being tracked"
                                />
                                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                                    <p><strong>Latitude:</strong> {user.driver_info.current_location.latitude.toFixed(6)}</p>
                                    <p><strong>Longitude:</strong> {user.driver_info.current_location.longitude.toFixed(6)}</p>
                                    <p><strong>Last Updated:</strong> {new Date(user.driver_info.current_location.last_updated).toLocaleString()}</p>
                                </div>
                            </>
                        ) : (
                            <StatusIndicator 
                                status="error" 
                                text="❌ No location data found. Make sure location permissions are enabled."
                            />
                        )}
                    </CardContent>
                </Card>

                {/* Check 4: DriverLocation Record */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">4. Location Database Record</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {hasDriverLocationRecord ? (
                            <>
                                <StatusIndicator 
                                    status="success" 
                                    text="✅ Location record exists in database"
                                />
                                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                                    <p><strong>Record ID:</strong> {driverLocation.id}</p>
                                    <p><strong>Available:</strong> {driverLocation.is_available ? 'Yes' : 'No'}</p>
                                    <p><strong>Last Ping:</strong> {new Date(driverLocation.last_ping).toLocaleString()}</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <StatusIndicator 
                                    status="error" 
                                    text="❌ No location record found in database. Location tracking may not be working."
                                />
                                <p className="text-sm text-gray-600">
                                    <strong>Fix:</strong> Try toggling offline/online or refresh the page while online.
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Check 5: H3 Index */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">5. H3 Geospatial Index</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {hasH3Index ? (
                            <>
                                <StatusIndicator 
                                    status="success" 
                                    text="✅ H3 index calculated (required for smart matching)"
                                />
                                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                                    <p><strong>H3 Index:</strong> <code>{driverLocation.h3_index}</code></p>
                                    <p className="text-xs mt-2">This is your hexagonal grid location used for fast driver matching.</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <StatusIndicator 
                                    status="error" 
                                    text="❌ H3 index missing. Smart dispatch won't work properly."
                                />
                                <p className="text-sm text-gray-600">
                                    <strong>Fix:</strong> The system should calculate this automatically. Try refreshing this page.
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Check 6: Pending Requests */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">6. Pending Ride Requests</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {hasPendingRequests ? (
                            <>
                                <StatusIndicator 
                                    status="warning" 
                                    text={`⚠️ You have ${pendingRequests.length} pending request(s) that may not be showing!`}
                                />
                                <div className="space-y-2">
                                    {pendingRequests.map(req => (
                                        <div key={req.id} className="bg-yellow-50 border border-yellow-200 p-3 rounded text-sm">
                                            <p><strong>Request ID:</strong> {req.id}</p>
                                            <p><strong>From:</strong> {req.pickup_location?.address}</p>
                                            <p><strong>To:</strong> {req.destination?.address}</p>
                                            <p><strong>Expires:</strong> {new Date(req.expires_at).toLocaleTimeString()}</p>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-sm text-gray-600">
                                    <strong>Issue:</strong> These requests should be showing on your Driver Dashboard. If not, there's a UI bug.
                                </p>
                            </>
                        ) : (
                            <StatusIndicator 
                                status="success" 
                                text="✅ No pending requests right now. System will notify you when a rider requests you."
                            />
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Action Items */}
            {!allSystemsGo && (
                <Card className="mt-8 bg-blue-50 border-blue-200">
                    <CardHeader>
                        <CardTitle className="text-lg">🔧 What to do next:</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm">
                            {!isOnline && (
                                <li className="flex items-start gap-2">
                                    <span className="font-bold">1.</span>
                                    <span>Go to your Driver Dashboard and toggle the switch to <strong>Online</strong></span>
                                </li>
                            )}
                            {!hasLocation && (
                                <li className="flex items-start gap-2">
                                    <span className="font-bold">2.</span>
                                    <span>Enable location permissions in your browser settings</span>
                                </li>
                            )}
                            {!hasDriverLocationRecord && (
                                <li className="flex items-start gap-2">
                                    <span className="font-bold">3.</span>
                                    <span>Try toggling online/offline or refreshing the page</span>
                                </li>
                            )}
                            <li className="flex items-start gap-2">
                                <span className="font-bold">4.</span>
                                <span>After fixing issues, click the <strong>Refresh</strong> button above to re-check</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
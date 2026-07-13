import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, MapPin, User } from 'lucide-react';

export default function RiderDiagnostics() {
    const [user, setUser] = useState(null);
    const [myRides, setMyRides] = useState([]);
    const [allDrivers, setAllDrivers] = useState([]);
    const [availableDrivers, setAvailableDrivers] = useState([]);
    const [rideRequests, setRideRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadDiagnostics = async () => {
        setIsLoading(true);
        try {
            const currentUser = await base44.auth.me();
            setUser(currentUser);

            // Get my rides
            const rides = await base44.entities.Ride.filter({
                rider_id: currentUser.id
            }, '-created_date', 5);
            setMyRides(rides);

            // Get ALL drivers
            const allDriverUsers = await base44.entities.User.filter({
                user_type: { $in: ['driver', 'both'] }
            });
            setAllDrivers(allDriverUsers);

            // Get available drivers
            const availDrivers = allDriverUsers.filter(d => d.driver_info?.is_available === true);
            setAvailableDrivers(availDrivers);

            // Get ride requests for my latest ride
            if (rides.length > 0) {
                const requests = await base44.entities.RideRequest.filter({
                    ride_id: rides[0].id
                });
                setRideRequests(requests);
            }

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

    const latestRide = myRides[0];
    const hasRides = myRides.length > 0;
    const hasAvailableDrivers = availableDrivers.length > 0;
    const hasRideRequests = rideRequests.length > 0;

    return (
        <div className="p-4 lg:p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Rider Diagnostics</h1>
                    <p className="text-gray-600 mt-2">Debug why drivers aren't receiving your requests</p>
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
                        {hasAvailableDrivers && hasRideRequests ? (
                            <>
                                <CheckCircle className="w-6 h-6 text-green-600" />
                                <span className="text-green-600">System Working</span>
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
                    <p className="text-gray-600">
                        {hasAvailableDrivers 
                            ? `${availableDrivers.length} driver(s) are online and available`
                            : "No drivers are currently online"}
                    </p>
                </CardContent>
            </Card>

            {/* Check 1: Your Latest Ride */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-lg">1. Your Latest Ride Request</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {hasRides ? (
                        <>
                            <StatusIndicator status="success" text="✅ You have created ride requests" />
                            <div className="bg-gray-50 p-4 rounded space-y-2">
                                <p><strong>Ride ID:</strong> {latestRide.id}</p>
                                <p><strong>Status:</strong> <Badge className="capitalize">{latestRide.status}</Badge></p>
                                <p><strong>From:</strong> {latestRide.pickup_location?.address}</p>
                                <p><strong>To:</strong> {latestRide.destination?.address}</p>
                                <p><strong>Created:</strong> {new Date(latestRide.created_date).toLocaleString()}</p>
                            </div>
                        </>
                    ) : (
                        <StatusIndicator status="error" text="❌ You haven't requested any rides yet" />
                    )}
                </CardContent>
            </Card>

            {/* Check 2: Available Drivers */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-lg">2. Available Drivers in System</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-blue-50 p-4 rounded text-center">
                            <p className="text-3xl font-bold text-blue-600">{allDrivers.length}</p>
                            <p className="text-sm text-gray-600">Total Drivers</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded text-center">
                            <p className="text-3xl font-bold text-green-600">{availableDrivers.length}</p>
                            <p className="text-sm text-gray-600">Online Now</p>
                        </div>
                    </div>

                    {availableDrivers.length > 0 ? (
                        <>
                            <StatusIndicator status="success" text={`✅ ${availableDrivers.length} driver(s) are online`} />
                            <div className="space-y-2">
                                {availableDrivers.map(driver => (
                                    <div key={driver.id} className="bg-gray-50 p-3 rounded flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <User className="w-5 h-5 text-gray-500" />
                                            <div>
                                                <p className="font-medium">{driver.email}</p>
                                                <p className="text-xs text-gray-500">
                                                    {driver.driver_info?.current_location?.latitude 
                                                        ? `Location: ${driver.driver_info.current_location.latitude.toFixed(4)}, ${driver.driver_info.current_location.longitude.toFixed(4)}`
                                                        : 'No location data'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                        <Badge className="bg-green-100 text-green-800">Online</Badge>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <StatusIndicator status="error" text="❌ No drivers are currently online" />
                    )}
                </CardContent>
            </Card>

            {/* Check 3: Ride Requests Sent */}
            {hasRides && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-lg">3. Ride Requests Sent to Drivers</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {hasRideRequests ? (
                            <>
                                <StatusIndicator status="success" text={`✅ ${rideRequests.length} request(s) sent to drivers`} />
                                <div className="space-y-2">
                                    {rideRequests.map(req => (
                                        <div key={req.id} className="bg-gray-50 p-3 rounded">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="font-medium">Request #{req.id.slice(0, 8)}</p>
                                                <Badge className={
                                                    req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    req.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                                    req.status === 'declined' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }>
                                                    {req.status}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-600">Driver ID: {req.driver_id}</p>
                                            <p className="text-sm text-gray-600">Distance: {req.estimated_distance?.toFixed(2)} km</p>
                                            <p className="text-sm text-gray-600">ETA: {req.estimated_duration} min</p>
                                            <p className="text-sm text-gray-600">Expires: {new Date(req.expires_at).toLocaleTimeString()}</p>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                <StatusIndicator status="error" text="❌ No ride requests were sent to drivers!" />
                                <div className="bg-red-50 border border-red-200 p-4 rounded">
                                    <p className="font-semibold text-red-900 mb-2">🐛 This is the problem!</p>
                                    <p className="text-sm text-red-700">
                                        The dispatch function either didn't run or failed. Possible causes:
                                    </p>
                                    <ul className="text-sm text-red-700 list-disc ml-5 mt-2">
                                        <li>Dispatch function wasn't called after ride creation</li>
                                        <li>Dispatch function failed due to an error</li>
                                        <li>No drivers matched the search criteria</li>
                                    </ul>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Action Items */}
            <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                    <CardTitle className="text-lg">🔧 What to do next:</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2 text-sm">
                        {!hasAvailableDrivers && (
                            <li className="flex items-start gap-2">
                                <span className="font-bold">1.</span>
                                <span>Make sure at least one driver is online (logged in as driver and toggled to "Online")</span>
                            </li>
                        )}
                        {hasRides && !hasRideRequests && (
                            <li className="flex items-start gap-2">
                                <span className="font-bold">2.</span>
                                <span>The dispatch system isn't creating ride requests. Check the "findDriversForRideV2" function in the backend.</span>
                            </li>
                        )}
                        <li className="flex items-start gap-2">
                            <span className="font-bold">3.</span>
                            <span>After making changes, click the <strong>Refresh</strong> button above to re-check</span>
                        </li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
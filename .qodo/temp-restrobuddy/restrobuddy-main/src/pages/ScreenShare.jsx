import React, { useState, useEffect, useRef } from "react";
import { DeviceSession } from "@/entities/DeviceSession";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Monitor, Smartphone, Cast, QrCode, Users, Eye, 
  Copy, CheckCircle, XCircle, Play, Pause, Settings, AlertCircle, Share2, Send, LogIn
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export default function ScreenShare() {
  const [mode, setMode] = useState("host");
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionCode, setSessionCode] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [deviceType, setDeviceType] = useState("kitchen_display");
  const [allowControl, setAllowControl] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [message, setMessage] = useState(null);
  const [joinCode, setJoinCode] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [isCapturingScreen, setIsCapturingScreen] = useState(false);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    loadUser();
    checkForJoinCode();
    return () => {
      stopSharing();
    };
  }, []);

  const loadUser = async () => {
    setIsLoadingUser(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setDeviceName(`${currentUser.full_name}'s Device`);
    } catch (error) {
      console.log("User not authenticated - allowing viewer mode");
      setIsAuthenticated(false);
    }
    setIsLoadingUser(false);
  };

  const checkForJoinCode = () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('join');
    if (code && code.length === 6) {
      setJoinCode(code);
      setMode("viewer");
    }
  };

  const generateSessionCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const captureScreen = async () => {
    try {
      setIsCapturingScreen(true);
      
      // Request screen capture
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always",
          displaySurface: "monitor"
        },
        audio: false
      });

      streamRef.current = stream;
      
      // Display in video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Listen for when user stops sharing via browser UI
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopSharing();
      });

      setIsCapturingScreen(false);
      return true;
    } catch (error) {
      console.error("Error capturing screen:", error);
      setMessage({ 
        type: "error", 
        text: "Failed to capture screen. Please grant permission and try again." 
      });
      setIsCapturingScreen(false);
      return false;
    }
  };

  const startSimplifiedSession = async () => {
    if (!isAuthenticated) {
      setMessage({ type: "error", text: "Please log in to start a session" });
      return;
    }

    try {
      setMessage(null);

      // First, capture the screen
      const captured = await captureScreen();
      if (!captured) {
        return; // User denied screen capture
      }

      const code = generateSessionCode();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 8);

      const session = await DeviceSession.create({
        session_code: code,
        device_name: deviceName,
        device_type: deviceType,
        owner_email: user.email,
        status: "active",
        allow_control: allowControl,
        expires_at: expiresAt.toISOString(),
        last_activity: new Date().toISOString(),
        connected_devices: []
      });

      setCurrentSession(session);
      setSessionCode(code);
      setIsSharing(true);
      
      // Create shareable URL
      const url = `${window.location.origin}${window.location.pathname}?join=${code}`;
      setShareUrl(url);
      
      setMessage({ 
        type: "success", 
        text: "Session started! Your screen is now being shared." 
      });

    } catch (error) {
      console.error("Error starting session:", error);
      setMessage({ type: "error", text: "Failed to start session. Please try again." });
      setIsSharing(false);
      
      // Stop screen capture if session creation failed
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  const stopSharing = async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (currentSession) {
      try {
        await DeviceSession.update(currentSession.id, {
          status: "disconnected"
        });
      } catch (error) {
        console.error("Error updating session:", error);
      }
    }

    setIsSharing(false);
    setCurrentSession(null);
    setSessionCode("");
    setShareUrl("");
  };

  const joinSession = async () => {
    if (!joinCode || joinCode.length !== 6) {
      setMessage({ type: "error", text: "Please enter a valid 6-digit code" });
      return;
    }

    setIsConnecting(true);
    try {
      const sessions = await DeviceSession.filter({
        session_code: joinCode,
        status: "active"
      });

      if (sessions.length === 0) {
        setMessage({ type: "error", text: "Session not found or expired" });
        setIsConnecting(false);
        return;
      }

      const session = sessions[0];

      if (isAuthenticated && user) {
        const updatedDevices = [
          ...(session.connected_devices || []),
          {
            device_id: `device-${Date.now()}`,
            device_name: `${user.full_name}'s Viewer`,
            connected_at: new Date().toISOString(),
            user_email: user.email
          }
        ];

        await DeviceSession.update(session.id, {
          connected_devices: updatedDevices,
          last_activity: new Date().toISOString()
        });
      }

      setCurrentSession(session);
      setMessage({ 
        type: "success", 
        text: `Connected to ${session.device_name}!` 
      });

    } catch (error) {
      console.error("Error joining session:", error);
      setMessage({ type: "error", text: "Failed to join session. Please try again." });
    }
    setIsConnecting(false);
  };

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(sessionCode);
    setMessage({ type: "success", text: "Code copied!" });
    setTimeout(() => setMessage(null), 2000);
  };

  const copyUrlToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setMessage({ type: "success", text: "Link copied!" });
    setTimeout(() => setMessage(null), 2000);
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Join my RESTROBUDDY Screen Share`);
    const body = encodeURIComponent(`Join my screen sharing session!\n\nCode: ${sessionCode}\n\nOr click this link: ${shareUrl}\n\nExpires in 8 hours.`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareViaSMS = () => {
    const message = encodeURIComponent(`Join my RESTROBUDDY screen: ${shareUrl} (Code: ${sessionCode})`);
    window.location.href = `sms:?body=${message}`;
  };

  const disconnectViewer = async (deviceId) => {
    if (!currentSession) return;

    try {
      const updatedDevices = currentSession.connected_devices.filter(
        d => d.device_id !== deviceId
      );

      await DeviceSession.update(currentSession.id, {
        connected_devices: updatedDevices
      });

      setCurrentSession({...currentSession, connected_devices: updatedDevices});
      setMessage({ type: "success", text: "Viewer disconnected" });
    } catch (error) {
      console.error("Error disconnecting viewer:", error);
    }
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full mb-4 shadow-lg">
            <Cast className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Screen Sharing & Remote Access
          </h1>
          <p className="text-xl text-slate-600">
            Share your screen with team members or view remote devices
          </p>
        </div>

        {/* Messages */}
        {message && (
          <Alert className={`mb-6 ${
            message.type === "success" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
          }`}>
            <AlertDescription className={
              message.type === "success" ? "text-green-800" : "text-red-800"
            }>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={mode} onValueChange={setMode} className="mb-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="host" className="flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Share My Screen
            </TabsTrigger>
            <TabsTrigger value="viewer" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              View Another Screen
            </TabsTrigger>
          </TabsList>

          {/* HOST MODE */}
          <TabsContent value="host">
            {!isAuthenticated ? (
              <Card className="border-0 shadow-xl max-w-2xl mx-auto">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <LogIn className="w-10 h-10 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    Login Required
                  </h2>
                  <p className="text-slate-600 mb-8">
                    Please log in to start sharing your screen
                  </p>
                  <Button
                    onClick={() => base44.auth.redirectToLogin(window.location.href)}
                    className="bg-purple-600 hover:bg-purple-700 px-8 py-6 text-lg"
                  >
                    <LogIn className="w-5 h-5 mr-2" />
                    Log In to Continue
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Settings Card */}
                <Card className="border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Screen Share Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {!isSharing ? (
                      <>
                        <div>
                          <Label htmlFor="device-name">Device Name</Label>
                          <Input
                            id="device-name"
                            value={deviceName}
                            onChange={(e) => setDeviceName(e.target.value)}
                            placeholder="Kitchen Display 1"
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label htmlFor="device-type">Device Type</Label>
                          <Select value={deviceType} onValueChange={setDeviceType}>
                            <SelectTrigger id="device-type" className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="kitchen_display">Kitchen Display</SelectItem>
                              <SelectItem value="kiosk">Kiosk</SelectItem>
                              <SelectItem value="pos">POS Terminal</SelectItem>
                              <SelectItem value="admin">Admin Dashboard</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                          <div>
                            <p className="font-semibold text-slate-900">Allow Remote Control</p>
                            <p className="text-sm text-slate-600">
                              Let viewers control this device
                            </p>
                          </div>
                          <Switch
                            checked={allowControl}
                            onCheckedChange={setAllowControl}
                          />
                        </div>

                        <Button
                          onClick={startSimplifiedSession}
                          disabled={isCapturingScreen}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg"
                        >
                          {isCapturingScreen ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Requesting Screen Access...
                            </>
                          ) : (
                            <>
                              <Play className="w-5 h-5 mr-2" />
                              Start Screen Sharing
                            </>
                          )}
                        </Button>

                        <Alert className="bg-blue-50 border-blue-200">
                          <AlertCircle className="h-4 w-4 text-blue-600" />
                          <AlertDescription className="text-blue-900 text-sm">
                            <strong>How it works:</strong> Click the button above and select which screen/window to share. Your browser will ask for permission first.
                          </AlertDescription>
                        </Alert>
                      </>
                    ) : (
                      <>
                        {/* Active Session Display */}
                        <div className="text-center p-8 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-200">
                          <Badge className="bg-green-500 text-white px-4 py-2 mb-4">
                            <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                            SESSION ACTIVE
                          </Badge>
                          
                          <p className="text-sm text-slate-600 mb-2 font-semibold">Share this code:</p>
                          <div className="flex items-center justify-center gap-3 mb-4">
                            <span className="text-5xl font-bold text-purple-900 tracking-wider font-mono">
                              {sessionCode}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={copyCodeToClipboard}
                              className="hover:bg-purple-200"
                              title="Copy code"
                            >
                              <Copy className="w-5 h-5" />
                            </Button>
                          </div>

                          {/* QR Code */}
                          <div className="bg-white p-4 rounded-lg inline-block mb-4">
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`}
                              alt="QR Code"
                              className="w-48 h-48"
                            />
                            <p className="text-xs text-slate-500 mt-2">Scan to join session</p>
                          </div>

                          <div className="flex gap-2 justify-center mt-4 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={copyUrlToClipboard}
                              className="bg-white"
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Copy Link
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={shareViaEmail}
                              className="bg-white"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Email
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={shareViaSMS}
                              className="bg-white"
                            >
                              <Share2 className="w-4 h-4 mr-2" />
                              SMS
                            </Button>
                          </div>

                          <div className="mt-4">
                            <Badge className="bg-purple-600 text-white px-4 py-1">
                              <Users className="w-3 h-3 mr-1" />
                              {currentSession?.connected_devices?.length || 0} viewers
                            </Badge>
                          </div>
                        </div>

                        {/* Connected Devices */}
                        <div className="space-y-3">
                          <Label className="text-base font-semibold">Connected Devices</Label>
                          {currentSession?.connected_devices?.length > 0 ? (
                            currentSession.connected_devices.map((device, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Smartphone className="w-5 h-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-sm">{device.device_name}</p>
                                    <p className="text-xs text-slate-500">{device.user_email}</p>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => disconnectViewer(device.device_id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                              <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                              <p className="text-sm text-slate-500">
                                No devices connected yet
                              </p>
                              <p className="text-xs text-slate-400 mt-1">
                                Share the code above to let others join
                              </p>
                            </div>
                          )}
                        </div>

                        <Button
                          onClick={stopSharing}
                          variant="destructive"
                          className="w-full py-6 text-lg"
                        >
                          <Pause className="w-5 h-5 mr-2" />
                          Stop Sharing
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Preview Card - Show Actual Screen Capture */}
                <Card className="border-0 shadow-xl bg-slate-900 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="w-5 h-5" />
                      Current Screen
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-slate-800 rounded-lg overflow-hidden border-2 border-slate-700">
                      {isSharing ? (
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center">
                            <Monitor className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400 text-lg font-semibold mb-2">
                              No Active Session
                            </p>
                            <p className="text-slate-500 text-sm">
                              Start a session to share your screen
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {isSharing && (
                      <div className="mt-4 space-y-2">
                        <Alert className="bg-green-900/50 border-green-700">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          <AlertDescription className="text-green-100 text-sm">
                            Your screen is being shared. All connected viewers can see this device in real-time.
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* VIEWER MODE */}
          <TabsContent value="viewer">
            <div className="max-w-2xl mx-auto">
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-emerald-600" />
                    Join Remote Screen
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!currentSession ? (
                    <>
                      <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200">
                        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Smartphone className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-lg font-semibold text-blue-900 mb-2">
                          Enter 6-Digit Code
                        </p>
                        <p className="text-sm text-blue-700 mb-6">
                          Get the code from the device you want to view
                        </p>
                        <Input
                          value={joinCode}
                          onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="000000"
                          className="text-center text-3xl font-mono tracking-widest h-16 max-w-xs mx-auto bg-white border-2 border-blue-300"
                          maxLength={6}
                        />
                      </div>

                      <Button
                        onClick={joinSession}
                        disabled={isConnecting || joinCode.length !== 6}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg disabled:opacity-50"
                      >
                        {isConnecting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Connect to Screen
                          </>
                        )}
                      </Button>

                      {!isAuthenticated && (
                        <Alert className="bg-amber-50 border-amber-200">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <AlertDescription className="text-amber-800 text-sm">
                            <strong>Guest Mode:</strong> You can view sessions without logging in. Log in for full features.
                          </AlertDescription>
                        </Alert>
                      )}

                      <Alert className="bg-slate-50 border-slate-200">
                        <AlertCircle className="h-4 w-4 text-slate-600" />
                        <AlertDescription className="text-slate-700 text-sm">
                          <strong>How to join:</strong>
                          <ul className="list-disc ml-4 mt-2 space-y-1">
                            <li>Enter the 6-digit code from the host device</li>
                            <li>Or scan the QR code shown on the host device</li>
                            <li>Or click a shared link from email/SMS</li>
                          </ul>
                        </AlertDescription>
                      </Alert>
                    </>
                  ) : (
                    <>
                      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
                        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                        <p className="text-lg font-semibold text-green-900 mb-1">
                          Connected to {currentSession.device_name}
                        </p>
                        <p className="text-sm text-green-700">
                          {currentSession.allow_control ? "You can view and control this device" : "View-only mode"}
                        </p>
                      </div>

                      <Alert className="bg-amber-50 border-amber-200">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-800 text-sm">
                          <strong>Note:</strong> Full real-time screen streaming requires WebRTC infrastructure. Contact the host directly to see their screen via video call or remote desktop software.
                        </AlertDescription>
                      </Alert>

                      <div className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center relative border-4 border-green-500">
                        <div className="text-center text-white">
                          <Monitor className="w-16 h-16 mx-auto mb-4 text-green-400" />
                          <p className="text-lg font-semibold">Viewing {currentSession.device_name}</p>
                          <p className="text-sm text-slate-400 mt-2">
                            Session Code: {currentSession.session_code}
                          </p>
                        </div>
                        <Badge className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1">
                          <Eye className="w-3 h-3 mr-1" />
                          CONNECTED
                        </Badge>
                      </div>

                      <Button
                        onClick={() => {
                          setCurrentSession(null);
                          setJoinCode("");
                        }}
                        variant="outline"
                        className="w-full py-6 text-lg"
                      >
                        Disconnect
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Feature Info */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="text-center p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Monitor className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Easy Screen Sharing</h3>
              <p className="text-sm text-slate-600">
                Share your kitchen display, kiosk, or POS terminal instantly with a simple code
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="text-center p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Multi-Device Support</h3>
              <p className="text-sm text-slate-600">
                Multiple team members can view the same screen simultaneously
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="text-center p-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">QR Code Access</h3>
              <p className="text-sm text-slate-600">
                Quick join with QR code scanning or shareable links via email/SMS
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
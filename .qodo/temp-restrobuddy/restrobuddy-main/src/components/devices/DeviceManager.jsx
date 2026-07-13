import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Printer,
  Monitor,
  Tablet,
  Wifi,
  Bluetooth,
  Trash2,
  Edit2,
  Eye,
  ExternalLink,
  Copy,
  CheckCircle,
  Info,
  PlayCircle,
  AlertTriangle,
  Cable,
  Usb,
  Plus,
  MapPin
} from "lucide-react";
import { createPageUrl } from "@/utils";

const displayPages = [
  { id: "KitchenDisplay", name: "Kitchen Display", description: "Real-time order management for kitchen staff" },
  { id: "KioskMode", name: "Kiosk Mode", description: "Customer self-ordering interface" },
  { id: "OrderStatus", name: "Order Status Board", description: "Public order status display" },
];

const locationAreas = [
  { id: "kitchen", name: "Kitchen", icon: "🍳" },
  { id: "bar", name: "Bar", icon: "🍸" },
  { id: "dining", name: "Dining Room", icon: "🍽️" },
  { id: "patio", name: "Patio", icon: "🌿" },
  { id: "lounge", name: "Lounge", icon: "🛋️" },
  { id: "porch", name: "Porch", icon: "🏠" },
  { id: "counter", name: "Front Counter", icon: "🧾" },
  { id: "drive_thru", name: "Drive-Thru", icon: "🚗" },
  { id: "office", name: "Back Office", icon: "💼" },
  { id: "storage", name: "Storage", icon: "📦" },
];

const connectionTypes = [
  { id: "hdmi", name: "HDMI Cable", icon: Cable, description: "Direct HDMI connection to display" },
  { id: "usb", name: "USB Cable", icon: Usb, description: "USB connection (printers, displays)" },
  { id: "printer_cable", name: "Printer Cable", icon: Printer, description: "Standard printer cable (parallel/serial)" },
  { id: "ethernet", name: "Ethernet", icon: Wifi, description: "Wired network connection" },
  { id: "wifi", name: "WiFi", icon: Wifi, description: "Wireless network" },
  { id: "bluetooth", name: "Bluetooth", icon: Bluetooth, description: "Bluetooth wireless" },
];

export default function DeviceManager({ devices, onUpdateDevices, onTestPrint }) {
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [showDisplayConfig, setShowDisplayConfig] = useState(false);
  const [showAddManual, setShowAddManual] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedDisplayPage, setSelectedDisplayPage] = useState("KitchenDisplay");
  const [copiedUrl, setCopiedUrl] = useState(false);
  
  // Manual device form
  const [manualDevice, setManualDevice] = useState({
    name: "",
    type: "display",
    connectionType: "hdmi",
    location: "",
    assignedDisplay: "KitchenDisplay"
  });

  const getDeviceIcon = (device) => {
    if (device.type?.toLowerCase().includes('printer')) return Printer;
    if (device.type?.toLowerCase().includes('tv') || device.type?.toLowerCase().includes('display')) return Monitor;
    if (device.type?.toLowerCase().includes('tablet')) return Tablet;
    if (device.connectionType === 'hdmi' || device.connectionType === 'usb') return Cable;
    if (device.connectionType === 'bluetooth') return Bluetooth;
    return Wifi;
  };

  const handleAddManualDevice = () => {
    if (!manualDevice.name.trim()) return;
    
    const newDevice = {
      id: `manual-${Date.now()}`,
      name: manualDevice.name.trim(),
      type: manualDevice.type === 'printer' ? 'Wired Printer' : 'Wired Display',
      connected: true,
      connectionType: manualDevice.connectionType,
      location: manualDevice.location,
      assignedDisplay: manualDevice.type === 'display' ? manualDevice.assignedDisplay : null,
      isDisplay: manualDevice.type === 'display',
      lastConnected: new Date().toISOString(),
      isManual: true
    };

    onUpdateDevices([...devices, newDevice]);
    setShowAddManual(false);
    setManualDevice({ name: "", type: "display", connectionType: "hdmi", location: "", assignedDisplay: "KitchenDisplay" });
  };

  const handleSetLocation = (deviceId, locationId) => {
    const updated = devices.map(d => 
      d.id === deviceId ? { ...d, location: locationId } : d
    );
    onUpdateDevices(updated);
  };

  const getDeviceStatusColor = (device) => {
    if (device.connected) return "bg-green-500";
    const lastConn = new Date(device.lastConnected);
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (lastConn > hourAgo) return "bg-yellow-500";
    return "bg-slate-400";
  };

  const getDeviceStatusText = (device) => {
    if (device.connected) return "Connected";
    const lastConn = new Date(device.lastConnected);
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (lastConn > hourAgo) return "Recently Active";
    return "Offline";
  };

  const handleRemoveDevice = (deviceId) => {
    const updated = devices.filter(d => d.id !== deviceId);
    onUpdateDevices(updated);
    setShowDetails(false);
  };

  const handleRenameDevice = () => {
    if (!newName.trim() || !selectedDevice) return;
    const updated = devices.map(d => 
      d.id === selectedDevice.id ? { ...d, customName: newName.trim() } : d
    );
    onUpdateDevices(updated);
    setShowRename(false);
    setNewName("");
  };

  const handleSetDisplayPage = (deviceId, pageId) => {
    const updated = devices.map(d => 
      d.id === deviceId ? { ...d, assignedDisplay: pageId } : d
    );
    onUpdateDevices(updated);
  };

  const getDisplayUrl = (pageId) => {
    return `${window.location.origin}${createPageUrl(pageId)}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const openDisplayOnDevice = (device) => {
    const pageId = device.assignedDisplay || "KitchenDisplay";
    const url = getDisplayUrl(pageId);
    window.open(url, `display-${device.id}`, 'width=1920,height=1080');
  };

  const isDisplayDevice = (device) => {
    const displayTypes = ['tv', 'display', 'tablet', 'chromecast', 'airplay', 'samsung', 'lg', 'roku', 'fire'];
    return displayTypes.some(t => 
      device.type?.toLowerCase().includes(t) || 
      device.deviceType?.toLowerCase().includes(t)
    );
  };

  const printerDevices = devices.filter(d => d.type?.toLowerCase().includes('printer'));
  const displayDevices = devices.filter(d => isDisplayDevice(d));
  const otherDevices = devices.filter(d => !d.type?.toLowerCase().includes('printer') && !isDisplayDevice(d));

  const DeviceCard = ({ device }) => {
    const Icon = getDeviceIcon(device);
    const isDisplay = isDisplayDevice(device);
    
    return (
      <Card className="border-2 hover:shadow-lg transition-all">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isDisplay ? 'bg-purple-100' : 'bg-emerald-100'
              }`}>
                <Icon className={`w-6 h-6 ${isDisplay ? 'text-purple-600' : 'text-emerald-600'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 truncate">
                    {device.customName || device.name}
                  </h3>
                  <div className={`w-2 h-2 rounded-full ${getDeviceStatusColor(device)}`} />
                </div>
                <p className="text-xs text-slate-500">{device.type}</p>
                {device.ipAddress && (
                  <p className="text-xs text-slate-400">{device.ipAddress}</p>
                )}
                {device.assignedDisplay && isDisplay && (
                  <Badge className="mt-1 bg-purple-100 text-purple-800 text-xs">
                    {displayPages.find(p => p.id === device.assignedDisplay)?.name || device.assignedDisplay}
                  </Badge>
                )}
                {device.location && (
                  <Badge className="mt-1 bg-amber-100 text-amber-800 text-xs flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {locationAreas.find(l => l.id === device.location)?.name || device.location}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex flex-col gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setSelectedDevice(device); setShowDetails(true); }}
              >
                <Eye className="w-4 h-4" />
              </Button>
              {isDisplay && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-purple-600"
                  onClick={() => { setSelectedDevice(device); setShowDisplayConfig(true); }}
                >
                  <Monitor className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-3 pt-3 border-t">
            {isDisplay ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setSelectedDevice(device); setShowDisplayConfig(true); }}
                >
                  <PlayCircle className="w-4 h-4 mr-1" />
                  Configure
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  onClick={() => openDisplayOnDevice(device)}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Open Display
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setSelectedDevice(device); setNewName(device.customName || device.name); setShowRename(true); }}
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Rename
                </Button>
                {onTestPrint && (
                  <Button
                    size="sm"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => onTestPrint(device)}
                  >
                    <Printer className="w-4 h-4 mr-1" />
                    Test Print
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Add Manual Device Button */}
      <div className="flex justify-end">
        <Button onClick={() => setShowAddManual(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Wired Device (HDMI/USB/Cable)
        </Button>
      </div>

      {/* Important Notice */}
      <Card className="border-2 border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-900 mb-1">How Display Connections Work</h4>
              <p className="text-sm text-amber-800 mb-2">
                Web browsers <strong>cannot directly push content</strong> to TVs or tablets. Instead:
              </p>
              <ul className="text-sm text-amber-800 space-y-1 ml-4 list-disc">
                <li><strong>Smart TVs (LG, Samsung):</strong> Open the TV's web browser and navigate to the URL shown below</li>
                <li><strong>iPad/Tablets:</strong> Open Safari/Chrome on the device and go to the URL</li>
                <li><strong>Chromecast:</strong> Use Chrome's "Cast" feature (three dots → Cast → select device)</li>
                <li><strong>AirPlay:</strong> Screen mirror from your Mac/iPhone to the TV</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Display Devices */}
      {displayDevices.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-purple-600" />
            Display Devices ({displayDevices.length})
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {displayDevices.map(device => (
              <DeviceCard key={device.id} device={device} />
            ))}
          </div>
        </div>
      )}

      {/* Printer Devices */}
      {printerDevices.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-600" />
            Printers ({printerDevices.length})
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {printerDevices.map(device => (
              <DeviceCard key={device.id} device={device} />
            ))}
          </div>
        </div>
      )}

      {/* Other Devices */}
      {otherDevices.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Wifi className="w-5 h-5 text-blue-600" />
            Other Devices ({otherDevices.length})
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {otherDevices.map(device => (
              <DeviceCard key={device.id} device={device} />
            ))}
          </div>
        </div>
      )}

      {devices.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-xl">
          <Wifi className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg">No devices connected yet</p>
          <p className="text-slate-400 text-sm">Use the scan buttons above to find devices</p>
        </div>
      )}

      {/* Device Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Device Details</DialogTitle>
          </DialogHeader>
          {selectedDevice && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {React.createElement(getDeviceIcon(selectedDevice), { 
                  className: "w-12 h-12 text-slate-600" 
                })}
                <div>
                  <h3 className="font-bold text-lg">{selectedDevice.customName || selectedDevice.name}</h3>
                  <Badge className={getDeviceStatusColor(selectedDevice).replace('bg-', 'bg-opacity-20 text-').replace('-500', '-700')}>
                    {getDeviceStatusText(selectedDevice)}
                  </Badge>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Type:</span>
                  <span className="font-medium">{selectedDevice.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Connection:</span>
                  <span className="font-medium capitalize">
                    {connectionTypes.find(c => c.id === selectedDevice.connectionType)?.name || selectedDevice.connectionType}
                  </span>
                </div>
                {selectedDevice.ipAddress && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">IP Address:</span>
                    <span className="font-mono">{selectedDevice.ipAddress}</span>
                  </div>
                )}
                {selectedDevice.port && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Port:</span>
                    <span className="font-mono">{selectedDevice.port}</span>
                  </div>
                )}
                {selectedDevice.id && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Device ID:</span>
                    <span className="font-mono text-xs truncate max-w-[200px]">{selectedDevice.id}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Connected:</span>
                  <span>{new Date(selectedDevice.lastConnected).toLocaleString()}</span>
                </div>
                {selectedDevice.assignedDisplay && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Assigned Display:</span>
                    <span>{displayPages.find(p => p.id === selectedDevice.assignedDisplay)?.name}</span>
                  </div>
                )}
                {selectedDevice.location && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Location:</span>
                    <span>{locationAreas.find(l => l.id === selectedDevice.location)?.icon} {locationAreas.find(l => l.id === selectedDevice.location)?.name}</span>
                  </div>
                )}
              </div>

              {/* Location Assignment */}
              <div>
                <Label className="text-sm font-medium">Assign to Location</Label>
                <Select 
                  value={selectedDevice.location || ""} 
                  onValueChange={(v) => {
                    handleSetLocation(selectedDevice.id, v);
                    setSelectedDevice({ ...selectedDevice, location: v });
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select area..." />
                  </SelectTrigger>
                  <SelectContent>
                    {locationAreas.map(area => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.icon} {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setNewName(selectedDevice.customName || selectedDevice.name); setShowDetails(false); setShowRename(true); }}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Rename
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleRemoveDevice(selectedDevice.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={showRename} onOpenChange={setShowRename}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Device</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Device Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter a custom name"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRename(false)}>Cancel</Button>
            <Button onClick={handleRenameDevice}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Manual Device Dialog */}
      <Dialog open={showAddManual} onOpenChange={setShowAddManual}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cable className="w-5 h-5" />
              Add Wired Device
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Device Name *</Label>
              <Input
                value={manualDevice.name}
                onChange={(e) => setManualDevice({ ...manualDevice, name: e.target.value })}
                placeholder="e.g., Kitchen Monitor, Bar Printer"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Device Type</Label>
              <Select 
                value={manualDevice.type} 
                onValueChange={(v) => setManualDevice({ ...manualDevice, type: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="display">Display / Monitor / TV</SelectItem>
                  <SelectItem value="printer">Printer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Connection Type</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {connectionTypes.map(conn => {
                  const Icon = conn.icon;
                  return (
                    <Card
                      key={conn.id}
                      className={`cursor-pointer p-3 text-center transition-all ${
                        manualDevice.connectionType === conn.id
                          ? 'border-2 border-emerald-500 bg-emerald-50'
                          : 'border hover:border-emerald-300'
                      }`}
                      onClick={() => setManualDevice({ ...manualDevice, connectionType: conn.id })}
                    >
                      <Icon className="w-5 h-5 mx-auto mb-1 text-slate-600" />
                      <p className="text-xs font-medium">{conn.name}</p>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div>
              <Label>Assign to Location</Label>
              <Select 
                value={manualDevice.location} 
                onValueChange={(v) => setManualDevice({ ...manualDevice, location: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select area..." />
                </SelectTrigger>
                <SelectContent>
                  {locationAreas.map(area => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.icon} {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {manualDevice.type === 'display' && (
              <div>
                <Label>Display Content</Label>
                <Select 
                  value={manualDevice.assignedDisplay} 
                  onValueChange={(v) => setManualDevice({ ...manualDevice, assignedDisplay: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {displayPages.map(page => (
                      <SelectItem key={page.id} value={page.id}>{page.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
              <p className="font-semibold mb-1">💡 Setup Tip:</p>
              <p>
                {manualDevice.connectionType === 'hdmi' && "Connect the HDMI cable from your computer to the display, then open the assigned page in a browser and drag it to the external display."}
                {manualDevice.connectionType === 'usb' && "Connect via USB and install any required drivers. For USB displays, extend your desktop to the connected monitor."}
                {manualDevice.connectionType === 'printer_cable' && "Connect the printer cable and install printer drivers. The device will appear in your system's printer list."}
                {manualDevice.connectionType === 'ethernet' && "Connect via ethernet cable. The device should automatically get an IP address from your router."}
                {(manualDevice.connectionType === 'wifi' || manualDevice.connectionType === 'bluetooth') && "Use the WiFi or Bluetooth scan tabs to find and connect to wireless devices."}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddManual(false)}>Cancel</Button>
            <Button onClick={handleAddManualDevice} disabled={!manualDevice.name.trim()}>
              Add Device
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Display Configuration Dialog */}
      <Dialog open={showDisplayConfig} onOpenChange={setShowDisplayConfig}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Configure Display: {selectedDevice?.customName || selectedDevice?.name}</DialogTitle>
          </DialogHeader>
          {selectedDevice && (
            <div className="space-y-6">
              {/* Display Page Selection */}
              <div>
                <Label className="text-base font-semibold">What should this display show?</Label>
                <div className="grid gap-2 mt-3">
                  {displayPages.map(page => (
                    <Card
                      key={page.id}
                      className={`cursor-pointer transition-all ${
                        (selectedDevice.assignedDisplay || 'KitchenDisplay') === page.id
                          ? 'border-2 border-purple-500 bg-purple-50'
                          : 'border hover:border-purple-300'
                      }`}
                      onClick={() => {
                        handleSetDisplayPage(selectedDevice.id, page.id);
                        setSelectedDevice({ ...selectedDevice, assignedDisplay: page.id });
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{page.name}</h4>
                            <p className="text-sm text-slate-500">{page.description}</p>
                          </div>
                          {(selectedDevice.assignedDisplay || 'KitchenDisplay') === page.id && (
                            <CheckCircle className="w-5 h-5 text-purple-600" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* URL to Open */}
              <div className="bg-slate-50 rounded-xl p-4">
                <Label className="text-base font-semibold mb-2 block">
                  Open this URL on your {selectedDevice.type || 'device'}:
                </Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={getDisplayUrl(selectedDevice.assignedDisplay || 'KitchenDisplay')}
                    readOnly
                    className="font-mono text-sm bg-white"
                  />
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(getDisplayUrl(selectedDevice.assignedDisplay || 'KitchenDisplay'))}
                  >
                    {copiedUrl ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Device-Specific Instructions */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  How to display on {selectedDevice.name}
                </h4>
                {selectedDevice.deviceType?.includes('lg') || selectedDevice.name?.toLowerCase().includes('lg') ? (
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal ml-4">
                    <li>On your LG TV, press the <strong>Home</strong> button</li>
                    <li>Open the <strong>Web Browser</strong> app</li>
                    <li>Type or paste the URL above in the address bar</li>
                    <li>Bookmark the page for quick access</li>
                  </ol>
                ) : selectedDevice.deviceType?.includes('samsung') || selectedDevice.name?.toLowerCase().includes('samsung') ? (
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal ml-4">
                    <li>On your Samsung TV, press <strong>Home</strong></li>
                    <li>Open the <strong>Internet</strong> browser app</li>
                    <li>Enter the URL above</li>
                    <li>Add to favorites for easy access</li>
                  </ol>
                ) : selectedDevice.type?.toLowerCase().includes('tablet') || selectedDevice.name?.toLowerCase().includes('ipad') ? (
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal ml-4">
                    <li>Open <strong>Safari</strong> or <strong>Chrome</strong> on the tablet</li>
                    <li>Enter the URL above</li>
                    <li>Tap <strong>Share</strong> → <strong>Add to Home Screen</strong></li>
                    <li>Enable <strong>Guided Access</strong> (Settings → Accessibility) to lock the app</li>
                  </ol>
                ) : selectedDevice.deviceType?.includes('chromecast') ? (
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal ml-4">
                    <li>Open Chrome on your computer</li>
                    <li>Go to the URL above</li>
                    <li>Click <strong>⋮</strong> (three dots) → <strong>Cast</strong></li>
                    <li>Select your Chromecast device</li>
                  </ol>
                ) : selectedDevice.deviceType?.includes('roku') ? (
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal ml-4">
                    <li>Screen mirror from your phone/computer</li>
                    <li>Or use <strong>Apple AirPlay</strong> if supported</li>
                    <li>Navigate to the URL on your mirrored device</li>
                  </ol>
                ) : (
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal ml-4">
                    <li>Open a web browser on the device</li>
                    <li>Navigate to the URL above</li>
                    <li>Bookmark for quick access</li>
                  </ol>
                )}
              </div>

              {/* Open Window Button */}
              <Button
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={() => openDisplayOnDevice(selectedDevice)}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Display in New Window (for screen sharing)
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
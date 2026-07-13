import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { createPageUrl } from "@/utils";
import DeviceManager from "@/components/devices/DeviceManager";
import {
  Printer,
  Bluetooth,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  Wifi,
  Settings,
  Download,
  Zap,
  Tag,
  Monitor,
  Search,
  LayoutList
} from "lucide-react";

export default function PrinterSetup() {
  const [connectedPrinters, setConnectedPrinters] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState(null);
  const [printerStatus, setPrinterStatus] = useState({});
  const [testPrintStatus, setTestPrintStatus] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("kitchen_ticket");
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  // Check URL for tab parameter
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get('tab') || 'bluetooth';
  const [connectionMethod, setConnectionMethod] = useState(initialTab);
  const [wifiPrinterIP, setWifiPrinterIP] = useState("");
  const [wifiPrinterPort, setWifiPrinterPort] = useState("9100");
  const [discoveredDevices, setDiscoveredDevices] = useState([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [wifiScanResults, setWifiScanResults] = useState([]);

  useEffect(() => {
    // Load saved printers from localStorage
    const saved = localStorage.getItem('connectedPrinters');
    if (saved) {
      setConnectedPrinters(JSON.parse(saved));
    }
  }, []);

  const savePrinters = (printers) => {
    localStorage.setItem('connectedPrinters', JSON.stringify(printers));
    setConnectedPrinters(printers);
  };

  const scanForBluetoothDevices = async () => {
    setIsDiscovering(true);
    setDiscoveredDevices([]);
    setTestPrintStatus("🔍 Scanning for ALL nearby Bluetooth devices (printers, displays, tablets, TVs)...");

    try {
      if (!navigator.bluetooth) {
        setTestPrintStatus("❌ Web Bluetooth not supported. Try Chrome/Edge on desktop or use WiFi scanning.");
        setIsDiscovering(false);
        return;
      }

      // Request ANY Bluetooth device - shows browser's device picker with all nearby devices
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          // Printer services
          'battery_service',
          '000018f0-0000-1000-8000-00805f9b34fb', // Generic Serial
          '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ESC/POS
          '0000fee7-0000-1000-8000-00805f9b34fb', // Custom printer
          '00001101-0000-1000-8000-00805f9b34fb', // Serial Port Profile
          // Display/TV services
          '0000180a-0000-1000-8000-00805f9b34fb', // Device Information
          '00001800-0000-1000-8000-00805f9b34fb', // Generic Access
          '00001812-0000-1000-8000-00805f9b34fb', // HID (for some displays)
          // Audio/Video services (smart TVs, speakers)
          '0000110b-0000-1000-8000-00805f9b34fb', // A2DP Audio Sink
          '0000110a-0000-1000-8000-00805f9b34fb', // A2DP Audio Source
          '0000111e-0000-1000-8000-00805f9b34fb', // Handsfree
        ]
      });

      if (device) {
        const deviceType = detectDeviceType(device.name || '');
        const deviceInfo = {
          id: device.id,
          name: device.name || 'Unknown Device',
          type: deviceType.type,
          category: deviceType.category,
          icon: deviceType.icon,
          device: device
        };
        setDiscoveredDevices(prev => [...prev.filter(d => d.id !== device.id), deviceInfo]);
        setTestPrintStatus(`✓ Found: ${device.name || 'Unknown Device'} (${deviceType.type}) - Click Connect to pair`);
      }
    } catch (error) {
      if (error.name === 'NotFoundError') {
        setTestPrintStatus("No device selected. Click 'Scan Nearby' again to see all available Bluetooth devices.");
      } else if (error.name === 'SecurityError') {
        setTestPrintStatus("❌ Bluetooth permission denied. Please allow Bluetooth access in your browser.");
      } else {
        setTestPrintStatus(`Scan complete. Click 'Scan Nearby' to find more devices.`);
      }
    }
    setIsDiscovering(false);
  };

  const detectDeviceType = (name) => {
    if (!name) return { type: 'Unknown Device', category: 'unknown', icon: 'bluetooth' };
    const nameLower = name.toLowerCase();
    
    // Printers
    if (nameLower.includes('printer') || nameLower.includes('pos') || nameLower.includes('thermal') ||
        nameLower.includes('star') || nameLower.includes('tsp') || nameLower.includes('epson') ||
        nameLower.includes('tm-') || nameLower.includes('munbyn') || nameLower.includes('volcora') ||
        nameLower.includes('rongta') || nameLower.includes('bt-') || nameLower.includes('rpp')) {
      return { type: 'Thermal Printer', category: 'printer', icon: 'printer' };
    }
    
    // TVs and Displays
    if (nameLower.includes('tv') || nameLower.includes('samsung') || nameLower.includes('lg') ||
        nameLower.includes('sony') || nameLower.includes('tcl') || nameLower.includes('vizio') ||
        nameLower.includes('roku') || nameLower.includes('fire') || nameLower.includes('chromecast') ||
        nameLower.includes('display') || nameLower.includes('monitor') || nameLower.includes('screen')) {
      return { type: 'Smart TV/Display', category: 'display', icon: 'monitor' };
    }
    
    // Tablets
    if (nameLower.includes('ipad') || nameLower.includes('tab') || nameLower.includes('galaxy tab') ||
        nameLower.includes('surface') || nameLower.includes('kindle') || nameLower.includes('lenovo tab')) {
      return { type: 'Tablet', category: 'tablet', icon: 'tablet' };
    }
    
    // Phones (could be used as displays)
    if (nameLower.includes('iphone') || nameLower.includes('pixel') || nameLower.includes('galaxy') ||
        nameLower.includes('phone') || nameLower.includes('mobile')) {
      return { type: 'Mobile Device', category: 'mobile', icon: 'smartphone' };
    }
    
    // Computers
    if (nameLower.includes('macbook') || nameLower.includes('laptop') || nameLower.includes('pc') ||
        nameLower.includes('desktop') || nameLower.includes('computer')) {
      return { type: 'Computer', category: 'computer', icon: 'laptop' };
    }
    
    // Speakers (could be smart displays)
    if (nameLower.includes('speaker') || nameLower.includes('echo') || nameLower.includes('home') ||
        nameLower.includes('nest') || nameLower.includes('sonos') || nameLower.includes('bose')) {
      return { type: 'Smart Speaker/Display', category: 'speaker', icon: 'speaker' };
    }
    
    return { type: 'Bluetooth Device', category: 'unknown', icon: 'bluetooth' };
  };

  const connectToBluetoothDevice = async (deviceInfo) => {
    setTestPrintStatus(`Connecting to ${deviceInfo.name}...`);
    
    try {
      const server = await deviceInfo.device.gatt.connect();
      setTestPrintStatus(`✓ Connected to ${deviceInfo.name}`);

      const newPrinter = {
        id: deviceInfo.id,
        name: deviceInfo.name,
        type: deviceInfo.type || 'Bluetooth Printer',
        connected: true,
        connectionType: 'bluetooth',
        device: deviceInfo.device,
        server: server,
        lastConnected: new Date().toISOString()
      };

      const updated = [...connectedPrinters.filter(p => p.id !== deviceInfo.id), newPrinter];
      savePrinters(updated);
      setSelectedPrinter(newPrinter);
      setPrinterStatus({ ...printerStatus, [deviceInfo.id]: 'connected' });
      setDiscoveredDevices([]);
    } catch (error) {
      setTestPrintStatus(`❌ Failed to connect: ${error.message}`);
    }
  };

  const scanForWifiDevices = async () => {
    setIsDiscovering(true);
    setWifiScanResults([]);
    setTestPrintStatus("🔍 Detecting network and scanning for devices...");

    const foundDevices = [];
    let networkPrefixes = ["192.168.1", "192.168.0", "192.168.2", "10.0.0", "10.0.1"];
    
    // Detect local network prefix
    try {
      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      pc.createDataChannel('');
      await pc.setLocalDescription(await pc.createOffer());
      
      await new Promise(r => {
        pc.onicecandidate = (ice) => {
          if (ice?.candidate?.candidate) {
            const matches = ice.candidate.candidate.match(/(\d+\.\d+\.\d+)\.\d+/g);
            if (matches) {
              matches.forEach(ip => {
                const prefix = ip.match(/(\d+\.\d+\.\d+)/)?.[1];
                if (prefix && !prefix.startsWith('0.') && prefix !== '127.0.0') {
                  if (!networkPrefixes.includes(prefix)) {
                    networkPrefixes.unshift(prefix);
                  }
                }
              });
            }
          }
        };
        setTimeout(r, 1000);
      });
      pc.close();
    } catch (e) {
      console.log('Network detection fallback');
    }

    const primaryPrefix = networkPrefixes[0];
    setTestPrintStatus(`🔍 Scanning ${primaryPrefix}.x network...`);

    // Comprehensive device ports - Epson printers use multiple ports
    const devicePorts = [
      // Epson Printers (ET-4800 uses these)
      { port: 9100, type: 'printer', name: 'Network Printer (RAW)' },
      { port: 631, type: 'printer', name: 'IPP Printer' },
      { port: 515, type: 'printer', name: 'LPD Printer' },
      { port: 80, type: 'printer_web', name: 'Printer Web Interface' },
      { port: 443, type: 'printer_web', name: 'Printer Web (HTTPS)' },
      // Epson specific
      { port: 3289, type: 'epson', name: 'Epson Printer' },
      { port: 2968, type: 'epson', name: 'Epson Discovery' },
      // LG TV (WebOS) - Multiple ports for discovery
      { port: 3000, type: 'lg_tv', name: 'LG TV' },
      { port: 3001, type: 'lg_tv', name: 'LG TV (SSL)' },
      { port: 1080, type: 'lg_tv', name: 'LG TV' },
      { port: 18181, type: 'lg_tv', name: 'LG TV' },
      { port: 9998, type: 'lg_tv', name: 'LG TV Control' },
      { port: 8080, type: 'lg_tv', name: 'LG TV Web' },
      // Samsung TV
      { port: 8001, type: 'samsung_tv', name: 'Samsung TV' },
      { port: 8002, type: 'samsung_tv', name: 'Samsung TV (SSL)' },
      { port: 55000, type: 'samsung_tv', name: 'Samsung TV Remote' },
      // Vizio TV
      { port: 7345, type: 'vizio_tv', name: 'Vizio TV' },
      { port: 9000, type: 'vizio_tv', name: 'Vizio TV' },
      // Roku / Onn / TCL
      { port: 8060, type: 'roku_tv', name: 'Roku/Onn/TCL TV' },
      // Chromecast / Google TV
      { port: 8008, type: 'chromecast', name: 'Chromecast' },
      { port: 8009, type: 'chromecast', name: 'Chromecast (SSL)' },
      { port: 8443, type: 'chromecast', name: 'Google TV' },
      // Fire TV
      { port: 5555, type: 'fire_tv', name: 'Fire TV' },
      // AirPlay
      { port: 7000, type: 'airplay', name: 'AirPlay' },
      // Sony Bravia
      { port: 10443, type: 'sony_tv', name: 'Sony TV' },
      // Philips
      { port: 1925, type: 'philips_tv', name: 'Philips TV' },
    ];

    // Generate IP list - common device ranges only
    const ipsToScan = [];
    // Most home routers assign IPs in 1-50 and 100-150 ranges
    for (let i = 1; i <= 50; i++) {
      ipsToScan.push(`${primaryPrefix}.${i}`);
    }
    for (let i = 100; i <= 150; i++) {
      ipsToScan.push(`${primaryPrefix}.${i}`);
    }
    // Also add common static IPs
    [200, 201, 202, 250, 251, 252, 253, 254].forEach(i => {
      ipsToScan.push(`${primaryPrefix}.${i}`);
    });

    const timeout = 1500; // Longer timeout for real devices
    const batchSize = 20; // Smaller batch for accuracy

    // Helper to check if device responds - strict verification
    const checkDevice = async (ip, port, type, name) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      const startTime = Date.now();
      
      try {
        // First, try to actually connect with cors mode to see if we get a real response
        const response = await fetch(`http://${ip}:${port}/`, {
          method: 'GET',
          mode: 'no-cors',
          signal: controller.signal,
          cache: 'no-store',
        });
        clearTimeout(timeoutId);
        const elapsed = Date.now() - startTime;
        
        // STRICT: Only count if response was very fast (< 150ms) 
        // Real devices on local network respond in 5-100ms typically
        // Timeouts that "succeed" take longer
        if (elapsed < 150 && response.type === 'opaque') {
          return { ip, port, type, name: `${name} (${ip})`, responseTime: elapsed, verified: true };
        }
      } catch (e) {
        clearTimeout(timeoutId);
      }
      return null;
    };

    // Create scan tasks
    const allTasks = ipsToScan.flatMap(ip => 
      devicePorts.map(({ port, type, name }) => ({ ip, port, type, name }))
    );

    // Process in batches
    let scannedCount = 0;
    const totalTasks = allTasks.length;

    for (let i = 0; i < allTasks.length; i += batchSize) {
      const batch = allTasks.slice(i, i + batchSize);
      const promises = batch.map(({ ip, port, type, name }) => 
        checkDevice(ip, port, type, name)
      );
      
      const results = await Promise.all(promises);
      scannedCount += batch.length;
      
      results.filter(Boolean).forEach(device => {
        // Deduplicate by IP+port
        const key = `${device.ip}:${device.port}`;
        if (!foundDevices.find(d => `${d.ip}:${d.port}` === key)) {
          foundDevices.push(device);
          setWifiScanResults([...foundDevices]);
        }
      });
      
      const progress = Math.round((scannedCount / totalTasks) * 100);
      setTestPrintStatus(`🔍 Scanning ${progress}%... Found ${foundDevices.length} device(s)`);
    }

    // Consolidate results - group by IP and pick best port
    // Only include devices that had verified responses
    const verifiedDevices = foundDevices.filter(d => d.verified);
    const consolidatedDevices = [];
    const ipGroups = {};
    
    verifiedDevices.forEach(device => {
      if (!ipGroups[device.ip]) {
        ipGroups[device.ip] = [];
      }
      ipGroups[device.ip].push(device);
    });

    Object.entries(ipGroups).forEach(([ip, devices]) => {
      // Check what ports responded to determine device type accurately
      const ports = devices.map(d => d.port);
      
      // TV-specific ports (these are ONLY used by TVs, never printers)
      const tvPorts = [3000, 3001, 1080, 18181, 9998, 8001, 8002, 55000, 7345, 8060, 8008, 8009, 8443, 5555, 7000, 10443, 1925];
      const printerPorts = [9100, 631, 515, 3289, 2968];
      
      const hasTvPort = ports.some(p => tvPorts.includes(p));
      const hasPrinterPort = ports.some(p => printerPorts.includes(p));
      
      // If device has TV-specific ports, it's a TV (even if port 80 also responded)
      if (hasTvPort && !hasPrinterPort) {
        const tvDevice = devices.find(d => tvPorts.includes(d.port));
        if (tvDevice) {
          consolidatedDevices.push(tvDevice);
        }
      } 
      // If device has printer-specific ports, it's a printer
      else if (hasPrinterPort) {
        const printerDevice = devices.find(d => printerPorts.includes(d.port));
        if (printerDevice) {
          consolidatedDevices.push({ ...printerDevice, type: 'printer', name: `Network Printer (${ip})` });
        }
      }
      // Port 80/8080 alone is ambiguous - check the original device type detection
      else {
        const webDevice = devices.find(d => d.port === 80 || d.port === 8080);
        if (webDevice) {
          // Don't auto-classify port 80 devices - they could be anything
          // Only add if we have more context
        }
      }
    });

    setWifiScanResults(consolidatedDevices);
    
    if (consolidatedDevices.length > 0) {
      setTestPrintStatus(`✓ Found ${consolidatedDevices.length} device(s) on your WiFi network!`);
    } else {
      setTestPrintStatus("ℹ️ No printers or displays found on your WiFi. Make sure devices are powered on and connected to the same network.");
    }
    
    setIsDiscovering(false);
  };

  const connectToWifiDevice = async (device) => {
    setTestPrintStatus(`Connecting to ${device.name} (${device.ip})...`);

    // Determine device category and display name
    const getDeviceInfo = (type) => {
      const tvTypes = ['samsung_tv', 'lg_tv', 'vizio_tv', 'roku_tv', 'tcl_tv', 'fire_tv', 'sony_tv', 'philips_tv', 'chromecast', 'airplay'];
      const printerTypes = ['printer'];
      const tabletTypes = ['android_tablet', 'web_display'];
      
      if (tvTypes.includes(type)) {
        return { category: 'Kitchen Display', icon: 'tv', isDisplay: true };
      } else if (printerTypes.includes(type)) {
        return { category: 'Network Printer', icon: 'printer', isDisplay: false };
      } else if (tabletTypes.includes(type)) {
        return { category: 'Tablet/Display', icon: 'tablet', isDisplay: true };
      }
      return { category: 'Network Device', icon: 'device', isDisplay: false };
    };

    const deviceInfo = getDeviceInfo(device.type);
    const kitchenDisplayUrl = `${window.location.origin}${createPageUrl("KitchenDisplay")}`;

    const newDevice = {
      id: `wifi-${device.ip}-${device.port}`,
      name: device.name,
      type: deviceInfo.category,
      connected: true,
      connectionType: 'wifi',
      ipAddress: device.ip,
      port: device.port.toString(),
      deviceType: device.type,
      deviceIcon: deviceInfo.icon,
      lastConnected: new Date().toISOString(),
      isDisplay: deviceInfo.isDisplay,
      displayUrl: kitchenDisplayUrl
    };

    const updated = [...connectedPrinters.filter(p => p.id !== newDevice.id), newDevice];
    savePrinters(updated);
    
    // Auto-open Kitchen Display for TV/display devices
    if (deviceInfo.isDisplay) {
      setTestPrintStatus(`✓ Connected to ${device.name}! Opening Kitchen Display...`);
      // Open Kitchen Display in new window for casting/mirroring
      const displayWindow = window.open(kitchenDisplayUrl, `display-${device.ip}`, 'width=1920,height=1080');
      if (displayWindow) {
        setTestPrintStatus(`✓ Kitchen Display opened! Cast or mirror this window to ${device.name}.`);
      } else {
        setTestPrintStatus(`✓ Connected! Open this URL on ${device.name}: ${kitchenDisplayUrl}`);
      }
    } else {
      setTestPrintStatus(`✓ Connected to ${device.name}!`);
    }
    
    setWifiScanResults(prev => prev.filter(d => d.ip !== device.ip || d.port !== device.port));
  };

  const scanForPrinters = async () => {
    setIsScanning(true);
    setTestPrintStatus("Scanning for Bluetooth printers...");

    try {
      // Check if Web Bluetooth is supported
      if (!navigator.bluetooth) {
        setTestPrintStatus("❌ Web Bluetooth not supported. Try: 1) Use Chrome/Edge on desktop, 2) Enable WiFi printing below, or 3) Use native mobile app.");
        setIsScanning(false);
        return;
      }

      // Enhanced printer scanning with multiple service UUIDs
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          // Generic Serial Port Profile (works with most printers)
          { services: ['000018f0-0000-1000-8000-00805f9b34fb'] },
          // ESC/POS Printer Service
          { services: ['49535343-fe7d-4ae5-8fa9-9fafd205e455'] },
          // Generic Attribute Profile
          { services: ['00001801-0000-1000-8000-00805f9b34fb'] },
          // Name-based filters for known printers
          { namePrefix: 'RONGTA' },
          { namePrefix: 'R22' },
          { namePrefix: 'Inkwon' },
          { namePrefix: 'B21' },
          { namePrefix: 'Jadens' },
          { namePrefix: 'JD23' },
          { namePrefix: 'JB23' },
          { namePrefix: 'MUNBYN' },
          { namePrefix: 'RPP' },
          { namePrefix: 'BlueTooth Printer' },
          { namePrefix: 'BT-' },
          { namePrefix: 'Printer' }
        ],
        optionalServices: [
          'battery_service',
          '000018f0-0000-1000-8000-00805f9b34fb',
          '49535343-fe7d-4ae5-8fa9-9fafd205e455',
          '0000fee7-0000-1000-8000-00805f9b34fb'
        ]
      });

      setTestPrintStatus(`✓ Found: ${device.name || 'Unknown Printer'}`);

      // Connect to the device
      const server = await device.gatt.connect();
      setTestPrintStatus(`✓ Connected to ${device.name || 'Printer'}`);

      // Try to get printer service and characteristic
      try {
        const services = await server.getPrimaryServices();
        console.log('Available services:', services.map(s => s.uuid));
      } catch (e) {
        console.log('Could not enumerate services:', e);
      }

      // Save printer
      const newPrinter = {
        id: device.id,
        name: device.name || 'Bluetooth Printer',
        type: detectPrinterType(device.name),
        connected: true,
        connectionType: 'bluetooth',
        device: device,
        server: server,
        lastConnected: new Date().toISOString()
      };

      const updated = [...connectedPrinters.filter(p => p.id !== device.id), newPrinter];
      savePrinters(updated);

      setSelectedPrinter(newPrinter);
      setPrinterStatus({ ...printerStatus, [device.id]: 'connected' });

    } catch (error) {
      console.error('Bluetooth error:', error);
      if (error.name === 'NotFoundError') {
        setTestPrintStatus("❌ No printer selected. Make sure printer is: 1) Powered ON 2) In pairing mode (blue LED blinking) 3) Within 10 feet");
      } else if (error.name === 'SecurityError') {
        setTestPrintStatus("❌ Bluetooth permission denied. Click 'Allow' when browser asks for Bluetooth access.");
      } else if (error.name === 'NetworkError') {
        setTestPrintStatus("❌ Cannot connect. Try: 1) Restart printer 2) Re-scan 3) Use WiFi printing option below");
      } else {
        setTestPrintStatus(`❌ Error: ${error.message}. Try WiFi printing option or contact support.`);
      }
    }

    setIsScanning(false);
  };

  const detectPrinterType = (name) => {
    if (!name) return 'Bluetooth Device';
    const nameLower = name.toLowerCase();
    // Printers
    if (nameLower.includes('star') || nameLower.includes('tsp')) return 'Star Micronics Printer';
    if (nameLower.includes('epson') || nameLower.includes('tm-')) return 'Epson Thermal Printer';
    if (nameLower.includes('munbyn')) return 'MUNBYN Printer';
    if (nameLower.includes('volcora')) return 'Volcora POS Printer';
    if (nameLower.includes('printer') || nameLower.includes('pos') || nameLower.includes('thermal')) return 'Thermal Printer';
    // Displays & Tablets
    if (nameLower.includes('ipad') || nameLower.includes('apple')) return 'Apple iPad';
    if (nameLower.includes('samsung') || nameLower.includes('galaxy')) return 'Samsung Device';
    if (nameLower.includes('fire') || nameLower.includes('amazon')) return 'Amazon Fire Device';
    if (nameLower.includes('lenovo') || nameLower.includes('tab')) return 'Lenovo Tablet';
    if (nameLower.includes('chromecast') || nameLower.includes('google')) return 'Google Chromecast';
    if (nameLower.includes('roku')) return 'Roku Device';
    if (nameLower.includes('lg') || nameLower.includes('webos')) return 'LG Smart TV';
    if (nameLower.includes('tcl')) return 'TCL/Roku TV';
    if (nameLower.includes('tv') || nameLower.includes('display') || nameLower.includes('monitor')) return 'Smart Display';
    return 'Bluetooth Device';
  };

  const labelTemplates = {
    kitchen_ticket: {
      name: "Kitchen Order Ticket",
      description: "Full order details for kitchen staff",
      icon: "🍔",
      generate: (sampleData) => {
        const line = '================================';
        const halfLine = '----------------';
        
        let content = `${line}\n`;
        content += `   🍔 KITCHEN ORDER #${sampleData.orderNum}\n`;
        content += `${line}\n\n`;
        content += `Time: ${sampleData.time}\n`;
        content += `Customer: ${sampleData.customerName}\n`;
        content += `Type: ${sampleData.orderType}\n\n`;
        content += `${halfLine}\n`;
        content += `ITEMS:\n`;
        content += `${halfLine}\n\n`;
        
        sampleData.items.forEach((item, idx) => {
          content += `${idx + 1}. ${item.name} x${item.quantity}\n`;
          if (item.notes) {
            content += `   ⚠️ ${item.notes}\n`;
          }
          content += `\n`;
        });
        
        if (sampleData.specialRequests) {
          content += `${halfLine}\n`;
          content += `⚠️ SPECIAL REQUESTS:\n`;
          content += `${sampleData.specialRequests}\n`;
          content += `${halfLine}\n`;
        }
        
        content += `\n${line}\n`;
        return content;
      }
    },
    quick_label: {
      name: "Quick Order Label",
      description: "Compact label with order essentials",
      icon: "🏷️",
      generate: (sampleData) => {
        let content = `┌────────────────────┐\n`;
        content += `│ ORDER #${sampleData.orderNum}      │\n`;
        content += `├────────────────────┤\n`;
        content += `│ ${sampleData.customerName.padEnd(18)}│\n`;
        content += `│ ${sampleData.time.padEnd(18)}│\n`;
        content += `├────────────────────┤\n`;
        sampleData.items.forEach((item) => {
          content += `│ ${item.quantity}x ${item.name.padEnd(16)}│\n`;
        });
        content += `└────────────────────┘\n`;
        return content;
      }
    },
    product_label: {
      name: "Product Label",
      description: "Label for food containers and prep items",
      icon: "📦",
      generate: (sampleData) => {
        let content = `╔════════════════════╗\n`;
        content += `║  PRODUCT LABEL     ║\n`;
        content += `╠════════════════════╣\n`;
        content += `║ ${sampleData.productName.padEnd(18)}║\n`;
        content += `║                    ║\n`;
        content += `║ Prep: ${sampleData.prepDate.padEnd(12)}║\n`;
        content += `║ Expires: ${sampleData.expireDate.padEnd(9)}║\n`;
        content += `║                    ║\n`;
        content += `║ Prep by: ${sampleData.prepBy.padEnd(9)}║\n`;
        content += `╚════════════════════╝\n`;
        return content;
      }
    },
    table_number: {
      name: "Table Number",
      description: "Large table assignment label",
      icon: "🪑",
      generate: (sampleData) => {
        let content = `\n\n`;
        content += `   ╔═══════════════╗\n`;
        content += `   ║               ║\n`;
        content += `   ║   TABLE ${sampleData.tableNum.padEnd(2)}    ║\n`;
        content += `   ║               ║\n`;
        content += `   ║   ${sampleData.partySize} GUESTS     ║\n`;
        content += `   ║               ║\n`;
        content += `   ╚═══════════════╝\n`;
        content += `\n\n`;
        return content;
      }
    },
    receipt_short: {
      name: "Short Receipt",
      description: "Compact receipt for quick transactions",
      icon: "🧾",
      generate: (sampleData) => {
        let content = `================================\n`;
        content += `   RESTROBUDDY\n`;
        content += `   Quick Receipt\n`;
        content += `================================\n\n`;
        content += `Order #${sampleData.orderNum}\n`;
        content += `${sampleData.time}\n\n`;
        content += `${sampleData.items.length} Items\n\n`;
        sampleData.items.forEach((item) => {
          const lineTotal = (item.quantity * item.price).toFixed(2);
          content += `${item.name.padEnd(16)} $${lineTotal.padStart(6)}\n`;
        });
        content += `\n--------------------------------\n`;
        content += `Total:              $${sampleData.total.padStart(6)}\n`;
        content += `================================\n\n`;
        content += `Thank you!\n\n`;
        return content;
      }
    },
    allergen_warning: {
      name: "Allergen Warning",
      description: "Allergy and dietary information label",
      icon: "⚠️",
      generate: (sampleData) => {
        let content = `┏━━━━━━━━━━━━━━━━━━━━┓\n`;
        content += `┃ ⚠️ ALLERGEN INFO  ┃\n`;
        content += `┣━━━━━━━━━━━━━━━━━━━━┫\n`;
        content += `┃                    ┃\n`;
        content += `┃ ${sampleData.itemName.padEnd(18)}┃\n`;
        content += `┃                    ┃\n`;
        content += `┃ Contains:          ┃\n`;
        sampleData.allergens.forEach(allergen => {
          content += `┃  • ${allergen.padEnd(16)}┃\n`;
        });
        content += `┃                    ┃\n`;
        if (sampleData.dietary) {
          content += `┃ ${sampleData.dietary.padEnd(18)}┃\n`;
        }
        content += `┗━━━━━━━━━━━━━━━━━━━━┛\n`;
        return content;
      }
    }
  };

  const getSampleData = (templateId) => {
    const samples = {
      kitchen_ticket: {
        orderNum: "001234",
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        customerName: "John Smith",
        orderType: "DINE-IN",
        items: [
          { name: "Classic Burger", quantity: 2, notes: "No onions" },
          { name: "French Fries", quantity: 2, notes: "" },
          { name: "Coca-Cola", quantity: 2, notes: "" }
        ],
        specialRequests: "Extra crispy fries, serve hot"
      },
      quick_label: {
        orderNum: "001234",
        customerName: "John S.",
        time: "02:45 PM",
        items: [
          { name: "Burger", quantity: 2 },
          { name: "Fries", quantity: 2 }
        ]
      },
      product_label: {
        productName: "Caesar Salad",
        prepDate: "Jan 15",
        expireDate: "Jan 17",
        prepBy: "Chef Mike"
      },
      table_number: {
        tableNum: "12",
        partySize: "4"
      },
      receipt_short: {
        orderNum: "001234",
        time: new Date().toLocaleString(),
        items: [
          { name: "Burger", quantity: 2, price: 12.99 },
          { name: "Fries", quantity: 2, price: 4.99 },
          { name: "Drink", quantity: 2, price: 2.99 }
        ],
        total: "41.94"
      },
      allergen_warning: {
        itemName: "Chicken Pasta",
        allergens: ["Gluten", "Dairy", "Eggs"],
        dietary: "Contains: Wheat"
      }
    };
    return samples[templateId] || samples.kitchen_ticket;
  };

  const handlePreviewTemplate = (templateId) => {
    setSelectedTemplate(templateId);
    const template = labelTemplates[templateId];
    const sampleData = getSampleData(templateId);
    const content = template.generate(sampleData);
    setPreviewContent(content);
    setShowPreview(true);
  };

  const handlePrintPreview = () => {
    const printWindow = window.open('', '', 'width=300,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>${labelTemplates[selectedTemplate].name}</title>
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 12px; 
              margin: 10px;
              width: 200px;
            }
            pre { 
              white-space: pre-wrap; 
              margin: 0;
              line-height: 1.3;
            }
          </style>
        </head>
        <body>
          <pre>${previewContent}</pre>
        </body>
      </html>
    `);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const testPrint = async (printer) => {
    setTestPrintStatus(`Sending test print to ${printer.name}...`);

    try {
      const template = labelTemplates[selectedTemplate];
      const sampleData = getSampleData(selectedTemplate);
      const testContent = template.generate(sampleData);
      
      const isReceiptPrinter = printer.type?.toLowerCase().includes('thermal') || 
                               printer.type?.toLowerCase().includes('receipt') ||
                               printer.type?.toLowerCase().includes('pos');

      // Different styling for receipt printers vs regular printers
      const pageStyle = isReceiptPrinter ? `
        @page { size: 80mm auto; margin: 0; }
        body { 
          font-family: 'Courier New', monospace; 
          font-size: 12px; 
          margin: 5mm;
          width: 70mm;
        }
        pre { white-space: pre-wrap; margin: 0; line-height: 1.4; }
      ` : `
        @page { size: auto; margin: 10mm; }
        body { 
          font-family: 'Courier New', monospace; 
          font-size: 14px; 
          margin: 20px;
        }
        pre { white-space: pre-wrap; margin: 0; line-height: 1.5; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 18px; }
        .header p { margin: 5px 0; color: #666; font-size: 12px; }
      `;

      // Create an iframe for printing (more reliable than window.open)
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = 'none';
      document.body.appendChild(printFrame);

      const printDocument = printFrame.contentWindow.document;
      printDocument.open();
      printDocument.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Test Print - ${printer.name}</title>
            <style>${pageStyle}</style>
          </head>
          <body>
            <div class="header">
              <h1>RESTROBUDDY Test Print</h1>
              <p>Printer: ${printer.name}</p>
              <p>Time: ${new Date().toLocaleString()}</p>
            </div>
            <hr style="border: 1px dashed #ccc; margin: 15px 0;">
            <pre>${testContent}</pre>
            <hr style="border: 1px dashed #ccc; margin: 15px 0;">
            <p style="text-align: center; font-size: 11px; color: #888;">
              If you see this, your printer is working correctly!
            </p>
          </body>
        </html>
      `);
      printDocument.close();

      // Wait for content to render, then print
      setTimeout(() => {
        try {
          printFrame.contentWindow.focus();
          printFrame.contentWindow.print();
          setTestPrintStatus(`✓ Print dialog opened! Select "${printer.name}" and click Print.`);
        } catch (printError) {
          console.error('Print error:', printError);
          setTestPrintStatus(`❌ Print failed. Try using browser's print (Ctrl+P / Cmd+P).`);
        }
        
        // Remove iframe after printing
        setTimeout(() => {
          document.body.removeChild(printFrame);
        }, 2000);
      }, 500);

    } catch (error) {
      console.error('Print error:', error);
      setTestPrintStatus(`❌ Failed to print: ${error.message}`);
    }
  };

  const generateESCPOSCommands = (text) => {
    // ESC/POS command bytes
    const ESC = 0x1B;
    const GS = 0x1D;
    
    return {
      initialize: [ESC, 0x40], // Initialize printer
      centerAlign: [ESC, 0x61, 0x01], // Center alignment
      leftAlign: [ESC, 0x61, 0x00], // Left alignment
      bold: [ESC, 0x45, 0x01], // Bold on
      boldOff: [ESC, 0x45, 0x00], // Bold off
      cut: [GS, 0x56, 0x00], // Cut paper
      text: Array.from(text).map(char => char.charCodeAt(0))
    };
  };

  const disconnectPrinter = (printerId) => {
    const updated = connectedPrinters.map(p => 
      p.id === printerId ? { ...p, connected: false } : p
    );
    savePrinters(updated);
    setPrinterStatus({ ...printerStatus, [printerId]: 'disconnected' });
    setTestPrintStatus(`Disconnected from printer`);
  };

  const removePrinter = (printerId) => {
    const updated = connectedPrinters.filter(p => p.id !== printerId);
    savePrinters(updated);
    setTestPrintStatus(`Printer removed`);
  };

  const supportedPrinters = [
    {
      name: "Star Micronics TSP143IV",
      protocol: "ESC/POS",
      features: ["Bluetooth", "WiFi", "iOS/Android", "Auto-Cut"],
      price: "$299",
      category: "printer"
    },
    {
      name: "Star Micronics mPOP",
      protocol: "ESC/POS",
      features: ["Bluetooth", "iOS MFi", "Cash Drawer", "Compact"],
      price: "$399",
      category: "printer"
    },
    {
      name: "Epson TM-m30II",
      protocol: "ESC/POS",
      features: ["Bluetooth", "WiFi", "iOS/Android", "Cloud Ready"],
      price: "$279",
      category: "printer"
    },
    {
      name: "Epson TM-T88VII",
      protocol: "ESC/POS",
      features: ["USB", "WiFi", "Ethernet", "High Speed"],
      price: "$349",
      category: "printer"
    },
    {
      name: "MUNBYN ITPP047",
      protocol: "ESC/POS",
      features: ["Bluetooth", "USB", "Android/Windows", "80mm"],
      price: "$89",
      category: "printer"
    },
    {
      name: "Volcora 80mm POS",
      protocol: "ESC/POS",
      features: ["Bluetooth", "USB", "Auto-Cut", "Windows/Mac"],
      price: "$79",
      category: "printer"
    }
  ];

  const supportedDisplays = [
    {
      name: "Apple iPad (Any Model)",
      features: ["WiFi", "AirPlay", "Safari Browser", "Fresh KDS"],
      connection: "WiFi / AirPlay",
      category: "tablet"
    },
    {
      name: "Samsung Galaxy Tab",
      features: ["WiFi", "Bluetooth", "SmartView", "Chrome"],
      connection: "WiFi / SmartView / Chromecast",
      category: "tablet"
    },
    {
      name: "Amazon Fire Tablet",
      features: ["WiFi", "Silk Browser", "Alexa Cast"],
      connection: "WiFi / Fire TV",
      category: "tablet"
    },
    {
      name: "Lenovo Tab M10/P11",
      features: ["WiFi", "Bluetooth", "Chrome", "Miracast"],
      connection: "WiFi / Miracast",
      category: "tablet"
    },
    {
      name: "Samsung Smart TV",
      features: ["WiFi", "SmartView", "Web Browser", "Screen Mirror"],
      connection: "WiFi / SmartView / HDMI",
      category: "display"
    },
    {
      name: "LG Smart TV (webOS)",
      features: ["WiFi", "AirPlay 2", "Screen Share", "Browser"],
      connection: "WiFi / AirPlay / Miracast",
      category: "display"
    },
    {
      name: "TCL/Roku TV",
      features: ["WiFi", "Apple AirPlay", "Screen Mirror"],
      connection: "WiFi / AirPlay / Roku Cast",
      category: "display"
    },
    {
      name: "Google Chromecast",
      features: ["WiFi", "Chrome Tab Cast", "Screen Mirror"],
      connection: "Chromecast / Google Home",
      category: "display"
    },
    {
      name: "Amazon Fire TV Stick",
      features: ["WiFi", "Screen Mirror", "Alexa"],
      connection: "WiFi / Fire TV App",
      category: "display"
    },
    {
      name: "Any HDMI Display + Chromecast",
      features: ["WiFi", "Chrome Cast", "Universal"],
      connection: "Chromecast Dongle",
      category: "display"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Printer Setup</h1>
          <p className="text-slate-600">Connect and test Bluetooth thermal printers</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Side - Connected Printers */}
          <div className="lg:col-span-2 space-y-6">
            {/* Connection Method Tabs */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
                <CardTitle className="flex items-center gap-2">
                  <Printer className="w-6 h-6" />
                  Connect Printer
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Tabs value={connectionMethod} onValueChange={setConnectionMethod} className="mb-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="bluetooth">
                      <Bluetooth className="w-4 h-4 mr-2" />
                      Bluetooth
                    </TabsTrigger>
                    <TabsTrigger value="wifi">
                      <Wifi className="w-4 h-4 mr-2" />
                      WiFi/Network
                    </TabsTrigger>
                    <TabsTrigger value="kiosk">
                          <Monitor className="w-4 h-4 mr-2" />
                          Kiosk Screens
                        </TabsTrigger>
                        <TabsTrigger value="manage">
                          <LayoutList className="w-4 h-4 mr-2" />
                          My Devices
                        </TabsTrigger>
                      </TabsList>

                  {/* Bluetooth Tab */}
                  <TabsContent value="bluetooth" className="space-y-4 mt-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <h4 className="font-bold text-blue-900 mb-2">✅ Auto-Discovery Enabled</h4>
                      <p className="text-sm text-blue-800">
                        Click scan to automatically find all nearby Bluetooth printers and displays - no pairing code needed!
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={scanForBluetoothDevices}
                        disabled={isDiscovering}
                        className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg"
                      >
                        {isDiscovering ? (
                          <>
                            <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                            Scanning...
                          </>
                        ) : (
                          <>
                            <Bluetooth className="w-5 h-5 mr-2" />
                            Scan Nearby
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={scanForPrinters}
                        disabled={isScanning}
                        variant="outline"
                        className="w-full py-6 text-lg"
                      >
                        {isScanning ? (
                          <>
                            <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                            Scanning...
                          </>
                        ) : (
                          <>
                            <Printer className="w-5 h-5 mr-2" />
                            Printers Only
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Discovered Bluetooth Devices */}
                    {discoveredDevices.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-bold text-slate-900">Found Bluetooth Devices:</h4>
                        {discoveredDevices.map(device => {
                          const isPrinter = device.category === 'printer';
                          const isDisplay = ['display', 'tablet', 'speaker'].includes(device.category);
                          const bgColor = isPrinter ? 'border-green-200 bg-green-50' : 
                                         isDisplay ? 'border-purple-200 bg-purple-50' :
                                         'border-blue-200 bg-blue-50';
                          const iconBg = isPrinter ? 'bg-green-600' : 
                                        isDisplay ? 'bg-purple-600' :
                                        'bg-blue-600';
                          
                          return (
                            <Card key={device.id} className={`border-2 ${bgColor}`}>
                              <CardContent className="p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}>
                                      {isPrinter ? (
                                        <Printer className="w-5 h-5 text-white" />
                                      ) : isDisplay ? (
                                        <Monitor className="w-5 h-5 text-white" />
                                      ) : (
                                        <Bluetooth className="w-5 h-5 text-white" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-bold text-slate-900">{device.name}</p>
                                      <div className="flex items-center gap-2">
                                        <p className="text-xs text-slate-600">{device.type}</p>
                                        <Badge variant="outline" className="text-xs capitalize">{device.category}</Badge>
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => connectToBluetoothDevice(device)}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                  >
                                    Connect
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}

                    <div className="text-sm text-slate-600 space-y-1">
                      <p><strong>Tips for best results:</strong></p>
                      <p>1. Turn ON printer (no pairing mode needed)</p>
                      <p>2. Keep within 30 feet of device</p>
                      <p>3. Click 'Allow' when browser asks permission</p>
                    </div>
                  </TabsContent>

                  {/* WiFi Tab */}
                  <TabsContent value="wifi" className="space-y-4 mt-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <h4 className="font-bold text-green-900 mb-2">✅ Auto-Discover Network Devices</h4>
                      <p className="text-sm text-green-800">
                        Automatically find printers and kitchen displays on your WiFi network - no IP address needed!
                      </p>
                    </div>



                    {/* Scan Button */}
                    <Button
                      onClick={scanForWifiDevices}
                      disabled={isDiscovering}
                      className="w-full bg-green-600 hover:bg-green-700 py-6 text-lg"
                    >
                      {isDiscovering ? (
                        <>
                          <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                          Scanning Network...
                        </>
                      ) : (
                        <>
                          <Search className="w-5 h-5 mr-2" />
                          Scan Network for Devices
                        </>
                      )}
                    </Button>

                    {/* Discovered WiFi Devices */}
                    {wifiScanResults.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-bold text-slate-900">Found on Network ({wifiScanResults.length}):</h4>
                        {wifiScanResults.map((device, idx) => {
                          const isPrinter = device.type === 'printer';
                          const isTv = ['samsung_tv', 'lg_tv', 'vizio_tv', 'roku_tv', 'tcl_tv', 'fire_tv', 'sony_tv', 'philips_tv'].includes(device.type);
                          const isCast = ['chromecast', 'airplay'].includes(device.type);
                          const isTablet = ['android_tablet', 'web_display'].includes(device.type);
                          
                          const bgColor = isPrinter ? 'border-green-200 bg-green-50' : 
                                         isTv ? 'border-purple-200 bg-purple-50' :
                                         isCast ? 'border-orange-200 bg-orange-50' :
                                         isTablet ? 'border-blue-200 bg-blue-50' :
                                         'border-slate-200 bg-slate-50';
                          const iconBg = isPrinter ? 'bg-green-600' : 
                                        isTv ? 'bg-purple-600' :
                                        isCast ? 'bg-orange-500' :
                                        isTablet ? 'bg-blue-600' :
                                        'bg-slate-600';
                          
                          const deviceLabel = isPrinter ? 'Printer' : isTv ? 'Smart TV' : isCast ? 'Cast Device' : isTablet ? 'Tablet' : 'Device';
                          
                          return (
                            <Card key={`${device.ip}-${device.port}-${idx}`} className={`border-2 ${bgColor}`}>
                              <CardContent className="p-3">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                                      {isPrinter ? (
                                        <Printer className="w-5 h-5 text-white" />
                                      ) : isCast ? (
                                        <Wifi className="w-5 h-5 text-white" />
                                      ) : (
                                        <Monitor className="w-5 h-5 text-white" />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-bold text-slate-900 truncate">{device.name}</p>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <Badge className={`text-xs ${isPrinter ? 'bg-green-600' : isTv ? 'bg-purple-600' : isCast ? 'bg-orange-500' : 'bg-blue-600'}`}>
                                          {deviceLabel}
                                        </Badge>
                                        <p className="text-xs text-slate-500">{device.ip}:{device.port}</p>
                                        {device.responseTime && (
                                          <Badge variant="outline" className="text-xs">{device.responseTime}ms</Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex gap-2 flex-shrink-0">
                                    <Button
                                      size="sm"
                                      onClick={() => connectToWifiDevice(device)}
                                      className="bg-emerald-600 hover:bg-emerald-700"
                                    >
                                      Connect
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setWifiScanResults(prev => prev.filter((_, i) => i !== idx))}
                                      className="text-red-600 border-red-200 hover:bg-red-50"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setWifiScanResults([])}
                          className="w-full text-slate-600"
                        >
                          Clear All Results
                        </Button>
                      </div>
                    )}

                    {/* How to Find Device IP */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <h4 className="font-bold text-amber-900 mb-2">📋 How to Find Device IP Address:</h4>
                      <ul className="text-sm text-amber-800 space-y-1">
                        <li>• <strong>Router:</strong> Login to router (192.168.1.1) → Connected Devices</li>
                        <li>• <strong>Printer:</strong> Print network config page from printer menu</li>
                        <li>• <strong>Smart TV:</strong> Settings → Network → View IP Address</li>
                        <li>• <strong>iPad/Tablet:</strong> Settings → WiFi → Tap connected network → IP Address</li>
                        <li>• <strong>Chromecast:</strong> Google Home app → Device → Settings → IP</li>
                      </ul>
                    </div>

                    {/* Manual IP Entry (Collapsible) */}
                    <details className="border rounded-lg p-3">
                      <summary className="font-semibold text-slate-700 cursor-pointer">
                        Manual IP Entry (Advanced)
                      </summary>
                      <div className="space-y-3 mt-3">
                        <div>
                          <Label>Printer IP Address</Label>
                          <Input
                            placeholder="192.168.1.100"
                            value={wifiPrinterIP}
                            onChange={(e) => setWifiPrinterIP(e.target.value)}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label>Port (Optional)</Label>
                          <Input
                            placeholder="9100"
                            value={wifiPrinterPort}
                            onChange={(e) => setWifiPrinterPort(e.target.value)}
                            className="mt-1"
                          />
                        </div>

                        <Button
                          onClick={async () => {
                            if (!wifiPrinterIP) {
                              setTestPrintStatus("❌ Please enter printer IP address");
                              return;
                            }
                            setTestPrintStatus("Connecting to WiFi printer...");
                            
                            const wifiPrinter = {
                              id: `wifi-${wifiPrinterIP}`,
                              name: `WiFi Printer (${wifiPrinterIP})`,
                              type: 'WiFi Network Printer',
                              connected: true,
                              connectionType: 'wifi',
                              ipAddress: wifiPrinterIP,
                              port: wifiPrinterPort || '9100',
                              lastConnected: new Date().toISOString()
                            };

                            const updated = [...connectedPrinters.filter(p => p.id !== wifiPrinter.id), wifiPrinter];
                            savePrinters(updated);
                            setTestPrintStatus("✓ WiFi printer connected! Click 'Test Print' to verify.");
                          }}
                          className="w-full"
                          variant="outline"
                        >
                          Connect Manually
                        </Button>
                      </div>
                    </details>

                    <div className="text-sm text-slate-600 space-y-1">
                      <p><strong>For best results:</strong></p>
                      <p>• Ensure printer/display is connected to same WiFi</p>
                      <p>• Both devices must be on the same network</p>
                      <p>• Kitchen displays will appear with purple icon</p>
                    </div>
                  </TabsContent>

                  {/* Kiosk Screens Tab */}
                  <TabsContent value="kiosk" className="space-y-4 mt-4">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                      <h4 className="font-bold text-purple-900 mb-2">📺 Kiosk & Kitchen Display Setup</h4>
                      <p className="text-sm text-purple-800">
                        Connect tablets, smart TVs, and displays for customer ordering kiosks and kitchen display systems.
                      </p>
                    </div>

                    {/* Casting Options */}
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={scanForWifiDevices}
                        disabled={isDiscovering}
                        className="w-full bg-purple-600 hover:bg-purple-700 py-6"
                      >
                        {isDiscovering ? (
                          <>
                            <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                            Scanning...
                          </>
                        ) : (
                          <>
                            <Search className="w-5 h-5 mr-2" />
                            Find Displays
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={scanForBluetoothDevices}
                        disabled={isDiscovering}
                        variant="outline"
                        className="w-full py-6"
                      >
                        <Bluetooth className="w-5 h-5 mr-2" />
                        Bluetooth Scan
                      </Button>
                    </div>

                    {/* Cast Methods */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-slate-900">Quick Connect Methods:</h4>
                      
                      {/* Chromecast */}
                      <Card className="border-2 border-orange-200 bg-orange-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <Wifi className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">Google Chromecast</p>
                              <p className="text-xs text-slate-600">Cast from Chrome browser tab</p>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-orange-200">
                            <p className="text-xs font-semibold text-orange-900 mb-2">Setup Steps:</p>
                            <ol className="text-xs text-orange-800 space-y-1 list-decimal ml-4">
                              <li>Open <strong>Chrome</strong> on your computer</li>
                              <li>Navigate to <code className="bg-orange-100 px-1 rounded">{window.location.origin}/KitchenDisplay</code></li>
                              <li>Click the <strong>⋮</strong> menu (three dots) → <strong>Cast</strong></li>
                              <li>Select your Chromecast device from the list</li>
                            </ol>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Samsung SmartView */}
                      <Card className="border-2 border-blue-200 bg-blue-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <Monitor className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">Samsung SmartView / Smart TV</p>
                              <p className="text-xs text-slate-600">Screen mirror or use TV's built-in browser</p>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-blue-200">
                            <p className="text-xs font-semibold text-blue-900 mb-2">Setup Steps:</p>
                            <ol className="text-xs text-blue-800 space-y-1 list-decimal ml-4">
                              <li>On your Samsung TV, press the <strong>Home</strong> button</li>
                              <li>Open the <strong>Internet</strong> browser app</li>
                              <li>Type: <code className="bg-blue-100 px-1 rounded">{window.location.origin}/KitchenDisplay</code></li>
                              <li>Add to <strong>Favorites</strong> for quick access</li>
                            </ol>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Apple AirPlay */}
                      <Card className="border-2 border-slate-200 bg-slate-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center flex-shrink-0">
                              <Monitor className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">Apple AirPlay</p>
                              <p className="text-xs text-slate-600">Mirror iPad/iPhone to Apple TV or AirPlay 2 TV</p>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-slate-200">
                            <p className="text-xs font-semibold text-slate-900 mb-2">Setup Steps:</p>
                            <ol className="text-xs text-slate-800 space-y-1 list-decimal ml-4">
                              <li>On your iPhone/iPad, open Safari</li>
                              <li>Go to <code className="bg-slate-100 px-1 rounded">{window.location.origin}/KitchenDisplay</code></li>
                              <li>Swipe down to open <strong>Control Center</strong></li>
                              <li>Tap <strong>Screen Mirroring</strong> → Select your TV</li>
                            </ol>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Fire TV */}
                      <Card className="border-2 border-orange-200 bg-orange-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <Monitor className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">Amazon Fire TV / Stick</p>
                              <p className="text-xs text-slate-600">Use Silk Browser on Fire TV</p>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-orange-200">
                            <p className="text-xs font-semibold text-orange-900 mb-2">Setup Steps:</p>
                            <ol className="text-xs text-orange-800 space-y-1 list-decimal ml-4">
                              <li>On Fire TV, open the <strong>Silk Browser</strong> app</li>
                              <li>Navigate to <code className="bg-orange-100 px-1 rounded">{window.location.origin}/KitchenDisplay</code></li>
                              <li>Click <strong>☆ Add to Favorites</strong> for quick access</li>
                              <li>Optional: Set as homepage in Silk settings</li>
                            </ol>
                          </div>
                        </CardContent>
                      </Card>

                      {/* LG webOS TV */}
                      <Card className="border-2 border-red-200 bg-red-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <Monitor className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">LG Smart TV (webOS)</p>
                              <p className="text-xs text-slate-600">Use the built-in web browser</p>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-red-200">
                            <p className="text-xs font-semibold text-red-900 mb-2">Setup Steps:</p>
                            <ol className="text-xs text-red-800 space-y-1 list-decimal ml-4">
                              <li>Press the <strong>Home</strong> button on your LG remote</li>
                              <li>Open the <strong>Web Browser</strong> app</li>
                              <li>Type: <code className="bg-red-100 px-1 rounded">{window.location.origin}/KitchenDisplay</code></li>
                              <li>Click <strong>☆ Bookmark</strong> for quick access</li>
                            </ol>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Miracast / Android */}
                      <Card className="border-2 border-green-200 bg-green-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <Wifi className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">Miracast / Android Screen Cast</p>
                              <p className="text-xs text-slate-600">Wireless display from any Android device</p>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-green-200">
                            <p className="text-xs font-semibold text-green-900 mb-2">Setup Steps:</p>
                            <ol className="text-xs text-green-800 space-y-1 list-decimal ml-4">
                              <li>On your Android phone/tablet, open Chrome</li>
                              <li>Go to <code className="bg-green-100 px-1 rounded">{window.location.origin}/KitchenDisplay</code></li>
                              <li>Go to <strong>Settings → Connected Devices → Cast</strong></li>
                              <li>Select your TV/display from the list</li>
                            </ol>
                          </div>
                        </CardContent>
                      </Card>
                      </div>

                    {/* Direct URL Access */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mt-4">
                      <h4 className="font-bold text-emerald-900 mb-2">🌐 Direct Browser Access (Easiest)</h4>
                      <p className="text-sm text-emerald-800 mb-3">
                        Open a web browser on any smart TV, tablet, or display and navigate to:
                      </p>
                      <div className="bg-white rounded-lg p-3 font-mono text-sm text-center border">
                        {window.location.origin}/KioskMode
                      </div>
                      <p className="text-xs text-emerald-700 mt-2">
                        Works on Samsung, LG, TCL, Roku, Fire TV, and any device with a web browser.
                      </p>
                    </div>

                    {/* Kiosk Mode Link */}
                    <div className="flex gap-3 mt-4">
                      <Button
                        onClick={() => window.open(createPageUrl("KioskMode"), '_blank')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 py-6"
                      >
                        <Monitor className="w-5 h-5 mr-2" />
                        Open Kiosk Mode
                      </Button>
                      <Button
                        onClick={() => window.open(createPageUrl("KitchenDisplay"), '_blank')}
                        variant="outline"
                        className="flex-1 py-6"
                      >
                        <Printer className="w-5 h-5 mr-2" />
                        Open Kitchen Display
                      </Button>
                    </div>
                    </TabsContent>

                    {/* Device Management Tab */}
                    <TabsContent value="manage" className="space-y-4 mt-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
                      <h4 className="font-bold text-slate-900 mb-2">📱 Device Management</h4>
                      <p className="text-sm text-slate-600">
                        View, configure, and manage all your connected printers and display devices. 
                        Set what each display shows and get setup instructions.
                      </p>
                    </div>

                    <DeviceManager 
                      devices={connectedPrinters} 
                      onUpdateDevices={savePrinters}
                      onTestPrint={testPrint}
                    />
                    </TabsContent>
                    </Tabs>

                {testPrintStatus && (
                  <div className={`p-4 rounded-lg mt-4 ${
                    testPrintStatus.includes('❌') ? 'bg-red-50 border border-red-200' :
                    testPrintStatus.includes('✓') ? 'bg-green-50 border border-green-200' :
                    'bg-blue-50 border border-blue-200'
                  }`}>
                    <p className={`text-sm ${
                      testPrintStatus.includes('❌') ? 'text-red-800' :
                      testPrintStatus.includes('✓') ? 'text-green-800' :
                      'text-blue-800'
                    }`}>
                      {testPrintStatus}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Connected Printers List */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Printer className="w-6 h-6 text-emerald-600" />
                    Connected Devices ({connectedPrinters.length})
                  </CardTitle>
                  {connectedPrinters.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConnectionMethod('manage')}
                    >
                      <LayoutList className="w-4 h-4 mr-2" />
                      Manage All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {connectedPrinters.length === 0 ? (
                  <div className="text-center py-12">
                    <Printer className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 text-lg mb-2">No printers connected</p>
                    <p className="text-slate-400 text-sm">Click "Scan for Printers" to connect a Bluetooth printer</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {connectedPrinters.map(printer => (
                      <Card key={printer.id} className="border-2">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-bold text-slate-900">{printer.name}</h3>
                                {printer.connected ? (
                                  <Badge className="bg-green-600">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Connected
                                  </Badge>
                                ) : (
                                  <Badge className="bg-slate-400">
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Disconnected
                                  </Badge>
                                )}
                                {printer.connectionType === 'wifi' && (
                                  <Badge className="bg-blue-500">
                                    <Wifi className="w-3 h-3 mr-1" />
                                    WiFi
                                  </Badge>
                                )}
                                {printer.connectionType === 'bluetooth' && (
                                  <Badge className="bg-purple-500">
                                    <Bluetooth className="w-3 h-3 mr-1" />
                                    BT
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-600">{printer.type}</p>
                              {printer.ipAddress && (
                                <p className="text-xs text-slate-600 mt-1">
                                  IP: {printer.ipAddress}:{printer.port}
                                </p>
                              )}
                              {printer.lastConnected && (
                                <p className="text-xs text-slate-400 mt-1">
                                  Last connected: {new Date(printer.lastConnected).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              onClick={() => testPrint(printer)}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              <Zap className="w-4 h-4 mr-2" />
                              Test Print
                            </Button>
                            {printer.connected ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => disconnectPrinter(printer.id)}
                              >
                                Disconnect
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={scanForPrinters}
                              >
                                Reconnect
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removePrinter(printer.id)}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Label Templates */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-6 h-6" />
                  Label Templates
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(labelTemplates).map(([id, template]) => (
                    <Card key={id} className="border-2 hover:shadow-lg transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="text-2xl mb-2">{template.icon}</div>
                            <h3 className="font-bold text-slate-900">{template.name}</h3>
                            <p className="text-sm text-slate-600">{template.description}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePreviewTemplate(id)}
                            className="flex-1"
                          >
                            Preview
                          </Button>
                          {connectedPrinters.length > 0 && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedTemplate(id);
                                setTimeout(() => testPrint(connectedPrinters[0]), 100);
                              }}
                              className="flex-1 bg-emerald-600"
                            >
                              Print
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Info & Support */}
          <div className="space-y-6">
            {/* Supported Printers */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Printer className="w-5 h-5 text-emerald-600" />
                  Compatible Printers
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 max-h-64 overflow-y-auto">
                {supportedPrinters.map((printer, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-sm">{printer.name}</p>
                      <Badge variant="outline" className="text-xs">{printer.price}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {printer.features.map((feature, fIdx) => (
                        <Badge key={fIdx} className="bg-emerald-100 text-emerald-800 text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Supported Displays & Tablets */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-purple-600" />
                  Compatible Displays & Tablets
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 max-h-80 overflow-y-auto">
                <p className="text-xs text-slate-500 mb-2">For Kitchen Display Systems (KDS)</p>
                {supportedDisplays.map((device, idx) => (
                  <div key={idx} className={`p-3 rounded-lg ${device.category === 'tablet' ? 'bg-blue-50' : 'bg-purple-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-sm">{device.name}</p>
                      <Badge className={`text-xs ${device.category === 'tablet' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                        {device.category === 'tablet' ? 'Tablet' : 'Display'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">{device.connection}</p>
                    <div className="flex flex-wrap gap-1">
                      {device.features.map((feature, fIdx) => (
                        <Badge key={fIdx} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Setup Instructions */}
            <Card className="border-0 bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Setup Instructions
                </h3>
                <ol className="space-y-2 text-sm text-blue-800">
                  <li>1. Turn on your Bluetooth printer</li>
                  <li>2. Make sure it's charged or plugged in</li>
                  <li>3. Click "Scan for Printers" above</li>
                  <li>4. Select your printer from the list</li>
                  <li>5. Click "Test Print" to verify</li>
                  <li>6. Your printer is now ready to use!</li>
                </ol>
              </CardContent>
            </Card>

            {/* Device Compatibility */}
            <Card className="border-0 bg-green-50 border-green-200">
              <CardContent className="p-4">
                <h3 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Device Compatibility
                </h3>
                <div className="space-y-3 text-sm text-green-800">
                  <div>
                    <p className="font-bold mb-1">✅ Bluetooth (Chrome/Edge):</p>
                    <ul className="space-y-1 ml-4">
                      <li>• Windows 10+, Mac, Linux</li>
                      <li>• Android tablets (all brands)</li>
                      <li>• Lenovo ThinkPad/IdeaPad</li>
                      <li>• Surface Pro tablets</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-bold mb-1">✅ WiFi (All devices):</p>
                    <ul className="space-y-1 ml-4">
                      <li>• iPads (all models)</li>
                      <li>• Safari browser</li>
                      <li>• Smart displays (Samsung/TCL)</li>
                      <li>• All tablets & browsers</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Connection Tips */}
            <Card className="border-0 bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Troubleshooting
                </h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <p><strong>Bluetooth not working?</strong></p>
                  <ul className="space-y-1 ml-4">
                    <li>• Use WiFi connection instead</li>
                    <li>• Update browser to latest version</li>
                    <li>• Restart printer and device</li>
                    <li>• Move printer closer (&lt;10 feet)</li>
                  </ul>
                  <p className="mt-2"><strong>WiFi recommended for:</strong></p>
                  <ul className="space-y-1 ml-4">
                    <li>• iPad/iPhone devices</li>
                    <li>• Multiple devices sharing printer</li>
                    <li>• Safari/Firefox browsers</li>
                    <li>• More reliable connection</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Tech Details */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg">Technical Details</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Protocol:</span>
                  <span className="font-semibold">ESC/POS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Connection:</span>
                  <span className="font-semibold">Web Bluetooth</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Print Width:</span>
                  <span className="font-semibold">50mm (2")</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Resolution:</span>
                  <span className="font-semibold">203 DPI</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Driver:</span>
                  <span className="font-semibold">Built-in</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Preview Dialog */}
        {showPreview && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full max-h-[80vh] overflow-auto">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                <div className="flex items-center justify-between">
                  <CardTitle>{labelTemplates[selectedTemplate].name}</CardTitle>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setShowPreview(false)}
                    className="text-white hover:bg-purple-500"
                  >
                    <XCircle className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="bg-slate-50 rounded-lg p-6 mb-6">
                  <div className="bg-white border-2 border-slate-300 rounded p-4 font-mono text-sm overflow-x-auto">
                    <pre className="whitespace-pre-wrap">{previewContent}</pre>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(false)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                  {connectedPrinters.length > 0 && (
                    <Button
                      onClick={() => {
                        testPrint(connectedPrinters[0]);
                        setShowPreview(false);
                      }}
                      className="flex-1 bg-emerald-600"
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Print to {connectedPrinters[0].name}
                    </Button>
                  )}
                  <Button
                    onClick={handlePrintPreview}
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Browser Print
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
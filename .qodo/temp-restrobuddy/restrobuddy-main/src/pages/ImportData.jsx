import React, { useState } from "react";
import { LoyaltyMember } from "@/entities/LoyaltyMember";
import { Employee } from "@/entities/Employee";
import { MenuItem } from "@/entities/MenuItem";
import { InventoryItem } from "@/entities/InventoryItem";
import { Restaurant } from "@/entities/Restaurant";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileSpreadsheet, Users, Package, Utensils, CheckCircle, AlertCircle, Download, ImageIcon, X, Image as ImageIconLucide } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";



export default function ImportData() {
  const [activeTab, setActiveTab] = useState("customers");
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [myRestaurant, setMyRestaurant] = useState(null);
  const [loadingRestaurant, setLoadingRestaurant] = useState(false);
  
  // Image upload states
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [uploadedImages, setUploadedImages] = useState({});
  const [uploadingImages, setUploadingImages] = useState(false);

  // Load user's restaurant when component mounts
  React.useEffect(() => {
    loadRestaurant();
  }, []);

  const loadRestaurant = async () => {
    setLoadingRestaurant(true);
    try {
      const user = await base44.auth.me();
      const restaurants = await Restaurant.filter({ owner_email: user.email });
      if (restaurants.length > 0) {
        setMyRestaurant(restaurants[0]);
      }
    } catch (error) {
      console.error("Error loading restaurant:", error);
    }
    setLoadingRestaurant(false);
  };

  // Column mappings for different import types
  const customerColumns = {
    first_name: "First Name",
    last_name: "Last Name",
    company_name: "Company Name",
    contact_person: "Contact Person",
    phone: "Phone Number",
    email: "Email",
    address: "Address",
    city: "City",
    state: "State",
    zip_code: "ZIP Code"
  };

  const employeeColumns = {
    full_name: "Full Name",
    email: "Email",
    phone: "Phone Number",
    role: "Role (manager/chef/server/cashier)",
    hourly_rate: "Hourly Rate",
    location: "Location",
    hire_date: "Hire Date"
  };

  const menuItemColumns = {
    name: "Item Name",
    description: "Description",
    category: "Category (appetizers/entrees/sides/desserts/beverages)",
    price: "Price",
    image_url: "Image URL",
    keyword: "SMS Keyword",
    preparation_time: "Prep Time (minutes)"
  };

  const inventoryColumns = {
    name: "Item Name",
    category: "Category (produce/meat/dairy/dry_goods/beverages/supplies)",
    unit: "Unit (kg/lb/oz/g/L/gal/units/cases)",
    current_quantity: "Current Quantity",
    reorder_point: "Reorder Point",
    cost_per_unit: "Cost Per Unit",
    supplier: "Supplier",
    supplier_contact: "Supplier Contact"
  };

  const getCurrentColumns = () => {
    switch(activeTab) {
      case "customers": return customerColumns;
      case "employees": return employeeColumns;
      case "menu": return menuItemColumns;
      case "inventory": return inventoryColumns;
      default: return {};
    }
  };

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setImportResult(null);
    setUploadedImages({}); // Reset uploaded images

    try {
      const text = await uploadedFile.text();
      let rows;

      if (uploadedFile.name.endsWith('.csv')) {
        rows = parseCSV(text);
      } else if (uploadedFile.name.endsWith('.vcf')) {
        rows = parseVCF(text);
      } else {
        alert("Please upload a CSV or VCF file");
        return;
      }

      setPreviewData(rows.slice(0, 10)); // Show first 10 rows

      // Auto-map columns based on header names
      if (rows.length > 0) {
        const headers = Object.keys(rows[0]);
        const mapping = {};
        const currentCols = getCurrentColumns();
        
        headers.forEach(header => {
          const normalizedHeader = header.toLowerCase().trim();
          // Try to match with expected columns
          Object.keys(currentCols).forEach(colKey => {
            if (normalizedHeader.includes(colKey.replace('_', ' ')) || 
                normalizedHeader.includes(colKey)) {
              mapping[header] = colKey;
            }
          });
        });
        
        setColumnMapping(mapping);
      }
    } catch (error) {
      console.error("Error parsing file:", error);
      alert("Error reading file. Please check the format.");
    }
  };

  const handleImageUpload = async (rowIndex, file) => {
    if (!file) return;

    setUploadingImages(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      setUploadedImages(prev => ({
        ...prev,
        [rowIndex]: file_url
      }));

      // Update preview data with uploaded image URL
      setPreviewData(prev => prev.map((row, idx) => {
        if (idx === rowIndex) {
          return { ...row, "Image URL": file_url };
        }
        return row;
      }));

    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    }
    setUploadingImages(false);
  };

  const handleBulkImageUpload = async (files) => {
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    const uploadPromises = [];
    
    for (let i = 0; i < Math.min(files.length, previewData.length); i++) {
      uploadPromises.push(
        base44.integrations.Core.UploadFile({ file: files[i] })
          .then(({ file_url }) => ({ index: i, url: file_url }))
      );
    }

    try {
      const results = await Promise.all(uploadPromises);
      const newUploadedImages = {};
      
      results.forEach(({ index, url }) => {
        newUploadedImages[index] = url;
      });

      setUploadedImages(prev => ({ ...prev, ...newUploadedImages }));

      // Update preview data with uploaded image URLs
      setPreviewData(prev => prev.map((row, idx) => {
        if (newUploadedImages[idx]) {
          return { ...row, "Image URL": newUploadedImages[idx] };
        }
        return row;
      }));

      alert(`Successfully uploaded ${results.length} images!`);
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Some images failed to upload. Please try again.");
    }
    setUploadingImages(false);
  };

  const removeUploadedImage = (rowIndex) => {
    setUploadedImages(prev => {
      const updated = { ...prev };
      delete updated[rowIndex];
      return updated;
    });

    // Remove from preview data
    setPreviewData(prev => prev.map((row, idx) => {
      if (idx === rowIndex && uploadedImages[idx]) {
        return { ...row, "Image URL": "" };
      }
      return row;
    }));
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });
      rows.push(row);
    }

    return rows;
  };

  const parseVCF = (text) => {
    const vcards = text.split('BEGIN:VCARD').slice(1);
    const rows = [];

    vcards.forEach(vcard => {
      const row = {};
      const lines = vcard.split('\n');

      lines.forEach(line => {
        if (line.startsWith('FN:')) {
          const fullName = line.substring(3).trim();
          const nameParts = fullName.split(' ');
          row['First Name'] = nameParts[0] || '';
          row['Last Name'] = nameParts.slice(1).join(' ') || '';
        } else if (line.startsWith('TEL')) {
          row['Phone Number'] = line.split(':')[1]?.trim() || '';
        } else if (line.startsWith('EMAIL')) {
          row['Email'] = line.split(':')[1]?.trim() || '';
        } else if (line.startsWith('ADR')) {
          const address = line.split(':')[1]?.split(';') || [];
          row['Address'] = address[2] || '';
          row['City'] = address[3] || '';
          row['State'] = address[4] || '';
          row['ZIP Code'] = address[5] || '';
        } else if (line.startsWith('ORG:')) {
          row['Company Name'] = line.substring(4).trim();
        }
      });

      if (Object.keys(row).length > 0) {
        rows.push(row);
      }
    });

    return rows;
  };

  const handleImport = async () => {
    if (!file || previewData.length === 0) {
      alert("Please upload a file first");
      return;
    }

    // Check if importing menu items without a restaurant
    if (activeTab === "menu" && !myRestaurant) {
      alert("You need to create a restaurant first before importing menu items. Go to Restaurant Settings to create one.");
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      let allRows;

      if (file.name.endsWith('.csv')) {
        allRows = parseCSV(text);
      } else if (file.name.endsWith('.vcf')) {
        allRows = parseVCF(text);
      }

      // Map data according to column mapping and include uploaded images
      const mappedData = allRows.map((row, idx) => {
        const mapped = {};
        Object.keys(columnMapping).forEach(sourceCol => {
          const targetCol = columnMapping[sourceCol];
          if (targetCol) {
            mapped[targetCol] = row[sourceCol];
          }
        });
        
        // Override with uploaded image if exists
        if (uploadedImages[idx]) {
          mapped['image_url'] = uploadedImages[idx];
        }
        
        return mapped;
      }).filter(row => Object.keys(row).length > 0);

      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      // Import based on active tab
      for (const data of mappedData) {
        try {
          switch(activeTab) {
            case "customers":
              await importCustomer(data);
              break;
            case "employees":
              await importEmployee(data);
              break;
            case "menu":
              await importMenuItem(data);
              break;
            case "inventory":
              await importInventoryItem(data);
              break;
          }
          successCount++;
        } catch (error) {
          errorCount++;
          errors.push({ data, error: error.message });
        }
      }

      setImportResult({
        total: mappedData.length,
        success: successCount,
        errors: errorCount,
        errorDetails: errors.slice(0, 5) // Show first 5 errors
      });

    } catch (error) {
      console.error("Import error:", error);
      alert("Error during import: " + error.message);
    }

    setImporting(false);
  };

  const importCustomer = async (data) => {
    const customerData = {
      customer_name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.company_name,
      email: data.email,
      phone: data.phone,
      points_balance: 0,
      tier: "bronze"
    };

    if (customerData.customer_name && customerData.phone) {
      await LoyaltyMember.create(customerData);
    } else {
      throw new Error("Missing required fields: name and phone");
    }
  };

  const importEmployee = async (data) => {
    const employeeData = {
      full_name: data.full_name || `${data.first_name || ''} ${data.last_name || ''}`.trim(),
      email: data.email,
      phone: data.phone,
      role: data.role || "server",
      hourly_rate: parseFloat(data.hourly_rate) || 15,
      location: data.location || "Main Location",
      hire_date: data.hire_date || new Date().toISOString().split('T')[0],
      status: "active"
    };

    if (employeeData.full_name && employeeData.email) {
      await Employee.create(employeeData);
    } else {
      throw new Error("Missing required fields: name and email");
    }
  };

  const importMenuItem = async (data) => {
    if (!myRestaurant) {
      throw new Error("No restaurant found. Please create a restaurant first.");
    }

    const menuData = {
      restaurant_id: myRestaurant.id,
      name: data.name,
      description: data.description || '',
      category: data.category || 'entrees',
      price: parseFloat(data.price) || 0,
      image_url: data.image_url || '',
      keyword: data.keyword?.toUpperCase() || '',
      preparation_time: parseInt(data.preparation_time) || 15,
      available: true
    };

    if (menuData.name && menuData.price > 0) {
      await MenuItem.create(menuData);
    } else {
      throw new Error("Missing required fields: name and price");
    }
  };

  const importInventoryItem = async (data) => {
    const inventoryData = {
      name: data.name,
      category: data.category || 'dry_goods',
      unit: data.unit || 'units',
      current_quantity: parseFloat(data.current_quantity) || 0,
      reorder_point: parseFloat(data.reorder_point) || 10,
      cost_per_unit: parseFloat(data.cost_per_unit) || 0,
      supplier: data.supplier || '',
      supplier_contact: data.supplier_contact || '',
      status: 'in_stock'
    };

    if (inventoryData.name && inventoryData.cost_per_unit > 0) {
      await InventoryItem.create(inventoryData);
    } else {
      throw new Error("Missing required fields: name and cost");
    }
  };

  const downloadTemplate = () => {
    const columns = getCurrentColumns();
    const headers = Object.values(columns).join(',');
    
    let sampleRows = '';
    switch(activeTab) {
      case "customers":
        sampleRows = '\n"John","Doe","Acme Corp","John Doe","+1 555-1234","john@email.com","123 Main St","New York","NY","10001"';
        break;
      case "employees":
        sampleRows = '\n"Jane Smith","jane@restaurant.com","+1 555-5678","server","15","Main Location","2024-01-15"';
        break;
      case "menu":
        sampleRows = '\n"Deluxe Burger","Juicy beef patty with premium toppings","entrees","15.99","https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500","BURGER","12"';
        sampleRows += '\n"Caesar Salad","Fresh romaine with parmesan and croutons","appetizers","8.99","https://images.unsplash.com/photo-1546793665-c74683f339c1?w=500","SALAD","8"';
        sampleRows += '\n"Chocolate Cake","Rich chocolate cake with ganache","desserts","6.99","https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500","CAKE","5"';
        break;
      case "inventory":
        sampleRows = '\n"Tomatoes","produce","lb","50","20","2.50","Fresh Farm Co","+1 555-9999"';
        break;
    }

    const csv = headers + sampleRows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}_import_template.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Import Data</h1>
          <p className="text-slate-600">Bulk import contacts, menu items, and inventory from CSV files</p>
        </div>

        <Tabs value={activeTab} onValueChange={(val) => {
          setActiveTab(val);
          setFile(null);
          setPreviewData([]);
          setColumnMapping({});
          setImportResult(null);
          setUploadedImages({});
        }}>
          <TabsList className="mb-8">
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="employees" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Employees
            </TabsTrigger>
            <TabsTrigger value="menu" className="flex items-center gap-2">
              <Utensils className="w-4 h-4" />
              Menu Items
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Inventory
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              {/* Upload Section */}
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Upload className="w-6 h-6 text-emerald-600" />
                    Upload File
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {activeTab === "menu" && !myRestaurant && !loadingRestaurant && (
                    <Alert className="bg-amber-50 border-amber-200">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-900">
                        <strong>Restaurant Required:</strong> You need to create a restaurant before importing menu items. 
                        Go to Restaurant Settings to create one first.
                      </AlertDescription>
                    </Alert>
                  )}

                  {activeTab === "menu" && myRestaurant && (
                    <Alert className="bg-blue-50 border-blue-200">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-900">
                        <strong>Restaurant:</strong> {myRestaurant.business_name}<br/>
                        Menu items will be automatically linked to this restaurant.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div>
                    <Label>Select CSV File</Label>
                    <Input
                      type="file"
                      accept=".csv,.vcf"
                      onChange={handleFileUpload}
                      className="mt-2"
                      disabled={activeTab === "menu" && !myRestaurant}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Supported formats: CSV{activeTab === "customers" ? ", VCF (vCard)" : ""}
                    </p>
                  </div>

                  <Button
                    onClick={downloadTemplate}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                  </Button>

                  {file && (
                    <Alert className="bg-blue-50 border-blue-200">
                      <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        <strong>{file.name}</strong> loaded with {previewData.length}+ records
                      </AlertDescription>
                    </Alert>
                  )}

                  {importResult && (
                    <Alert className={importResult.errors > 0 ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200"}>
                      {importResult.errors > 0 ? (
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      <AlertDescription className={importResult.errors > 0 ? "text-amber-800" : "text-green-800"}>
                        <div className="space-y-2">
                          <p>
                            <strong>Import Complete:</strong> {importResult.success} of {importResult.total} records imported successfully
                          </p>
                          {importResult.errors > 0 && (
                            <div>
                              <p className="font-semibold">{importResult.errors} errors:</p>
                              <ul className="text-xs space-y-1 mt-1">
                                {importResult.errorDetails.map((err, idx) => (
                                  <li key={idx}>• {err.error}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Instructions */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-50 to-white">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    {activeTab === "menu" && <ImageIcon className="w-6 h-6 text-emerald-600" />}
                    Import Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-lg mb-2 text-emerald-900">Required Fields</h4>
                      <ul className="space-y-1 text-sm">
                        {Object.entries(getCurrentColumns()).map(([key, label]) => (
                          <li key={key} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span className="text-slate-700">{label}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {activeTab === "menu" && (
                      <div className="pt-4 border-t border-emerald-200">
                        <h4 className="font-bold text-sm mb-2 text-slate-900 flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" />
                          Adding Images (2 Options):
                        </h4>
                        <div className="space-y-3">
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs text-blue-900 font-semibold mb-1">
                              Option 1: Upload Images Directly
                            </p>
                            <p className="text-xs text-blue-800">
                              After uploading CSV, use the "Upload Images" button to add pictures for each menu item
                            </p>
                          </div>
                          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                            <p className="text-xs text-purple-900 font-semibold mb-1">
                              Option 2: Use Image URLs
                            </p>
                            <ul className="text-xs text-purple-800 space-y-1">
                              <li>• Use Unsplash, Imgur, or your own hosting</li>
                              <li>• Format: <code className="bg-purple-200 px-1 rounded">https://images.unsplash.com/photo-xxx?w=500</code></li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-emerald-200">
                      <h4 className="font-bold text-sm mb-2 text-slate-900">Steps:</h4>
                      <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
                        <li>Download the CSV template</li>
                        <li>Fill in your data (Excel, Google Sheets, etc.)</li>
                        {activeTab === "menu" && <li>Leave Image URL blank if uploading directly</li>}
                        <li>Save as CSV and upload</li>
                        {activeTab === "menu" && <li>Click "Upload Images" to add pictures</li>}
                        <li>Review preview and click "Import"</li>
                      </ol>
                    </div>

                    <div className="pt-4 border-t border-emerald-200">
                      <h4 className="font-bold text-sm mb-2 text-slate-900">Tips:</h4>
                      <ul className="text-xs text-slate-600 space-y-1">
                        {activeTab === "menu" ? (
                          <>
                            <li>• Prices should be numbers without $ symbol</li>
                            <li>• Categories must match exactly (appetizers, entrees, sides, desserts, beverages)</li>
                            <li>• SMS Keywords should be SHORT and UPPERCASE (e.g., BURGER, PIZZA)</li>
                            <li>• Prep time is in minutes</li>
                            <li>• Upload images match to rows in order</li>
                          </>
                        ) : (
                          <>
                            <li>• Phone numbers should include country code (+1)</li>
                            <li>• Prices and costs should be numbers without $ symbol</li>
                            <li>• Categories must match exactly (see dropdown options)</li>
                            <li>• Leave optional fields blank if not needed</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview and Mapping */}
            {previewData.length > 0 && (
              <>
                <Card className="border-0 shadow-xl mb-8">
                  <CardHeader>
                    <CardTitle className="text-2xl">Column Mapping</CardTitle>
                    <p className="text-sm text-slate-600">Match your file columns to the correct fields</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {Object.keys(previewData[0]).map((sourceCol) => (
                        <div key={sourceCol} className="flex items-center gap-3">
                          <div className="flex-1">
                            <Label className="text-xs text-slate-500">From File</Label>
                            <div className="bg-slate-100 px-3 py-2 rounded font-mono text-sm">
                              {sourceCol}
                            </div>
                          </div>
                          <span className="text-slate-400">→</span>
                          <div className="flex-1">
                            <Label className="text-xs text-slate-500">Maps To</Label>
                            <Select
                              value={columnMapping[sourceCol] || ""}
                              onValueChange={(value) => setColumnMapping({
                                ...columnMapping,
                                [sourceCol]: value
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select field" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={null}>Skip this column</SelectItem>
                                {Object.entries(getCurrentColumns()).map(([key, label]) => (
                                  <SelectItem key={key} value={key}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {activeTab === "menu" && (
                  <Card className="border-0 shadow-xl mb-8 bg-gradient-to-br from-purple-50 to-white">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-2xl flex items-center gap-2">
                            <ImageIconLucide className="w-6 h-6 text-purple-600" />
                            Upload Menu Images
                          </CardTitle>
                          <p className="text-sm text-slate-600 mt-1">Add images for your menu items (optional)</p>
                        </div>
                        <Badge className="bg-purple-100 text-purple-800">
                          {Object.keys(uploadedImages).length}/{previewData.length} uploaded
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <Label>Upload images for each item (in order)</Label>
                          <Input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleBulkImageUpload(Array.from(e.target.files))}
                            className="mt-2"
                            disabled={uploadingImages}
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            Select multiple images (they'll match to rows in order)
                          </p>
                        </div>
                      </div>

                      {Object.keys(uploadedImages).length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {previewData.map((row, idx) => uploadedImages[idx] && (
                            <div key={idx} className="relative group">
                              <img
                                src={uploadedImages[idx]}
                                alt={row.name || `Item ${idx + 1}`}
                                className="w-full h-32 object-cover rounded-lg border-2 border-purple-200"
                              />
                              <button
                                onClick={() => removeUploadedImage(idx)}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <p className="text-xs text-center mt-1 text-slate-600 truncate">
                                {row.name || `Row ${idx + 1}`}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {uploadingImages && (
                        <div className="text-center py-4">
                          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          <p className="text-sm text-slate-600">Uploading images...</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <Card className="border-0 shadow-xl mb-8">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-2xl">Data Preview</CardTitle>
                        <p className="text-sm text-slate-600">First 10 records from your file</p>
                      </div>
                      <Button
                        onClick={handleImport}
                        disabled={importing || Object.keys(columnMapping).length === 0 || (activeTab === "menu" && !myRestaurant)}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        {importing ? "Importing..." : `Import ${previewData.length}+ Records`}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {activeTab === "menu" && <TableHead>Image</TableHead>}
                            {Object.keys(previewData[0]).map((col) => (
                              <TableHead key={col}>
                                <div>
                                  <div className="font-semibold">{col}</div>
                                  {columnMapping[col] && (
                                    <Badge variant="outline" className="text-xs mt-1">
                                      → {getCurrentColumns()[columnMapping[col]]}
                                    </Badge>
                                  )}
                                </div>
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previewData.map((row, idx) => (
                            <TableRow key={idx}>
                              {activeTab === "menu" && (
                                <TableCell>
                                  {uploadedImages[idx] ? (
                                    <div className="relative group">
                                      <img
                                        src={uploadedImages[idx]}
                                        alt=""
                                        className="w-16 h-16 object-cover rounded border-2 border-emerald-200"
                                      />
                                      <button
                                        onClick={() => removeUploadedImage(idx)}
                                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : row["Image URL"] ? (
                                    <img
                                      src={row["Image URL"]}
                                      alt=""
                                      className="w-16 h-16 object-cover rounded"
                                      onError={(e) => e.target.style.display = 'none'}
                                    />
                                  ) : (
                                    <div className="w-16 h-16 bg-slate-100 rounded flex items-center justify-center">
                                      <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(idx, e.target.files[0])}
                                        className="hidden"
                                        id={`upload-${idx}`}
                                      />
                                      <label
                                        htmlFor={`upload-${idx}`}
                                        className="cursor-pointer text-slate-400 hover:text-slate-600"
                                      >
                                        <Upload className="w-6 h-6" />
                                      </label>
                                    </div>
                                  )}
                                </TableCell>
                              )}
                              {Object.entries(row).map(([key, val], valIdx) => (
                                <TableCell key={valIdx} className="text-sm">
                                  {key.toLowerCase().includes('image') && val && !uploadedImages[idx] ? (
                                    <div className="flex items-center gap-2">
                                      <img src={val} alt="" className="w-12 h-12 object-cover rounded" onError={(e) => e.target.style.display = 'none'} />
                                      <span className="text-xs text-slate-500 truncate max-w-[200px]">{val}</span>
                                    </div>
                                  ) : key.toLowerCase().includes('image') ? (
                                    <span className="text-xs text-emerald-600">Uploaded ✓</span>
                                  ) : (
                                    val || <span className="text-slate-400">—</span>
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { UploadFile, ExtractDataFromUploadedFile } from '@/integrations/Core';
import { MenuItem } from '@/entities/MenuItem';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function RestaurantBulkImport() {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, uploading, processing, completed, error
    const [uploadProgress, setUploadProgress] = useState(0);
    const [results, setResults] = useState(null);
    const [restaurantId, setRestaurantId] = useState(null);

    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const id = params.get('restaurantId');
        if (id) {
            setRestaurantId(id);
        } else {
            setStatus('error');
            setResults({ error: "No restaurant ID provided. Please go back to your dashboard and try again." });
        }
    }, [location.search]);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
        setStatus('idle');
        setResults(null);
    };

    const processImport = async () => {
        if (!file || !restaurantId) return;

        setStatus('uploading');
        try {
            // 1. Upload the file
            const { file_url } = await UploadFile({ file });
            if (!file_url) throw new Error("File upload failed to return a URL.");

            setStatus('processing');
            // 2. Extract data from the file
            const menuItemSchema = {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    price: { type: 'number' },
                    category: { type: 'string' }
                },
                required: ['name', 'price', 'category']
            };

            const extractionResult = await ExtractDataFromUploadedFile({
                file_url: file_url,
                json_schema: { type: 'array', items: menuItemSchema }
            });

            if (extractionResult.status !== 'success' || !extractionResult.output) {
                throw new Error(extractionResult.details || "Failed to extract data from file.");
            }

            // 3. Bulk create menu items
            const itemsToCreate = extractionResult.output.map(item => ({
                ...item,
                restaurant_id: restaurantId,
                is_available: true
            }));

            if (itemsToCreate.length === 0) {
                throw new Error("No valid menu items found in the file.");
            }

            await MenuItem.bulkCreate(itemsToCreate);

            setStatus('completed');
            setResults({ successCount: itemsToCreate.length });

        } catch (error) {
            console.error("Import process failed:", error);
            setStatus('error');
            setResults({ error: error.message });
        }
    };

    return (
        <div className="p-4 lg:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-3xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Upload className="w-5 h-5"/> Bulk Menu Import</CardTitle>
                        <CardDescription>Upload a CSV file to add multiple menu items at once.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2"><FileText className="w-4 h-4"/> CSV File Format</h4>
                            <p className="text-sm text-blue-700 mb-3">
                                Your CSV file must have a header row with the following columns: `name`, `description`, `price`, and `category`.
                            </p>
                            <pre className="text-xs p-2 bg-white rounded">
                                name,description,price,category<br/>
                                Classic Burger,"A juicy beef patty with lettuce, tomato, and cheese.",12.99,Main Course<br/>
                                Fries,"Crispy golden french fries.",4.50,Appetizer
                            </pre>
                        </div>
                        
                        <div>
                            <Label htmlFor="menu-csv">Upload CSV File</Label>
                            <Input id="menu-csv" type="file" accept=".csv" onChange={handleFileChange} className="mt-1"/>
                        </div>

                        {status === 'idle' && file && (
                            <Button onClick={processImport} disabled={!file || !restaurantId} className="w-full">
                                Start Import
                            </Button>
                        )}

                        {(status === 'uploading' || status === 'processing') && (
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-600 mb-2"/>
                                <p className="font-medium">{status === 'uploading' ? 'Uploading file...' : 'Processing data...'}</p>
                                <p className="text-sm text-gray-500">Please wait, this may take a moment.</p>
                            </div>
                        )}

                        {status === 'completed' && results && (
                            <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                                <CheckCircle className="w-8 h-8 mx-auto text-green-600 mb-2"/>
                                <p className="font-medium text-green-800">Import Successful!</p>
                                <p className="text-sm text-green-700">{results.successCount} menu items have been added to your restaurant.</p>
                            </div>
                        )}

                        {status === 'error' && results && (
                            <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
                                <AlertCircle className="w-8 h-8 mx-auto text-red-600 mb-2"/>
                                <p className="font-medium text-red-800">Import Failed</p>
                                <p className="text-sm text-red-700">{results.error}</p>
                            </div>
                        )}

                        <div className="text-center">
                            <Link to={createPageUrl(`RestaurantDashboard`)}>
                                <Button variant="outline">Back to Dashboard</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
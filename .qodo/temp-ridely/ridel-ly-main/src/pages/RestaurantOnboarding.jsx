
import React, { useState } from "react";
import { User } from "@/entities/User";
import { Restaurant } from "@/entities/Restaurant";
import { UploadFile } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPageUrl } from "@/utils";
import { Utensils, Store, CheckCircle, Upload, Star, BarChart } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const tiers = [
    {
        name: "Basic",
        commission: "15%",
        description: "Perfect for getting started and handling your own deliveries.",
        features: ["Listing on Ride-ly", "Accept pickup orders", "Use your own delivery drivers"],
        value: "basic"
    },
    {
        name: "Plus",
        commission: "22%",
        description: "The most popular choice for growing businesses.",
        features: ["Everything in Basic", "Access to Ride-ly driver network", "Standard visibility in search"],
        value: "plus"
    },
    {
        name: "Premier",
        commission: "28%",
        description: "Maximize your reach and get powerful insights.",
        features: ["Everything in Plus", "Top placement in search results", "In-app marketing promotions", "Access to customer data insights"],
        value: "premier"
    }
];

export default function RestaurantOnboarding() {
    const [step, setStep] = useState(1);
    const [restaurantData, setRestaurantData] = useState({
        name: "",
        description: "",
        address: { street: "", city: "", state: "", zip_code: "" },
        phone_number: "",
        cuisine_type: "",
        logo_url: "",
        tier: "plus"
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [logoFile, setLogoFile] = useState(null);

    const handleNext = () => setStep(step + 1);
    const handlePrevious = () => setStep(step - 1);

    const handleLogoUpload = async () => {
        if (!logoFile) {
            handleNext(); // Skip if no logo
            return;
        }
        setIsSubmitting(true);
        try {
            const { file_url } = await UploadFile({ file: logoFile });
            setRestaurantData({ ...restaurantData, logo_url: file_url });
            handleNext();
        } catch (error) {
            console.error("Error uploading logo:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const user = await User.me();
            await Restaurant.create({
                ...restaurantData,
                owner_id: user.id,
            });
            setStep(5); // Go to final confirmation step
        } catch (error) {
            console.error("Error creating restaurant:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 p-4 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <Utensils className="w-12 h-12 mx-auto text-orange-500 mb-4" />
                    <h1 className="text-3xl font-bold text-gray-900">Partner with Ride-ly</h1>
                    <p className="text-gray-600 mt-2">Reach more customers and grow your business on a fairer platform.</p>
                </div>

                <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    {step === 1 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Choose Your Partnership Plan</CardTitle>
                                <CardDescription>Select a commission tier that works for your business. No hidden fees.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {tiers.map(tier => (
                                        <div 
                                            key={tier.name}
                                            onClick={() => setRestaurantData({...restaurantData, tier: tier.value})}
                                            className={cn("p-6 border rounded-lg cursor-pointer transition-all",
                                                restaurantData.tier === tier.value ? "border-blue-500 ring-2 ring-blue-500 shadow-lg" : "hover:border-gray-400"
                                            )}
                                        >
                                            <h3 className="font-bold text-lg">{tier.name}</h3>
                                            <p className="text-2xl font-bold my-2">{tier.commission} <span className="text-sm font-normal text-gray-500">Commission</span></p>
                                            <p className="text-sm text-gray-600 h-12">{tier.description}</p>
                                            <ul className="mt-4 space-y-2 text-sm">
                                                {tier.features.map(feature => (
                                                    <li key={feature} className="flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                        <span>{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-end pt-4">
                                    <Button onClick={handleNext} className="w-full md:w-auto">Continue</Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    {step === 2 && (
                        <Card>
                            <CardHeader><CardTitle>Restaurant Details</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <Input placeholder="Restaurant Name" value={restaurantData.name} onChange={(e) => setRestaurantData({ ...restaurantData, name: e.target.value })} />
                                <Input placeholder="Cuisine Type (e.g., Italian)" value={restaurantData.cuisine_type} onChange={(e) => setRestaurantData({ ...restaurantData, cuisine_type: e.target.value })} />
                                <Input placeholder="Street Address" value={restaurantData.address.street} onChange={(e) => setRestaurantData({ ...restaurantData, address: { ...restaurantData.address, street: e.target.value } })} />
                                <div className="grid grid-cols-3 gap-4">
                                    <Input placeholder="City" value={restaurantData.address.city} onChange={(e) => setRestaurantData({ ...restaurantData, address: { ...restaurantData.address, city: e.target.value } })} />
                                    <Input placeholder="State" value={restaurantData.address.state} onChange={(e) => setRestaurantData({ ...restaurantData, address: { ...restaurantData.address, state: e.target.value } })} />
                                    <Input placeholder="ZIP Code" value={restaurantData.address.zip_code} onChange={(e) => setRestaurantData({ ...restaurantData, address: { ...restaurantData.address, zip_code: e.target.value } })} />
                                </div>
                                <div className="flex justify-between">
                                    <Button variant="outline" onClick={handlePrevious}>Previous</Button>
                                    <Button onClick={handleNext}>Continue</Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    {step === 3 && (
                        <Card>
                            <CardHeader><CardTitle>Upload Your Logo</CardTitle></CardHeader>
                            <CardContent className="space-y-4 text-center">
                                <Label htmlFor="logo-upload" className="mx-auto flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-10 h-10 mb-3 text-gray-400" />
                                        <p className="mb-2 text-sm text-gray-500">{logoFile ? logoFile.name : "Click to upload your logo (optional)"}</p>
                                        <p className="text-xs text-gray-500">PNG, JPG, or SVG</p>
                                    </div>
                                    <Input id="logo-upload" type="file" className="hidden" onChange={(e) => setLogoFile(e.target.files[0])} />
                                </Label>
                                <div className="flex justify-between">
                                    <Button variant="outline" onClick={handlePrevious}>Previous</Button>
                                    <Button onClick={handleLogoUpload} disabled={isSubmitting}>{isSubmitting ? "Uploading..." : "Save & Continue"}</Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    {step === 4 && (
                         <Card>
                            <CardHeader><CardTitle>Final Confirmation</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <p>Review your information below. Once submitted, our team will review your application.</p>
                                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                                   <p><strong>Name:</strong> {restaurantData.name}</p>
                                   <p><strong>Cuisine:</strong> {restaurantData.cuisine_type}</p>
                                   <p><strong>Plan:</strong> <span className="capitalize font-medium">{restaurantData.tier} Tier</span></p>
                                   <p><strong>Address:</strong> {`${restaurantData.address.street}, ${restaurantData.address.city}, ${restaurantData.address.state} ${restaurantData.address.zip_code}`}</p>
                                   {restaurantData.logo_url && <img src={restaurantData.logo_url} alt="logo" className="w-24 h-24 rounded-lg object-cover mt-2"/>}
                                </div>
                                <div className="flex justify-between">
                                    <Button variant="outline" onClick={handlePrevious}>Previous</Button>
                                    <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? "Submitting..." : "Submit Application"}</Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                     {step === 5 && (
                        <Card className="text-center">
                            <CardHeader><CardTitle className="flex justify-center items-center gap-2"><CheckCircle className="text-green-500"/> Application Submitted</CardTitle></CardHeader>
                            <CardContent>
                                <p className="mb-4">Thank you! Your restaurant application is under review. We'll notify you within 24-48 hours. You can now set up your menu.</p>
                                <Button onClick={() => window.location.href = createPageUrl("RestaurantDashboard")} className="w-full">Go to Restaurant Dashboard</Button>
                            </CardContent>
                        </Card>
                    )}
                </motion.div>
            </div>
        </div>
    );
}

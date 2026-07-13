import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StripeSetupGuide() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2">Stripe Setup Required</h1>
      <p className="text-slate-600 mb-6">
        Follow these steps to configure Stripe products for RESTROBUDDY subscriptions.
      </p>

      <Alert className="mb-6 border-amber-200 bg-amber-50">
        <AlertCircle className="w-4 h-4 text-amber-600" />
        <AlertDescription className="text-amber-900">
          <strong>One-time setup required:</strong> You need to create 3 products in Stripe with exact names and pricing.
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-700 w-8 h-8 rounded-full flex items-center justify-center font-bold">
                1
              </span>
              Create Products in Stripe Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <a 
                href="https://dashboard.stripe.com/test/products/create" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold"
              >
                Open Stripe Products Page
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="border rounded-lg p-4 bg-slate-50">
              <h4 className="font-bold mb-3">Product 1: RESTROBUDDY Starter</h4>
              <ul className="space-y-2 text-sm">
                <li>• <strong>Name:</strong> <code className="bg-white px-2 py-1 rounded">RESTROBUDDY Starter</code></li>
                <li>• <strong>Description:</strong> Perfect for single-location restaurants</li>
                <li>• <strong>Pricing Model:</strong> Recurring</li>
                <li>• <strong>Monthly Price:</strong> $99.00 USD per month</li>
                <li>• <strong>Annual Price:</strong> $950.00 USD per year (create as second price for same product)</li>
              </ul>
            </div>

            <div className="border rounded-lg p-4 bg-slate-50">
              <h4 className="font-bold mb-3">Product 2: RESTROBUDDY Professional</h4>
              <ul className="space-y-2 text-sm">
                <li>• <strong>Name:</strong> <code className="bg-white px-2 py-1 rounded">RESTROBUDDY Professional</code></li>
                <li>• <strong>Description:</strong> Most popular for growing restaurants</li>
                <li>• <strong>Pricing Model:</strong> Recurring</li>
                <li>• <strong>Monthly Price:</strong> $299.00 USD per month</li>
                <li>• <strong>Annual Price:</strong> $2,868.00 USD per year</li>
              </ul>
            </div>

            <div className="border rounded-lg p-4 bg-slate-50">
              <h4 className="font-bold mb-3">Product 3: RESTROBUDDY Enterprise</h4>
              <ul className="space-y-2 text-sm">
                <li>• <strong>Name:</strong> <code className="bg-white px-2 py-1 rounded">RESTROBUDDY Enterprise</code></li>
                <li>• <strong>Description:</strong> For multi-location restaurants</li>
                <li>• <strong>Pricing Model:</strong> Recurring</li>
                <li>• <strong>Monthly Price:</strong> $599.00 USD per month</li>
                <li>• <strong>Annual Price:</strong> $5,748.00 USD per year</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-700 w-8 h-8 rounded-full flex items-center justify-center font-bold">
                2
              </span>
              Important: Exact Names Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-red-900">
                <strong>Critical:</strong> Product names MUST match exactly as shown above. The system searches for these exact names:
                <ul className="list-disc ml-4 mt-2 space-y-1">
                  <li><code className="bg-white px-2 py-1 rounded">RESTROBUDDY Starter</code></li>
                  <li><code className="bg-white px-2 py-1 rounded">RESTROBUDDY Professional</code></li>
                  <li><code className="bg-white px-2 py-1 rounded">RESTROBUDDY Enterprise</code></li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-700 w-8 h-8 rounded-full flex items-center justify-center font-bold">
                3
              </span>
              Test Your Setup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">
              Once you've created all products and prices in Stripe:
            </p>
            <Button 
              onClick={() => window.location.href = '/Pricing'}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Go to Pricing Page to Test Checkout
            </Button>
          </CardContent>
        </Card>

        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-900">
            <strong>After setup:</strong> The checkout function will automatically find your products by name and use the correct prices for monthly/annual billing.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
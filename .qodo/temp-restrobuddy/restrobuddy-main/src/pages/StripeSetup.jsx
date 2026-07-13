import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, AlertCircle, Loader2, Copy } from "lucide-react";
import { setupStripeProducts } from "@/functions/setupStripeProducts";

export default function StripeSetup() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSetup = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await setupStripeProducts({});
      
      if (response.data?.success) {
        setResult(response.data);
      } else {
        setError(response.data?.error || 'Setup failed');
      }
    } catch (err) {
      setError(err.message || 'Failed to setup Stripe products');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Stripe Product Setup</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Create RESTROBUDDY Subscription Products</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 mb-4">
            This will create the following products and prices in your Stripe account:
          </p>
          
          <div className="space-y-2 mb-6">
            <div className="border rounded p-3">
              <strong>RESTROBUDDY Starter</strong>
              <ul className="text-sm text-slate-600 mt-1">
                <li>• Monthly: $99/month</li>
                <li>• Annual: $950/year</li>
              </ul>
            </div>
            <div className="border rounded p-3">
              <strong>RESTROBUDDY Professional</strong>
              <ul className="text-sm text-slate-600 mt-1">
                <li>• Monthly: $299/month</li>
                <li>• Annual: $2,868/year</li>
              </ul>
            </div>
            <div className="border rounded p-3">
              <strong>RESTROBUDDY Enterprise</strong>
              <ul className="text-sm text-slate-600 mt-1">
                <li>• Monthly: $599/month</li>
                <li>• Annual: $5,748/year</li>
              </ul>
            </div>
          </div>

          <Button 
            onClick={handleSetup} 
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Products...
              </>
            ) : (
              'Create Stripe Products'
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-900">
            <strong>Error:</strong> {error}
            {error.includes('permissions') && (
              <div className="mt-2 text-sm">
                Your Stripe API key needs write permissions. Please:
                <ol className="list-decimal ml-4 mt-1">
                  <li>Go to Stripe Dashboard → Developers → API Keys</li>
                  <li>Create a new Restricted Key with these permissions:
                    <ul className="list-disc ml-4">
                      <li>Products: Write</li>
                      <li>Prices: Write</li>
                    </ul>
                  </li>
                  <li>Update STRIPE_API_KEY environment variable</li>
                </ol>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {result && (
        <Alert className="border-green-200 bg-green-50">
          <Check className="w-4 h-4 text-green-600" />
          <AlertDescription>
            <div className="text-green-900">
              <strong className="block mb-3">✅ Products created successfully!</strong>
              
              <div className="space-y-4 text-sm">
                {result.products?.map((product, idx) => (
                  <div key={idx} className="bg-white rounded p-3 border">
                    <div className="font-semibold mb-2 capitalize">{product.plan}</div>
                    <div className="space-y-1 font-mono text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Product ID:</span>
                        <div className="flex items-center gap-2">
                          <code className="bg-slate-100 px-2 py-1 rounded">{product.product_id}</code>
                          <button 
                            onClick={() => copyToClipboard(product.product_id)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Monthly Price:</span>
                        <div className="flex items-center gap-2">
                          <code className="bg-slate-100 px-2 py-1 rounded">{product.monthly_price_id}</code>
                          <button 
                            onClick={() => copyToClipboard(product.monthly_price_id)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Annual Price:</span>
                        <div className="flex items-center gap-2">
                          <code className="bg-slate-100 px-2 py-1 rounded">{product.annual_price_id}</code>
                          <button 
                            onClick={() => copyToClipboard(product.annual_price_id)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                <strong className="block mb-2">Next Steps:</strong>
                <ol className="list-decimal ml-4 space-y-1">
                  <li>Products and prices are now created in Stripe</li>
                  <li>The checkout function will automatically find and use them</li>
                  <li>You can now test the subscription flow on the Pricing page</li>
                </ol>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
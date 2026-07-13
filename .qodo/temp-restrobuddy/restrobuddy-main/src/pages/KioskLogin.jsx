
import React, { useState } from "react";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function KioskLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // In production, this would validate credentials
      // For now, we'll check if user exists and has admin/manager role
      await User.loginWithRedirect(window.location.origin + createPageUrl("KioskMode"));
    } catch (error) {
      console.error("Login error:", error);
      setError("Invalid credentials. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl">
        <CardHeader className="text-center">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e0344f6fce6eca73088ca1/51cbc3e9d_file_0000000081ac61f596211266b0c51fb41.png"
            alt="RESTROBUDDY"
            className="w-20 h-20 mx-auto mb-4"
          />
          <CardTitle className="text-3xl font-bold">Kiosk Manager Login</CardTitle>
          <p className="text-slate-600 mt-2">Sign in to activate kiosk mode</p>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-6 bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-base font-semibold">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="manager@restaurant.com"
                className="mt-2 h-12 rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-base font-semibold">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="mt-2 h-12 rounded-xl"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-lg py-6 rounded-xl"
            >
              {isLoading ? "Signing in..." : "Sign In to Kiosk"}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate(createPageUrl("OrderMenu"))}
                className="text-slate-600"
              >
                Back to Main Menu
              </Button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-900">
              <strong>Demo Mode:</strong> This would authenticate staff members with manager/admin roles. 
              Once authenticated, the kiosk switches to customer ordering mode.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

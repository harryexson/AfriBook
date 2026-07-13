import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function BackofficeSettings() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="bg-gradient-to-r from-slate-600 to-slate-700 border-b border-slate-500">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link to={createPageUrl("DeveloperBackoffice")}>
              <Button variant="ghost" className="text-white hover:bg-slate-500">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Settings className="w-8 h-8" />
            System Settings
          </h1>
          <p className="text-slate-100 mt-1">Configure pricing, commissions, and system-wide settings</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">
              System settings configuration will be available soon. This will include:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-slate-600">
              <li>Configure subscription pricing plans</li>
              <li>Set marketplace commission rates</li>
              <li>Manage email templates</li>
              <li>Configure payment processors</li>
              <li>Set trial period durations</li>
              <li>System-wide feature toggles</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
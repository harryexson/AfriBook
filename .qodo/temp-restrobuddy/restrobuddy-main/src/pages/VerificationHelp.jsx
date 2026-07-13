import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, CheckCircle, AlertCircle, RefreshCw, HelpCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function VerificationHelp() {
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState(null);

  const handleResendVerification = async () => {
    setResending(true);
    setMessage(null);
    
    try {
      // This would trigger Base44's resend verification email
      // For now, show instructions
      setMessage({
        type: "success",
        text: "If you haven't received your verification email, please check your spam folder or contact support."
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: "Unable to resend verification email. Please contact support."
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Email Verification Help</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {message && (
              <Alert className={message.type === "success" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
                {message.type === "success" ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={message.type === "success" ? "text-green-800" : "text-red-800"}>
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  Common Issues
                </h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Check your spam/junk folder for the verification email</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Make sure you're entering the code exactly as shown (copy/paste recommended)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Verification codes expire after 15 minutes - request a new one if needed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Ensure you're using the email address you signed up with</span>
                  </li>
                </ul>
              </div>

              <div className="bg-amber-50 rounded-lg p-4">
                <h3 className="font-semibold text-amber-900 mb-2">Still Having Issues?</h3>
                <p className="text-sm text-amber-800 mb-3">
                  If you continue to have problems verifying your email, please contact our support team:
                </p>
                <div className="space-y-2 text-sm text-amber-800">
                  <p>📧 Email: support@restrobuddy.com</p>
                  <p>💬 Live Chat: Available 9 AM - 5 PM EST</p>
                </div>
              </div>

              <Button
                onClick={handleResendVerification}
                disabled={resending}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {resending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Request Help
                  </>
                )}
              </Button>

              <div className="text-center">
                <Button
                  variant="link"
                  onClick={() => window.location.href = "/"}
                  className="text-slate-600"
                >
                  Back to Home
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
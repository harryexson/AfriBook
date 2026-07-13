import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";

export default function ReviewResponseModal({ 
  isOpen, 
  onClose, 
  review, 
  onSubmit,
  isSubmitting 
}) {
  const [response, setResponse] = useState(review?.response || "");

  const handleSubmit = async () => {
    if (!response.trim()) {
      alert("Please write a response");
      return;
    }
    await onSubmit(response);
    setResponse("");
  };

  if (!review) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Respond to Review</DialogTitle>
          <DialogDescription>
            Your response will be visible to all customers
          </DialogDescription>
        </DialogHeader>

        {/* Review Preview */}
        <Card className="bg-slate-50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-slate-900">{review.customer_name}</p>
                <p className="text-sm text-slate-500">{new Date(review.created_date).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                  />
                ))}
              </div>
            </div>
            <p className="text-slate-700">{review.review_text}</p>
            
            {/* Sentiment Badge */}
            {review.sentiment && (
              <div className="mt-3 pt-3 border-t">
                <span className="text-xs font-semibold text-slate-600">Sentiment: </span>
                <span className={`text-xs font-bold capitalize ${
                  review.sentiment === 'positive' ? 'text-green-600' :
                  review.sentiment === 'negative' ? 'text-red-600' :
                  'text-slate-600'
                }`}>
                  {review.sentiment}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Response Form */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="response">Your Response</Label>
            <Textarea
              id="response"
              placeholder="Thank you for your feedback! We appreciate your business and would like to address your concern..."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={5}
              className="mt-2 resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-slate-500 mt-1">
              {response.length}/1000 characters
            </p>
          </div>

          {review.response && review.response_date && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-blue-900 mb-1">Previous Response</p>
              <p className="text-sm text-blue-800 mb-2">{review.response}</p>
              <p className="text-xs text-blue-700">
                Responded on {new Date(review.response_date).toLocaleDateString()} by {review.response_by}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !response.trim()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Response'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
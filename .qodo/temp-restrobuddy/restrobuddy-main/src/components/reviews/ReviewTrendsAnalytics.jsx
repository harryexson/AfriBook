import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertTriangle, ThumbsUp } from "lucide-react";

export default function ReviewTrendsAnalytics({ reviews }) {
  // Aggregate themes
  const themeCount = {};
  const sentimentCount = { positive: 0, neutral: 0, negative: 0 };
  const concerns = [];
  const positives = [];

  reviews.forEach(review => {
    if (review.sentiment) {
      sentimentCount[review.sentiment]++;
    }
    
    if (review.themes) {
      review.themes.forEach(theme => {
        themeCount[theme] = (themeCount[theme] || 0) + 1;
      });
    }

    if (review.concerns) {
      concerns.push(...review.concerns);
    }
    
    if (review.positives) {
      positives.push(...review.positives);
    }
  });

  // Get top themes
  const topThemes = Object.entries(themeCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Get most common concerns
  const commonConcerns = {};
  concerns.forEach(c => {
    commonConcerns[c] = (commonConcerns[c] || 0) + 1;
  });
  const topConcerns = Object.entries(commonConcerns)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  // Get most common positives
  const commonPositives = {};
  positives.forEach(p => {
    commonPositives[p] = (commonPositives[p] || 0) + 1;
  });
  const topPositives = Object.entries(commonPositives)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const totalReviews = reviews.length;
  const sentimentPercentage = {
    positive: ((sentimentCount.positive / totalReviews) * 100).toFixed(0),
    neutral: ((sentimentCount.neutral / totalReviews) * 100).toFixed(0),
    negative: ((sentimentCount.negative / totalReviews) * 100).toFixed(0)
  };

  return (
    <div className="space-y-6">
      {/* Sentiment Overview */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <ThumbsUp className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-sm text-slate-600">Positive Reviews</p>
              <p className="text-3xl font-bold text-green-600">{sentimentCount.positive}</p>
              <p className="text-xs text-slate-500 mt-1">{sentimentPercentage.positive}% of reviews</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-sm text-slate-600">Neutral Reviews</p>
              <p className="text-3xl font-bold text-slate-600">{sentimentCount.neutral}</p>
              <p className="text-xs text-slate-500 mt-1">{sentimentPercentage.neutral}% of reviews</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-sm text-slate-600">Negative Reviews</p>
              <p className="text-3xl font-bold text-red-600">{sentimentCount.negative}</p>
              <p className="text-xs text-slate-500 mt-1">{sentimentPercentage.negative}% of reviews</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Themes */}
      {topThemes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Common Feedback Themes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topThemes.map(([theme, count]) => (
                <div key={theme} className="flex items-center justify-between">
                  <span className="text-slate-700 capitalize">{theme}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-emerald-600 h-2 rounded-full" 
                        style={{ width: `${(count / reviews.length) * 100}%` }}
                      />
                    </div>
                    <Badge>{count}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Positive Highlights */}
      {topPositives.length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-lg text-green-900">✨ What Customers Love</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topPositives.map(([positive, count]) => (
                <div key={positive} className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <div>
                    <p className="text-green-900">{positive}</p>
                    <p className="text-xs text-green-700">Mentioned {count} time{count > 1 ? 's' : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Areas for Improvement */}
      {topConcerns.length > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader>
            <CardTitle className="text-lg text-amber-900">⚠️ Areas for Improvement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topConcerns.map(([concern, count]) => (
                <div key={concern} className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <div>
                    <p className="text-amber-900">{concern}</p>
                    <p className="text-xs text-amber-700">Mentioned {count} time{count > 1 ? 's' : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
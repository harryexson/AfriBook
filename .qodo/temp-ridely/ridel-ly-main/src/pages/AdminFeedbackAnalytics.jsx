import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Star, 
  AlertTriangle,
  ThumbsUp,
  MessageCircle,
  Sparkles,
  BarChart3,
  Users
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminFeedbackAnalytics() {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: feedbackData, isLoading } = useQuery({
    queryKey: ['feedback-analytics', timeRange],
    queryFn: async () => {
      const cutoffDate = new Date();
      if (timeRange === '7d') cutoffDate.setDate(cutoffDate.getDate() - 7);
      else if (timeRange === '30d') cutoffDate.setDate(cutoffDate.getDate() - 30);
      else cutoffDate.setDate(cutoffDate.getDate() - 90);

      const feedback = await base44.entities.RideFeedback.filter({
        created_date: { $gte: cutoffDate.toISOString() }
      }, '-created_date', 500);

      return feedback;
    },
    refetchInterval: 60000
  });

  if (isLoading) {
    return <div className="p-8">Loading analytics...</div>;
  }

  // Calculate metrics
  const totalFeedback = feedbackData?.length || 0;
  const avgRating = totalFeedback > 0
    ? feedbackData.reduce((sum, f) => sum + f.overall_rating, 0) / totalFeedback
    : 0;

  const sentimentBreakdown = {
    positive: feedbackData?.filter(f => f.ai_analysis?.sentiment === 'positive').length || 0,
    neutral: feedbackData?.filter(f => f.ai_analysis?.sentiment === 'neutral').length || 0,
    negative: feedbackData?.filter(f => f.ai_analysis?.sentiment === 'negative').length || 0
  };

  const actionRequired = feedbackData?.filter(f => f.follow_up_required).length || 0;
  const wouldRecommend = feedbackData?.filter(f => f.would_recommend === true).length || 0;
  const npsScore = totalFeedback > 0 ? Math.round((wouldRecommend / totalFeedback) * 100) : 0;

  // Rating distribution
  const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
    rating: `${rating} ⭐`,
    count: feedbackData?.filter(f => f.overall_rating === rating).length || 0
  }));

  // Sentiment pie chart
  const sentimentData = [
    { name: 'Positive', value: sentimentBreakdown.positive },
    { name: 'Neutral', value: sentimentBreakdown.neutral },
    { name: 'Negative', value: sentimentBreakdown.negative }
  ];

  // Top issues
  const allIssues = feedbackData
    ?.flatMap(f => f.ai_analysis?.issues_detected || [])
    .reduce((acc, issue) => {
      acc[issue] = (acc[issue] || 0) + 1;
      return acc;
    }, {});

  const topIssues = Object.entries(allIssues || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([issue, count]) => ({ issue, count }));

  // Top compliments
  const allCompliments = feedbackData
    ?.flatMap(f => f.ai_analysis?.compliments || [])
    .reduce((acc, compliment) => {
      acc[compliment] = (acc[compliment] || 0) + 1;
      return acc;
    }, {});

  const topCompliments = Object.entries(allCompliments || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([compliment, count]) => ({ compliment, count }));

  // Category ratings
  const categoryRatings = [
    'driver_behavior',
    'vehicle_cleanliness',
    'ride_comfort',
    'driving_quality',
    'route_efficiency'
  ].map(category => {
    const ratings = feedbackData
      ?.map(f => f.category_ratings?.[category])
      .filter(r => r !== undefined && r !== null);
    
    const avg = ratings && ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      : 0;

    return {
      category: category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      rating: Math.round(avg * 10) / 10
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Feedback Analytics</h1>
          <p className="text-gray-600 mt-1">AI-powered insights from rider feedback</p>
        </div>
        <Tabs value={timeRange} onValueChange={setTimeRange}>
          <TabsList>
            <TabsTrigger value="7d">7 Days</TabsTrigger>
            <TabsTrigger value="30d">30 Days</TabsTrigger>
            <TabsTrigger value="90d">90 Days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFeedback}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              Responses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
              {avgRating.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Out of 5.0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">NPS Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{npsScore}%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" />
              Would recommend
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Action Required</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{actionRequired}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Needs follow-up
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Positive Sentiment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalFeedback > 0 ? Math.round((sentimentBreakdown.positive / totalFeedback) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI analyzed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ratingDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rating" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sentiment Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Ratings</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryRatings} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 5]} />
                <YAxis dataKey="category" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="rating" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Top Issues Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topIssues.length > 0 ? (
              <div className="space-y-2">
                {topIssues.map((issue, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                    <span className="text-sm flex-1">{issue.issue}</span>
                    <Badge className="bg-red-100 text-red-800">{issue.count}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No issues detected</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Compliments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ThumbsUp className="w-5 h-5 text-green-600" />
            Top Compliments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topCompliments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {topCompliments.map((comp, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm flex-1">{comp.compliment}</span>
                  <Badge className="bg-green-100 text-green-800">{comp.count}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No compliments yet</p>
          )}
        </CardContent>
      </Card>

      {/* Action Required List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Feedback Requiring Action ({actionRequired})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {feedbackData
              ?.filter(f => f.follow_up_required)
              .slice(0, 10)
              .map((feedback) => (
                <div key={feedback.id} className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-red-100 text-red-800">
                          {feedback.overall_rating} ⭐
                        </Badge>
                        <Badge variant="outline">
                          Ride {feedback.ride_id.slice(0, 8)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mt-2">
                        {feedback.feedback_text || 'No text provided'}
                      </p>
                    </div>
                  </div>
                  
                  {feedback.ai_analysis?.issues_detected && feedback.ai_analysis.issues_detected.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-red-200">
                      <p className="text-xs font-semibold text-red-800 mb-2">AI Detected Issues:</p>
                      <div className="flex flex-wrap gap-2">
                        {feedback.ai_analysis.issues_detected.map((issue, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {issue}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline">
                      View Ride Details
                    </Button>
                    <Button size="sm" variant="outline">
                      Contact User
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
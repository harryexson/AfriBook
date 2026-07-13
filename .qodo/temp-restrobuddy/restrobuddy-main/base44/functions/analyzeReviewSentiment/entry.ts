import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reviewId, reviewText, restaurantId, type = 'restaurant' } = await req.json();

    if (!reviewText || !reviewId) {
      return Response.json({ error: 'Missing reviewText or reviewId' }, { status: 400 });
    }

    // Analyze sentiment using LLM
    const analysisResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this customer review and provide sentiment analysis. Identify the overall sentiment, key themes, and specific topics mentioned.

Review: "${reviewText}"

Provide:
1. Overall sentiment (positive, neutral, negative)
2. Sentiment score (0-1, where 0 is very negative and 1 is very positive)
3. Key themes mentioned (food quality, service, price, cleanliness, wait time, etc.)
4. Top 3 specific positive comments if any
5. Top 3 specific concerns if any
6. Urgency level for response (low, medium, high)`,
      response_json_schema: {
        type: "object",
        properties: {
          sentiment: { 
            type: "string",
            enum: ["positive", "neutral", "negative"]
          },
          sentiment_score: { type: "number" },
          themes: { 
            type: "array",
            items: { type: "string" }
          },
          positives: { 
            type: "array",
            items: { type: "string" }
          },
          concerns: { 
            type: "array",
            items: { type: "string" }
          },
          response_urgency: {
            type: "string",
            enum: ["low", "medium", "high"]
          }
        }
      }
    });

    // Save sentiment analysis to review
    const EntityName = type === 'restaurant' ? 'RestaurantReview' : 'MenuItemReview';
    await base44.asServiceRole.entities[EntityName].update(reviewId, {
      sentiment: analysisResult.sentiment,
      sentiment_score: analysisResult.sentiment_score,
      themes: analysisResult.themes,
      response_urgency: analysisResult.response_urgency
    });

    return Response.json({
      success: true,
      analysis: analysisResult
    });
  } catch (error) {
    console.error('Error analyzing review:', error);
    return Response.json({ 
      error: error.message || 'Failed to analyze review' 
    }, { status: 500 });
  }
});
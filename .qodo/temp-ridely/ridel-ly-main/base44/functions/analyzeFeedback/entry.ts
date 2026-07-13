import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { rideId, driverId, feedbackData } = await req.json();

        if (!rideId || !driverId || !feedbackData) {
            return Response.json({ 
                error: 'Missing required fields' 
            }, { status: 400 });
        }

        // Get ride details
        const ride = await base44.entities.Ride.get(rideId);
        if (!ride) {
            return Response.json({ error: 'Ride not found' }, { status: 404 });
        }

        // AI Analysis of feedback text
        let aiAnalysis = {
            sentiment: 'neutral',
            sentiment_score: 0,
            key_themes: [],
            issues_detected: [],
            compliments: [],
            action_required: false
        };

        if (feedbackData.feedback_text && feedbackData.feedback_text.trim().length > 0) {
            try {
                const analysisResult = await base44.integrations.Core.InvokeLLM({
                    prompt: `Analyze this ride feedback and extract insights:
                    
Feedback: "${feedbackData.feedback_text}"
Overall Rating: ${feedbackData.overall_rating}/5

Please analyze and return:
1. Sentiment (positive, neutral, or negative)
2. Sentiment score from -1 (very negative) to 1 (very positive)
3. Key themes mentioned (max 5)
4. Specific issues or complaints (if any)
5. Compliments or positive aspects (if any)
6. Whether immediate action/follow-up is required based on severity

Consider the overall rating alongside the text. Low ratings (1-2) should trigger action_required even if text is neutral.`,
                    response_json_schema: {
                        type: 'object',
                        properties: {
                            sentiment: {
                                type: 'string',
                                enum: ['positive', 'neutral', 'negative']
                            },
                            sentiment_score: {
                                type: 'number',
                                minimum: -1,
                                maximum: 1
                            },
                            key_themes: {
                                type: 'array',
                                items: { type: 'string' },
                                maxItems: 5
                            },
                            issues_detected: {
                                type: 'array',
                                items: { type: 'string' }
                            },
                            compliments: {
                                type: 'array',
                                items: { type: 'string' }
                            },
                            action_required: {
                                type: 'boolean'
                            }
                        }
                    }
                });

                if (analysisResult) {
                    aiAnalysis = analysisResult;
                }
            } catch (aiError) {
                console.error('AI analysis error:', aiError);
                // Continue without AI analysis
                // Fallback: determine action_required based on rating
                if (feedbackData.overall_rating <= 2) {
                    aiAnalysis.action_required = true;
                    aiAnalysis.sentiment = 'negative';
                    aiAnalysis.sentiment_score = -0.5;
                }
            }
        } else {
            // No text feedback, just use rating
            if (feedbackData.overall_rating >= 4) {
                aiAnalysis.sentiment = 'positive';
                aiAnalysis.sentiment_score = 0.7;
            } else if (feedbackData.overall_rating <= 2) {
                aiAnalysis.sentiment = 'negative';
                aiAnalysis.sentiment_score = -0.5;
                aiAnalysis.action_required = true;
            }
        }

        // Create feedback record with AI analysis
        const feedbackRecord = await base44.entities.RideFeedback.create({
            ride_id: rideId,
            rider_id: user.id,
            driver_id: driverId,
            overall_rating: feedbackData.overall_rating,
            category_ratings: feedbackData.category_ratings || {},
            feedback_text: feedbackData.feedback_text || '',
            ai_analysis: aiAnalysis,
            preferences_followed: feedbackData.preferences_followed || {},
            would_recommend: feedbackData.would_recommend,
            tip_amount: feedbackData.tip_amount || 0,
            follow_up_required: aiAnalysis.action_required
        });

        // Update ride with rating and tip
        await base44.entities.Ride.update(rideId, {
            rider_rating: feedbackData.overall_rating,
            fare: {
                ...ride.fare,
                tip_amount: feedbackData.tip_amount || 0
            }
        });

        // Update driver's average rating
        const driver = await base44.entities.User.get(driverId);
        const allFeedback = await base44.entities.RideFeedback.filter({
            driver_id: driverId
        });

        const avgRating = allFeedback.reduce((sum, f) => sum + f.overall_rating, 0) / allFeedback.length;
        
        await base44.asServiceRole.entities.User.update(driverId, {
            average_rating: Math.round(avgRating * 10) / 10
        });

        // If action required, create support ticket
        if (aiAnalysis.action_required) {
            try {
                await base44.asServiceRole.entities.SupportConversation.create({
                    user_id: user.id,
                    user_type: 'rider',
                    subject: `Low rating feedback - Ride ${rideId.slice(0, 8)}`,
                    category: 'feedback',
                    status: 'open',
                    priority: 'high',
                    metadata: {
                        ride_id: rideId,
                        rating: feedbackData.overall_rating,
                        auto_created: true
                    }
                });

                // Create initial message
                await base44.asServiceRole.entities.SupportMessage.create({
                    conversation_id: (await base44.entities.SupportConversation.filter({
                        user_id: user.id,
                        metadata: { ride_id: rideId }
                    }, '-created_date', 1))[0].id,
                    sender_id: 'system',
                    sender_type: 'system',
                    message_text: `Low rating received (${feedbackData.overall_rating}/5) for ride. Feedback: ${feedbackData.feedback_text || 'No text provided'}. Issues detected: ${aiAnalysis.issues_detected.join(', ') || 'None specified'}`,
                    is_read_by_agent: false
                });
            } catch (supportError) {
                console.error('Error creating support ticket:', supportError);
            }
        }

        console.log(`[FEEDBACK] Analyzed feedback for ride ${rideId}: ${aiAnalysis.sentiment} (${feedbackData.overall_rating}/5)`);

        return Response.json({
            success: true,
            feedback_id: feedbackRecord.id,
            ai_analysis: aiAnalysis,
            message: 'Feedback submitted successfully'
        });

    } catch (error) {
        console.error('[FEEDBACK ERROR]:', error);
        return Response.json({ 
            error: error.message,
            success: false
        }, { status: 500 });
    }
});
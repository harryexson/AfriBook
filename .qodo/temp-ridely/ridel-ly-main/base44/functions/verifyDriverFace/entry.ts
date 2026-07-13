import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { capturedImageUrl, driverId } = await req.json();

    if (!capturedImageUrl || !driverId) {
      return Response.json({ 
        error: 'Missing required parameters',
        verified: false 
      }, { status: 400 });
    }

    // Get driver's license photo from their documents
    const driverDocuments = await base44.asServiceRole.entities.DriverDocument.filter({
      driver_id: driverId,
      document_type: 'drivers_license',
      status: 'approved'
    });

    if (!driverDocuments || driverDocuments.length === 0) {
      return Response.json({
        verified: false,
        reason: 'No approved driver license found. Please upload your driver license first.'
      });
    }

    const licenseDocument = driverDocuments[0];
    const licenseImageUrl = licenseDocument.document_url;

    if (!licenseImageUrl) {
      return Response.json({
        verified: false,
        reason: 'Driver license image not available'
      });
    }

    // Use LLM with vision capabilities to compare faces
    const verificationPrompt = `You are a facial recognition verification system. Compare the two face images and determine if they are the same person.

Image 1 (Live capture): ${capturedImageUrl}
Image 2 (Driver's license): ${licenseImageUrl}

Analyze the facial features including:
- Face shape and structure
- Eye shape, spacing, and position
- Nose shape and size
- Mouth and lip structure
- Ear shape (if visible)
- Overall facial proportions

Consider that:
- Lighting conditions may differ
- The person may have aged slightly
- Hair style may have changed
- Facial hair may differ
- Glasses may or may not be present

Determine if these images show the SAME person with high confidence.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: verificationPrompt,
      file_urls: [capturedImageUrl, licenseImageUrl],
      response_json_schema: {
        type: "object",
        properties: {
          is_same_person: {
            type: "boolean",
            description: "Whether the two images show the same person"
          },
          confidence: {
            type: "number",
            description: "Confidence score between 0 and 1"
          },
          reasoning: {
            type: "string",
            description: "Brief explanation of the decision"
          },
          matching_features: {
            type: "array",
            items: { type: "string" },
            description: "List of matching facial features"
          },
          concerns: {
            type: "array",
            items: { type: "string" },
            description: "Any concerns or discrepancies noted"
          }
        },
        required: ["is_same_person", "confidence", "reasoning"]
      }
    });

    const verification = result;
    
    // Require high confidence for verification (>= 0.75)
    const isVerified = verification.is_same_person && verification.confidence >= 0.75;

    // Log verification attempt
    const sessionId = `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      await base44.asServiceRole.entities.DriverDocument.create({
        driver_id: driverId,
        document_type: 'facial_verification',
        document_url: capturedImageUrl,
        status: isVerified ? 'approved' : 'rejected',
        verification_notes: JSON.stringify({
          session_id: sessionId,
          confidence: verification.confidence,
          reasoning: verification.reasoning,
          matching_features: verification.matching_features,
          concerns: verification.concerns,
          verified_at: new Date().toISOString()
        })
      });
    } catch (logError) {
      console.log('Could not log verification attempt:', logError.message);
    }

    if (isVerified) {
      return Response.json({
        verified: true,
        confidence: verification.confidence,
        session_id: sessionId,
        message: 'Identity verified successfully'
      });
    } else {
      let reason = 'Face does not match driver license photo';
      
      if (verification.confidence < 0.5) {
        reason = 'Low confidence match. Please ensure good lighting and face the camera directly.';
      } else if (verification.concerns && verification.concerns.length > 0) {
        reason = `Verification concerns: ${verification.concerns.join(', ')}`;
      }

      return Response.json({
        verified: false,
        confidence: verification.confidence,
        reason: reason,
        session_id: sessionId
      });
    }

  } catch (error) {
    console.error('Facial verification error:', error);
    return Response.json({ 
      error: error.message,
      verified: false,
      reason: 'Verification service error. Please try again.'
    }, { status: 500 });
  }
});
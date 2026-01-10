import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role for server-side operations
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Challenge definitions - must match WaveformAssessment.jsx
const challengeData = {
    1: { originalCycles: 4, octaves: 1, direction: 'lower' },  // 4 → 2 cycles
    2: { originalCycles: 2, octaves: 1, direction: 'higher' }, // 2 → 4 cycles
    3: { originalCycles: 4, octaves: 1, direction: 'lower' },  // 4 → 2 cycles
    4: { originalCycles: 6, octaves: 1, direction: 'lower' },  // 6 → 3 cycles
    5: { originalCycles: 3, octaves: 1, direction: 'higher' }, // 3 → 6 cycles
    6: { originalCycles: 8, octaves: 2, direction: 'lower' },  // 8 → 2 cycles
    7: { originalCycles: 4, octaves: 1, direction: 'lower' },  // 4 → 2 cycles
    8: { originalCycles: 2, octaves: 2, direction: 'higher' }, // 2 → 8 cycles
    9: { originalCycles: 4, octaves: 1, direction: 'higher' }, // 4 → 8 cycles
    10: { originalCycles: 3, octaves: 1, direction: 'higher' } // 3 → 6 cycles
};

function calculateExpectedCycles(challengeNumber, originalCycles, octaves, direction) {
    // Use challenge data if available, otherwise calculate from parameters
    const challenge = challengeData[challengeNumber];
    const cycles = challenge ? challenge.originalCycles : originalCycles;
    const oct = challenge ? challenge.octaves : octaves;
    const dir = challenge ? challenge.direction : direction;

    if (dir === 'higher') {
        return cycles * Math.pow(2, oct);
    } else {
        return cycles / Math.pow(2, oct);
    }
}

export async function POST(request) {
    try {
        const { submissionId } = await request.json();

        if (!submissionId) {
            return Response.json({ error: 'Missing submissionId' }, { status: 400 });
        }

        // Check for API key
        if (!process.env.ANTHROPIC_API_KEY) {
            return Response.json({
                error: 'ANTHROPIC_API_KEY not configured. Add it to your environment variables.'
            }, { status: 500 });
        }

        // Fetch submission from database
        const { data: submission, error: fetchError } = await supabase
            .from('submissions')
            .select('*')
            .eq('id', submissionId)
            .single();

        if (fetchError || !submission) {
            return Response.json({ error: 'Submission not found' }, { status: 404 });
        }

        // Calculate expected cycles
        const expectedCycles = calculateExpectedCycles(
            submission.challenge_number,
            4, // default original cycles
            submission.octaves,
            submission.direction
        );

        const challenge = challengeData[submission.challenge_number] || {};
        const originalCycles = challenge.originalCycles || 4;

        // Prepare image data - remove data URL prefix if present
        let imageData = submission.drawing_image;
        let mediaType = 'image/png';

        if (imageData.startsWith('data:')) {
            const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) {
                mediaType = matches[1];
                imageData = matches[2];
            }
        }

        // Create Claude client
        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });

        // Build the marking prompt
        const markingPrompt = `You are marking a student's waveform drawing assessment for A-Level Music Technology.

IMAGE CONTEXT:
- The dashed gray line shows the ORIGINAL waveform: a ${submission.original_shape} wave with ${originalCycles} cycles
- The solid blue line is the STUDENT'S DRAWING that you need to mark
- The student was asked to draw a ${submission.target_shape} wave that is ${submission.octaves} octave(s) ${submission.direction}

EXPECTED ANSWER:
- The student should have drawn ${expectedCycles} cycles of a ${submission.target_shape} wave
- Going ${submission.octaves} octave(s) ${submission.direction} means ${submission.direction === 'higher' ? 'doubling' : 'halving'} the frequency${submission.octaves === 2 ? ' twice (4x or ÷4)' : ''}

MARKING CRITERIA (10 marks total):
1. CYCLE COUNT (4 marks): Count the complete cycles in the blue student drawing. Expected: ${expectedCycles} cycles
2. SHAPE ACCURACY (4 marks): Is the blue line a correct ${submission.target_shape} wave shape?
3. DRAWING QUALITY (2 marks): Is the drawing clear, consistent in amplitude, and well-executed?

Please analyze the image carefully and provide your assessment as JSON in this exact format:
{
  "cycleCount": {
    "detected": <number of cycles you count in the blue line>,
    "expected": ${expectedCycles},
    "correct": <true if detected equals expected, false otherwise>,
    "marks": <0-4 based on accuracy>,
    "feedback": "<specific feedback about cycle count>"
  },
  "shapeAccuracy": {
    "detected": "<what shape you see: sine/square/saw/triangle/unclear>",
    "expected": "${submission.target_shape}",
    "correct": <true if shape matches, false otherwise>,
    "marks": <0-4 based on accuracy>,
    "feedback": "<specific feedback about shape>"
  },
  "drawingQuality": {
    "marks": <0-2>,
    "feedback": "<feedback about clarity and consistency>"
  },
  "overallFeedback": "<2-3 sentences summarizing the student's work>",
  "strengths": ["<strength 1>", "<strength 2 if applicable>"],
  "improvements": ["<improvement 1>", "<improvement 2 if applicable>"],
  "suggestedMark": <total out of 10>,
  "confidence": "<high/medium/low - how confident you are in this assessment>"
}

Return ONLY the JSON object, no other text.`;

        // Call Claude vision API
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: mediaType,
                                data: imageData,
                            },
                        },
                        {
                            type: 'text',
                            text: markingPrompt,
                        },
                    ],
                },
            ],
        });

        // Extract response text
        const responseText = response.content[0].text;

        // Parse JSON from response
        let feedback;
        try {
            // Try to extract JSON from the response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                feedback = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found in response');
            }
        } catch (parseError) {
            console.error('Failed to parse AI response:', responseText);
            return Response.json({
                error: 'Failed to parse AI response',
                rawResponse: responseText
            }, { status: 500 });
        }

        // Save feedback to database
        const { error: updateError } = await supabase
            .from('submissions')
            .update({
                ai_feedback: feedback,
                ai_mark: feedback.suggestedMark,
                ai_marked_at: new Date().toISOString(),
            })
            .eq('id', submissionId);

        if (updateError) {
            console.error('Failed to save feedback:', updateError);
            // Still return feedback even if save fails
        }

        return Response.json({
            success: true,
            feedback,
            markedAt: new Date().toISOString(),
        });

    } catch (error) {
        console.error('AI marking error:', error);
        return Response.json({
            error: error.message || 'Failed to process marking request'
        }, { status: 500 });
    }
}

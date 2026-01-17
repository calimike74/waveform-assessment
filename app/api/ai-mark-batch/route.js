import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

// Lazy Supabase client creation to avoid build-time errors
let supabase = null;
function getSupabase() {
    if (!supabase) {
        supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
    }
    return supabase;
}

// Challenge definitions for waveform-octaves assessment
const octaveChallengeData = {
    1: { originalCycles: 4, octaves: 1, direction: 'lower' },
    2: { originalCycles: 2, octaves: 1, direction: 'higher' },
    3: { originalCycles: 4, octaves: 1, direction: 'lower' },
    4: { originalCycles: 6, octaves: 1, direction: 'lower' },
    5: { originalCycles: 3, octaves: 1, direction: 'higher' },
    6: { originalCycles: 8, octaves: 2, direction: 'lower' },
    7: { originalCycles: 4, octaves: 1, direction: 'lower' },
    8: { originalCycles: 2, octaves: 2, direction: 'higher' },
    9: { originalCycles: 4, octaves: 1, direction: 'higher' },
    10: { originalCycles: 3, octaves: 1, direction: 'higher' }
};

// Challenge definitions for waveform-periods assessment
const periodChallengeData = {
    1: { shape: 'sine', periodMs: 1, expectedCycles: 5, transitionPoints: null },
    2: { shape: 'square', periodMs: 2, expectedCycles: 2.5, transitionPoints: [1, 2, 3, 4] },
    3: { shape: 'sine', periodMs: 0.5, expectedCycles: 10, transitionPoints: null },
    4: { shape: 'triangle', periodMs: 1, expectedCycles: 5, transitionPoints: null },
    5: { shape: 'square', periodMs: 1, expectedCycles: 5, transitionPoints: [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5] },
    6: { shape: 'saw', periodMs: 2, expectedCycles: 2.5, transitionPoints: [2, 4] },
    7: { shape: 'sine', periodMs: 4, expectedCycles: 1.25, transitionPoints: null },
    8: { shape: 'triangle', periodMs: 2, expectedCycles: 2.5, transitionPoints: null },
    9: { shape: 'square', periodMs: 0.5, expectedCycles: 10, transitionPoints: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4, 4.25, 4.5, 4.75] },
    10: { shape: 'saw', periodMs: 1, expectedCycles: 5, transitionPoints: [1, 2, 3, 4, 5] }
};

function calculateExpectedCycles(challengeNumber, originalCycles, octaves, direction) {
    const challenge = octaveChallengeData[challengeNumber];
    const cycles = challenge ? challenge.originalCycles : originalCycles;
    const oct = challenge ? challenge.octaves : octaves;
    const dir = challenge ? challenge.direction : direction;

    if (dir === 'higher') {
        return cycles * Math.pow(2, oct);
    } else {
        return cycles / Math.pow(2, oct);
    }
}

function buildPeriodMarkingPrompt(submission, challenge, correctAnswerData) {
    const hasTransitions = challenge.shape === 'square' || challenge.shape === 'saw';
    const transitionInfo = hasTransitions && challenge.transitionPoints
        ? `\nTRANSITION TIMING VERIFICATION (for ${challenge.shape} waves):
Expected transition times: ${challenge.transitionPoints.join(', ')}ms
${challenge.shape === 'square' ? 'Square wave transitions (high<->low) should occur at these times.' : 'Sawtooth resets (instant drops) should occur at these times.'}
Check that the student\'s drawing shows transitions at approximately these positions.`
        : '';

    const transitionJson = hasTransitions
        ? `"transitionTiming": {
    "expectedPositions": [${(challenge.transitionPoints || []).join(', ')}],
    "assessment": "<accurate/slightly off/significantly wrong>",
    "correct": <true if transitions are at approximately correct positions>
  },`
        : '';

    if (correctAnswerData) {
        return `You are marking a student's period waveform drawing for A-Level Music Technology.

TWO IMAGES PROVIDED:
1. FIRST IMAGE (Student's Drawing): Time axis 0-5ms, student's waveform (solid blue)
2. SECOND IMAGE (Correct Answer): Time axis 0-5ms, correct waveform (solid green)

TASK GIVEN TO STUDENT:
- Draw a ${challenge.shape.toUpperCase()} wave with period ${challenge.periodMs}ms
- Time window: 0-5ms
- Expected number of cycles: ${challenge.expectedCycles} (calculated: 5ms / ${challenge.periodMs}ms)
${transitionInfo}

BINARY MARKING RULES (1 mark per question):
Award 1 mark ONLY if ALL conditions are met:
1. CYCLE COUNT: Student's blue line has approximately ${challenge.expectedCycles} complete cycles
2. WAVEFORM SHAPE: Student's blue line shows correct ${challenge.shape} wave characteristics
${hasTransitions ? `3. TRANSITION TIMING: Transitions occur at approximately correct time positions` : ''}

Award 0 marks if any condition is wrong.

SHAPE CHARACTERISTICS:
${challenge.shape === 'sine' ? '- SINE: Smooth sinusoidal curve with rounded peaks and troughs' : ''}
${challenge.shape === 'square' ? '- SQUARE: Flat tops and bottoms with vertical transitions (sharp corners)' : ''}
${challenge.shape === 'saw' ? '- SAW: Linear diagonal ramps with instant vertical resets' : ''}
${challenge.shape === 'triangle' ? '- TRIANGLE: Linear segments meeting at sharp peaks and troughs' : ''}

IMPORTANT: Address the student directly using "you" in feedback.

Respond with JSON only:
{
  "cycleCount": {
    "detected": <number of complete cycles visible in blue line>,
    "expected": ${challenge.expectedCycles},
    "correct": <true if detected approximately matches expected>
  },
  "shapeAccuracy": {
    "detected": "<sine/square/saw/triangle/unclear>",
    "expected": "${challenge.shape}",
    "correct": <true if shape matches>
  },
  ${transitionJson}
  "mark": <1 if ALL required conditions are correct, otherwise 0>,
  "feedback": "<brief constructive feedback addressing the student with 'you'>"
}`;
    } else {
        return `You are marking a student's period waveform drawing for A-Level Music Technology.

IMAGE:
- Blue line = THE STUDENT'S DRAWING to mark
- Time axis: 0-5ms (X-axis, shown at bottom)
- Displacement axis (Y-axis)

TASK GIVEN TO STUDENT:
- Draw a ${challenge.shape.toUpperCase()} wave with period ${challenge.periodMs}ms
- Time window: 0-5ms
- Expected number of cycles: ${challenge.expectedCycles} (calculated: 5ms / ${challenge.periodMs}ms)
${transitionInfo}

BINARY MARKING RULES (1 mark per question):
Award 1 mark ONLY if ALL conditions are met:
1. CYCLE COUNT: Drawing shows approximately ${challenge.expectedCycles} complete cycles
2. WAVEFORM SHAPE: Drawing shows correct ${challenge.shape} wave characteristics
${hasTransitions ? `3. TRANSITION TIMING: Transitions occur at approximately correct time positions` : ''}

Award 0 marks if any condition is wrong.

IMPORTANT: Address the student directly using "you" in feedback.

Respond with JSON only:
{
  "cycleCount": {
    "detected": <number of complete cycles visible>,
    "expected": ${challenge.expectedCycles},
    "correct": <true if detected approximately matches expected>
  },
  "shapeAccuracy": {
    "detected": "<sine/square/saw/triangle/unclear>",
    "expected": "${challenge.shape}",
    "correct": <true if shape matches>
  },
  ${transitionJson}
  "mark": <1 if ALL required conditions are correct, otherwise 0>,
  "feedback": "<brief constructive feedback addressing the student with 'you'>"
}`;
    }
}

function buildOctaveMarkingPrompt(submission, originalCycles, expectedCycles, correctAnswerData) {
    if (correctAnswerData) {
        return `You are marking a student's waveform drawing for A-Level Music Technology.

TWO IMAGES PROVIDED:
1. FIRST IMAGE (Student's Drawing): Original waveform (dashed gray) + student's attempt (solid blue)
2. SECOND IMAGE (Correct Answer): Original waveform (dashed gray) + correct answer (solid green)

TASK:
- Original: ${submission.original_shape} wave with ${originalCycles} cycles
- Student asked to draw: ${submission.target_shape} wave, ${submission.octaves} octave(s) ${submission.direction}
- Expected: ${expectedCycles} cycles of a ${submission.target_shape} wave

BINARY MARKING RULES (1 mark per question):
Award 1 mark ONLY if BOTH conditions are met:
1. CYCLE COUNT: The student's blue line has ${expectedCycles} complete cycles (peaks and troughs)
2. WAVEFORM SHAPE: The student's blue line shows the correct ${submission.target_shape} wave shape

Award 0 marks if either condition is wrong.

Count cycles by counting complete oscillations (peak-to-trough-to-peak = 1 cycle).
For octave transformations: higher = doubled cycles, lower = halved cycles.

IMPORTANT: In your feedback, address the student directly using "you" (e.g. "You drew..." not "The student drew...").

Provide your assessment as JSON:
{
  "cycleCount": {
    "detected": <number of complete cycles in the blue line>,
    "expected": ${expectedCycles},
    "correct": <true if detected equals expected>
  },
  "shapeAccuracy": {
    "detected": "<sine/square/saw/triangle/unclear>",
    "expected": "${submission.target_shape}",
    "correct": <true if shape matches>
  },
  "mark": <1 if BOTH cycleCount.correct AND shapeAccuracy.correct are true, otherwise 0>,
  "feedback": "<brief feedback addressing the student directly using 'you' - e.g. 'Well done! You drew...' or 'You drew X cycles but needed Y...'>"
}

Return ONLY the JSON object.`;
    } else {
        return `You are marking a student's waveform drawing for A-Level Music Technology.

IMAGE:
- Dashed gray line = ORIGINAL waveform: ${submission.original_shape} wave with ${originalCycles} cycles
- Solid blue line = THE STUDENT'S DRAWING to mark
- Task: Draw a ${submission.target_shape} wave, ${submission.octaves} octave(s) ${submission.direction}
- Expected: ${expectedCycles} cycles of a ${submission.target_shape} wave

BINARY MARKING RULES (1 mark per question):
Award 1 mark ONLY if BOTH conditions are met:
1. CYCLE COUNT: The blue line has ${expectedCycles} complete cycles
2. WAVEFORM SHAPE: The blue line shows a correct ${submission.target_shape} wave

Award 0 marks if either condition is wrong.

Count cycles by counting complete oscillations (peak-to-trough-to-peak = 1 cycle).
For octave changes: ${submission.direction} by ${submission.octaves} octave(s) means ${submission.direction === 'higher' ? 'multiply' : 'divide'} cycles by ${Math.pow(2, submission.octaves)}.

IMPORTANT: In your feedback, address the student directly using "you" (e.g. "You drew..." not "The student drew...").

Provide your assessment as JSON:
{
  "cycleCount": {
    "detected": <number of complete cycles in the blue line>,
    "expected": ${expectedCycles},
    "correct": <true if detected equals expected>
  },
  "shapeAccuracy": {
    "detected": "<sine/square/saw/triangle/unclear>",
    "expected": "${submission.target_shape}",
    "correct": <true if shape matches>
  },
  "mark": <1 if BOTH cycleCount.correct AND shapeAccuracy.correct are true, otherwise 0>,
  "feedback": "<brief feedback addressing the student directly using 'you' - e.g. 'Well done! You drew...' or 'You drew X cycles but needed Y...'>"
}

Return ONLY the JSON object.`;
    }
}

async function markSingleSubmission(anthropic, submission, correctAnswerImages) {
    const assessmentId = submission.assessment_id;
    const isPeriodAssessment = assessmentId === 'waveform-periods';

    let expectedCycles;
    let originalCycles;
    let challenge;
    let markingPrompt;

    if (isPeriodAssessment) {
        challenge = periodChallengeData[submission.challenge_number] || {};
        expectedCycles = challenge.expectedCycles || (5 / (submission.period_ms || 1));
        originalCycles = null;
    } else {
        challenge = octaveChallengeData[submission.challenge_number] || {};
        originalCycles = challenge.originalCycles || 4;
        expectedCycles = calculateExpectedCycles(
            submission.challenge_number,
            4,
            submission.octaves,
            submission.direction
        );
    }

    // Prepare image data
    let imageData = submission.drawing_image;
    let mediaType = 'image/png';

    if (imageData.startsWith('data:')) {
        const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
            mediaType = matches[1];
            imageData = matches[2];
        }
    }

    // Get correct answer image if provided
    const correctAnswerImage = correctAnswerImages?.[submission.challenge_number];
    let correctAnswerData = null;
    let correctAnswerMediaType = 'image/png';

    if (correctAnswerImage) {
        if (correctAnswerImage.startsWith('data:')) {
            const matches = correctAnswerImage.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) {
                correctAnswerMediaType = matches[1];
                correctAnswerData = matches[2];
            }
        } else {
            correctAnswerData = correctAnswerImage;
        }
    }

    // Build the appropriate marking prompt
    if (isPeriodAssessment) {
        markingPrompt = buildPeriodMarkingPrompt(submission, challenge, correctAnswerData);
    } else {
        markingPrompt = buildOctaveMarkingPrompt(submission, originalCycles, expectedCycles, correctAnswerData);
    }

    // Build message content
    const messageContent = [];
    messageContent.push({
        type: 'image',
        source: {
            type: 'base64',
            media_type: mediaType,
            data: imageData,
        },
    });

    if (correctAnswerData) {
        messageContent.push({
            type: 'image',
            source: {
                type: 'base64',
                media_type: correctAnswerMediaType,
                data: correctAnswerData,
            },
        });
    }

    messageContent.push({
        type: 'text',
        text: markingPrompt,
    });

    // Call Claude vision API
    const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
            {
                role: 'user',
                content: messageContent,
            },
        ],
    });

    // Parse response
    const responseText = response.content[0].text;
    let feedback;

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        feedback = JSON.parse(jsonMatch[0]);
    } else {
        throw new Error('No JSON found in response');
    }

    // Update submission in database
    await getSupabase()
        .from('submissions')
        .update({
            ai_feedback: feedback,
            ai_mark: feedback.mark !== undefined ? feedback.mark : feedback.suggestedMark,
            ai_marked_at: new Date().toISOString(),
        })
        .eq('id', submission.id);

    return {
        submissionId: submission.id,
        challengeNumber: submission.challenge_number,
        feedback,
        mark: feedback.mark !== undefined ? feedback.mark : 0,
    };
}

export async function POST(request) {
    try {
        const { submissionIds, correctAnswerImages } = await request.json();

        if (!submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0) {
            return Response.json({ error: 'Missing or empty submissionIds array' }, { status: 400 });
        }

        if (!process.env.ANTHROPIC_API_KEY) {
            return Response.json({
                error: 'ANTHROPIC_API_KEY not configured. Add it to your environment variables.'
            }, { status: 500 });
        }

        // Fetch all submissions from database
        const { data: submissions, error: fetchError } = await getSupabase()
            .from('submissions')
            .select('*')
            .in('id', submissionIds);

        if (fetchError) {
            return Response.json({ error: 'Failed to fetch submissions' }, { status: 500 });
        }

        if (!submissions || submissions.length === 0) {
            return Response.json({ error: 'No submissions found' }, { status: 404 });
        }

        // Create Anthropic client
        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });

        // Mark submissions sequentially to avoid rate limits
        const results = [];
        const errors = [];

        for (const submission of submissions) {
            try {
                const result = await markSingleSubmission(anthropic, submission, correctAnswerImages);
                results.push(result);
            } catch (err) {
                console.error(`Failed to mark submission ${submission.id}:`, err);
                errors.push({
                    submissionId: submission.id,
                    challengeNumber: submission.challenge_number,
                    error: err.message || 'Marking failed',
                });
            }
        }

        // Calculate total score
        const totalMark = results.reduce((sum, r) => sum + (r.mark || 0), 0);
        const maxMark = submissionIds.length;

        return Response.json({
            success: true,
            results,
            errors,
            summary: {
                totalMark,
                maxMark,
                percentage: Math.round((totalMark / maxMark) * 100),
                markedCount: results.length,
                errorCount: errors.length,
            },
            markedAt: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Batch AI marking error:', error);
        return Response.json({
            error: error.message || 'Failed to process batch marking request'
        }, { status: 500 });
    }
}

// Waveform Period Drawing Assessment Configuration
// Students draw waveforms to match specific time periods (ms) on an exam-style grid

export default {
    id: 'waveform-periods',
    title: 'Period Waveform Drawing',
    description: 'Draw waveforms with specific periods. Given a period in milliseconds, draw the waveform showing the correct number of cycles in a 5ms time window.',
    type: 'drawing',
    markingMethod: 'ai',
    topic: '2.5 Numeracy',

    // Assessment metadata
    challengeCount: 10,
    estimatedTime: '15-20 minutes',

    // Time window configuration
    timeWindowMs: 5,
    timeRange: { min: 0, max: 5 },

    // Waveform shape definitions
    shapes: {
        sine: {
            name: 'Sine',
            draw: (progress, cycles) => Math.sin(progress * cycles * 2 * Math.PI)
        },
        square: {
            name: 'Square',
            draw: (progress, cycles) => Math.sign(Math.sin(progress * cycles * 2 * Math.PI))
        },
        saw: {
            name: 'Saw',
            draw: (progress, cycles) => {
                const phase = (progress * cycles) % 1;
                return 2 * phase - 1;
            }
        },
        triangle: {
            name: 'Triangle',
            draw: (progress, cycles) => {
                const phase = (progress * cycles) % 1;
                return 4 * Math.abs(phase - 0.5) - 1;
            }
        }
    },

    // The 10 challenges for this assessment
    // Period values: 0.5, 1, 2, 4 ms
    // Expected cycles = 5ms / periodMs
    challenges: [
        {
            id: 1,
            name: 'Sine (1ms period)',
            shape: 'sine',
            periodMs: 1,
            expectedCycles: 5,
            description: 'Draw a SINE wave with 1ms period',
            hint: '1ms period = 5 complete cycles in 5ms. Zero crossings every 0.5ms.',
            colorKey: 'green'
        },
        {
            id: 2,
            name: 'Square (2ms period)',
            shape: 'square',
            periodMs: 2,
            expectedCycles: 2.5,
            description: 'Draw a SQUARE wave with 2ms period',
            hint: '2ms period = 2.5 cycles. Transitions at 1ms, 2ms, 3ms, 4ms.',
            colorKey: 'amber',
            transitionPoints: [1, 2, 3, 4]
        },
        {
            id: 3,
            name: 'Sine (0.5ms period)',
            shape: 'sine',
            periodMs: 0.5,
            expectedCycles: 10,
            description: 'Draw a SINE wave with 0.5ms period',
            hint: '0.5ms period = 10 cycles. High frequency - draw carefully!',
            colorKey: 'cyan'
        },
        {
            id: 4,
            name: 'Triangle (1ms period)',
            shape: 'triangle',
            periodMs: 1,
            expectedCycles: 5,
            description: 'Draw a TRIANGLE wave with 1ms period',
            hint: '1ms period = 5 cycles. Peaks at 0.5ms, 1.5ms, 2.5ms, 3.5ms, 4.5ms.',
            colorKey: 'green'
        },
        {
            id: 5,
            name: 'Square (1ms period)',
            shape: 'square',
            periodMs: 1,
            expectedCycles: 5,
            description: 'Draw a SQUARE wave with 1ms period',
            hint: '1ms period = 5 cycles. Transitions every 0.5ms.',
            colorKey: 'amber',
            examStyle: true,
            transitionPoints: [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5]
        },
        {
            id: 6,
            name: 'Saw (2ms period)',
            shape: 'saw',
            periodMs: 2,
            expectedCycles: 2.5,
            description: 'Draw a SAW wave with 2ms period',
            hint: '2ms period = 2.5 cycles. Linear ramp, instant reset at 2ms and 4ms.',
            colorKey: 'purple',
            transitionPoints: [2, 4]
        },
        {
            id: 7,
            name: 'Sine (4ms period)',
            shape: 'sine',
            periodMs: 4,
            expectedCycles: 1.25,
            description: 'Draw a SINE wave with 4ms period',
            hint: '4ms period = 1.25 cycles. Slow wave - only slightly more than one cycle.',
            colorKey: 'green'
        },
        {
            id: 8,
            name: 'Triangle (2ms period)',
            shape: 'triangle',
            periodMs: 2,
            expectedCycles: 2.5,
            description: 'Draw a TRIANGLE wave with 2ms period',
            hint: '2ms period = 2.5 cycles. Peaks at 1ms, 3ms; troughs at 0, 2ms, 4ms.',
            colorKey: 'cyan'
        },
        {
            id: 9,
            name: 'Square (0.5ms period)',
            shape: 'square',
            periodMs: 0.5,
            expectedCycles: 10,
            description: 'Draw a SQUARE wave with 0.5ms period',
            hint: '0.5ms period = 10 cycles. Rapid switching - transitions every 0.25ms.',
            colorKey: 'red',
            examStyle: true,
            transitionPoints: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4, 4.25, 4.5, 4.75]
        },
        {
            id: 10,
            name: 'Saw (1ms period)',
            shape: 'saw',
            periodMs: 1,
            expectedCycles: 5,
            description: 'Draw a SAW wave with 1ms period',
            hint: '1ms period = 5 cycles. Linear ramp up, instant reset at each millisecond.',
            colorKey: 'amber',
            transitionPoints: [1, 2, 3, 4, 5]
        }
    ],

    // AI marking configuration
    aiConfig: {
        maxMarks: 10,
        marksPerQuestion: 1,
        markingMethod: 'binary',
        criteria: {
            cycleCount: { required: true, description: 'Correct number of cycles for given period (5ms / period)' },
            shapeAccuracy: { required: true, description: 'Correct waveform shape characteristics' },
            transitionTiming: { required: true, description: 'For square/saw waves: transitions at correct time positions' }
        },
        rules: `BINARY MARKING: Award 1 mark per question ONLY if ALL conditions are met:
1. CYCLE COUNT: Correct number of complete cycles (5ms / period)
2. WAVEFORM SHAPE: Matches the specified waveform type
3. TRANSITION TIMING (square/saw only): Transitions occur at correct time positions

If any condition is wrong, award 0 marks for that question.
Total: 10 questions x 1 mark = 10 marks maximum.`
    }
};

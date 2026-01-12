// Waveform Octave Drawing Assessment Configuration
// This is the first assessment - students draw waveforms at different octaves

export default {
    id: 'waveform-octaves',
    title: 'Octave Waveform Drawing',
    description: 'Draw waveforms showing octave transpositions. You\'ll see an original waveform and must draw what it would look like at a different octave.',
    type: 'drawing',
    markingMethod: 'ai',
    topic: '2.5 Numeracy',

    // Assessment metadata
    challengeCount: 10,
    estimatedTime: '15-20 minutes',

    // Waveform shape definitions used by this assessment
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
    challenges: [
        {
            id: 1,
            name: 'Sine → Sine (Octave Lower)',
            originalCycles: 4,
            targetCycles: 2,
            originalShape: 'sine',
            targetShape: 'sine',
            direction: 'lower',
            octaves: 1,
            description: 'Draw a SINE wave ONE OCTAVE LOWER',
            hint: 'Same shape, but period doubles → half as many cycles.',
            colorKey: 'green'
        },
        {
            id: 2,
            name: 'Square → Square (Octave Higher)',
            originalCycles: 2,
            targetCycles: 4,
            originalShape: 'square',
            targetShape: 'square',
            direction: 'higher',
            octaves: 1,
            description: 'Draw a SQUARE wave ONE OCTAVE HIGHER',
            hint: 'Same shape, but period halves → twice as many cycles.',
            colorKey: 'amber'
        },
        {
            id: 3,
            name: 'Square → Saw (Octave Lower)',
            originalCycles: 4,
            targetCycles: 2,
            originalShape: 'square',
            targetShape: 'saw',
            direction: 'lower',
            octaves: 1,
            description: 'Draw a SAW wave ONE OCTAVE LOWER',
            hint: '2023 Exam Style! Change shape AND double the period.',
            colorKey: 'cyan',
            examStyle: true
        },
        {
            id: 4,
            name: 'Triangle → Triangle (Octave Lower)',
            originalCycles: 6,
            targetCycles: 3,
            originalShape: 'triangle',
            targetShape: 'triangle',
            direction: 'lower',
            octaves: 1,
            description: 'Draw a TRIANGLE wave ONE OCTAVE LOWER',
            hint: 'Same shape. 6 cycles → 3 cycles.',
            colorKey: 'green'
        },
        {
            id: 5,
            name: 'Sine → Square (Octave Higher)',
            originalCycles: 3,
            targetCycles: 6,
            originalShape: 'sine',
            targetShape: 'square',
            direction: 'higher',
            octaves: 1,
            description: 'Draw a SQUARE wave ONE OCTAVE HIGHER',
            hint: 'Change to square wave AND double the cycles.',
            colorKey: 'amber',
            examStyle: true
        },
        {
            id: 6,
            name: 'Saw → Saw (Two Octaves Lower)',
            originalCycles: 8,
            targetCycles: 2,
            originalShape: 'saw',
            targetShape: 'saw',
            direction: 'lower',
            octaves: 2,
            description: 'Draw a SAW wave TWO OCTAVES LOWER',
            hint: 'Two octaves = ÷4 cycles. 8 → 2 cycles.',
            colorKey: 'purple'
        },
        {
            id: 7,
            name: 'Triangle → Sine (Octave Lower)',
            originalCycles: 4,
            targetCycles: 2,
            originalShape: 'triangle',
            targetShape: 'sine',
            direction: 'lower',
            octaves: 1,
            description: 'Draw a SINE wave ONE OCTAVE LOWER',
            hint: 'Change shape from triangle to sine, and double the period.',
            colorKey: 'cyan',
            examStyle: true
        },
        {
            id: 8,
            name: 'Square → Triangle (Two Octaves Higher)',
            originalCycles: 2,
            targetCycles: 8,
            originalShape: 'square',
            targetShape: 'triangle',
            direction: 'higher',
            octaves: 2,
            description: 'Draw a TRIANGLE wave TWO OCTAVES HIGHER',
            hint: 'Change to triangle AND multiply cycles by 4.',
            colorKey: 'red',
            examStyle: true
        },
        {
            id: 9,
            name: 'Saw → Square (Octave Higher)',
            originalCycles: 4,
            targetCycles: 8,
            originalShape: 'saw',
            targetShape: 'square',
            direction: 'higher',
            octaves: 1,
            description: 'Draw a SQUARE wave ONE OCTAVE HIGHER',
            hint: 'Change shape from saw to square, period halves.',
            colorKey: 'amber',
            examStyle: true
        },
        {
            id: 10,
            name: 'Sine → Sine (Octave Higher)',
            originalCycles: 3,
            targetCycles: 6,
            originalShape: 'sine',
            targetShape: 'sine',
            direction: 'higher',
            octaves: 1,
            description: 'Draw a SINE wave ONE OCTAVE HIGHER',
            hint: 'Same shape. 3 cycles → 6 cycles.',
            colorKey: 'amber'
        }
    ],

    // AI marking configuration - BINARY MARKING (1 mark per question)
    aiConfig: {
        maxMarks: 10,
        marksPerQuestion: 1,
        markingMethod: 'binary',
        criteria: {
            cycleCount: { required: true, description: 'Correct number of cycles (doubled or halved based on octave)' },
            shapeAccuracy: { required: true, description: 'Correct waveform shape (sine, square, saw, triangle)' }
        },
        rules: `BINARY MARKING: Award 1 mark per question ONLY if BOTH conditions are met:
1. Cycle count matches the octave transformation (higher = doubled, lower = halved)
2. Waveform shape matches the target shape

If either condition is wrong, award 0 marks for that question.
Total: 10 questions × 1 mark = 10 marks maximum.`
    }
};

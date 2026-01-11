// Synthesis Fundamentals Quiz Assessment
// A-Level Music Technology - Topic 1.2 Synthesis

export default {
    id: 'synthesis-fundamentals-quiz',
    title: 'Synthesis Fundamentals Quiz',
    description: 'Test your understanding of subtractive synthesis concepts including oscillators, filters, and envelopes.',
    type: 'quiz',
    markingMethod: 'auto',
    topic: '1.2 Synthesis',
    icon: '🎹',

    // Assessment metadata
    estimatedTime: '10-15 minutes',

    // Quiz questions
    questions: [
        {
            id: 1,
            type: 'multiple-choice',
            question: 'In subtractive synthesis, what is the primary function of a low-pass filter?',
            options: [
                'To add new harmonics to the sound',
                'To remove frequencies above the cutoff point',
                'To increase the amplitude of all frequencies',
                'To create new oscillators'
            ],
            correctAnswer: 1,
            explanation: 'A low-pass filter allows frequencies below the cutoff point to pass through while attenuating (reducing) frequencies above it. This "subtracts" harmonics from the original waveform.'
        },
        {
            id: 2,
            type: 'multiple-choice',
            question: 'Which waveform contains only odd harmonics?',
            options: [
                'Sawtooth wave',
                'Sine wave',
                'Square wave',
                'Noise'
            ],
            correctAnswer: 2,
            explanation: 'A square wave contains only odd harmonics (1st, 3rd, 5th, 7th, etc.). A sawtooth wave contains all harmonics, a sine wave has no additional harmonics, and noise contains random frequencies.'
        },
        {
            id: 3,
            type: 'multiple-choice',
            question: 'What do the letters ADSR stand for in an envelope generator?',
            options: [
                'Amplitude, Delay, Sustain, Release',
                'Attack, Decay, Sustain, Release',
                'Attack, Dynamics, Sound, Reverb',
                'Audio, Digital, Signal, Response'
            ],
            correctAnswer: 1,
            explanation: 'ADSR stands for Attack (time to reach peak), Decay (time to fall to sustain level), Sustain (level held while key is pressed), and Release (time to fade after key release).'
        },
        {
            id: 4,
            type: 'multiple-choice',
            question: 'If you increase the resonance on a low-pass filter, what happens?',
            options: [
                'The cutoff frequency increases',
                'Frequencies near the cutoff are boosted',
                'All frequencies are attenuated equally',
                'The filter is bypassed'
            ],
            correctAnswer: 1,
            explanation: 'Resonance (also called Q or emphasis) boosts frequencies around the cutoff point, creating a peak. At very high resonance, the filter can self-oscillate and produce a sine wave.'
        },
        {
            id: 5,
            type: 'multiple-choice',
            question: 'Which oscillator waveform has the richest harmonic content?',
            options: [
                'Sine wave',
                'Triangle wave',
                'Square wave',
                'Sawtooth wave'
            ],
            correctAnswer: 3,
            explanation: 'The sawtooth wave contains all harmonics (both odd and even) and has the richest harmonic content. This makes it an excellent starting point for subtractive synthesis.'
        },
        {
            id: 6,
            type: 'multiple-choice',
            question: 'What is the purpose of an LFO (Low Frequency Oscillator) in synthesis?',
            options: [
                'To generate the main audio signal',
                'To create modulation effects like vibrato and tremolo',
                'To filter out low frequencies',
                'To increase the volume of the sound'
            ],
            correctAnswer: 1,
            explanation: 'An LFO generates sub-audio frequencies (typically 0.1Hz to 20Hz) used to modulate other parameters. When modulating pitch, it creates vibrato; when modulating amplitude, it creates tremolo.'
        },
        {
            id: 7,
            type: 'multiple-choice',
            question: 'In a synthesizer, what does "detune" typically refer to?',
            options: [
                'Removing the tuning of an oscillator completely',
                'Slightly offsetting the pitch of one oscillator from another',
                'Lowering the volume of an oscillator',
                'Changing the waveform shape'
            ],
            correctAnswer: 1,
            explanation: 'Detuning means slightly offsetting the pitch of oscillators relative to each other. This creates a thicker, richer sound due to the slight phase differences and beating between the oscillators.'
        },
        {
            id: 8,
            type: 'multiple-choice',
            question: 'A high-pass filter removes which frequencies?',
            options: [
                'Frequencies above the cutoff',
                'Frequencies below the cutoff',
                'Frequencies at the cutoff only',
                'All frequencies equally'
            ],
            correctAnswer: 1,
            explanation: 'A high-pass filter allows frequencies above the cutoff to pass while attenuating frequencies below it. This is the opposite of a low-pass filter and is useful for removing bass rumble or muddiness.'
        },
        {
            id: 9,
            type: 'short-answer',
            question: 'Explain why a longer attack time on an amplitude envelope might be used for a pad sound.',
            hint: 'Think about how pad sounds typically enter a mix and their musical function.'
        },
        {
            id: 10,
            type: 'short-answer',
            question: 'Describe what happens when filter cutoff is modulated by an envelope generator.',
            hint: 'Consider how the timbre of the sound changes over time.'
        }
    ],

    // Marking configuration
    markingConfig: {
        autoScoreMultipleChoice: true,
        aiMarkShortAnswer: true,
        totalMarks: 20, // 8 MC questions (1 mark each) + 2 short answers (6 marks each)
    }
};

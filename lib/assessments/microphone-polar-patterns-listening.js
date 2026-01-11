// Microphone Polar Patterns Listening Assessment
// A-Level Music Technology - Topic 1.1 Recording

export default {
    id: 'microphone-polar-patterns-listening',
    title: 'Microphone Polar Patterns',
    description: 'Listen to audio examples and identify the microphone polar patterns used. You\'ll hear recordings made with different microphone types and need to identify their characteristics.',
    type: 'listening',
    markingMethod: 'auto',
    topic: '1.2 Microphones',
    icon: '🎤',

    // Assessment metadata
    estimatedTime: '15-20 minutes',
    maxPlays: null, // Unlimited plays for practice

    // Audio file - this should be placed in /public/audio/
    // For now, using a placeholder path
    audioFile: '/audio/microphone-examples.mp3',

    // Questions with timestamps
    questions: [
        {
            id: 1,
            type: 'identification',
            question: 'Listen to Recording A. Which polar pattern best describes the microphone used?',
            context: 'This recording captures a vocalist with noticeable room ambience and pickup from the sides.',
            startTime: 0,
            endTime: 15,
            options: [
                'Cardioid',
                'Figure-8 (Bidirectional)',
                'Omnidirectional',
                'Supercardioid'
            ],
            correctAnswer: 2,
            explanation: 'The omnidirectional pattern picks up sound equally from all directions, which explains the even room ambience heard in this recording.'
        },
        {
            id: 2,
            type: 'identification',
            question: 'Listen to Recording B. Which polar pattern is being demonstrated?',
            context: 'Notice how sounds from the rear are significantly reduced while front pickup is strong.',
            startTime: 16,
            endTime: 30,
            options: [
                'Cardioid',
                'Figure-8 (Bidirectional)',
                'Omnidirectional',
                'Hypercardioid'
            ],
            correctAnswer: 0,
            explanation: 'The cardioid pattern rejects sound from the rear while capturing sound from the front, making it ideal for isolating a sound source.'
        },
        {
            id: 3,
            type: 'identification',
            question: 'Listen to Recording C. Identify the polar pattern based on what you hear.',
            context: 'This recording has strong pickup from front AND rear, with rejection at the sides.',
            startTime: 31,
            endTime: 45,
            options: [
                'Cardioid',
                'Figure-8 (Bidirectional)',
                'Omnidirectional',
                'Supercardioid'
            ],
            correctAnswer: 1,
            explanation: 'The figure-8 (bidirectional) pattern picks up sound from front and rear equally while rejecting sound from the sides.'
        },
        {
            id: 4,
            type: 'multiple-choice',
            question: 'Based on what you heard in Recording B, why would a cardioid microphone be preferred for live vocals?',
            startTime: 16,
            endTime: 30,
            options: [
                'It picks up more room ambience',
                'It reduces feedback from stage monitors',
                'It captures a wider stereo image',
                'It has a flatter frequency response'
            ],
            correctAnswer: 1,
            explanation: 'Cardioid microphones reject sound from the rear, which helps prevent feedback from stage monitors typically placed behind the vocalist.'
        },
        {
            id: 5,
            type: 'multiple-choice',
            question: 'In Recording A (omnidirectional), what characteristic of the sound suggests this polar pattern?',
            startTime: 0,
            endTime: 15,
            options: [
                'Very dry, isolated sound',
                'Strong proximity effect',
                'Even room tone and ambient pickup',
                'Pronounced side rejection'
            ],
            correctAnswer: 2,
            explanation: 'Omnidirectional microphones pick up sound equally from all directions, resulting in more natural room tone and ambience in the recording.'
        },
        {
            id: 6,
            type: 'short-answer',
            question: 'Listen to all three recordings again. Describe one practical recording scenario where each polar pattern (omni, cardioid, figure-8) would be the best choice.',
            hint: 'Consider the acoustic environment, number of sound sources, and desired sound characteristics for each pattern.'
        },
        {
            id: 7,
            type: 'multiple-choice',
            question: 'Which polar pattern would exhibit the strongest proximity effect?',
            options: [
                'Omnidirectional',
                'Cardioid',
                'Figure-8',
                'Both Cardioid and Figure-8 equally'
            ],
            correctAnswer: 2,
            explanation: 'Figure-8 microphones exhibit the strongest proximity effect because they are pressure-gradient designs with the most pronounced bass boost at close distances.'
        },
        {
            id: 8,
            type: 'identification',
            question: 'Listen to Recording D. This demonstrates a variation of the cardioid pattern. Which one?',
            context: 'Notice the tighter pickup angle with some rear sensitivity.',
            startTime: 46,
            endTime: 60,
            options: [
                'Wide cardioid',
                'Supercardioid',
                'Standard cardioid',
                'Omnidirectional'
            ],
            correctAnswer: 1,
            explanation: 'Supercardioid has a narrower front pickup than standard cardioid but has a small rear lobe of sensitivity, which can be heard in the recording.'
        },
        {
            id: 9,
            type: 'short-answer',
            question: 'Explain why understanding polar patterns is essential for minimising bleed in a multi-microphone recording setup.',
            hint: 'Think about how different polar patterns can be positioned to reject unwanted sound sources.'
        },
        {
            id: 10,
            type: 'multiple-choice',
            question: 'When recording a drum kit, which polar pattern would typically be used for overhead microphones to capture a stereo image?',
            options: [
                'Figure-8 in M/S configuration',
                'Cardioid pointed down at the kit',
                'Omnidirectional for maximum ambience',
                'Supercardioid for tight focus'
            ],
            correctAnswer: 1,
            explanation: 'Cardioid overheads pointed down at the kit are most common as they provide good cymbal capture while rejecting room reflections and spill from other instruments.'
        }
    ],

    // Marking configuration
    markingConfig: {
        autoScoreIdentification: true,
        autoScoreMultipleChoice: true,
        aiMarkShortAnswer: true,
        totalMarks: 20,
    }
};

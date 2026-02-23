// Microphone Polar Patterns Quiz
// A-Level Music Technology - Topic 1.2 Microphones

export default {
    id: 'microphone-polar-patterns-listening',
    title: 'Microphone Polar Patterns',
    description: 'Test your knowledge of microphone polar patterns, their characteristics, and practical applications in recording scenarios.',
    type: 'quiz',
    markingMethod: 'auto',
    topic: '1.2 Microphones',
    icon: '🎤',

    // Assessment metadata
    estimatedTime: '10-15 minutes',

    // Questions
    questions: [
        {
            id: 1,
            type: 'multiple-choice',
            question: 'A vocalist is recorded in a room with noticeable ambience and even pickup from all directions. Which polar pattern was most likely used?',
            options: [
                'Cardioid',
                'Figure-8 (Bidirectional)',
                'Omnidirectional',
                'Supercardioid'
            ],
            correctAnswer: 2,
            explanation: 'The omnidirectional pattern picks up sound equally from all directions, resulting in even room ambience in the recording.'
        },
        {
            id: 2,
            type: 'multiple-choice',
            question: 'A recording has strong front pickup with sounds from the rear significantly reduced. Which polar pattern does this describe?',
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
            type: 'multiple-choice',
            question: 'A microphone captures strong pickup from both front and rear, with rejection at the sides. Which polar pattern is this?',
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
            question: 'Why would a cardioid microphone be preferred for live vocals?',
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
            question: 'Which characteristic would you expect from a recording made with an omnidirectional microphone?',
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
            question: 'Describe one practical recording scenario where each polar pattern (omni, cardioid, figure-8) would be the best choice.',
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
            type: 'multiple-choice',
            question: 'A microphone has a tighter pickup angle than a standard cardioid, but also has a small rear lobe of sensitivity. Which pattern is this?',
            options: [
                'Wide cardioid',
                'Supercardioid',
                'Standard cardioid',
                'Omnidirectional'
            ],
            correctAnswer: 1,
            explanation: 'Supercardioid has a narrower front pickup than standard cardioid but has a small rear lobe of sensitivity.'
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
        autoScoreMultipleChoice: true,
        aiMarkShortAnswer: true,
        totalMarks: 20,
    }
};

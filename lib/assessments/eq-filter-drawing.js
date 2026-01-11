// EQ Filter Drawing Assessment Configuration
// Topic 1.11 EQ - Students draw filter response curves from memory

export default {
    id: 'eq-filter-drawing',
    title: 'EQ Filter Drawing',
    description: 'Draw filter response curves from memory. You\'ll draw 6 different filter types including high-pass, low-pass, shelves, and parametric EQ.',
    type: 'drawing',
    markingMethod: 'ai',
    topic: '1.11 EQ',
    icon: '📊',

    // Assessment metadata
    challengeCount: 6,
    estimatedTime: '15-20 minutes',

    // Canvas configuration
    canvas: {
        width: 700,
        height: 350,
        frequencyRange: { min: 20, max: 20000 },  // Hz (logarithmic)
        gainRange: { min: -24, max: 24 },          // dB
    },

    // The 6 assessment challenges
    challenges: [
        {
            id: 1,
            name: 'High-Pass Filter',
            type: 'highpass',
            frequency: 200,
            description: 'Draw a High-Pass Filter with cutoff at 200Hz',
            hint: 'Remember: HPF removes frequencies BELOW the cutoff',
            colorKey: 'cyan'
        },
        {
            id: 2,
            name: 'Low-Pass Filter',
            type: 'lowpass',
            frequency: 8000,
            description: 'Draw a Low-Pass Filter with cutoff at 8kHz',
            hint: 'Remember: LPF removes frequencies ABOVE the cutoff',
            colorKey: 'amber'
        },
        {
            id: 3,
            name: 'Low Shelf Boost',
            type: 'lowshelf',
            frequency: 200,
            gain: 6,
            description: 'Draw a Low Shelf with +6dB boost at 200Hz',
            hint: 'Shelf filters adjust level - they don\'t remove completely',
            colorKey: 'green'
        },
        {
            id: 4,
            name: 'High Shelf Cut',
            type: 'highshelf',
            frequency: 10000,
            gain: -6,
            description: 'Draw a High Shelf with -6dB cut at 10kHz',
            hint: 'High shelf affects frequencies ABOVE the frequency point',
            colorKey: 'purple'
        },
        {
            id: 5,
            name: 'Bell/Parametric Boost',
            type: 'bell',
            frequency: 1000,
            gain: 6,
            q: 1.4,
            description: 'Draw a Bell filter with +6dB boost at 1kHz (moderate Q)',
            hint: 'Bell filters create a symmetrical bump centered on the frequency',
            colorKey: 'amber'
        },
        {
            id: 6,
            name: 'Notch Filter',
            type: 'notch',
            frequency: 50,
            description: 'Draw a Notch Filter at 50Hz',
            hint: 'Notch filters create a sharp, narrow cut at one frequency',
            colorKey: 'red'
        }
    ],

    // AI marking configuration
    aiConfig: {
        maxMarks: 10,
        criteria: {
            filterType: { maxMarks: 4, description: 'Correct filter shape/type' },
            frequencyPlacement: { maxMarks: 3, description: 'Cutoff/center frequency at correct position' },
            gainAccuracy: { maxMarks: 3, description: 'Correct boost/cut level and slope' }
        },
        systemPrompt: `You are marking an A-Level Music Technology student's EQ filter drawing assessment.
The student was asked to draw a specific filter type on a frequency response graph.

The graph shows:
- X-axis: Frequency (20Hz to 20kHz, logarithmic scale)
- Y-axis: Gain (-24dB to +24dB)
- A vertical marker showing the target frequency
- A horizontal marker showing the target gain (for shelf/bell filters)

Marking criteria:
- Filter type (4 marks): Does the drawing show the correct filter shape?
  * High-pass: flat at high frequencies, rolls off below cutoff
  * Low-pass: flat at low frequencies, rolls off above cutoff
  * Low shelf: boosts/cuts below the frequency, flat above
  * High shelf: boosts/cuts above the frequency, flat below
  * Bell/Parametric: symmetrical boost/cut centered on frequency
  * Notch: sharp narrow cut at specific frequency

- Frequency placement (3 marks): Is the filter's action centered on the correct frequency marker?

- Gain accuracy (3 marks):
  * For pass filters: appropriate rolloff slope
  * For shelf/bell: correct boost or cut amount
  * For notch: appropriate depth and narrowness

Provide constructive feedback suitable for a 17-18 year old student.
Be encouraging but accurate. Identify specific strengths and areas for improvement.
Reference the exam board expectations where relevant.`
    }
};

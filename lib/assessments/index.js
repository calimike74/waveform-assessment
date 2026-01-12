// Assessment Registry
// Central registry for all assessments in the platform

import waveformOctaves from './waveform-octaves';
import waveformPeriods from './waveform-periods';
import synthesisFundamentalsQuiz from './synthesis-fundamentals-quiz';
import microphonePolarPatternsListening from './microphone-polar-patterns-listening';
import eqFilterDrawing from './eq-filter-drawing';

// All available assessments
const assessments = {
    'waveform-octaves': waveformOctaves,
    'waveform-periods': waveformPeriods,
    'synthesis-fundamentals-quiz': synthesisFundamentalsQuiz,
    'microphone-polar-patterns-listening': microphonePolarPatternsListening,
    'eq-filter-drawing': eqFilterDrawing,
};

/**
 * Get all assessments as an array
 */
export function getAllAssessments() {
    return Object.values(assessments);
}

/**
 * Get assessments filtered by type
 * @param {string} type - 'drawing' | 'quiz' | 'listening'
 */
export function getAssessmentsByType(type) {
    return Object.values(assessments).filter(a => a.type === type);
}

/**
 * Get a specific assessment by ID
 * @param {string} id - The assessment ID
 */
export function getAssessment(id) {
    return assessments[id] || null;
}

/**
 * Get assessment IDs for static path generation
 */
export function getAssessmentIds() {
    return Object.keys(assessments);
}

/**
 * Check if an assessment exists
 * @param {string} id - The assessment ID
 */
export function assessmentExists(id) {
    return id in assessments;
}

/**
 * Get assessments grouped by type for the hub display
 */
export function getAssessmentsGroupedByType() {
    const grouped = {
        drawing: [],
        quiz: [],
        listening: [],
    };

    Object.values(assessments).forEach(assessment => {
        if (grouped[assessment.type]) {
            grouped[assessment.type].push(assessment);
        }
    });

    return grouped;
}

/**
 * Get assessments grouped by topic code for the hub display
 * Returns an array of { topic, assessments } sorted numerically (1.1, 1.2, 2.1, etc.)
 */
export function getAssessmentsGroupedByTopic() {
    const grouped = {};

    Object.values(assessments).forEach(assessment => {
        const topic = assessment.topic || 'Other';
        if (!grouped[topic]) {
            grouped[topic] = [];
        }
        grouped[topic].push(assessment);
    });

    // Sort topics numerically (1.1, 1.2, 2.1, etc.)
    const sortedTopics = Object.keys(grouped).sort((a, b) => {
        const numA = parseFloat(a) || 999;
        const numB = parseFloat(b) || 999;
        return numA - numB;
    });

    return sortedTopics.map(topic => ({
        topic,
        assessments: grouped[topic]
    }));
}

// Theme colors used across assessments
export const assessmentTheme = {
    bg: {
        deep: '#1a1814',
        panel: '#252219',
        surface: '#2d2a23',
        elevated: '#38342b',
        cream: '#f5f0e6',
    },
    accent: {
        amber: '#e8a849',
        amberGlow: '#ffc24d',
        green: '#7cb342',
        greenGlow: '#9ccc65',
        red: '#e57373',
        blue: '#5c9ce6',
        cyan: '#22d3ee',
        purple: '#a78bfa',
    },
    text: {
        primary: '#f5f0e6',
        secondary: '#a8a090',
        tertiary: '#6b6560',
    },
    border: {
        subtle: 'rgba(245, 240, 230, 0.08)',
        medium: 'rgba(245, 240, 230, 0.15)',
        strong: 'rgba(245, 240, 230, 0.25)',
    }
};

// Map color keys to actual colors
export function getAccentColor(colorKey) {
    return assessmentTheme.accent[colorKey] || assessmentTheme.accent.amber;
}

// Type icons for display
export const typeIcons = {
    drawing: '✏️',
    quiz: '📝',
    listening: '🎧',
};

// Type labels
export const typeLabels = {
    drawing: 'Drawing Assessment',
    quiz: 'Quiz',
    listening: 'Listening Assessment',
};

export default assessments;

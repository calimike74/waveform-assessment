'use client';

import React from 'react';
import { theme as designTheme, typography, borderRadius, spacing, transitions } from '@/lib/theme';

const t = designTheme.light;

const BatchMarkingProgress = ({
    currentQuestion,
    totalQuestions,
    isVisible = true
}) => {
    if (!isVisible) return null;

    const progress = totalQuestions > 0 ? (currentQuestion / totalQuestions) * 100 : 0;
    const estimatedSecondsPerQuestion = 8;
    const remainingQuestions = totalQuestions - currentQuestion;
    const estimatedSeconds = remainingQuestions * estimatedSecondsPerQuestion;

    const formatTime = (seconds) => {
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                fontFamily: typography.fontFamily,
            }}
        >
            <div
                style={{
                    backgroundColor: t.bg.primary,
                    borderRadius: borderRadius['2xl'],
                    padding: spacing[10],
                    maxWidth: '420px',
                    width: '90%',
                    textAlign: 'center',
                    boxShadow: t.shadow.lg,
                }}
            >
                {/* Spinner */}
                <div
                    style={{
                        width: '64px',
                        height: '64px',
                        margin: '0 auto',
                        marginBottom: spacing[6],
                        borderRadius: '50%',
                        border: `4px solid ${t.border.subtle}`,
                        borderTopColor: t.accent.primary,
                        animation: 'spin 1s linear infinite',
                    }}
                />

                <style>
                    {`
                        @keyframes spin {
                            to { transform: rotate(360deg); }
                        }
                    `}
                </style>

                {/* Title */}
                <h2
                    style={{
                        fontSize: typography.size['2xl'],
                        fontWeight: typography.weight.bold,
                        color: t.text.primary,
                        marginBottom: spacing[2],
                    }}
                >
                    AI Marking in Progress
                </h2>

                {/* Current status */}
                <p
                    style={{
                        fontSize: typography.size.lg,
                        color: t.text.secondary,
                        marginBottom: spacing[6],
                    }}
                >
                    Marking question {currentQuestion} of {totalQuestions}
                </p>

                {/* Progress bar */}
                <div
                    style={{
                        backgroundColor: t.bg.tertiary,
                        borderRadius: borderRadius.full,
                        height: '12px',
                        overflow: 'hidden',
                        marginBottom: spacing[4],
                    }}
                >
                    <div
                        style={{
                            backgroundColor: t.accent.primary,
                            height: '100%',
                            width: `${progress}%`,
                            borderRadius: borderRadius.full,
                            transition: `width ${transitions.normal} ${transitions.easing}`,
                        }}
                    />
                </div>

                {/* Percentage and time estimate */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: typography.size.sm,
                        color: t.text.tertiary,
                    }}
                >
                    <span>{Math.round(progress)}% complete</span>
                    <span>~{formatTime(estimatedSeconds)} remaining</span>
                </div>

                {/* Hint */}
                <p
                    style={{
                        marginTop: spacing[6],
                        fontSize: typography.size.sm,
                        color: t.text.tertiary,
                        fontStyle: 'italic',
                    }}
                >
                    Please wait while AI reviews your drawings...
                </p>
            </div>
        </div>
    );
};

export default BatchMarkingProgress;

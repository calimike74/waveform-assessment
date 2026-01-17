'use client';

import React from 'react';
import { theme as designTheme, typography, borderRadius, spacing, transitions } from '@/lib/theme';

const t = designTheme.light;

const BatchResultsSummary = ({
    results = [],
    summary = { totalMark: 0, maxMark: 10, percentage: 0 },
    onReviewQuestion,
    onClose,
    isVisible = true
}) => {
    if (!isVisible) return null;

    // Sort results by challenge number
    const sortedResults = [...results].sort((a, b) => a.challengeNumber - b.challengeNumber);

    // Determine grade color based on percentage
    const getGradeColor = (percentage) => {
        if (percentage >= 80) return t.accent.success;
        if (percentage >= 60) return '#22C55E'; // Green-500
        if (percentage >= 40) return t.accent.warning;
        return t.accent.error;
    };

    const gradeColor = getGradeColor(summary.percentage);

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
                padding: spacing[4],
            }}
        >
            <div
                style={{
                    backgroundColor: t.bg.primary,
                    borderRadius: borderRadius['2xl'],
                    padding: spacing[8],
                    maxWidth: '600px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflow: 'auto',
                    boxShadow: t.shadow.lg,
                }}
            >
                {/* Header */}
                <div
                    style={{
                        textAlign: 'center',
                        marginBottom: spacing[6],
                    }}
                >
                    <h2
                        style={{
                            fontSize: typography.size['3xl'],
                            fontWeight: typography.weight.bold,
                            color: t.text.primary,
                            marginBottom: spacing[2],
                        }}
                    >
                        Assessment Complete
                    </h2>
                    <p
                        style={{
                            fontSize: typography.size.base,
                            color: t.text.secondary,
                        }}
                    >
                        Here are your results
                    </p>
                </div>

                {/* Score display */}
                <div
                    style={{
                        backgroundColor: t.bg.secondary,
                        borderRadius: borderRadius.xl,
                        padding: spacing[6],
                        textAlign: 'center',
                        marginBottom: spacing[6],
                        border: `2px solid ${gradeColor}`,
                    }}
                >
                    <div
                        style={{
                            fontSize: typography.size['4xl'],
                            fontWeight: typography.weight.bold,
                            color: gradeColor,
                            marginBottom: spacing[1],
                        }}
                    >
                        {summary.totalMark} / {summary.maxMark}
                    </div>
                    <div
                        style={{
                            fontSize: typography.size.xl,
                            fontWeight: typography.weight.semibold,
                            color: t.text.secondary,
                        }}
                    >
                        {summary.percentage}%
                    </div>
                </div>

                {/* Results grid */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, 1fr)',
                        gap: spacing[3],
                        marginBottom: spacing[6],
                    }}
                >
                    {sortedResults.map((result) => {
                        const isCorrect = result.mark === 1;
                        return (
                            <button
                                key={result.submissionId}
                                onClick={() => onReviewQuestion && onReviewQuestion(result.challengeNumber - 1, result)}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: spacing[3],
                                    borderRadius: borderRadius.lg,
                                    border: `2px solid ${isCorrect ? t.accent.success : t.accent.error}`,
                                    backgroundColor: isCorrect ? t.accent.successLight : t.accent.errorLight,
                                    cursor: 'pointer',
                                    transition: `all ${transitions.fast} ${transitions.easing}`,
                                    minHeight: '72px',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                    e.currentTarget.style.boxShadow = t.shadow.md;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: typography.size.lg,
                                        fontWeight: typography.weight.bold,
                                        color: isCorrect ? t.accent.success : t.accent.error,
                                    }}
                                >
                                    Q{result.challengeNumber}
                                </span>
                                <span
                                    style={{
                                        fontSize: typography.size['2xl'],
                                        marginTop: spacing[1],
                                    }}
                                >
                                    {isCorrect ? '✓' : '✗'}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Feedback hint */}
                <p
                    style={{
                        textAlign: 'center',
                        fontSize: typography.size.sm,
                        color: t.text.tertiary,
                        marginBottom: spacing[6],
                    }}
                >
                    Click any question to review your drawing and feedback
                </p>

                {/* Close button */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                    }}
                >
                    <button
                        onClick={onClose}
                        style={{
                            padding: `${spacing[3]} ${spacing[8]}`,
                            fontSize: typography.size.base,
                            fontWeight: typography.weight.semibold,
                            backgroundColor: t.accent.primary,
                            color: t.text.inverse,
                            border: 'none',
                            borderRadius: borderRadius.lg,
                            cursor: 'pointer',
                            transition: `all ${transitions.fast} ${transitions.easing}`,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = t.accent.primaryHover;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = t.accent.primary;
                        }}
                    >
                        Close Results
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BatchResultsSummary;

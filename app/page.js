'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getAllAssessments, assessmentTheme, typeIcons, typeLabels } from '@/lib/assessments';

// Student Hub - Assessment Selection Page
export default function AssessmentHub() {
    const [studentName, setStudentName] = useState('');
    const [hasEnteredName, setHasEnteredName] = useState(false);

    const assessments = getAllAssessments();
    const theme = assessmentTheme;

    // Name entry screen
    if (!hasEnteredName) {
        return (
            <div style={{
                minHeight: '100vh',
                background: `linear-gradient(180deg, ${theme.bg.deep} 0%, #12110e 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}>
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `
                        radial-gradient(ellipse at 20% 20%, rgba(232, 168, 73, 0.03) 0%, transparent 50%),
                        radial-gradient(ellipse at 80% 80%, rgba(92, 156, 230, 0.02) 0%, transparent 50%)
                    `,
                    pointerEvents: 'none',
                }} />

                <div style={{
                    background: `linear-gradient(135deg, ${theme.bg.panel} 0%, ${theme.bg.surface} 100%)`,
                    borderRadius: '16px',
                    border: `1px solid ${theme.border.medium}`,
                    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
                    padding: '2.5rem',
                    maxWidth: '480px',
                    width: '100%',
                    position: 'relative',
                    zIndex: 1,
                }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: `linear-gradient(135deg, ${theme.accent.purple}20 0%, ${theme.accent.purple}10 100%)`,
                        border: `1px solid ${theme.accent.purple}40`,
                        color: theme.accent.purple,
                        padding: '0.4rem 0.8rem',
                        borderRadius: '20px',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        fontFamily: '"SF Mono", "Fira Code", monospace',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        marginBottom: '1.5rem',
                    }}>
                        <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: theme.accent.purple,
                            boxShadow: `0 0 8px ${theme.accent.purple}`,
                        }} />
                        Music Technology Assessments
                    </div>

                    <h1 style={{
                        fontSize: '1.75rem',
                        fontWeight: '600',
                        color: theme.text.primary,
                        marginBottom: '0.5rem',
                        letterSpacing: '-0.02em',
                    }}>
                        Assessment Hub
                    </h1>

                    <p style={{
                        color: theme.text.secondary,
                        fontSize: '0.95rem',
                        lineHeight: '1.6',
                        marginBottom: '2rem',
                    }}>
                        Enter your name to access the assessments. Your work will be
                        <strong style={{ color: theme.text.primary }}> saved and marked</strong> by your teacher.
                    </p>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{
                            display: 'block',
                            color: theme.text.tertiary,
                            fontSize: '0.8rem',
                            marginBottom: '0.5rem',
                            fontWeight: '500',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                        }}>
                            Your Name
                        </label>
                        <input
                            type="text"
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                            placeholder="Enter your name"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && studentName.trim()) {
                                    setHasEnteredName(true);
                                }
                            }}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                background: theme.bg.deep,
                                border: `1px solid ${theme.border.medium}`,
                                borderRadius: '10px',
                                color: theme.text.primary,
                                fontSize: '1rem',
                                outline: 'none',
                            }}
                        />
                    </div>

                    <button
                        onClick={() => setHasEnteredName(true)}
                        disabled={!studentName.trim()}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            borderRadius: '8px',
                            border: 'none',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            cursor: studentName.trim() ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            background: studentName.trim()
                                ? `linear-gradient(135deg, ${theme.accent.amber} 0%, #d4922e 100%)`
                                : theme.bg.elevated,
                            color: studentName.trim() ? theme.bg.deep : theme.text.tertiary,
                            boxShadow: studentName.trim() ? `0 2px 8px rgba(232, 168, 73, 0.3)` : 'none',
                        }}
                    >
                        View Assessments
                        <span style={{ fontSize: '1.1rem' }}>→</span>
                    </button>
                </div>
            </div>
        );
    }

    // Assessment selection hub
    return (
        <div style={{
            minHeight: '100vh',
            background: `linear-gradient(180deg, ${theme.bg.deep} 0%, #12110e 100%)`,
            padding: '2rem',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}>
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `
                    radial-gradient(ellipse at 20% 20%, rgba(232, 168, 73, 0.03) 0%, transparent 50%),
                    radial-gradient(ellipse at 80% 80%, rgba(92, 156, 230, 0.02) 0%, transparent 50%)
                `,
                pointerEvents: 'none',
            }} />

            <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2rem',
                    flexWrap: 'wrap',
                    gap: '1rem',
                }}>
                    <div>
                        <div style={{
                            fontSize: '0.65rem',
                            color: theme.text.tertiary,
                            fontFamily: '"SF Mono", monospace',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            marginBottom: '0.25rem',
                        }}>
                            Music Technology Assessment Hub
                        </div>
                        <h1 style={{
                            fontSize: '1.5rem',
                            fontWeight: '600',
                            color: theme.text.primary,
                        }}>
                            Welcome, {studentName}
                        </h1>
                    </div>

                    <button
                        onClick={() => setHasEnteredName(false)}
                        style={{
                            padding: '0.5rem 1rem',
                            background: theme.bg.surface,
                            border: `1px solid ${theme.border.medium}`,
                            borderRadius: '8px',
                            color: theme.text.secondary,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                        }}
                    >
                        Change Name
                    </button>
                </div>

                {/* Assessment count */}
                <div style={{
                    background: theme.bg.panel,
                    borderRadius: '12px',
                    padding: '1rem 1.5rem',
                    marginBottom: '2rem',
                    border: `1px solid ${theme.border.subtle}`,
                    display: 'flex',
                    gap: '2rem',
                    flexWrap: 'wrap',
                }}>
                    <div>
                        <div style={{
                            fontSize: '1.5rem',
                            fontWeight: '700',
                            color: theme.accent.amber,
                            fontFamily: '"SF Mono", monospace',
                        }}>
                            {assessments.length}
                        </div>
                        <div style={{
                            fontSize: '0.75rem',
                            color: theme.text.tertiary,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                        }}>
                            Available Assessments
                        </div>
                    </div>
                    <div>
                        <div style={{
                            fontSize: '1.5rem',
                            fontWeight: '700',
                            color: theme.accent.green,
                            fontFamily: '"SF Mono", monospace',
                        }}>
                            {assessments.filter(a => a.type === 'drawing').length}
                        </div>
                        <div style={{
                            fontSize: '0.75rem',
                            color: theme.text.tertiary,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                        }}>
                            Drawing Tasks
                        </div>
                    </div>
                </div>

                {/* Assessment cards */}
                <div style={{
                    display: 'grid',
                    gap: '1rem',
                }}>
                    {assessments.map((assessment) => (
                        <Link
                            key={assessment.id}
                            href={`/${assessment.id}?name=${encodeURIComponent(studentName)}`}
                            style={{ textDecoration: 'none' }}
                        >
                            <div style={{
                                background: `linear-gradient(135deg, ${theme.bg.panel} 0%, ${theme.bg.surface} 100%)`,
                                borderRadius: '12px',
                                border: `1px solid ${theme.border.medium}`,
                                padding: '1.5rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
                                    e.currentTarget.style.borderColor = theme.accent.amber + '60';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'none';
                                    e.currentTarget.style.boxShadow = 'none';
                                    e.currentTarget.style.borderColor = theme.border.medium;
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    marginBottom: '0.75rem',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <span style={{ fontSize: '1.5rem' }}>
                                            {typeIcons[assessment.type] || '📋'}
                                        </span>
                                        <div>
                                            <h2 style={{
                                                color: theme.text.primary,
                                                fontSize: '1.1rem',
                                                fontWeight: '600',
                                                marginBottom: '0.25rem',
                                            }}>
                                                {assessment.title}
                                            </h2>
                                            <span style={{
                                                fontSize: '0.7rem',
                                                color: theme.accent.purple,
                                                background: `${theme.accent.purple}15`,
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '4px',
                                                fontWeight: '500',
                                            }}>
                                                {assessment.topic}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        gap: '0.5rem',
                                        alignItems: 'center',
                                    }}>
                                        <span style={{
                                            fontSize: '0.7rem',
                                            color: theme.text.tertiary,
                                            background: theme.bg.deep,
                                            padding: '0.3rem 0.6rem',
                                            borderRadius: '4px',
                                        }}>
                                            {assessment.challengeCount} challenges
                                        </span>
                                        <span style={{
                                            fontSize: '0.7rem',
                                            color: theme.accent.amber,
                                            background: `${theme.accent.amber}15`,
                                            padding: '0.3rem 0.6rem',
                                            borderRadius: '4px',
                                        }}>
                                            {typeLabels[assessment.type]}
                                        </span>
                                    </div>
                                </div>

                                <p style={{
                                    color: theme.text.secondary,
                                    fontSize: '0.9rem',
                                    lineHeight: '1.5',
                                    marginBottom: '0.75rem',
                                }}>
                                    {assessment.description}
                                </p>

                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        color: theme.text.tertiary,
                                    }}>
                                        ⏱ {assessment.estimatedTime}
                                    </span>

                                    <span style={{
                                        color: theme.accent.amber,
                                        fontSize: '0.85rem',
                                        fontWeight: '500',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                    }}>
                                        Start Assessment →
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Empty state */}
                {assessments.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        padding: '3rem',
                        color: theme.text.tertiary,
                    }}>
                        No assessments available yet.
                    </div>
                )}
            </div>
        </div>
    );
}

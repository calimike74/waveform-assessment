'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// Waveform shape definitions (same as assessment component)
const waveformShapes = {
    sine: (progress, cycles) => Math.sin(progress * cycles * 2 * Math.PI),
    square: (progress, cycles) => Math.sign(Math.sin(progress * cycles * 2 * Math.PI)),
    saw: (progress, cycles) => {
        const phase = (progress * cycles) % 1;
        return 2 * phase - 1;
    },
    triangle: (progress, cycles) => {
        const phase = (progress * cycles) % 1;
        return 4 * Math.abs(phase - 0.5) - 1;
    }
};

// Challenge data for calculating expected cycles
const challengeData = {
    1: { originalCycles: 4, targetCycles: 2 },
    2: { originalCycles: 2, targetCycles: 4 },
    3: { originalCycles: 4, targetCycles: 2 },
    4: { originalCycles: 6, targetCycles: 3 },
    5: { originalCycles: 3, targetCycles: 6 },
    6: { originalCycles: 8, targetCycles: 2 },
    7: { originalCycles: 4, targetCycles: 2 },
    8: { originalCycles: 2, targetCycles: 8 },
    9: { originalCycles: 4, targetCycles: 8 },
    10: { originalCycles: 3, targetCycles: 6 }
};

export default function TeacherDashboard() {
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState({ student: '', challenge: '' });
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [markingId, setMarkingId] = useState(null);
    const [markingError, setMarkingError] = useState(null);
    const [correctAnswerImage, setCorrectAnswerImage] = useState(null);
    const correctAnswerCanvasRef = useRef(null);

    // Simple password check (you can change this)
    const TEACHER_PASSWORD = 'teacher2024';

    // Generate correct answer image when submission is selected
    const generateCorrectAnswer = useCallback((submission) => {
        if (!submission) return null;

        const canvas = document.createElement('canvas');
        const width = 700;
        const height = 350;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        const padding = { top: 50, right: 50, bottom: 60, left: 70 };
        const graphWidth = width - padding.left - padding.right;
        const graphHeight = height - padding.top - padding.bottom;

        // Background
        ctx.fillStyle = '#1a1814';
        ctx.fillRect(0, 0, width, height);

        // Graph background
        ctx.fillStyle = '#252219';
        ctx.fillRect(padding.left, padding.top, graphWidth, graphHeight);

        // Grid lines
        ctx.strokeStyle = 'rgba(245, 240, 230, 0.1)';
        ctx.lineWidth = 1;

        // Vertical grid
        for (let i = 0; i <= 10; i++) {
            const x = padding.left + (graphWidth / 10) * i;
            ctx.beginPath();
            ctx.moveTo(x, padding.top);
            ctx.lineTo(x, padding.top + graphHeight);
            ctx.stroke();
        }

        // Horizontal grid
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (graphHeight / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + graphWidth, y);
            ctx.stroke();
        }

        // Center line
        ctx.strokeStyle = 'rgba(245, 240, 230, 0.3)';
        ctx.lineWidth = 2;
        const centerY = padding.top + graphHeight / 2;
        ctx.beginPath();
        ctx.moveTo(padding.left, centerY);
        ctx.lineTo(padding.left + graphWidth, centerY);
        ctx.stroke();

        // Get challenge info
        const challenge = challengeData[submission.challenge_number] || {};
        const originalCycles = challenge.originalCycles || 4;
        const targetCycles = challenge.targetCycles || 4;
        const targetShape = submission.target_shape || 'sine';
        const originalShape = submission.original_shape || 'sine';

        // Draw original waveform (dashed gray)
        if (waveformShapes[originalShape]) {
            ctx.strokeStyle = 'rgba(150, 150, 150, 0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 8]);
            ctx.beginPath();

            for (let i = 0; i <= graphWidth; i++) {
                const progress = i / graphWidth;
                const value = waveformShapes[originalShape](progress, originalCycles);
                const x = padding.left + i;
                const y = centerY - (value * graphHeight * 0.4);

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Draw correct answer (solid green)
        if (waveformShapes[targetShape]) {
            ctx.strokeStyle = '#7cb342';
            ctx.lineWidth = 3;
            ctx.beginPath();

            for (let i = 0; i <= graphWidth; i++) {
                const progress = i / graphWidth;
                const value = waveformShapes[targetShape](progress, targetCycles);
                const x = padding.left + i;
                const y = centerY - (value * graphHeight * 0.4);

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }

        // Labels
        ctx.fillStyle = '#f5f0e6';
        ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(`Original: ${originalShape} (${originalCycles} cycles)`, padding.left, 25);

        ctx.fillStyle = '#7cb342';
        ctx.fillText(`Correct Answer: ${targetShape} (${targetCycles} cycles)`, padding.left + 300, 25);

        return canvas.toDataURL('image/png');
    }, []);

    // Update correct answer when submission changes
    useEffect(() => {
        if (selectedSubmission) {
            const image = generateCorrectAnswer(selectedSubmission);
            setCorrectAnswerImage(image);
        } else {
            setCorrectAnswerImage(null);
        }
    }, [selectedSubmission, generateCorrectAnswer]);

    const handleLogin = (e) => {
        e.preventDefault();
        if (password === TEACHER_PASSWORD) {
            setIsAuthenticated(true);
            fetchSubmissions();
        } else {
            alert('Incorrect password');
        }
    };

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('submissions')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSubmissions(data || []);
        } catch (err) {
            console.error('Error fetching submissions:', err);
            alert('Failed to load submissions');
        }
        setLoading(false);
    };

    // Request AI marking for a submission
    const requestAIMarking = async (submissionId) => {
        setMarkingId(submissionId);
        setMarkingError(null);

        try {
            // Generate correct answer image for the submission being marked
            const submission = submissions.find(s => s.id === submissionId) || selectedSubmission;
            const correctImage = submission ? generateCorrectAnswer(submission) : null;

            const response = await fetch('/api/ai-mark', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    submissionId,
                    correctAnswerImage: correctImage
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get AI feedback');
            }

            // Update local state with feedback
            setSubmissions(prev => prev.map(sub =>
                sub.id === submissionId
                    ? { ...sub, ai_feedback: data.feedback, ai_mark: data.feedback.suggestedMark, ai_marked_at: data.markedAt }
                    : sub
            ));

            // Update selected submission if it's the one being marked
            if (selectedSubmission?.id === submissionId) {
                setSelectedSubmission(prev => ({
                    ...prev,
                    ai_feedback: data.feedback,
                    ai_mark: data.feedback.suggestedMark,
                    ai_marked_at: data.markedAt
                }));
            }
        } catch (error) {
            console.error('AI marking error:', error);
            setMarkingError(error.message);
        } finally {
            setMarkingId(null);
        }
    };

    // Get unique student names for filter
    const studentNames = [...new Set(submissions.map(s => s.student_name))].sort();

    // Filter submissions
    const filteredSubmissions = submissions.filter(s => {
        if (filter.student && s.student_name !== filter.student) return false;
        if (filter.challenge && s.challenge_number !== parseInt(filter.challenge)) return false;
        return true;
    });

    // Group by student
    const groupedByStudent = filteredSubmissions.reduce((acc, sub) => {
        if (!acc[sub.student_name]) acc[sub.student_name] = [];
        acc[sub.student_name].push(sub);
        return acc;
    }, {});

    // Theme matching the assessment
    const theme = {
        bg: { deep: '#1a1814', panel: '#252219', surface: '#2d2a23' },
        accent: { amber: '#e8a849', green: '#7cb342', blue: '#5c9ce6', red: '#e57373' },
        text: { primary: '#f5f0e6', secondary: '#a8a090', tertiary: '#6b6560' },
        border: { subtle: 'rgba(245, 240, 230, 0.08)', medium: 'rgba(245, 240, 230, 0.15)' }
    };

    // Login screen
    if (!isAuthenticated) {
        return (
            <div style={{
                minHeight: '100vh',
                background: `linear-gradient(180deg, ${theme.bg.deep} 0%, #12110e 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}>
                <div style={{
                    background: theme.bg.panel,
                    padding: '2.5rem',
                    borderRadius: '16px',
                    border: `1px solid ${theme.border.medium}`,
                    maxWidth: '400px',
                    width: '100%',
                }}>
                    <h1 style={{
                        color: theme.text.primary,
                        fontSize: '1.5rem',
                        marginBottom: '0.5rem',
                    }}>
                        Teacher Dashboard
                    </h1>
                    <p style={{
                        color: theme.text.secondary,
                        fontSize: '0.9rem',
                        marginBottom: '1.5rem',
                    }}>
                        Enter password to view student submissions
                    </p>
                    <form onSubmit={handleLogin}>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            style={{
                                width: '100%',
                                padding: '0.875rem',
                                background: theme.bg.deep,
                                border: `1px solid ${theme.border.medium}`,
                                borderRadius: '8px',
                                color: theme.text.primary,
                                fontSize: '1rem',
                                marginBottom: '1rem',
                                outline: 'none',
                            }}
                        />
                        <button
                            type="submit"
                            style={{
                                width: '100%',
                                padding: '0.875rem',
                                background: `linear-gradient(135deg, ${theme.accent.amber} 0%, #d4922e 100%)`,
                                border: 'none',
                                borderRadius: '8px',
                                color: theme.bg.deep,
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                            }}
                        >
                            Access Dashboard
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Main dashboard
    return (
        <div style={{
            minHeight: '100vh',
            background: `linear-gradient(180deg, ${theme.bg.deep} 0%, #12110e 100%)`,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            padding: '2rem',
        }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
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
                        <h1 style={{ color: theme.text.primary, fontSize: '1.75rem', marginBottom: '0.25rem' }}>
                            Teacher Dashboard
                        </h1>
                        <p style={{ color: theme.text.secondary, fontSize: '0.9rem' }}>
                            {submissions.length} total submissions from {studentNames.length} students
                        </p>
                    </div>
                    <button
                        onClick={fetchSubmissions}
                        disabled={loading}
                        style={{
                            padding: '0.625rem 1.25rem',
                            background: theme.bg.surface,
                            border: `1px solid ${theme.border.medium}`,
                            borderRadius: '8px',
                            color: theme.text.secondary,
                            cursor: 'pointer',
                        }}
                    >
                        {loading ? 'Loading...' : 'Refresh'}
                    </button>
                </div>

                {/* Filters */}
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginBottom: '1.5rem',
                    flexWrap: 'wrap',
                }}>
                    <select
                        value={filter.student}
                        onChange={(e) => setFilter(f => ({ ...f, student: e.target.value }))}
                        style={{
                            padding: '0.625rem 1rem',
                            background: theme.bg.surface,
                            border: `1px solid ${theme.border.medium}`,
                            borderRadius: '8px',
                            color: theme.text.primary,
                            fontSize: '0.875rem',
                        }}
                    >
                        <option value="">All Students</option>
                        {studentNames.map(name => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>
                    <select
                        value={filter.challenge}
                        onChange={(e) => setFilter(f => ({ ...f, challenge: e.target.value }))}
                        style={{
                            padding: '0.625rem 1rem',
                            background: theme.bg.surface,
                            border: `1px solid ${theme.border.medium}`,
                            borderRadius: '8px',
                            color: theme.text.primary,
                            fontSize: '0.875rem',
                        }}
                    >
                        <option value="">All Challenges</option>
                        {[1,2,3,4,5,6,7,8,9,10].map(n => (
                            <option key={n} value={n}>Challenge {n}</option>
                        ))}
                    </select>
                    {(filter.student || filter.challenge) && (
                        <button
                            onClick={() => setFilter({ student: '', challenge: '' })}
                            style={{
                                padding: '0.625rem 1rem',
                                background: 'transparent',
                                border: `1px solid ${theme.accent.red}50`,
                                borderRadius: '8px',
                                color: theme.accent.red,
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                            }}
                        >
                            Clear Filters
                        </button>
                    )}
                </div>

                {/* Submissions Grid */}
                {loading ? (
                    <div style={{ color: theme.text.secondary, textAlign: 'center', padding: '3rem' }}>
                        Loading submissions...
                    </div>
                ) : filteredSubmissions.length === 0 ? (
                    <div style={{ color: theme.text.secondary, textAlign: 'center', padding: '3rem' }}>
                        No submissions found
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: '1rem',
                    }}>
                        {filteredSubmissions.map((sub) => (
                            <div
                                key={sub.id}
                                onClick={() => setSelectedSubmission(sub)}
                                style={{
                                    background: theme.bg.panel,
                                    borderRadius: '12px',
                                    border: `1px solid ${theme.border.medium}`,
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'none';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                {/* Drawing preview */}
                                <div style={{
                                    background: theme.bg.deep,
                                    padding: '0.5rem',
                                }}>
                                    <img
                                        src={sub.drawing_image}
                                        alt={`${sub.student_name} - Challenge ${sub.challenge_number}`}
                                        style={{
                                            width: '100%',
                                            height: 'auto',
                                            borderRadius: '6px',
                                        }}
                                    />
                                </div>
                                {/* Info */}
                                <div style={{ padding: '1rem' }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: '0.5rem',
                                    }}>
                                        <span style={{
                                            color: theme.text.primary,
                                            fontWeight: '600',
                                            fontSize: '0.95rem',
                                        }}>
                                            {sub.student_name}
                                        </span>
                                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                            {sub.ai_mark !== undefined && sub.ai_mark !== null && (
                                                <span style={{
                                                    background: sub.ai_mark >= 8
                                                        ? theme.accent.green
                                                        : sub.ai_mark >= 5
                                                        ? theme.accent.amber
                                                        : theme.accent.red,
                                                    color: '#fff',
                                                    padding: '0.2rem 0.4rem',
                                                    borderRadius: '4px',
                                                    fontSize: '0.7rem',
                                                    fontWeight: '700',
                                                }}>
                                                    {sub.ai_mark}/10
                                                </span>
                                            )}
                                            <span style={{
                                                background: theme.accent.amber + '20',
                                                color: theme.accent.amber,
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '4px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                            }}>
                                                #{sub.challenge_number}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{
                                        color: theme.text.tertiary,
                                        fontSize: '0.8rem',
                                        marginBottom: '0.5rem',
                                    }}>
                                        {sub.original_shape} → {sub.target_shape} ({sub.octaves} octave {sub.direction})
                                    </div>
                                    <div style={{
                                        color: theme.text.tertiary,
                                        fontSize: '0.75rem',
                                    }}>
                                        {new Date(sub.created_at).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal for full-size view */}
                {selectedSubmission && (
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0,0,0,0.9)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                            padding: '2rem',
                        }}
                        onClick={() => setSelectedSubmission(null)}
                    >
                        <div
                            style={{
                                background: theme.bg.panel,
                                borderRadius: '16px',
                                maxWidth: '900px',
                                width: '100%',
                                maxHeight: '90vh',
                                overflow: 'auto',
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div style={{ padding: '1.5rem' }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    marginBottom: '1rem',
                                }}>
                                    <div>
                                        <h2 style={{ color: theme.text.primary, marginBottom: '0.25rem' }}>
                                            {selectedSubmission.student_name}
                                        </h2>
                                        <p style={{ color: theme.text.secondary, fontSize: '0.9rem' }}>
                                            Challenge {selectedSubmission.challenge_number}: {selectedSubmission.original_shape} → {selectedSubmission.target_shape} ({selectedSubmission.octaves} octave {selectedSubmission.direction})
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedSubmission(null)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: theme.text.tertiary,
                                            fontSize: '1.5rem',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                                {/* Side-by-side comparison */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '1rem',
                                    marginBottom: '1rem',
                                }}>
                                    {/* Student's Drawing */}
                                    <div>
                                        <div style={{
                                            color: theme.accent.blue,
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            marginBottom: '0.5rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                        }}>
                                            Student's Drawing
                                        </div>
                                        <div style={{
                                            background: theme.bg.deep,
                                            borderRadius: '8px',
                                            padding: '0.5rem',
                                            border: `2px solid ${theme.accent.blue}30`,
                                        }}>
                                            <img
                                                src={selectedSubmission.drawing_image}
                                                alt="Student drawing"
                                                style={{
                                                    width: '100%',
                                                    height: 'auto',
                                                    borderRadius: '6px',
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Correct Answer */}
                                    <div>
                                        <div style={{
                                            color: theme.accent.green,
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            marginBottom: '0.5rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                        }}>
                                            Correct Answer
                                        </div>
                                        <div style={{
                                            background: theme.bg.deep,
                                            borderRadius: '8px',
                                            padding: '0.5rem',
                                            border: `2px solid ${theme.accent.green}30`,
                                        }}>
                                            {correctAnswerImage ? (
                                                <img
                                                    src={correctAnswerImage}
                                                    alt="Correct answer"
                                                    style={{
                                                        width: '100%',
                                                        height: 'auto',
                                                        borderRadius: '6px',
                                                    }}
                                                />
                                            ) : (
                                                <div style={{
                                                    color: theme.text.tertiary,
                                                    textAlign: 'center',
                                                    padding: '2rem',
                                                    fontSize: '0.85rem',
                                                }}>
                                                    Generating correct answer...
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div style={{
                                    marginTop: '1rem',
                                    padding: '1rem',
                                    background: theme.bg.deep,
                                    borderRadius: '8px',
                                }}>
                                    <div style={{ color: theme.text.tertiary, fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                                        Submitted: {new Date(selectedSubmission.created_at).toLocaleString()}
                                    </div>
                                    <div style={{ color: theme.text.secondary, fontSize: '0.85rem' }}>
                                        <strong>Task:</strong> Draw a {selectedSubmission.target_shape} wave {selectedSubmission.octaves} octave{selectedSubmission.octaves > 1 ? 's' : ''} {selectedSubmission.direction} from the original {selectedSubmission.original_shape} wave.
                                    </div>
                                </div>

                                {/* AI Marking Section */}
                                <div style={{
                                    marginTop: '1.5rem',
                                    padding: '1rem',
                                    background: theme.bg.surface,
                                    borderRadius: '8px',
                                    border: `1px solid ${theme.border.medium}`,
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '1rem',
                                    }}>
                                        <h3 style={{ color: theme.text.primary, fontSize: '1rem', margin: 0 }}>
                                            AI Marking
                                        </h3>
                                        {!selectedSubmission.ai_feedback && (
                                            <button
                                                onClick={() => requestAIMarking(selectedSubmission.id)}
                                                disabled={markingId === selectedSubmission.id}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    background: markingId === selectedSubmission.id
                                                        ? theme.bg.deep
                                                        : `linear-gradient(135deg, ${theme.accent.blue} 0%, #4a8cd4 100%)`,
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    color: theme.text.primary,
                                                    fontSize: '0.85rem',
                                                    fontWeight: '500',
                                                    cursor: markingId === selectedSubmission.id ? 'wait' : 'pointer',
                                                    opacity: markingId === selectedSubmission.id ? 0.7 : 1,
                                                }}
                                            >
                                                {markingId === selectedSubmission.id ? 'Analyzing...' : 'Get AI Feedback'}
                                            </button>
                                        )}
                                    </div>

                                    {markingError && (
                                        <div style={{
                                            padding: '0.75rem',
                                            background: theme.accent.red + '20',
                                            borderRadius: '6px',
                                            color: theme.accent.red,
                                            fontSize: '0.85rem',
                                            marginBottom: '1rem',
                                        }}>
                                            {markingError}
                                        </div>
                                    )}

                                    {selectedSubmission.ai_feedback ? (
                                        <div>
                                            {/* Mark Badge */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1rem',
                                                marginBottom: '1rem',
                                            }}>
                                                <div style={{
                                                    width: '60px',
                                                    height: '60px',
                                                    borderRadius: '12px',
                                                    background: selectedSubmission.ai_feedback.suggestedMark >= 8
                                                        ? theme.accent.green
                                                        : selectedSubmission.ai_feedback.suggestedMark >= 5
                                                        ? theme.accent.amber
                                                        : theme.accent.red,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexDirection: 'column',
                                                }}>
                                                    <span style={{
                                                        color: '#fff',
                                                        fontSize: '1.5rem',
                                                        fontWeight: '700',
                                                        lineHeight: 1,
                                                    }}>
                                                        {selectedSubmission.ai_feedback.suggestedMark}
                                                    </span>
                                                    <span style={{
                                                        color: 'rgba(255,255,255,0.8)',
                                                        fontSize: '0.65rem',
                                                        fontWeight: '500',
                                                    }}>
                                                        /10
                                                    </span>
                                                </div>
                                                <div>
                                                    <div style={{ color: theme.text.primary, fontWeight: '600', marginBottom: '0.25rem' }}>
                                                        {selectedSubmission.ai_feedback.suggestedMark >= 8 ? 'Excellent' :
                                                         selectedSubmission.ai_feedback.suggestedMark >= 6 ? 'Good' :
                                                         selectedSubmission.ai_feedback.suggestedMark >= 4 ? 'Needs Improvement' : 'Incorrect'}
                                                    </div>
                                                    <div style={{ color: theme.text.tertiary, fontSize: '0.75rem' }}>
                                                        Confidence: {selectedSubmission.ai_feedback.confidence || 'N/A'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Marking Criteria */}
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(3, 1fr)',
                                                gap: '0.75rem',
                                                marginBottom: '1rem',
                                            }}>
                                                {/* Cycle Count */}
                                                <div style={{
                                                    padding: '0.75rem',
                                                    background: theme.bg.deep,
                                                    borderRadius: '6px',
                                                    borderLeft: `3px solid ${selectedSubmission.ai_feedback.cycleCount?.correct ? theme.accent.green : theme.accent.red}`,
                                                }}>
                                                    <div style={{ color: theme.text.tertiary, fontSize: '0.7rem', marginBottom: '0.25rem' }}>
                                                        CYCLES
                                                    </div>
                                                    <div style={{ color: theme.text.primary, fontWeight: '600', fontSize: '0.9rem' }}>
                                                        {selectedSubmission.ai_feedback.cycleCount?.detected || '?'} / {selectedSubmission.ai_feedback.cycleCount?.expected || '?'}
                                                    </div>
                                                    <div style={{ color: theme.text.tertiary, fontSize: '0.7rem' }}>
                                                        {selectedSubmission.ai_feedback.cycleCount?.marks || 0}/4 marks
                                                    </div>
                                                </div>

                                                {/* Shape */}
                                                <div style={{
                                                    padding: '0.75rem',
                                                    background: theme.bg.deep,
                                                    borderRadius: '6px',
                                                    borderLeft: `3px solid ${selectedSubmission.ai_feedback.shapeAccuracy?.correct ? theme.accent.green : theme.accent.red}`,
                                                }}>
                                                    <div style={{ color: theme.text.tertiary, fontSize: '0.7rem', marginBottom: '0.25rem' }}>
                                                        SHAPE
                                                    </div>
                                                    <div style={{ color: theme.text.primary, fontWeight: '600', fontSize: '0.9rem', textTransform: 'capitalize' }}>
                                                        {selectedSubmission.ai_feedback.shapeAccuracy?.detected || '?'}
                                                    </div>
                                                    <div style={{ color: theme.text.tertiary, fontSize: '0.7rem' }}>
                                                        {selectedSubmission.ai_feedback.shapeAccuracy?.marks || 0}/4 marks
                                                    </div>
                                                </div>

                                                {/* Quality */}
                                                <div style={{
                                                    padding: '0.75rem',
                                                    background: theme.bg.deep,
                                                    borderRadius: '6px',
                                                    borderLeft: `3px solid ${theme.accent.blue}`,
                                                }}>
                                                    <div style={{ color: theme.text.tertiary, fontSize: '0.7rem', marginBottom: '0.25rem' }}>
                                                        QUALITY
                                                    </div>
                                                    <div style={{ color: theme.text.primary, fontWeight: '600', fontSize: '0.9rem' }}>
                                                        {selectedSubmission.ai_feedback.drawingQuality?.marks || 0}/2
                                                    </div>
                                                    <div style={{ color: theme.text.tertiary, fontSize: '0.7rem' }}>
                                                        marks
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Overall Feedback */}
                                            <div style={{
                                                padding: '0.75rem',
                                                background: theme.bg.deep,
                                                borderRadius: '6px',
                                                marginBottom: '0.75rem',
                                            }}>
                                                <div style={{ color: theme.text.secondary, fontSize: '0.85rem', lineHeight: 1.5 }}>
                                                    {selectedSubmission.ai_feedback.overallFeedback}
                                                </div>
                                            </div>

                                            {/* Strengths & Improvements */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                                {selectedSubmission.ai_feedback.strengths?.length > 0 && (
                                                    <div>
                                                        <div style={{ color: theme.accent.green, fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                                                            STRENGTHS
                                                        </div>
                                                        <ul style={{ margin: 0, paddingLeft: '1rem', color: theme.text.secondary, fontSize: '0.8rem' }}>
                                                            {selectedSubmission.ai_feedback.strengths.map((s, i) => (
                                                                <li key={i} style={{ marginBottom: '0.25rem' }}>{s}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {selectedSubmission.ai_feedback.improvements?.length > 0 && (
                                                    <div>
                                                        <div style={{ color: theme.accent.amber, fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                                                            TO IMPROVE
                                                        </div>
                                                        <ul style={{ margin: 0, paddingLeft: '1rem', color: theme.text.secondary, fontSize: '0.8rem' }}>
                                                            {selectedSubmission.ai_feedback.improvements.map((s, i) => (
                                                                <li key={i} style={{ marginBottom: '0.25rem' }}>{s}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Re-mark button */}
                                            <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                                                <button
                                                    onClick={() => requestAIMarking(selectedSubmission.id)}
                                                    disabled={markingId === selectedSubmission.id}
                                                    style={{
                                                        padding: '0.4rem 0.75rem',
                                                        background: 'transparent',
                                                        border: `1px solid ${theme.border.medium}`,
                                                        borderRadius: '4px',
                                                        color: theme.text.tertiary,
                                                        fontSize: '0.75rem',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    {markingId === selectedSubmission.id ? 'Re-analyzing...' : 'Re-mark'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ color: theme.text.tertiary, fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
                                            {markingId === selectedSubmission.id ? (
                                                <div>
                                                    <div style={{ marginBottom: '0.5rem' }}>Analyzing drawing with AI...</div>
                                                    <div style={{ fontSize: '0.75rem' }}>This may take a few seconds</div>
                                                </div>
                                            ) : (
                                                'Click "Get AI Feedback" to analyze this submission'
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

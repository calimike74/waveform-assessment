'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function TeacherDashboard() {
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState({ student: '', challenge: '' });
    const [selectedSubmission, setSelectedSubmission] = useState(null);

    // Simple password check (you can change this)
    const TEACHER_PASSWORD = 'teacher2024';

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
                                <div style={{
                                    background: theme.bg.deep,
                                    borderRadius: '8px',
                                    padding: '0.5rem',
                                }}>
                                    <img
                                        src={selectedSubmission.drawing_image}
                                        alt="Full size drawing"
                                        style={{
                                            width: '100%',
                                            height: 'auto',
                                            borderRadius: '6px',
                                        }}
                                    />
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
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

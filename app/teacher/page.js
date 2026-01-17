'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase';
import { getAllAssessments } from '@/lib/assessments';
import { theme as designTheme, typography, borderRadius, spacing, transitions } from '@/lib/theme';

// Use light theme
const t = designTheme.light;

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

// Canvas preview theme (darker for waveform visibility)
const canvasPreviewTheme = {
    bg: '#1a1a2e',
    grid: 'rgba(255, 255, 255, 0.1)',
    centerLine: 'rgba(255, 255, 255, 0.3)',
    original: 'rgba(150, 150, 150, 0.5)',
    correct: '#10B981',
};

export default function TeacherDashboard() {
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState({ student: '', challenge: '', assessment: '' });
    const availableAssessments = getAllAssessments();
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [markingId, setMarkingId] = useState(null);
    const [markingError, setMarkingError] = useState(null);
    const [correctAnswerImage, setCorrectAnswerImage] = useState(null);
    const correctAnswerCanvasRef = useRef(null);

    // Batch marking state
    const [batchMarking, setBatchMarking] = useState(false);
    const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

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
        ctx.fillStyle = canvasPreviewTheme.bg;
        ctx.fillRect(0, 0, width, height);

        // Graph background
        ctx.fillStyle = '#16213e';
        ctx.fillRect(padding.left, padding.top, graphWidth, graphHeight);

        // Grid lines
        ctx.strokeStyle = canvasPreviewTheme.grid;
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
        ctx.strokeStyle = canvasPreviewTheme.centerLine;
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
            ctx.strokeStyle = canvasPreviewTheme.original;
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
            ctx.strokeStyle = canvasPreviewTheme.correct;
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
        ctx.fillStyle = '#f0f0f0';
        ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(`Original: ${originalShape} (${originalCycles} cycles)`, padding.left, 25);

        ctx.fillStyle = canvasPreviewTheme.correct;
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
            const { data, error } = await getSupabase()
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

    // Batch mark all unmarked submissions
    const batchMarkAll = async () => {
        const unmarked = filteredSubmissions.filter(s => !s.ai_feedback);
        if (unmarked.length === 0) {
            alert('All submissions in current view are already marked!');
            return;
        }

        setBatchMarking(true);
        setBatchProgress({ current: 0, total: unmarked.length });

        for (let i = 0; i < unmarked.length; i++) {
            const sub = unmarked[i];
            setBatchProgress({ current: i + 1, total: unmarked.length });

            try {
                const correctImage = generateCorrectAnswer(sub);

                const response = await fetch('/api/ai-mark', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        submissionId: sub.id,
                        correctAnswerImage: correctImage
                    }),
                });

                const data = await response.json();

                if (response.ok) {
                    setSubmissions(prev => prev.map(s =>
                        s.id === sub.id
                            ? { ...s, ai_feedback: data.feedback, ai_mark: data.feedback.suggestedMark, ai_marked_at: data.markedAt }
                            : s
                    ));
                }
            } catch (error) {
                console.error(`Failed to mark submission ${sub.id}:`, error);
            }

            // Small delay between requests
            if (i < unmarked.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        setBatchMarking(false);
        setBatchProgress({ current: 0, total: 0 });
    };

    // Export submissions to CSV
    const exportToCSV = () => {
        const dataToExport = filteredSubmissions.length > 0 ? filteredSubmissions : submissions;

        if (dataToExport.length === 0) {
            alert('No submissions to export');
            return;
        }

        // CSV headers
        const headers = [
            'Student Name',
            'Challenge Number',
            'Original Shape',
            'Target Shape',
            'Octaves',
            'Direction',
            'AI Mark',
            'Cycle Count (Detected)',
            'Cycle Count (Expected)',
            'Cycle Count Correct',
            'Shape Detected',
            'Shape Correct',
            'Drawing Quality Marks',
            'Overall Feedback',
            'Strengths',
            'Improvements',
            'Submitted At',
            'AI Marked At'
        ];

        // Convert submissions to CSV rows
        const rows = dataToExport.map(sub => {
            const feedback = sub.ai_feedback || {};
            return [
                sub.student_name,
                sub.challenge_number,
                sub.original_shape,
                sub.target_shape,
                sub.octaves,
                sub.direction,
                sub.ai_mark ?? '',
                feedback.cycleCount?.detected ?? '',
                feedback.cycleCount?.expected ?? '',
                feedback.cycleCount?.correct ?? '',
                feedback.shapeAccuracy?.detected ?? '',
                feedback.shapeAccuracy?.correct ?? '',
                feedback.drawingQuality?.marks ?? '',
                (feedback.overallFeedback || '').replace(/"/g, '""'),
                (feedback.strengths || []).join('; ').replace(/"/g, '""'),
                (feedback.improvements || []).join('; ').replace(/"/g, '""'),
                new Date(sub.created_at).toLocaleString(),
                sub.ai_marked_at ? new Date(sub.ai_marked_at).toLocaleString() : ''
            ];
        });

        // Build CSV content
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell =>
                typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))
                    ? `"${cell}"`
                    : cell
            ).join(','))
        ].join('\n');

        // Create download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const filterDesc = filter.student || filter.challenge
            ? `_${filter.student || 'all'}_ch${filter.challenge || 'all'}`
            : '';
        link.download = `waveform_submissions${filterDesc}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Get unique student names for filter
    const studentNames = [...new Set(submissions.map(s => s.student_name))].sort();

    // Get unique assessment IDs for filter dropdown
    const assessmentIds = [...new Set(submissions.map(s => s.assessment_id || 'waveform-octaves'))];

    // Filter submissions
    const filteredSubmissions = submissions.filter(s => {
        if (filter.student && s.student_name !== filter.student) return false;
        if (filter.challenge && s.challenge_number !== parseInt(filter.challenge)) return false;
        if (filter.assessment && (s.assessment_id || 'waveform-octaves') !== filter.assessment) return false;
        return true;
    });

    // Group by student
    const groupedByStudent = filteredSubmissions.reduce((acc, sub) => {
        if (!acc[sub.student_name]) acc[sub.student_name] = [];
        acc[sub.student_name].push(sub);
        return acc;
    }, {});

    // Common button styles
    const buttonBase = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: typography.fontFamily,
        fontWeight: typography.weight.medium,
        fontSize: typography.size.base,
        borderRadius: borderRadius.lg,
        cursor: 'pointer',
        transition: `all ${transitions.fast} ${transitions.easing}`,
        border: 'none',
        outline: 'none',
    };

    // Common input styles
    const inputBase = {
        fontFamily: typography.fontFamily,
        fontSize: typography.size.base,
        padding: `${spacing[2]} ${spacing[3]}`,
        borderRadius: borderRadius.lg,
        border: `1px solid ${t.border.input}`,
        backgroundColor: t.bg.primary,
        color: t.text.primary,
        outline: 'none',
        transition: `border-color ${transitions.fast} ${transitions.easing}, box-shadow ${transitions.fast} ${transitions.easing}`,
    };

    // Login screen
    if (!isAuthenticated) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    background: t.bg.secondary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: typography.fontFamily,
                    padding: spacing[8],
                }}
            >
                <main
                    style={{
                        background: t.bg.primary,
                        padding: spacing[10],
                        borderRadius: borderRadius['2xl'],
                        border: `1px solid ${t.border.subtle}`,
                        boxShadow: t.shadow.lg,
                        maxWidth: '400px',
                        width: '100%',
                    }}
                    role="main"
                    aria-labelledby="login-title"
                >
                    <h1
                        id="login-title"
                        style={{
                            color: t.text.primary,
                            fontSize: typography.size['2xl'],
                            fontWeight: typography.weight.bold,
                            marginBottom: spacing[2],
                            lineHeight: typography.lineHeight.tight,
                        }}
                    >
                        Teacher Dashboard
                    </h1>
                    <p
                        style={{
                            color: t.text.secondary,
                            fontSize: typography.size.base,
                            marginBottom: spacing[6],
                            lineHeight: typography.lineHeight.relaxed,
                        }}
                    >
                        Enter password to view student submissions
                    </p>
                    <form onSubmit={handleLogin}>
                        <label
                            htmlFor="teacher-password"
                            style={{
                                display: 'block',
                                color: t.text.secondary,
                                fontSize: typography.size.sm,
                                fontWeight: typography.weight.medium,
                                marginBottom: spacing[1],
                            }}
                        >
                            Access Code
                        </label>
                        <input
                            id="teacher-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter access code"
                            style={{
                                ...inputBase,
                                width: '100%',
                                marginBottom: spacing[4],
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = t.border.focus;
                                e.target.style.boxShadow = `0 0 0 3px rgba(37, 99, 235, 0.1)`;
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = t.border.input;
                                e.target.style.boxShadow = 'none';
                            }}
                            aria-required="true"
                        />
                        <button
                            type="submit"
                            style={{
                                ...buttonBase,
                                width: '100%',
                                padding: `${spacing[3]} ${spacing[4]}`,
                                background: t.accent.primary,
                                color: t.text.inverse,
                                fontWeight: typography.weight.semibold,
                                boxShadow: t.shadow.md,
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = t.accent.primaryHover;
                                e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = t.accent.primary;
                                e.currentTarget.style.transform = 'none';
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.outline = `2px solid ${t.border.focus}`;
                                e.currentTarget.style.outlineOffset = '2px';
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.outline = 'none';
                            }}
                        >
                            Access Dashboard
                        </button>
                    </form>
                </main>
            </div>
        );
    }

    // Main dashboard
    return (
        <div
            style={{
                minHeight: '100vh',
                background: t.bg.secondary,
                fontFamily: typography.fontFamily,
                padding: spacing[8],
            }}
        >
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                {/* Header */}
                <header
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: spacing[6],
                        flexWrap: 'wrap',
                        gap: spacing[4],
                    }}
                >
                    <div>
                        <h1
                            style={{
                                color: t.text.primary,
                                fontSize: typography.size['3xl'],
                                fontWeight: typography.weight.bold,
                                marginBottom: spacing[1],
                                lineHeight: typography.lineHeight.tight,
                            }}
                        >
                            Teacher Dashboard
                        </h1>
                        <p
                            style={{
                                color: t.text.secondary,
                                fontSize: typography.size.base,
                            }}
                        >
                            {submissions.length} total submissions from {studentNames.length} students
                        </p>
                    </div>
                    <nav
                        style={{ display: 'flex', gap: spacing[3], flexWrap: 'wrap' }}
                        aria-label="Dashboard actions"
                    >
                        <button
                            onClick={exportToCSV}
                            disabled={loading || submissions.length === 0}
                            aria-label="Export submissions to CSV"
                            style={{
                                ...buttonBase,
                                padding: `${spacing[2]} ${spacing[4]}`,
                                background: t.accent.success,
                                color: t.text.inverse,
                                opacity: submissions.length === 0 ? 0.5 : 1,
                                cursor: submissions.length === 0 ? 'not-allowed' : 'pointer',
                            }}
                            onMouseEnter={(e) => {
                                if (submissions.length > 0) {
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'none';
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.outline = `2px solid ${t.border.focus}`;
                                e.currentTarget.style.outlineOffset = '2px';
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.outline = 'none';
                            }}
                        >
                            Export CSV
                        </button>
                        <button
                            onClick={batchMarkAll}
                            disabled={loading || batchMarking || filteredSubmissions.length === 0}
                            aria-label={batchMarking ? `Marking ${batchProgress.current} of ${batchProgress.total}` : `Mark all ${filteredSubmissions.filter(s => !s.ai_feedback).length} unmarked submissions`}
                            style={{
                                ...buttonBase,
                                padding: `${spacing[2]} ${spacing[4]}`,
                                background: batchMarking ? t.bg.tertiary : t.accent.primary,
                                color: batchMarking ? t.text.secondary : t.text.inverse,
                                cursor: batchMarking ? 'wait' : 'pointer',
                                minWidth: '180px',
                            }}
                            onMouseEnter={(e) => {
                                if (!batchMarking) {
                                    e.currentTarget.style.background = t.accent.primaryHover;
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = batchMarking ? t.bg.tertiary : t.accent.primary;
                                e.currentTarget.style.transform = 'none';
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.outline = `2px solid ${t.border.focus}`;
                                e.currentTarget.style.outlineOffset = '2px';
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.outline = 'none';
                            }}
                        >
                            {batchMarking
                                ? `Marking ${batchProgress.current}/${batchProgress.total}...`
                                : `Mark All Unmarked (${filteredSubmissions.filter(s => !s.ai_feedback).length})`}
                        </button>
                        <button
                            onClick={fetchSubmissions}
                            disabled={loading}
                            aria-label="Refresh submissions"
                            style={{
                                ...buttonBase,
                                padding: `${spacing[2]} ${spacing[4]}`,
                                background: t.bg.primary,
                                border: `1px solid ${t.border.medium}`,
                                color: t.text.secondary,
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = t.border.strong;
                                e.currentTarget.style.color = t.text.primary;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = t.border.medium;
                                e.currentTarget.style.color = t.text.secondary;
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.outline = `2px solid ${t.border.focus}`;
                                e.currentTarget.style.outlineOffset = '2px';
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.outline = 'none';
                            }}
                        >
                            {loading ? 'Loading...' : 'Refresh'}
                        </button>
                    </nav>
                </header>

                {/* Filters */}
                <section
                    aria-label="Submission filters"
                    style={{
                        display: 'flex',
                        gap: spacing[4],
                        marginBottom: spacing[6],
                        flexWrap: 'wrap',
                        alignItems: 'center',
                    }}
                >
                    <div>
                        <label
                            htmlFor="filter-student"
                            style={{
                                display: 'block',
                                color: t.text.tertiary,
                                fontSize: typography.size.xs,
                                fontWeight: typography.weight.medium,
                                marginBottom: spacing[1],
                                textTransform: 'uppercase',
                                letterSpacing: typography.letterSpacing.wide,
                            }}
                        >
                            Student
                        </label>
                        <select
                            id="filter-student"
                            value={filter.student}
                            onChange={(e) => setFilter(f => ({ ...f, student: e.target.value }))}
                            style={{
                                ...inputBase,
                                minWidth: '160px',
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = t.border.focus;
                                e.target.style.boxShadow = `0 0 0 3px rgba(37, 99, 235, 0.1)`;
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = t.border.input;
                                e.target.style.boxShadow = 'none';
                            }}
                        >
                            <option value="">All Students</option>
                            {studentNames.map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label
                            htmlFor="filter-assessment"
                            style={{
                                display: 'block',
                                color: t.text.tertiary,
                                fontSize: typography.size.xs,
                                fontWeight: typography.weight.medium,
                                marginBottom: spacing[1],
                                textTransform: 'uppercase',
                                letterSpacing: typography.letterSpacing.wide,
                            }}
                        >
                            Assessment
                        </label>
                        <select
                            id="filter-assessment"
                            value={filter.assessment}
                            onChange={(e) => setFilter(f => ({ ...f, assessment: e.target.value }))}
                            style={{
                                ...inputBase,
                                minWidth: '200px',
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = t.border.focus;
                                e.target.style.boxShadow = `0 0 0 3px rgba(37, 99, 235, 0.1)`;
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = t.border.input;
                                e.target.style.boxShadow = 'none';
                            }}
                        >
                            <option value="">All Assessments</option>
                            {availableAssessments.map(a => (
                                <option key={a.id} value={a.id}>{a.title}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label
                            htmlFor="filter-challenge"
                            style={{
                                display: 'block',
                                color: t.text.tertiary,
                                fontSize: typography.size.xs,
                                fontWeight: typography.weight.medium,
                                marginBottom: spacing[1],
                                textTransform: 'uppercase',
                                letterSpacing: typography.letterSpacing.wide,
                            }}
                        >
                            Challenge
                        </label>
                        <select
                            id="filter-challenge"
                            value={filter.challenge}
                            onChange={(e) => setFilter(f => ({ ...f, challenge: e.target.value }))}
                            style={{
                                ...inputBase,
                                minWidth: '140px',
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = t.border.focus;
                                e.target.style.boxShadow = `0 0 0 3px rgba(37, 99, 235, 0.1)`;
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = t.border.input;
                                e.target.style.boxShadow = 'none';
                            }}
                        >
                            <option value="">All Challenges</option>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                <option key={n} value={n}>Challenge {n}</option>
                            ))}
                        </select>
                    </div>
                    {(filter.student || filter.challenge || filter.assessment) && (
                        <div style={{ alignSelf: 'flex-end' }}>
                            <button
                                onClick={() => setFilter({ student: '', challenge: '', assessment: '' })}
                                aria-label="Clear all filters"
                                style={{
                                    ...buttonBase,
                                    padding: `${spacing[2]} ${spacing[3]}`,
                                    background: 'transparent',
                                    border: `1px solid ${t.accent.error}40`,
                                    color: t.accent.error,
                                    fontSize: typography.size.sm,
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = t.accent.errorLight;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.outline = `2px solid ${t.border.focus}`;
                                    e.currentTarget.style.outlineOffset = '2px';
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.outline = 'none';
                                }}
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}
                </section>

                {/* Submissions Grid */}
                <main role="main" aria-label="Student submissions">
                    {loading ? (
                        <div
                            style={{
                                color: t.text.secondary,
                                textAlign: 'center',
                                padding: spacing[12],
                                fontSize: typography.size.lg,
                            }}
                            role="status"
                            aria-live="polite"
                        >
                            Loading submissions...
                        </div>
                    ) : filteredSubmissions.length === 0 ? (
                        <div
                            style={{
                                color: t.text.secondary,
                                textAlign: 'center',
                                padding: spacing[12],
                                fontSize: typography.size.lg,
                            }}
                        >
                            No submissions found
                        </div>
                    ) : (
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                                gap: spacing[4],
                            }}
                        >
                            {filteredSubmissions.map((sub) => (
                                <article
                                    key={sub.id}
                                    onClick={() => setSelectedSubmission(sub)}
                                    tabIndex={0}
                                    role="button"
                                    aria-label={`View submission from ${sub.student_name}, Challenge ${sub.challenge_number}`}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            setSelectedSubmission(sub);
                                        }
                                    }}
                                    style={{
                                        background: t.bg.primary,
                                        borderRadius: borderRadius.xl,
                                        border: `1px solid ${t.border.subtle}`,
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        transition: `all ${transitions.normal} ${transitions.easing}`,
                                        boxShadow: t.shadow.sm,
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = t.shadow.lg;
                                        e.currentTarget.style.borderColor = t.border.medium;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'none';
                                        e.currentTarget.style.boxShadow = t.shadow.sm;
                                        e.currentTarget.style.borderColor = t.border.subtle;
                                    }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.outline = `2px solid ${t.border.focus}`;
                                        e.currentTarget.style.outlineOffset = '2px';
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.outline = 'none';
                                    }}
                                >
                                    {/* Drawing preview - dark background for visibility */}
                                    <div
                                        style={{
                                            background: canvasPreviewTheme.bg,
                                            padding: spacing[2],
                                        }}
                                    >
                                        <img
                                            src={sub.drawing_image}
                                            alt={`Waveform drawing by ${sub.student_name} for Challenge ${sub.challenge_number}`}
                                            style={{
                                                width: '100%',
                                                height: 'auto',
                                                borderRadius: borderRadius.md,
                                                display: 'block',
                                            }}
                                        />
                                    </div>
                                    {/* Info */}
                                    <div style={{ padding: spacing[4] }}>
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'flex-start',
                                                marginBottom: spacing[2],
                                            }}
                                        >
                                            <span
                                                style={{
                                                    color: t.text.primary,
                                                    fontWeight: typography.weight.semibold,
                                                    fontSize: typography.size.base,
                                                }}
                                            >
                                                {sub.student_name}
                                            </span>
                                            <div style={{ display: 'flex', gap: spacing[2], alignItems: 'center' }}>
                                                {sub.ai_mark !== undefined && sub.ai_mark !== null && (
                                                    <span
                                                        style={{
                                                            background: sub.ai_mark >= 8
                                                                ? t.accent.success
                                                                : sub.ai_mark >= 5
                                                                    ? t.accent.warning
                                                                    : t.accent.error,
                                                            color: t.text.inverse,
                                                            padding: `${spacing[0.5]} ${spacing[2]}`,
                                                            borderRadius: borderRadius.sm,
                                                            fontSize: typography.size.xs,
                                                            fontWeight: typography.weight.bold,
                                                        }}
                                                    >
                                                        {sub.ai_mark}/10
                                                    </span>
                                                )}
                                                <span
                                                    style={{
                                                        background: t.accent.infoLight,
                                                        color: t.accent.info,
                                                        padding: `${spacing[0.5]} ${spacing[2]}`,
                                                        borderRadius: borderRadius.sm,
                                                        fontSize: typography.size.xs,
                                                        fontWeight: typography.weight.semibold,
                                                    }}
                                                >
                                                    #{sub.challenge_number}
                                                </span>
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                color: t.text.tertiary,
                                                fontSize: typography.size.sm,
                                                marginBottom: spacing[2],
                                            }}
                                        >
                                            {sub.original_shape} → {sub.target_shape} ({sub.octaves} octave {sub.direction})
                                        </div>
                                        <div
                                            style={{
                                                color: t.text.tertiary,
                                                fontSize: typography.size.xs,
                                            }}
                                        >
                                            {new Date(sub.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </main>

                {/* Modal for full-size view */}
                {selectedSubmission && (
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                            padding: spacing[4],
                        }}
                        onClick={() => setSelectedSubmission(null)}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-title"
                    >
                        <div
                            style={{
                                background: t.bg.primary,
                                borderRadius: borderRadius['2xl'],
                                maxWidth: '900px',
                                width: '100%',
                                maxHeight: '90vh',
                                overflow: 'auto',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div style={{ padding: spacing[6] }}>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: spacing[4],
                                    }}
                                >
                                    <div>
                                        <h2
                                            id="modal-title"
                                            style={{
                                                color: t.text.primary,
                                                fontSize: typography.size['2xl'],
                                                fontWeight: typography.weight.bold,
                                                marginBottom: spacing[1],
                                            }}
                                        >
                                            {selectedSubmission.student_name}
                                        </h2>
                                        <p style={{ color: t.text.secondary, fontSize: typography.size.base }}>
                                            Challenge {selectedSubmission.challenge_number}: {selectedSubmission.original_shape} → {selectedSubmission.target_shape} ({selectedSubmission.octaves} octave {selectedSubmission.direction})
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedSubmission(null)}
                                        aria-label="Close modal"
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: t.text.tertiary,
                                            fontSize: typography.size['2xl'],
                                            cursor: 'pointer',
                                            padding: spacing[2],
                                            lineHeight: 1,
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.color = t.text.primary;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.color = t.text.tertiary;
                                        }}
                                        onFocus={(e) => {
                                            e.currentTarget.style.outline = `2px solid ${t.border.focus}`;
                                            e.currentTarget.style.outlineOffset = '2px';
                                        }}
                                        onBlur={(e) => {
                                            e.currentTarget.style.outline = 'none';
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>

                                {/* Side-by-side comparison */}
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: spacing[4],
                                        marginBottom: spacing[4],
                                    }}
                                >
                                    {/* Student's Drawing */}
                                    <div>
                                        <div
                                            style={{
                                                color: t.accent.primary,
                                                fontSize: typography.size.xs,
                                                fontWeight: typography.weight.semibold,
                                                marginBottom: spacing[2],
                                                textTransform: 'uppercase',
                                                letterSpacing: typography.letterSpacing.wide,
                                            }}
                                        >
                                            Student's Drawing
                                        </div>
                                        <div
                                            style={{
                                                background: canvasPreviewTheme.bg,
                                                borderRadius: borderRadius.lg,
                                                padding: spacing[2],
                                                border: `2px solid ${t.accent.primary}30`,
                                            }}
                                        >
                                            <img
                                                src={selectedSubmission.drawing_image}
                                                alt="Student's waveform drawing"
                                                style={{
                                                    width: '100%',
                                                    height: 'auto',
                                                    borderRadius: borderRadius.md,
                                                    display: 'block',
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Correct Answer */}
                                    <div>
                                        <div
                                            style={{
                                                color: t.accent.success,
                                                fontSize: typography.size.xs,
                                                fontWeight: typography.weight.semibold,
                                                marginBottom: spacing[2],
                                                textTransform: 'uppercase',
                                                letterSpacing: typography.letterSpacing.wide,
                                            }}
                                        >
                                            Correct Answer
                                        </div>
                                        <div
                                            style={{
                                                background: canvasPreviewTheme.bg,
                                                borderRadius: borderRadius.lg,
                                                padding: spacing[2],
                                                border: `2px solid ${t.accent.success}30`,
                                            }}
                                        >
                                            {correctAnswerImage ? (
                                                <img
                                                    src={correctAnswerImage}
                                                    alt="Correct waveform answer"
                                                    style={{
                                                        width: '100%',
                                                        height: 'auto',
                                                        borderRadius: borderRadius.md,
                                                        display: 'block',
                                                    }}
                                                />
                                            ) : (
                                                <div
                                                    style={{
                                                        color: t.text.tertiary,
                                                        textAlign: 'center',
                                                        padding: spacing[8],
                                                        fontSize: typography.size.sm,
                                                    }}
                                                >
                                                    Generating correct answer...
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Submission info */}
                                <div
                                    style={{
                                        padding: spacing[4],
                                        background: t.bg.secondary,
                                        borderRadius: borderRadius.lg,
                                        marginBottom: spacing[4],
                                    }}
                                >
                                    <div
                                        style={{
                                            color: t.text.tertiary,
                                            fontSize: typography.size.sm,
                                            marginBottom: spacing[2],
                                        }}
                                    >
                                        Submitted: {new Date(selectedSubmission.created_at).toLocaleString()}
                                    </div>
                                    <div style={{ color: t.text.secondary, fontSize: typography.size.base }}>
                                        <strong>Task:</strong> Draw a {selectedSubmission.target_shape} wave {selectedSubmission.octaves} octave{selectedSubmission.octaves > 1 ? 's' : ''} {selectedSubmission.direction} from the original {selectedSubmission.original_shape} wave.
                                    </div>
                                </div>

                                {/* AI Marking Section */}
                                <section
                                    aria-labelledby="ai-marking-title"
                                    style={{
                                        padding: spacing[4],
                                        background: t.bg.tertiary,
                                        borderRadius: borderRadius.lg,
                                        border: `1px solid ${t.border.subtle}`,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: spacing[4],
                                        }}
                                    >
                                        <h3
                                            id="ai-marking-title"
                                            style={{
                                                color: t.text.primary,
                                                fontSize: typography.size.lg,
                                                fontWeight: typography.weight.semibold,
                                                margin: 0,
                                            }}
                                        >
                                            AI Marking
                                        </h3>
                                        {!selectedSubmission.ai_feedback && (
                                            <button
                                                onClick={() => requestAIMarking(selectedSubmission.id)}
                                                disabled={markingId === selectedSubmission.id}
                                                style={{
                                                    ...buttonBase,
                                                    padding: `${spacing[2]} ${spacing[4]}`,
                                                    background: markingId === selectedSubmission.id
                                                        ? t.bg.secondary
                                                        : t.accent.primary,
                                                    color: markingId === selectedSubmission.id
                                                        ? t.text.secondary
                                                        : t.text.inverse,
                                                    fontSize: typography.size.sm,
                                                    cursor: markingId === selectedSubmission.id ? 'wait' : 'pointer',
                                                    opacity: markingId === selectedSubmission.id ? 0.7 : 1,
                                                }}
                                                onFocus={(e) => {
                                                    e.currentTarget.style.outline = `2px solid ${t.border.focus}`;
                                                    e.currentTarget.style.outlineOffset = '2px';
                                                }}
                                                onBlur={(e) => {
                                                    e.currentTarget.style.outline = 'none';
                                                }}
                                            >
                                                {markingId === selectedSubmission.id ? 'Analyzing...' : 'Get AI Feedback'}
                                            </button>
                                        )}
                                    </div>

                                    {markingError && (
                                        <div
                                            style={{
                                                padding: spacing[3],
                                                background: t.accent.errorLight,
                                                borderRadius: borderRadius.md,
                                                color: t.accent.error,
                                                fontSize: typography.size.sm,
                                                marginBottom: spacing[4],
                                            }}
                                            role="alert"
                                        >
                                            {markingError}
                                        </div>
                                    )}

                                    {selectedSubmission.ai_feedback ? (
                                        <div>
                                            {/* Mark Badge */}
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: spacing[4],
                                                    marginBottom: spacing[4],
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: '64px',
                                                        height: '64px',
                                                        borderRadius: borderRadius.xl,
                                                        background: selectedSubmission.ai_feedback.suggestedMark >= 8
                                                            ? t.accent.success
                                                            : selectedSubmission.ai_feedback.suggestedMark >= 5
                                                                ? t.accent.warning
                                                                : t.accent.error,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexDirection: 'column',
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            color: t.text.inverse,
                                                            fontSize: typography.size['2xl'],
                                                            fontWeight: typography.weight.bold,
                                                            lineHeight: 1,
                                                        }}
                                                    >
                                                        {selectedSubmission.ai_feedback.suggestedMark}
                                                    </span>
                                                    <span
                                                        style={{
                                                            color: 'rgba(255, 255, 255, 0.8)',
                                                            fontSize: typography.size.xs,
                                                            fontWeight: typography.weight.medium,
                                                        }}
                                                    >
                                                        /10
                                                    </span>
                                                </div>
                                                <div>
                                                    <div
                                                        style={{
                                                            color: t.text.primary,
                                                            fontWeight: typography.weight.semibold,
                                                            marginBottom: spacing[1],
                                                        }}
                                                    >
                                                        {selectedSubmission.ai_feedback.suggestedMark >= 8 ? 'Excellent' :
                                                            selectedSubmission.ai_feedback.suggestedMark >= 6 ? 'Good' :
                                                                selectedSubmission.ai_feedback.suggestedMark >= 4 ? 'Needs Improvement' : 'Incorrect'}
                                                    </div>
                                                    <div style={{ color: t.text.tertiary, fontSize: typography.size.sm }}>
                                                        Confidence: {selectedSubmission.ai_feedback.confidence || 'N/A'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Marking Criteria */}
                                            <div
                                                style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                                    gap: spacing[3],
                                                    marginBottom: spacing[4],
                                                }}
                                            >
                                                {/* Cycle Count */}
                                                <div
                                                    style={{
                                                        padding: spacing[3],
                                                        background: t.bg.primary,
                                                        borderRadius: borderRadius.md,
                                                        borderLeft: `3px solid ${selectedSubmission.ai_feedback.cycleCount?.correct ? t.accent.success : t.accent.error}`,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            color: t.text.tertiary,
                                                            fontSize: typography.size.xs,
                                                            marginBottom: spacing[1],
                                                            textTransform: 'uppercase',
                                                            letterSpacing: typography.letterSpacing.wide,
                                                        }}
                                                    >
                                                        Cycles
                                                    </div>
                                                    <div
                                                        style={{
                                                            color: t.text.primary,
                                                            fontWeight: typography.weight.semibold,
                                                            fontSize: typography.size.lg,
                                                        }}
                                                    >
                                                        {selectedSubmission.ai_feedback.cycleCount?.detected || '?'} / {selectedSubmission.ai_feedback.cycleCount?.expected || '?'}
                                                    </div>
                                                    <div style={{ color: t.text.tertiary, fontSize: typography.size.xs }}>
                                                        {selectedSubmission.ai_feedback.cycleCount?.marks || 0}/4 marks
                                                    </div>
                                                </div>

                                                {/* Shape */}
                                                <div
                                                    style={{
                                                        padding: spacing[3],
                                                        background: t.bg.primary,
                                                        borderRadius: borderRadius.md,
                                                        borderLeft: `3px solid ${selectedSubmission.ai_feedback.shapeAccuracy?.correct ? t.accent.success : t.accent.error}`,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            color: t.text.tertiary,
                                                            fontSize: typography.size.xs,
                                                            marginBottom: spacing[1],
                                                            textTransform: 'uppercase',
                                                            letterSpacing: typography.letterSpacing.wide,
                                                        }}
                                                    >
                                                        Shape
                                                    </div>
                                                    <div
                                                        style={{
                                                            color: t.text.primary,
                                                            fontWeight: typography.weight.semibold,
                                                            fontSize: typography.size.lg,
                                                            textTransform: 'capitalize',
                                                        }}
                                                    >
                                                        {selectedSubmission.ai_feedback.shapeAccuracy?.detected || '?'}
                                                    </div>
                                                    <div style={{ color: t.text.tertiary, fontSize: typography.size.xs }}>
                                                        {selectedSubmission.ai_feedback.shapeAccuracy?.marks || 0}/4 marks
                                                    </div>
                                                </div>

                                                {/* Quality */}
                                                <div
                                                    style={{
                                                        padding: spacing[3],
                                                        background: t.bg.primary,
                                                        borderRadius: borderRadius.md,
                                                        borderLeft: `3px solid ${t.accent.info}`,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            color: t.text.tertiary,
                                                            fontSize: typography.size.xs,
                                                            marginBottom: spacing[1],
                                                            textTransform: 'uppercase',
                                                            letterSpacing: typography.letterSpacing.wide,
                                                        }}
                                                    >
                                                        Quality
                                                    </div>
                                                    <div
                                                        style={{
                                                            color: t.text.primary,
                                                            fontWeight: typography.weight.semibold,
                                                            fontSize: typography.size.lg,
                                                        }}
                                                    >
                                                        {selectedSubmission.ai_feedback.drawingQuality?.marks || 0}/2
                                                    </div>
                                                    <div style={{ color: t.text.tertiary, fontSize: typography.size.xs }}>
                                                        marks
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Overall Feedback */}
                                            <div
                                                style={{
                                                    padding: spacing[4],
                                                    background: t.bg.primary,
                                                    borderRadius: borderRadius.md,
                                                    marginBottom: spacing[3],
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        color: t.text.secondary,
                                                        fontSize: typography.size.base,
                                                        lineHeight: typography.lineHeight.relaxed,
                                                    }}
                                                >
                                                    {selectedSubmission.ai_feedback.overallFeedback}
                                                </div>
                                            </div>

                                            {/* Strengths & Improvements */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[3] }}>
                                                {selectedSubmission.ai_feedback.strengths?.length > 0 && (
                                                    <div>
                                                        <div
                                                            style={{
                                                                color: t.accent.success,
                                                                fontSize: typography.size.xs,
                                                                fontWeight: typography.weight.semibold,
                                                                marginBottom: spacing[2],
                                                                textTransform: 'uppercase',
                                                                letterSpacing: typography.letterSpacing.wide,
                                                            }}
                                                        >
                                                            Strengths
                                                        </div>
                                                        <ul
                                                            style={{
                                                                margin: 0,
                                                                paddingLeft: spacing[4],
                                                                color: t.text.secondary,
                                                                fontSize: typography.size.sm,
                                                                lineHeight: typography.lineHeight.relaxed,
                                                            }}
                                                        >
                                                            {selectedSubmission.ai_feedback.strengths.map((s, i) => (
                                                                <li key={i} style={{ marginBottom: spacing[1] }}>{s}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {selectedSubmission.ai_feedback.improvements?.length > 0 && (
                                                    <div>
                                                        <div
                                                            style={{
                                                                color: t.accent.warning,
                                                                fontSize: typography.size.xs,
                                                                fontWeight: typography.weight.semibold,
                                                                marginBottom: spacing[2],
                                                                textTransform: 'uppercase',
                                                                letterSpacing: typography.letterSpacing.wide,
                                                            }}
                                                        >
                                                            To Improve
                                                        </div>
                                                        <ul
                                                            style={{
                                                                margin: 0,
                                                                paddingLeft: spacing[4],
                                                                color: t.text.secondary,
                                                                fontSize: typography.size.sm,
                                                                lineHeight: typography.lineHeight.relaxed,
                                                            }}
                                                        >
                                                            {selectedSubmission.ai_feedback.improvements.map((s, i) => (
                                                                <li key={i} style={{ marginBottom: spacing[1] }}>{s}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Re-mark button */}
                                            <div style={{ marginTop: spacing[4], textAlign: 'right' }}>
                                                <button
                                                    onClick={() => requestAIMarking(selectedSubmission.id)}
                                                    disabled={markingId === selectedSubmission.id}
                                                    style={{
                                                        ...buttonBase,
                                                        padding: `${spacing[2]} ${spacing[3]}`,
                                                        background: 'transparent',
                                                        border: `1px solid ${t.border.medium}`,
                                                        color: t.text.tertiary,
                                                        fontSize: typography.size.sm,
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.borderColor = t.border.strong;
                                                        e.currentTarget.style.color = t.text.secondary;
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.borderColor = t.border.medium;
                                                        e.currentTarget.style.color = t.text.tertiary;
                                                    }}
                                                    onFocus={(e) => {
                                                        e.currentTarget.style.outline = `2px solid ${t.border.focus}`;
                                                        e.currentTarget.style.outlineOffset = '2px';
                                                    }}
                                                    onBlur={(e) => {
                                                        e.currentTarget.style.outline = 'none';
                                                    }}
                                                >
                                                    {markingId === selectedSubmission.id ? 'Re-analyzing...' : 'Re-mark'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            style={{
                                                color: t.text.tertiary,
                                                fontSize: typography.size.base,
                                                textAlign: 'center',
                                                padding: spacing[4],
                                            }}
                                        >
                                            {markingId === selectedSubmission.id ? (
                                                <div>
                                                    <div style={{ marginBottom: spacing[2] }}>Analyzing drawing with AI...</div>
                                                    <div style={{ fontSize: typography.size.sm }}>This may take a few seconds</div>
                                                </div>
                                            ) : (
                                                'Click "Get AI Feedback" to analyze this submission'
                                            )}
                                        </div>
                                    )}
                                </section>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

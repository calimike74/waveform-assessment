'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import { theme, typography, borderRadius, spacing, transitions } from '@/lib/theme';
import BatchMarkingProgress from './BatchMarkingProgress';
import BatchResultsSummary from './BatchResultsSummary';

// ============================================
// EQ FILTER DRAWING ASSESSMENT
// 6 Challenges - Supabase submission with AI marking
// ============================================

const EQFilterAssessment = ({ initialName = '' }) => {
    const [studentName, setStudentName] = useState(initialName);
    const [hasStarted, setHasStarted] = useState(!!initialName);
    const [currentChallenge, setCurrentChallenge] = useState(0);
    const [completedChallenges, setCompletedChallenges] = useState(new Set());
    const [submittedChallenges, setSubmittedChallenges] = useState(new Set());
    const [isInputFocused, setIsInputFocused] = useState(false);

    // Canvas state
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [userPoints, setUserPoints] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null);

    // Feedback state
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [currentFeedback, setCurrentFeedback] = useState(null);
    const [feedbackError, setFeedbackError] = useState(null);

    // Batch marking state
    const [savedDrawings, setSavedDrawings] = useState(new Map()); // Map<challengeIndex, submissionId>
    const [isBatchMarking, setIsBatchMarking] = useState(false);
    const [batchMarkingProgress, setBatchMarkingProgress] = useState({ current: 0, total: 0 });
    const [showBatchResults, setShowBatchResults] = useState(false);
    const [batchResults, setBatchResults] = useState([]);
    const [batchSummary, setBatchSummary] = useState({ totalMark: 0, maxMark: 6, percentage: 0 });

    const t = theme.light;
    const canvasWidth = 700;
    const canvasHeight = 350;
    const padding = { top: 50, right: 50, bottom: 60, left: 70 };

    // The 6 assessment challenges
    const challenges = [
        {
            id: 1,
            name: 'High-Pass Filter',
            type: 'highpass',
            frequency: 200,
            description: 'Draw a High-Pass Filter with cutoff at 200Hz',
            hint: 'Remember: HPF removes frequencies BELOW the cutoff'
        },
        {
            id: 2,
            name: 'Low-Pass Filter',
            type: 'lowpass',
            frequency: 8000,
            description: 'Draw a Low-Pass Filter with cutoff at 8kHz',
            hint: 'Remember: LPF removes frequencies ABOVE the cutoff'
        },
        {
            id: 3,
            name: 'Low Shelf Boost',
            type: 'lowshelf',
            frequency: 200,
            gain: 6,
            description: 'Draw a Low Shelf with +6dB boost at 200Hz',
            hint: 'Shelf filters adjust level - they don\'t remove completely'
        },
        {
            id: 4,
            name: 'High Shelf Cut',
            type: 'highshelf',
            frequency: 10000,
            gain: -6,
            description: 'Draw a High Shelf with -6dB cut at 10kHz',
            hint: 'High shelf affects frequencies ABOVE the frequency point'
        },
        {
            id: 5,
            name: 'Bell/Parametric Boost',
            type: 'bell',
            frequency: 1000,
            gain: 6,
            q: 1.4,
            description: 'Draw a Bell filter with +6dB boost at 1kHz (moderate Q)',
            hint: 'Bell filters create a symmetrical bump centered on the frequency'
        },
        {
            id: 6,
            name: 'Notch Filter',
            type: 'notch',
            frequency: 50,
            description: 'Draw a Notch Filter at 50Hz',
            hint: 'Notch filters create a sharp, narrow cut at one frequency'
        }
    ];

    const currentChallengeData = challenges[currentChallenge];

    // Frequency/dB conversion functions
    const freqToX = useCallback((freq) => {
        const minLog = Math.log10(20);
        const maxLog = Math.log10(20000);
        const logFreq = Math.log10(freq);
        return padding.left + ((logFreq - minLog) / (maxLog - minLog)) * (canvasWidth - padding.left - padding.right);
    }, []);

    const dbToY = useCallback((db) => {
        const innerHeight = canvasHeight - padding.top - padding.bottom;
        return padding.top + innerHeight / 2 - (db / 48) * (innerHeight / 2);
    }, []);

    // Draw the grid (keeping dark canvas for better curve visibility)
    const drawGrid = useCallback((ctx) => {
        const innerWidth = canvasWidth - padding.left - padding.right;
        const innerHeight = canvasHeight - padding.top - padding.bottom;

        // Background - keeping dark for better curve visibility
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Graph area
        ctx.fillStyle = '#0f0f1a';
        ctx.fillRect(padding.left, padding.top, innerWidth, innerHeight);

        // Vertical grid lines (frequency)
        const freqMarkers = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        freqMarkers.forEach(freq => {
            const x = freqToX(freq);
            ctx.beginPath();
            ctx.moveTo(x, padding.top);
            ctx.lineTo(x, canvasHeight - padding.bottom);
            ctx.stroke();
        });

        // Horizontal grid lines (dB)
        for (let db = -24; db <= 24; db += 6) {
            const y = dbToY(db);
            ctx.strokeStyle = db === 0 ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = db === 0 ? 2 : 1;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(canvasWidth - padding.right, y);
            ctx.stroke();
        }

        // Axes border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top);
        ctx.lineTo(padding.left, canvasHeight - padding.bottom);
        ctx.lineTo(canvasWidth - padding.right, canvasHeight - padding.bottom);
        ctx.stroke();

        // X-axis labels (frequency)
        ctx.fillStyle = '#9ca3af';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        const freqLabels = [
            { freq: 20, label: '20' },
            { freq: 100, label: '100' },
            { freq: 500, label: '500' },
            { freq: 1000, label: '1k' },
            { freq: 5000, label: '5k' },
            { freq: 20000, label: '20k' }
        ];
        freqLabels.forEach(({ freq, label }) => {
            const x = freqToX(freq);
            ctx.fillText(label, x, canvasHeight - padding.bottom + 20);
        });

        // Y-axis labels (dB)
        ctx.textAlign = 'right';
        for (let db = -24; db <= 24; db += 12) {
            const y = dbToY(db);
            ctx.fillText(`${db > 0 ? '+' : ''}${db}`, padding.left - 10, y + 4);
        }

        // Axis titles
        ctx.fillStyle = '#d1d5db';
        ctx.font = '13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Frequency (Hz)', canvasWidth / 2, canvasHeight - 12);

        ctx.save();
        ctx.translate(18, canvasHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Gain (dB)', 0, 0);
        ctx.restore();

        // Draw frequency marker for the challenge
        if (currentChallengeData) {
            const markerX = freqToX(currentChallengeData.frequency);
            ctx.strokeStyle = 'rgba(37, 99, 235, 0.8)';
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 4]);
            ctx.beginPath();
            ctx.moveTo(markerX, padding.top);
            ctx.lineTo(markerX, canvasHeight - padding.bottom);
            ctx.stroke();
            ctx.setLineDash([]);

            // Frequency label
            ctx.fillStyle = '#3b82f6';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            const freqLabel = currentChallengeData.frequency >= 1000
                ? `${currentChallengeData.frequency / 1000}kHz`
                : `${currentChallengeData.frequency}Hz`;
            ctx.fillText(freqLabel, markerX, padding.top - 12);

            // Gain marker for shelf/bell
            if (currentChallengeData.gain !== undefined) {
                const gainY = dbToY(currentChallengeData.gain);
                ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)';
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(padding.left, gainY);
                ctx.lineTo(canvasWidth - padding.right, gainY);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.fillStyle = '#a855f7';
                ctx.textAlign = 'left';
                ctx.font = 'bold 11px monospace';
                ctx.fillText(
                    `${currentChallengeData.gain > 0 ? '+' : ''}${currentChallengeData.gain}dB`,
                    canvasWidth - padding.right + 8,
                    gainY + 4
                );
            }
        }

        // Header with challenge info
        ctx.fillStyle = '#f8f9fa';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Challenge ${currentChallenge + 1}: ${currentChallengeData?.name || ''}`, padding.left, 25);

        ctx.fillStyle = '#9ca3af';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(studentName || 'Student Name', canvasWidth - padding.right, 25);
    }, [freqToX, dbToY, currentChallengeData, currentChallenge, studentName]);

    // Draw user's line
    const drawUserLine = useCallback((ctx) => {
        if (userPoints.length < 2) return;

        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 8;

        ctx.beginPath();
        ctx.moveTo(userPoints[0].x, userPoints[0].y);
        for (let i = 1; i < userPoints.length; i++) {
            ctx.lineTo(userPoints[i].x, userPoints[i].y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
    }, [userPoints]);

    // Redraw canvas
    const redrawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        drawGrid(ctx);
        drawUserLine(ctx);
    }, [drawGrid, drawUserLine]);

    useEffect(() => {
        redrawCanvas();
    }, [redrawCanvas, userPoints, currentChallenge]);

    // Mouse event handlers
    const getMousePos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };

    const handleMouseDown = (e) => {
        const pos = getMousePos(e);
        if (pos.x >= padding.left && pos.x <= canvasWidth - padding.right &&
            pos.y >= padding.top && pos.y <= canvasHeight - padding.bottom) {
            setIsDrawing(true);
            setUserPoints([pos]);
            setSubmitStatus(null);
        }
    };

    const handleMouseMove = (e) => {
        if (!isDrawing) return;
        const pos = getMousePos(e);
        if (pos.x >= padding.left && pos.x <= canvasWidth - padding.right &&
            pos.y >= padding.top && pos.y <= canvasHeight - padding.bottom) {
            setUserPoints(prev => [...prev, pos]);
        }
    };

    const handleMouseUp = () => {
        if (isDrawing && userPoints.length > 5) {
            setCompletedChallenges(prev => new Set([...prev, currentChallenge]));
        }
        setIsDrawing(false);
    };

    const handleMouseLeave = () => {
        setIsDrawing(false);
    };

    // Touch event handlers for tablet/iPad support
    const handleTouchStart = (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const pos = {
            x: (touch.clientX - rect.left) * scaleX,
            y: (touch.clientY - rect.top) * scaleY
        };

        if (pos.x >= padding.left && pos.x <= canvasWidth - padding.right &&
            pos.y >= padding.top && pos.y <= canvasHeight - padding.bottom) {
            setIsDrawing(true);
            setUserPoints([pos]);
            setSubmitStatus(null);
        }
    };

    const handleTouchMove = (e) => {
        e.preventDefault();
        if (!isDrawing) return;
        const touch = e.touches[0];
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const pos = {
            x: (touch.clientX - rect.left) * scaleX,
            y: (touch.clientY - rect.top) * scaleY
        };

        if (pos.x >= padding.left && pos.x <= canvasWidth - padding.right &&
            pos.y >= padding.top && pos.y <= canvasHeight - padding.bottom) {
            setUserPoints(prev => [...prev, pos]);
        }
    };

    const handleTouchEnd = (e) => {
        e.preventDefault();
        if (isDrawing && userPoints.length > 5) {
            setCompletedChallenges(prev => new Set([...prev, currentChallenge]));
        }
        setIsDrawing(false);
    };

    // Clear drawing
    const clearDrawing = () => {
        setUserPoints([]);
        setSubmitStatus(null);
        setCompletedChallenges(prev => {
            const newSet = new Set(prev);
            newSet.delete(currentChallenge);
            return newSet;
        });
    };

    // Save drawing to Supabase
    const saveToDatabase = async (imageData) => {
        try {
            const { data, error } = await getSupabase()
                .from('submissions')
                .insert({
                    assessment_id: 'eq-filter-drawing',
                    student_name: studentName,
                    challenge_number: currentChallenge + 1,
                    filter_type: currentChallengeData.type,
                    target_frequency: currentChallengeData.frequency,
                    target_gain: currentChallengeData.gain || null,
                    drawing_image: imageData,
                })
                .select('id')
                .single();

            if (error) {
                console.error('Failed to save to database:', error);
                return null;
            }
            return data?.id || null;
        } catch (err) {
            console.error('Database save error:', err);
            return null;
        }
    };

    // Request AI marking
    const requestAIMarking = async (submissionId) => {
        try {
            const response = await fetch('/api/ai-mark', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    submissionId,
                    assessmentType: 'eq-filter-drawing',
                    challengeData: currentChallengeData
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'AI marking failed');
            }

            const result = await response.json();
            return result.feedback;
        } catch (err) {
            console.error('AI marking error:', err);
            throw err;
        }
    };

    // Save drawing to database (without AI marking - marking happens in batch at end)
    const saveDrawing = async () => {
        const canvas = canvasRef.current;
        if (!canvas || userPoints.length < 5) return;

        setIsSubmitting(true);
        setFeedbackError(null);

        try {
            const imageData = canvas.toDataURL('image/png');
            const submissionId = await saveToDatabase(imageData);
            if (!submissionId) {
                throw new Error('Failed to save drawing');
            }

            // Track the saved drawing for batch marking
            setSavedDrawings(prev => {
                const newMap = new Map(prev);
                newMap.set(currentChallenge, submissionId);
                return newMap;
            });

            setSubmittedChallenges(prev => new Set([...prev, currentChallenge]));
            setSubmitStatus('saved');

            // Auto-advance to next question if not on the last one
            if (currentChallenge < challenges.length - 1) {
                setTimeout(() => {
                    nextChallenge();
                    setSubmitStatus(null);
                }, 800);
            }
        } catch (err) {
            console.error('Save error:', err);
            setFeedbackError(err.message || 'Failed to save drawing');
            setShowFeedbackModal(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Submit all saved drawings for batch AI marking
    const submitAllForMarking = async () => {
        if (savedDrawings.size === 0) return;

        // Confirm if submitting partial assessment
        if (savedDrawings.size < challenges.length) {
            const confirmed = window.confirm(
                `You have only saved ${savedDrawings.size} out of ${challenges.length} drawings. ` +
                `Unsaved questions will receive 0 marks. Do you want to continue?`
            );
            if (!confirmed) return;
        }

        setIsBatchMarking(true);
        setBatchMarkingProgress({ current: 0, total: savedDrawings.size });

        try {
            const submissionIds = Array.from(savedDrawings.values());

            // Call batch marking API
            const response = await fetch('/api/ai-mark-batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    submissionIds,
                    correctAnswerImages: {} // EQ assessment doesn't use correct answer images
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Batch marking failed');
            }

            const result = await response.json();

            setBatchResults(result.results || []);
            setBatchSummary(result.summary || { totalMark: 0, maxMark: savedDrawings.size, percentage: 0 });
            setShowBatchResults(true);
        } catch (err) {
            console.error('Batch marking error:', err);
            setFeedbackError(err.message || 'Failed to mark drawings');
            setShowFeedbackModal(true);
        } finally {
            setIsBatchMarking(false);
            setBatchMarkingProgress({ current: 0, total: 0 });
        }
    };

    // Handle reviewing a specific question from batch results
    const handleReviewQuestion = (challengeIndex, result) => {
        setCurrentChallenge(challengeIndex);
        setCurrentFeedback(result.feedback);
        setShowBatchResults(false);
        setShowFeedbackModal(true);
    };

    // Navigation
    const goToChallenge = (index) => {
        setCurrentChallenge(index);
        setUserPoints([]);
        setSubmitStatus(null);
    };

    const nextChallenge = () => {
        if (currentChallenge < challenges.length - 1) {
            goToChallenge(currentChallenge + 1);
        }
    };

    const prevChallenge = () => {
        if (currentChallenge > 0) {
            goToChallenge(currentChallenge - 1);
        }
    };

    // Feedback Modal Component
    const FeedbackModal = () => {
        if (!showFeedbackModal) return null;

        return (
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: spacing[4],
                }}
                onClick={() => setShowFeedbackModal(false)}
                role="dialog"
                aria-modal="true"
                aria-labelledby="feedback-title"
            >
                <div
                    style={{
                        background: t.bg.primary,
                        borderRadius: borderRadius['2xl'],
                        padding: spacing[8],
                        maxWidth: '500px',
                        width: '100%',
                        maxHeight: '80vh',
                        overflowY: 'auto',
                        boxShadow: t.shadow.xl,
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {feedbackError ? (
                        <>
                            <h2
                                id="feedback-title"
                                style={{
                                    color: t.accent.error,
                                    fontSize: typography.size.xl,
                                    fontWeight: typography.weight.bold,
                                    marginBottom: spacing[4],
                                }}
                            >
                                Submission Error
                            </h2>
                            <p style={{ color: t.text.secondary, marginBottom: spacing[6] }}>
                                {feedbackError}
                            </p>
                        </>
                    ) : currentFeedback ? (
                        <>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: spacing[3],
                                    marginBottom: spacing[4],
                                }}
                            >
                                <span style={{ fontSize: '2rem' }}>
                                    {currentFeedback.mark >= 8 ? '🌟' : currentFeedback.mark >= 5 ? '👍' : '📝'}
                                </span>
                                <div>
                                    <h2
                                        id="feedback-title"
                                        style={{
                                            color: t.text.primary,
                                            fontSize: typography.size.xl,
                                            fontWeight: typography.weight.bold,
                                        }}
                                    >
                                        {currentFeedback.mark}/10
                                    </h2>
                                    <p style={{ color: t.text.tertiary, fontSize: typography.size.sm }}>
                                        Challenge {currentChallenge + 1}: {currentChallengeData.name}
                                    </p>
                                </div>
                            </div>
                            <div
                                style={{
                                    background: t.bg.secondary,
                                    borderRadius: borderRadius.lg,
                                    padding: spacing[4],
                                    marginBottom: spacing[6],
                                }}
                            >
                                <p
                                    style={{
                                        color: t.text.secondary,
                                        lineHeight: typography.lineHeight.relaxed,
                                        whiteSpace: 'pre-wrap',
                                    }}
                                >
                                    {currentFeedback.feedback}
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <h2
                                id="feedback-title"
                                style={{
                                    color: t.accent.success,
                                    fontSize: typography.size.xl,
                                    fontWeight: typography.weight.bold,
                                    marginBottom: spacing[4],
                                }}
                            >
                                Submitted for Marking
                            </h2>
                            <p style={{ color: t.text.secondary, marginBottom: spacing[6] }}>
                                Your drawing has been submitted. Your teacher will review and provide feedback.
                            </p>
                        </>
                    )}
                    <button
                        onClick={() => setShowFeedbackModal(false)}
                        style={{
                            width: '100%',
                            padding: spacing[3],
                            background: t.accent.primary,
                            color: t.text.inverse,
                            border: 'none',
                            borderRadius: borderRadius.lg,
                            fontSize: typography.size.base,
                            fontWeight: typography.weight.semibold,
                            cursor: 'pointer',
                        }}
                    >
                        Continue
                    </button>
                </div>
            </div>
        );
    };

    // Start screen
    if (!hasStarted) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    background: t.bg.secondary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: spacing[8],
                    fontFamily: typography.fontFamily,
                }}
            >
                <main
                    style={{
                        background: t.bg.primary,
                        borderRadius: borderRadius['2xl'],
                        border: `1px solid ${t.border.subtle}`,
                        boxShadow: t.shadow.lg,
                        padding: spacing[10],
                        maxWidth: '500px',
                        width: '100%',
                    }}
                    role="main"
                    aria-labelledby="assessment-title"
                >
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: spacing[2],
                            background: t.accent.infoLight,
                            border: `1px solid ${t.accent.info}30`,
                            color: t.accent.info,
                            padding: `${spacing[1]} ${spacing[3]}`,
                            borderRadius: borderRadius.full,
                            fontSize: typography.size.xs,
                            fontWeight: typography.weight.semibold,
                            letterSpacing: typography.letterSpacing.wide,
                            textTransform: 'uppercase',
                            marginBottom: spacing[6],
                        }}
                    >
                        <span
                            style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: t.accent.info,
                            }}
                            aria-hidden="true"
                        />
                        1.11 EQ Assessment
                    </div>

                    <h1
                        id="assessment-title"
                        style={{
                            fontSize: typography.size['2xl'],
                            fontWeight: typography.weight.bold,
                            color: t.text.primary,
                            marginBottom: spacing[2],
                        }}
                    >
                        EQ Filter Drawing Assessment
                    </h1>

                    <p
                        style={{
                            color: t.text.secondary,
                            fontSize: typography.size.base,
                            lineHeight: typography.lineHeight.relaxed,
                            marginBottom: spacing[6],
                        }}
                    >
                        You will draw <strong style={{ color: t.text.primary }}>6 filter curves</strong> from memory.
                        After drawing each one, submit it for{' '}
                        <strong style={{ color: t.accent.primary }}>AI marking and feedback</strong>.
                    </p>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (studentName.trim()) setHasStarted(true);
                        }}
                    >
                        <div style={{ marginBottom: spacing[6] }}>
                            <label
                                htmlFor="student-name"
                                style={{
                                    display: 'block',
                                    color: t.text.primary,
                                    fontSize: typography.size.sm,
                                    marginBottom: spacing[2],
                                    fontWeight: typography.weight.medium,
                                }}
                            >
                                Your Name
                            </label>
                            <input
                                id="student-name"
                                type="text"
                                value={studentName}
                                onChange={(e) => setStudentName(e.target.value)}
                                onFocus={() => setIsInputFocused(true)}
                                onBlur={() => setIsInputFocused(false)}
                                placeholder="Enter your full name"
                                autoComplete="name"
                                required
                                style={{
                                    width: '100%',
                                    padding: spacing[4],
                                    background: t.bg.primary,
                                    border: `2px solid ${isInputFocused ? t.border.focus : t.border.medium}`,
                                    borderRadius: borderRadius.lg,
                                    color: t.text.primary,
                                    fontSize: typography.size.base,
                                    outline: 'none',
                                    transition: `border-color ${transitions.fast} ${transitions.easing}`,
                                    boxSizing: 'border-box',
                                }}
                            />
                        </div>

                        <div
                            style={{
                                background: t.bg.tertiary,
                                borderRadius: borderRadius.lg,
                                padding: spacing[4],
                                marginBottom: spacing[6],
                            }}
                        >
                            <div
                                style={{
                                    fontSize: typography.size.xs,
                                    color: t.accent.warning,
                                    fontWeight: typography.weight.semibold,
                                    marginBottom: spacing[2],
                                    textTransform: 'uppercase',
                                    letterSpacing: typography.letterSpacing.wide,
                                }}
                            >
                                Instructions
                            </div>
                            <ul
                                style={{
                                    color: t.text.secondary,
                                    fontSize: typography.size.sm,
                                    lineHeight: typography.lineHeight.relaxed,
                                    paddingLeft: spacing[5],
                                    margin: 0,
                                }}
                            >
                                <li>Draw the filter curve on the canvas</li>
                                <li>The frequency marker shows where to position your curve</li>
                                <li>Click "Submit" when finished for instant feedback</li>
                                <li>Complete all 6 challenges</li>
                            </ul>
                        </div>

                        <button
                            type="submit"
                            disabled={!studentName.trim()}
                            style={{
                                width: '100%',
                                padding: spacing[4],
                                background: studentName.trim() ? t.accent.primary : t.bg.tertiary,
                                border: 'none',
                                borderRadius: borderRadius.lg,
                                color: studentName.trim() ? t.text.inverse : t.text.tertiary,
                                fontSize: typography.size.base,
                                fontWeight: typography.weight.semibold,
                                cursor: studentName.trim() ? 'pointer' : 'not-allowed',
                                transition: `all ${transitions.fast} ${transitions.easing}`,
                            }}
                            aria-label="Start assessment"
                        >
                            Start Assessment
                        </button>
                    </form>
                </main>
            </div>
        );
    }

    // Main assessment interface
    return (
        <div
            style={{
                minHeight: '100vh',
                background: t.bg.secondary,
                padding: spacing[6],
                fontFamily: typography.fontFamily,
            }}
        >
            <FeedbackModal />

            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
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
                        <p
                            style={{
                                fontSize: typography.size.xs,
                                color: t.text.tertiary,
                                fontWeight: typography.weight.medium,
                                textTransform: 'uppercase',
                                letterSpacing: typography.letterSpacing.wide,
                                marginBottom: spacing[1],
                            }}
                        >
                            1.11 EQ Filter Drawing
                        </p>
                        <h1
                            style={{
                                fontSize: typography.size.xl,
                                fontWeight: typography.weight.bold,
                                color: t.text.primary,
                            }}
                        >
                            {studentName}
                        </h1>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing[2],
                        }}
                    >
                        <span style={{ color: t.text.tertiary, fontSize: typography.size.sm }}>Progress:</span>
                        <span
                            style={{
                                color: submittedChallenges.size === 6 ? t.accent.success : t.accent.primary,
                                fontWeight: typography.weight.semibold,
                                fontFamily: typography.fontFamilyMono,
                            }}
                        >
                            {submittedChallenges.size} / 6 submitted
                        </span>
                    </div>
                </header>

                {/* Challenge Navigation Pills */}
                <div
                    style={{
                        display: 'flex',
                        gap: spacing[2],
                        marginBottom: spacing[6],
                        flexWrap: 'wrap',
                    }}
                    role="tablist"
                    aria-label="Challenge navigation"
                >
                    {challenges.map((challenge, idx) => (
                        <button
                            key={idx}
                            onClick={() => goToChallenge(idx)}
                            role="tab"
                            aria-selected={currentChallenge === idx}
                            aria-label={`Challenge ${idx + 1}: ${challenge.name}${submittedChallenges.has(idx) ? ', submitted' : ''}`}
                            style={{
                                padding: `${spacing[2]} ${spacing[4]}`,
                                background: currentChallenge === idx
                                    ? t.accent.primary
                                    : submittedChallenges.has(idx)
                                        ? t.accent.successLight
                                        : completedChallenges.has(idx)
                                            ? t.bg.tertiary
                                            : t.bg.primary,
                                border: `1px solid ${
                                    currentChallenge === idx ? t.accent.primary :
                                    submittedChallenges.has(idx) ? t.accent.success :
                                    completedChallenges.has(idx) ? t.border.medium : t.border.subtle
                                }`,
                                borderRadius: borderRadius.lg,
                                color: currentChallenge === idx ? t.text.inverse :
                                       submittedChallenges.has(idx) ? t.accent.success : t.text.secondary,
                                cursor: 'pointer',
                                fontSize: typography.size.sm,
                                fontWeight: typography.weight.medium,
                                display: 'flex',
                                alignItems: 'center',
                                gap: spacing[1],
                                transition: `all ${transitions.fast} ${transitions.easing}`,
                            }}
                        >
                            {submittedChallenges.has(idx) && <span aria-hidden="true">✓</span>}
                            {idx + 1}
                        </button>
                    ))}
                </div>

                {/* Challenge Info Card */}
                <div
                    style={{
                        background: t.bg.primary,
                        borderRadius: borderRadius.xl,
                        padding: spacing[6],
                        marginBottom: spacing[6],
                        border: `1px solid ${t.border.subtle}`,
                        boxShadow: t.shadow.sm,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: spacing[4],
                            flexWrap: 'wrap',
                        }}
                    >
                        <div>
                            <p
                                style={{
                                    fontSize: typography.size.xs,
                                    color: t.text.tertiary,
                                    fontWeight: typography.weight.medium,
                                    textTransform: 'uppercase',
                                    letterSpacing: typography.letterSpacing.wide,
                                    marginBottom: spacing[2],
                                }}
                            >
                                Challenge {currentChallenge + 1} of 6
                            </p>
                            <h2
                                style={{
                                    fontSize: typography.size.xl,
                                    fontWeight: typography.weight.bold,
                                    color: t.text.primary,
                                    marginBottom: spacing[2],
                                }}
                            >
                                {currentChallengeData.description}
                            </h2>
                            <p
                                style={{
                                    color: t.accent.warning,
                                    fontSize: typography.size.sm,
                                    fontStyle: 'italic',
                                }}
                            >
                                {currentChallengeData.hint}
                            </p>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                gap: spacing[4],
                                flexWrap: 'wrap',
                            }}
                        >
                            <div style={{ textAlign: 'center' }}>
                                <p
                                    style={{
                                        fontSize: typography.size.xs,
                                        color: t.text.tertiary,
                                        textTransform: 'uppercase',
                                        marginBottom: spacing[1],
                                    }}
                                >
                                    Frequency
                                </p>
                                <p
                                    style={{
                                        fontSize: typography.size.lg,
                                        fontWeight: typography.weight.bold,
                                        color: t.accent.primary,
                                        fontFamily: typography.fontFamilyMono,
                                    }}
                                >
                                    {currentChallengeData.frequency >= 1000
                                        ? `${currentChallengeData.frequency / 1000}kHz`
                                        : `${currentChallengeData.frequency}Hz`
                                    }
                                </p>
                            </div>
                            {currentChallengeData.gain !== undefined && (
                                <div style={{ textAlign: 'center' }}>
                                    <p
                                        style={{
                                            fontSize: typography.size.xs,
                                            color: t.text.tertiary,
                                            textTransform: 'uppercase',
                                            marginBottom: spacing[1],
                                        }}
                                    >
                                        Gain
                                    </p>
                                    <p
                                        style={{
                                            fontSize: typography.size.lg,
                                            fontWeight: typography.weight.bold,
                                            color: '#a855f7',
                                            fontFamily: typography.fontFamilyMono,
                                        }}
                                    >
                                        {currentChallengeData.gain > 0 ? '+' : ''}{currentChallengeData.gain}dB
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Canvas */}
                <div
                    style={{
                        background: t.bg.primary,
                        borderRadius: borderRadius.xl,
                        padding: spacing[4],
                        marginBottom: spacing[4],
                        border: `1px solid ${t.border.subtle}`,
                        boxShadow: t.shadow.sm,
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        width={canvasWidth}
                        height={canvasHeight}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseLeave}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        style={{
                            display: 'block',
                            width: '100%',
                            maxWidth: `${canvasWidth}px`,
                            margin: '0 auto',
                            cursor: 'crosshair',
                            borderRadius: borderRadius.lg,
                            touchAction: 'none',
                        }}
                        aria-label={`Drawing canvas for ${currentChallengeData.name}. Draw your filter curve here.`}
                        role="img"
                    />
                </div>

                {/* Controls */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: spacing[4],
                        flexWrap: 'wrap',
                    }}
                >
                    <div style={{ display: 'flex', gap: spacing[3] }}>
                        <button
                            onClick={clearDrawing}
                            style={{
                                padding: `${spacing[3]} ${spacing[5]}`,
                                background: t.bg.primary,
                                border: `1px solid ${t.border.medium}`,
                                borderRadius: borderRadius.lg,
                                color: t.text.secondary,
                                cursor: 'pointer',
                                fontSize: typography.size.sm,
                                fontWeight: typography.weight.medium,
                                transition: `all ${transitions.fast} ${transitions.easing}`,
                            }}
                            aria-label="Clear drawing"
                        >
                            Clear Drawing
                        </button>
                        <button
                            onClick={saveDrawing}
                            disabled={userPoints.length < 5 || isSubmitting}
                            style={{
                                padding: `${spacing[3]} ${spacing[6]}`,
                                background: userPoints.length >= 5
                                    ? savedDrawings.has(currentChallenge)
                                        ? t.accent.success
                                        : t.accent.primary
                                    : t.bg.tertiary,
                                border: 'none',
                                borderRadius: borderRadius.lg,
                                color: userPoints.length >= 5 ? t.text.inverse : t.text.tertiary,
                                cursor: userPoints.length >= 5 && !isSubmitting ? 'pointer' : 'not-allowed',
                                fontSize: typography.size.sm,
                                fontWeight: typography.weight.semibold,
                                display: 'flex',
                                alignItems: 'center',
                                gap: spacing[2],
                                transition: `all ${transitions.fast} ${transitions.easing}`,
                            }}
                            aria-label={isSubmitting ? 'Saving...' : 'Save drawing'}
                        >
                            {isSubmitting ? (
                                <>Saving...</>
                            ) : savedDrawings.has(currentChallenge) ? (
                                <>Saved</>
                            ) : (
                                <>Save</>
                            )}
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: spacing[3] }}>
                        <button
                            onClick={prevChallenge}
                            disabled={currentChallenge === 0}
                            style={{
                                padding: `${spacing[3]} ${spacing[5]}`,
                                background: currentChallenge > 0 ? t.bg.primary : t.bg.tertiary,
                                border: `1px solid ${t.border.medium}`,
                                borderRadius: borderRadius.lg,
                                color: currentChallenge > 0 ? t.text.secondary : t.text.tertiary,
                                cursor: currentChallenge > 0 ? 'pointer' : 'not-allowed',
                                fontSize: typography.size.sm,
                                fontWeight: typography.weight.medium,
                                transition: `all ${transitions.fast} ${transitions.easing}`,
                            }}
                            aria-label="Previous challenge"
                        >
                            <span aria-hidden="true">←</span> Previous
                        </button>
                        <button
                            onClick={nextChallenge}
                            disabled={currentChallenge === challenges.length - 1}
                            style={{
                                padding: `${spacing[3]} ${spacing[5]}`,
                                background: currentChallenge < challenges.length - 1 ? t.bg.primary : t.bg.tertiary,
                                border: `1px solid ${t.border.medium}`,
                                borderRadius: borderRadius.lg,
                                color: currentChallenge < challenges.length - 1 ? t.text.secondary : t.text.tertiary,
                                cursor: currentChallenge < challenges.length - 1 ? 'pointer' : 'not-allowed',
                                fontSize: typography.size.sm,
                                fontWeight: typography.weight.medium,
                                transition: `all ${transitions.fast} ${transitions.easing}`,
                            }}
                            aria-label="Next challenge"
                        >
                            Next <span aria-hidden="true">→</span>
                        </button>
                    </div>
                </div>

                {/* Submit All for Marking section */}
                {savedDrawings.size > 0 && (
                    <div
                        style={{
                            marginTop: spacing[8],
                            background: savedDrawings.size === challenges.length
                                ? t.accent.successLight
                                : `${t.accent.primary}10`,
                            border: `1px solid ${savedDrawings.size === challenges.length
                                ? t.accent.success
                                : t.accent.primary}40`,
                            borderRadius: borderRadius.xl,
                            padding: spacing[6],
                            textAlign: 'center',
                        }}
                        role="status"
                    >
                        <div
                            style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                background: savedDrawings.size === challenges.length
                                    ? `${t.accent.success}20`
                                    : `${t.accent.primary}20`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto',
                                marginBottom: spacing[4],
                                fontSize: '1.5rem',
                                color: savedDrawings.size === challenges.length
                                    ? t.accent.success
                                    : t.accent.primary,
                            }}
                        >
                            {savedDrawings.size === challenges.length ? '✓' : savedDrawings.size}
                        </div>
                        <h3
                            style={{
                                color: savedDrawings.size === challenges.length
                                    ? t.accent.success
                                    : t.accent.primary,
                                fontSize: typography.size.lg,
                                fontWeight: typography.weight.bold,
                                marginBottom: spacing[2],
                            }}
                        >
                            {savedDrawings.size === challenges.length
                                ? 'All Drawings Saved!'
                                : `${savedDrawings.size} of ${challenges.length} Drawings Saved`}
                        </h3>
                        <p style={{ color: t.text.secondary, marginBottom: spacing[4] }}>
                            {savedDrawings.size === challenges.length
                                ? 'Ready to submit for AI marking'
                                : 'Save more drawings or submit now for partial marking'}
                        </p>
                        <button
                            onClick={submitAllForMarking}
                            disabled={isBatchMarking}
                            style={{
                                padding: `${spacing[4]} ${spacing[8]}`,
                                borderRadius: borderRadius.lg,
                                border: 'none',
                                background: savedDrawings.size === challenges.length
                                    ? t.accent.success
                                    : t.accent.primary,
                                color: t.text.inverse,
                                fontSize: typography.size.base,
                                fontWeight: typography.weight.bold,
                                cursor: isBatchMarking ? 'not-allowed' : 'pointer',
                                boxShadow: t.shadow.md,
                                transition: `all ${transitions.fast} ${transitions.easing}`,
                            }}
                        >
                            Submit All for Marking ({savedDrawings.size}/{challenges.length})
                        </button>
                    </div>
                )}

                {/* Batch Marking Progress Modal */}
                <BatchMarkingProgress
                    currentQuestion={batchMarkingProgress.current}
                    totalQuestions={batchMarkingProgress.total}
                    isVisible={isBatchMarking}
                />

                {/* Batch Results Summary Modal */}
                <BatchResultsSummary
                    results={batchResults}
                    summary={batchSummary}
                    onReviewQuestion={handleReviewQuestion}
                    onClose={() => setShowBatchResults(false)}
                    isVisible={showBatchResults}
                />
            </div>
        </div>
    );
};

export default EQFilterAssessment;

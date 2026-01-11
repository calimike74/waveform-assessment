'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { theme as designTheme, typography, borderRadius, spacing, transitions, assessmentColors } from '@/lib/theme';

// ============================================
// OCTAVE WAVEFORM DRAWING ASSESSMENT
// Educational Light Theme with Dark Canvas
// 10 Challenges - Submissions saved for marking
// ============================================

const WaveformAssessment = ({ initialName = '' }) => {
    const [studentName, setStudentName] = useState(initialName);
    const [hasStarted, setHasStarted] = useState(!!initialName);
    const [currentChallenge, setCurrentChallenge] = useState(0);
    const [completedChallenges, setCompletedChallenges] = useState(new Set());
    const [copiedChallenges, setCopiedChallenges] = useState(new Set());
    const [isInputFocused, setIsInputFocused] = useState(false);

    // Canvas state
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [userPoints, setUserPoints] = useState([]);
    const [copyStatus, setCopyStatus] = useState(null);
    const [showCopyModal, setShowCopyModal] = useState(false);
    const [modalImageUrl, setModalImageUrl] = useState(null);

    // AI Feedback state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [currentFeedback, setCurrentFeedback] = useState(null);
    const [feedbackError, setFeedbackError] = useState(null);

    const canvasWidth = 700;
    const canvasHeight = 350;
    const padding = { top: 50, right: 50, bottom: 60, left: 70 };

    // Use the educational light theme
    const t = designTheme.light;

    // Canvas-specific colors (darker for waveform visibility)
    const canvasTheme = {
        bg: '#1a1a2e',
        bgGraph: '#16213e',
        grid: 'rgba(255, 255, 255, 0.06)',
        centerLine: 'rgba(255, 255, 255, 0.25)',
        text: '#f0f0f0',
        textSecondary: '#94a3b8',
        userLine: '#60a5fa',
        originalLine: 'rgba(148, 163, 184, 0.5)',
    };

    // Waveform shape definitions
    const waveformShapes = {
        sine: {
            name: 'Sine',
            draw: (progress, cycles) => Math.sin(progress * cycles * 2 * Math.PI)
        },
        square: {
            name: 'Square',
            draw: (progress, cycles) => Math.sign(Math.sin(progress * cycles * 2 * Math.PI))
        },
        saw: {
            name: 'Saw',
            draw: (progress, cycles) => {
                const phase = (progress * cycles) % 1;
                return 2 * phase - 1;
            }
        },
        triangle: {
            name: 'Triangle',
            draw: (progress, cycles) => {
                const phase = (progress * cycles) % 1;
                return 4 * Math.abs(phase - 0.5) - 1;
            }
        }
    };

    // Difficulty/type colors
    const challengeColors = {
        green: t.accent.success,
        amber: t.accent.warning,
        cyan: t.accent.info,
        purple: '#8B5CF6',
        red: t.accent.error,
    };

    // The 10 assessment challenges
    const challenges = [
        {
            id: 1,
            name: 'Sine → Sine (Octave Lower)',
            originalCycles: 4,
            targetCycles: 2,
            originalShape: 'sine',
            targetShape: 'sine',
            direction: 'lower',
            octaves: 1,
            description: 'Draw a SINE wave ONE OCTAVE LOWER',
            hint: 'Same shape, but period doubles → half as many cycles.',
            colorKey: 'green'
        },
        {
            id: 2,
            name: 'Square → Square (Octave Higher)',
            originalCycles: 2,
            targetCycles: 4,
            originalShape: 'square',
            targetShape: 'square',
            direction: 'higher',
            octaves: 1,
            description: 'Draw a SQUARE wave ONE OCTAVE HIGHER',
            hint: 'Same shape, but period halves → twice as many cycles.',
            colorKey: 'amber'
        },
        {
            id: 3,
            name: 'Square → Saw (Octave Lower)',
            originalCycles: 4,
            targetCycles: 2,
            originalShape: 'square',
            targetShape: 'saw',
            direction: 'lower',
            octaves: 1,
            description: 'Draw a SAW wave ONE OCTAVE LOWER',
            hint: '2023 Exam Style! Change shape AND double the period.',
            colorKey: 'cyan',
            examStyle: true
        },
        {
            id: 4,
            name: 'Triangle → Triangle (Octave Lower)',
            originalCycles: 6,
            targetCycles: 3,
            originalShape: 'triangle',
            targetShape: 'triangle',
            direction: 'lower',
            octaves: 1,
            description: 'Draw a TRIANGLE wave ONE OCTAVE LOWER',
            hint: 'Same shape. 6 cycles → 3 cycles.',
            colorKey: 'green'
        },
        {
            id: 5,
            name: 'Sine → Square (Octave Higher)',
            originalCycles: 3,
            targetCycles: 6,
            originalShape: 'sine',
            targetShape: 'square',
            direction: 'higher',
            octaves: 1,
            description: 'Draw a SQUARE wave ONE OCTAVE HIGHER',
            hint: 'Change to square wave AND double the cycles.',
            colorKey: 'amber',
            examStyle: true
        },
        {
            id: 6,
            name: 'Saw → Saw (Two Octaves Lower)',
            originalCycles: 8,
            targetCycles: 2,
            originalShape: 'saw',
            targetShape: 'saw',
            direction: 'lower',
            octaves: 2,
            description: 'Draw a SAW wave TWO OCTAVES LOWER',
            hint: 'Two octaves = ÷4 cycles. 8 → 2 cycles.',
            colorKey: 'purple'
        },
        {
            id: 7,
            name: 'Triangle → Sine (Octave Lower)',
            originalCycles: 4,
            targetCycles: 2,
            originalShape: 'triangle',
            targetShape: 'sine',
            direction: 'lower',
            octaves: 1,
            description: 'Draw a SINE wave ONE OCTAVE LOWER',
            hint: 'Change shape from triangle to sine, and double the period.',
            colorKey: 'cyan',
            examStyle: true
        },
        {
            id: 8,
            name: 'Square → Triangle (Two Octaves Higher)',
            originalCycles: 2,
            targetCycles: 8,
            originalShape: 'square',
            targetShape: 'triangle',
            direction: 'higher',
            octaves: 2,
            description: 'Draw a TRIANGLE wave TWO OCTAVES HIGHER',
            hint: 'Change to triangle AND multiply cycles by 4.',
            colorKey: 'red',
            examStyle: true
        },
        {
            id: 9,
            name: 'Saw → Square (Octave Higher)',
            originalCycles: 4,
            targetCycles: 8,
            originalShape: 'saw',
            targetShape: 'square',
            direction: 'higher',
            octaves: 1,
            description: 'Draw a SQUARE wave ONE OCTAVE HIGHER',
            hint: 'Change shape from saw to square, period halves.',
            colorKey: 'amber',
            examStyle: true
        },
        {
            id: 10,
            name: 'Sine → Sine (Octave Higher)',
            originalCycles: 3,
            targetCycles: 6,
            originalShape: 'sine',
            targetShape: 'sine',
            direction: 'higher',
            octaves: 1,
            description: 'Draw a SINE wave ONE OCTAVE HIGHER',
            hint: 'Same shape. 3 cycles → 6 cycles.',
            colorKey: 'amber'
        }
    ];

    const currentChallengeData = challenges[currentChallenge];
    const getChallengeColor = (colorKey) => challengeColors[colorKey] || t.accent.primary;

    // Generate correct answer image for AI comparison
    const generateCorrectAnswerImage = useCallback((challenge) => {
        if (!challenge) return null;

        const canvas = document.createElement('canvas');
        const width = 700;
        const height = 350;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        const pad = { top: 50, right: 50, bottom: 60, left: 70 };
        const graphWidth = width - pad.left - pad.right;
        const graphHeight = height - pad.top - pad.bottom;

        // Background
        ctx.fillStyle = canvasTheme.bg;
        ctx.fillRect(0, 0, width, height);

        // Graph background
        ctx.fillStyle = canvasTheme.bgGraph;
        ctx.fillRect(pad.left, pad.top, graphWidth, graphHeight);

        // Grid lines
        ctx.strokeStyle = canvasTheme.grid;
        ctx.lineWidth = 1;

        for (let i = 0; i <= 10; i++) {
            const x = pad.left + (graphWidth / 10) * i;
            ctx.beginPath();
            ctx.moveTo(x, pad.top);
            ctx.lineTo(x, pad.top + graphHeight);
            ctx.stroke();
        }

        for (let i = 0; i <= 4; i++) {
            const y = pad.top + (graphHeight / 4) * i;
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(pad.left + graphWidth, y);
            ctx.stroke();
        }

        // Center line
        ctx.strokeStyle = canvasTheme.centerLine;
        ctx.lineWidth = 2;
        const centerY = pad.top + graphHeight / 2;
        ctx.beginPath();
        ctx.moveTo(pad.left, centerY);
        ctx.lineTo(pad.left + graphWidth, centerY);
        ctx.stroke();

        // Draw original waveform (dashed gray)
        const originalShape = waveformShapes[challenge.originalShape];
        if (originalShape) {
            ctx.strokeStyle = canvasTheme.originalLine;
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 8]);
            ctx.beginPath();

            for (let i = 0; i <= graphWidth; i++) {
                const progress = i / graphWidth;
                const value = originalShape.draw(progress, challenge.originalCycles);
                const x = pad.left + i;
                const y = centerY - (value * graphHeight * 0.4);

                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Draw correct answer (solid green)
        const targetShape = waveformShapes[challenge.targetShape];
        if (targetShape) {
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 3;
            ctx.beginPath();

            for (let i = 0; i <= graphWidth; i++) {
                const progress = i / graphWidth;
                const value = targetShape.draw(progress, challenge.targetCycles);
                const x = pad.left + i;
                const y = centerY - (value * graphHeight * 0.4);

                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        // Labels
        ctx.fillStyle = canvasTheme.text;
        ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(`Original: ${challenge.originalShape} (${challenge.originalCycles} cycles)`, pad.left, 25);

        ctx.fillStyle = '#10b981';
        ctx.fillText(`Correct: ${challenge.targetShape} (${challenge.targetCycles} cycles)`, pad.left + 300, 25);

        return canvas.toDataURL('image/png');
    }, [waveformShapes, canvasTheme]);

    // Draw the waveform grid and reference
    const drawGrid = useCallback((ctx) => {
        const innerWidth = canvasWidth - padding.left - padding.right;
        const innerHeight = canvasHeight - padding.top - padding.bottom;

        // Background
        ctx.fillStyle = canvasTheme.bg;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Graph area
        ctx.fillStyle = canvasTheme.bgGraph;
        ctx.fillRect(padding.left, padding.top, innerWidth, innerHeight);

        // Vertical grid lines
        for (let i = 0; i <= 8; i++) {
            const x = padding.left + (i / 8) * innerWidth;
            ctx.strokeStyle = canvasTheme.grid;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, padding.top);
            ctx.lineTo(x, canvasHeight - padding.bottom);
            ctx.stroke();
        }

        // Horizontal grid lines
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (i / 4) * innerHeight;
            if (i === 2) {
                ctx.strokeStyle = canvasTheme.centerLine;
                ctx.lineWidth = 1.5;
            } else {
                ctx.strokeStyle = canvasTheme.grid;
                ctx.lineWidth = 1;
            }
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(canvasWidth - padding.right, y);
            ctx.stroke();
        }

        // Axes border
        ctx.strokeStyle = 'rgba(96, 165, 250, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top);
        ctx.lineTo(padding.left, canvasHeight - padding.bottom);
        ctx.lineTo(canvasWidth - padding.right, canvasHeight - padding.bottom);
        ctx.stroke();

        // X-axis label
        ctx.fillStyle = canvasTheme.textSecondary;
        ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Time', canvasWidth / 2, canvasHeight - 12);

        // Y-axis label
        ctx.save();
        ctx.translate(16, canvasHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Amplitude', 0, 0);
        ctx.restore();

        // Draw ORIGINAL waveform as dashed reference
        if (currentChallengeData) {
            const midY = padding.top + innerHeight / 2;
            const amplitude = innerHeight * 0.35;
            const shapeFunc = waveformShapes[currentChallengeData.originalShape]?.draw || waveformShapes.sine.draw;
            const shapeName = waveformShapes[currentChallengeData.originalShape]?.name || 'Sine';

            ctx.strokeStyle = canvasTheme.originalLine;
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();

            for (let i = 0; i <= innerWidth; i++) {
                const x = padding.left + i;
                const progress = i / innerWidth;
                const y = midY - shapeFunc(progress, currentChallengeData.originalCycles) * amplitude;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = canvasTheme.textSecondary;
            ctx.font = '10px ui-monospace, monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`Original: ${shapeName}`, padding.left + 8, padding.top + 18);
        }

        // Header with challenge info
        ctx.fillStyle = canvasTheme.text;
        ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Challenge ${currentChallenge + 1}: ${currentChallengeData?.name || ''}`, padding.left, 25);

        ctx.fillStyle = canvasTheme.textSecondary;
        ctx.font = '11px -apple-system, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(studentName || 'Student Name', canvasWidth - padding.right, 25);

        // Target shape badge
        if (currentChallengeData) {
            const targetShapeName = waveformShapes[currentChallengeData.targetShape]?.name || 'Sine';
            const badgeText = `Draw: ${targetShapeName}`;
            ctx.font = 'bold 10px ui-monospace, monospace';
            const badgeWidth = ctx.measureText(badgeText).width + 16;
            const badgeX = canvasWidth - padding.right - badgeWidth;
            const color = getChallengeColor(currentChallengeData.colorKey);

            ctx.fillStyle = color + '30';
            ctx.beginPath();
            ctx.roundRect(badgeX, padding.top + 8, badgeWidth, 24, 4);
            ctx.fill();

            ctx.fillStyle = color;
            ctx.textAlign = 'center';
            ctx.fillText(badgeText, badgeX + badgeWidth/2, padding.top + 24);
        }
    }, [currentChallengeData, currentChallenge, studentName, canvasTheme, waveformShapes, getChallengeColor]);

    // Draw user's line
    const drawUserLine = useCallback((ctx) => {
        if (userPoints.length < 2) return;

        ctx.strokeStyle = canvasTheme.userLine;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = canvasTheme.userLine;
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.moveTo(userPoints[0].x, userPoints[0].y);
        for (let i = 1; i < userPoints.length; i++) {
            ctx.lineTo(userPoints[i].x, userPoints[i].y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
    }, [userPoints, canvasTheme]);

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
            setCopyStatus(null);
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

    // Touch event handlers
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
            setCopyStatus(null);
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
        setCopyStatus(null);
        setCompletedChallenges(prev => {
            const newSet = new Set(prev);
            newSet.delete(currentChallenge);
            return newSet;
        });
    };

    // Save drawing to Supabase
    const saveToDatabase = async (imageData) => {
        try {
            const { data, error } = await supabase
                .from('submissions')
                .insert({
                    assessment_id: 'waveform-octaves',
                    student_name: studentName,
                    challenge_number: currentChallenge + 1,
                    original_shape: currentChallengeData.originalShape,
                    target_shape: currentChallengeData.targetShape,
                    direction: currentChallengeData.direction,
                    octaves: currentChallengeData.octaves,
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
    const requestAIMarking = async (submissionId, correctAnswerImage) => {
        try {
            const response = await fetch('/api/ai-mark', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ submissionId, correctAnswerImage }),
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

    // Submit drawing with AI feedback
    const submitDrawing = async () => {
        const canvas = canvasRef.current;
        if (!canvas || userPoints.length < 5) return;

        setIsSubmitting(true);
        setFeedbackError(null);

        try {
            const imageData = canvas.toDataURL('image/png');
            const submissionId = await saveToDatabase(imageData);
            if (!submissionId) {
                throw new Error('Failed to save submission');
            }

            const correctAnswerImage = generateCorrectAnswerImage(currentChallengeData);
            const feedback = await requestAIMarking(submissionId, correctAnswerImage);

            setCurrentFeedback(feedback);
            setShowFeedbackModal(true);
            setCopiedChallenges(prev => new Set([...prev, currentChallenge]));
            setCopyStatus('copied');
        } catch (err) {
            console.error('Submission error:', err);
            setFeedbackError(err.message || 'Submission failed');
            setShowFeedbackModal(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Copy to clipboard
    const copyToClipboard = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const imageData = canvas.toDataURL('image/png');

        try {
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            setCopyStatus('copied');
            setCopiedChallenges(prev => new Set([...prev, currentChallenge]));
            saveToDatabase(imageData);
            setTimeout(() => setCopyStatus(null), 3000);
        } catch (err) {
            console.error('Clipboard copy failed:', err);
            setModalImageUrl(imageData);
            setShowCopyModal(true);
        }
    };

    const handleModalCopied = () => {
        if (modalImageUrl) {
            saveToDatabase(modalImageUrl);
        }
        setShowCopyModal(false);
        setModalImageUrl(null);
        setCopyStatus('copied');
        setCopiedChallenges(prev => new Set([...prev, currentChallenge]));
        setTimeout(() => setCopyStatus(null), 3000);
    };

    const handleModalClose = () => {
        setShowCopyModal(false);
        setModalImageUrl(null);
    };

    // Navigation
    const goToChallenge = (index) => {
        setCurrentChallenge(index);
        setUserPoints([]);
        setCopyStatus(null);
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
                        maxWidth: '480px',
                        width: '100%',
                    }}
                    role="main"
                    aria-labelledby="assessment-title"
                >
                    {/* Badge */}
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: spacing[2],
                            background: `${challengeColors.purple}15`,
                            border: `1px solid ${challengeColors.purple}40`,
                            color: challengeColors.purple,
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
                                background: challengeColors.purple,
                            }}
                            aria-hidden="true"
                        />
                        2.5 Numeracy
                    </div>

                    <h1
                        id="assessment-title"
                        style={{
                            fontSize: typography.size['3xl'],
                            fontWeight: typography.weight.bold,
                            color: t.text.primary,
                            marginBottom: spacing[2],
                            letterSpacing: typography.letterSpacing.tight,
                            lineHeight: typography.lineHeight.tight,
                        }}
                    >
                        Octave Waveform Drawing
                    </h1>

                    <p
                        style={{
                            color: t.text.secondary,
                            fontSize: typography.size.base,
                            lineHeight: typography.lineHeight.relaxed,
                            marginBottom: spacing[8],
                        }}
                    >
                        You'll see an original waveform. Draw what it would look like at a{' '}
                        <strong style={{ color: t.text.primary }}>different octave</strong>.
                        Each drawing will be{' '}
                        <strong style={{ color: t.accent.primary }}>submitted for marking</strong>.
                    </p>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (studentName.trim()) {
                                setHasStarted(true);
                            }
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
                                    lineHeight: typography.lineHeight.normal,
                                    outline: 'none',
                                    transition: `border-color ${transitions.fast} ${transitions.easing}, box-shadow ${transitions.fast} ${transitions.easing}`,
                                    boxShadow: isInputFocused ? `0 0 0 3px ${t.accent.primary}20` : 'none',
                                    boxSizing: 'border-box',
                                }}
                            />
                        </div>

                        {/* Instructions */}
                        <div
                            style={{
                                background: t.bg.tertiary,
                                borderRadius: borderRadius.lg,
                                padding: spacing[4],
                                marginBottom: spacing[6],
                                border: `1px solid ${t.border.subtle}`,
                            }}
                        >
                            <div
                                style={{
                                    fontSize: typography.size.xs,
                                    color: t.accent.info,
                                    fontWeight: typography.weight.semibold,
                                    marginBottom: spacing[3],
                                    letterSpacing: typography.letterSpacing.wide,
                                    textTransform: 'uppercase',
                                }}
                            >
                                Instructions
                            </div>
                            <ol
                                style={{
                                    color: t.text.secondary,
                                    fontSize: typography.size.sm,
                                    lineHeight: typography.lineHeight.loose,
                                    paddingLeft: spacing[5],
                                    margin: 0,
                                }}
                            >
                                <li>Look at the dashed <strong style={{ color: t.text.primary }}>original</strong> waveform</li>
                                <li>Draw the <strong style={{ color: t.text.primary }}>transposed</strong> waveform</li>
                                <li>Click <strong style={{ color: t.text.primary }}>"Submit"</strong> to submit for marking</li>
                                <li>Complete all <strong style={{ color: t.text.primary }}>10 challenges</strong></li>
                            </ol>
                        </div>

                        <button
                            type="submit"
                            disabled={!studentName.trim()}
                            style={{
                                width: '100%',
                                padding: spacing[4],
                                borderRadius: borderRadius.lg,
                                border: 'none',
                                fontSize: typography.size.base,
                                fontWeight: typography.weight.semibold,
                                cursor: studentName.trim() ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: spacing[2],
                                background: studentName.trim() ? t.accent.primary : t.bg.tertiary,
                                color: studentName.trim() ? t.text.inverse : t.text.tertiary,
                                transition: `all ${transitions.fast} ${transitions.easing}`,
                                boxShadow: studentName.trim() ? t.shadow.md : 'none',
                            }}
                            onMouseEnter={(e) => {
                                if (studentName.trim()) {
                                    e.currentTarget.style.background = t.accent.primaryHover;
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (studentName.trim()) {
                                    e.currentTarget.style.background = t.accent.primary;
                                    e.currentTarget.style.transform = 'none';
                                }
                            }}
                            aria-label="Start the assessment"
                        >
                            Start Assessment
                            <span aria-hidden="true" style={{ fontSize: '1.2rem' }}>→</span>
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
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                {/* Header */}
                <header
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: spacing[5],
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
                            Octave Waveform Drawing Assessment
                        </p>
                        <h1
                            style={{
                                fontSize: typography.size['xl'],
                                fontWeight: typography.weight.bold,
                                color: t.text.primary,
                                lineHeight: typography.lineHeight.tight,
                            }}
                        >
                            {studentName}
                        </h1>
                    </div>

                    {/* Progress */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing[3],
                            background: t.bg.primary,
                            padding: `${spacing[2]} ${spacing[4]}`,
                            borderRadius: borderRadius.lg,
                            border: `1px solid ${t.border.subtle}`,
                            boxShadow: t.shadow.sm,
                        }}
                        role="region"
                        aria-label="Progress"
                    >
                        <span style={{ color: t.text.tertiary, fontSize: typography.size.sm }}>Progress</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {challenges.map((_, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: copiedChallenges.has(idx)
                                            ? t.accent.success
                                            : completedChallenges.has(idx)
                                                ? t.accent.warning
                                                : t.bg.tertiary,
                                        transition: `all ${transitions.normal} ${transitions.easing}`,
                                    }}
                                    aria-label={copiedChallenges.has(idx) ? 'Submitted' : completedChallenges.has(idx) ? 'Drawn' : 'Not started'}
                                />
                            ))}
                        </div>
                        <span
                            style={{
                                color: copiedChallenges.size === 10 ? t.accent.success : t.accent.primary,
                                fontWeight: typography.weight.semibold,
                                fontFamily: typography.fontFamilyMono,
                                fontSize: typography.size.sm,
                            }}
                        >
                            {copiedChallenges.size}/10
                        </span>
                    </div>
                </header>

                {/* Challenge selector */}
                <div
                    style={{
                        display: 'flex',
                        gap: spacing[2],
                        marginBottom: spacing[5],
                        flexWrap: 'wrap',
                    }}
                    role="tablist"
                    aria-label="Challenge selector"
                >
                    {challenges.map((challenge, idx) => (
                        <button
                            key={idx}
                            onClick={() => goToChallenge(idx)}
                            role="tab"
                            aria-selected={currentChallenge === idx}
                            aria-label={`Challenge ${idx + 1}${copiedChallenges.has(idx) ? ', submitted' : ''}`}
                            style={{
                                padding: `${spacing[2]} ${spacing[4]}`,
                                borderRadius: borderRadius.md,
                                border: `1px solid ${
                                    currentChallenge === idx ? t.accent.primary :
                                    copiedChallenges.has(idx) ? t.accent.success + '60' :
                                    completedChallenges.has(idx) ? t.accent.warning + '40' :
                                    t.border.subtle
                                }`,
                                background: currentChallenge === idx
                                    ? `${t.accent.primary}10`
                                    : copiedChallenges.has(idx)
                                        ? `${t.accent.success}10`
                                        : t.bg.primary,
                                color: currentChallenge === idx
                                    ? t.accent.primary
                                    : copiedChallenges.has(idx)
                                        ? t.accent.success
                                        : t.text.secondary,
                                cursor: 'pointer',
                                fontSize: typography.size.sm,
                                fontWeight: typography.weight.medium,
                                display: 'flex',
                                alignItems: 'center',
                                gap: spacing[1],
                                transition: `all ${transitions.fast} ${transitions.easing}`,
                            }}
                        >
                            {copiedChallenges.has(idx) && (
                                <span style={{ fontSize: '0.9rem' }} aria-hidden="true">✓</span>
                            )}
                            {idx + 1}
                        </button>
                    ))}
                </div>

                {/* Challenge info panel */}
                <div
                    style={{
                        background: t.bg.primary,
                        borderRadius: borderRadius.xl,
                        padding: spacing[5],
                        marginBottom: spacing[5],
                        border: `1px solid ${t.border.subtle}`,
                        boxShadow: t.shadow.sm,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: spacing[6],
                            flexWrap: 'wrap',
                        }}
                    >
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], marginBottom: spacing[2] }}>
                                <span
                                    style={{
                                        fontSize: typography.size.xs,
                                        color: t.text.tertiary,
                                        fontWeight: typography.weight.medium,
                                        textTransform: 'uppercase',
                                        letterSpacing: typography.letterSpacing.wide,
                                    }}
                                >
                                    Challenge {currentChallenge + 1} of 10
                                </span>
                                {currentChallengeData.examStyle && (
                                    <span
                                        style={{
                                            background: `${t.accent.error}15`,
                                            border: `1px solid ${t.accent.error}40`,
                                            color: t.accent.error,
                                            padding: `${spacing[0.5]} ${spacing[2]}`,
                                            borderRadius: borderRadius.sm,
                                            fontSize: typography.size.xs,
                                            fontWeight: typography.weight.bold,
                                            letterSpacing: typography.letterSpacing.wide,
                                        }}
                                    >
                                        EXAM STYLE
                                    </span>
                                )}
                            </div>
                            <h2
                                style={{
                                    fontSize: typography.size['xl'],
                                    fontWeight: typography.weight.semibold,
                                    color: t.text.primary,
                                    marginBottom: spacing[2],
                                    lineHeight: typography.lineHeight.tight,
                                }}
                            >
                                {currentChallengeData.description}
                            </h2>
                        </div>

                        {/* Challenge details */}
                        <div style={{ display: 'flex', gap: spacing[3], flexWrap: 'wrap' }}>
                            <div
                                style={{
                                    background: t.bg.tertiary,
                                    borderRadius: borderRadius.lg,
                                    padding: spacing[3],
                                    border: `1px solid ${t.border.subtle}`,
                                    textAlign: 'center',
                                    minWidth: '80px',
                                }}
                            >
                                <div style={{ fontSize: typography.size.xs, color: t.text.tertiary, textTransform: 'uppercase', letterSpacing: typography.letterSpacing.wide, marginBottom: spacing[1] }}>
                                    Original
                                </div>
                                <div style={{ fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: t.text.secondary, fontFamily: typography.fontFamilyMono }}>
                                    {waveformShapes[currentChallengeData.originalShape]?.name}
                                </div>
                            </div>

                            <div
                                style={{
                                    background: t.bg.tertiary,
                                    borderRadius: borderRadius.lg,
                                    padding: spacing[3],
                                    border: `1px solid ${getChallengeColor(currentChallengeData.colorKey)}40`,
                                    textAlign: 'center',
                                    minWidth: '80px',
                                }}
                            >
                                <div style={{ fontSize: typography.size.xs, color: t.text.tertiary, textTransform: 'uppercase', letterSpacing: typography.letterSpacing.wide, marginBottom: spacing[1] }}>
                                    Draw
                                </div>
                                <div style={{ fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: getChallengeColor(currentChallengeData.colorKey), fontFamily: typography.fontFamilyMono }}>
                                    {waveformShapes[currentChallengeData.targetShape]?.name}
                                </div>
                            </div>

                            <div
                                style={{
                                    background: currentChallengeData.direction === 'lower' ? `${t.accent.success}10` : `${t.accent.warning}10`,
                                    borderRadius: borderRadius.lg,
                                    padding: spacing[3],
                                    border: `1px solid ${currentChallengeData.direction === 'lower' ? t.accent.success : t.accent.warning}40`,
                                    textAlign: 'center',
                                    minWidth: '80px',
                                }}
                            >
                                <div style={{ fontSize: typography.size.xs, color: t.text.tertiary, textTransform: 'uppercase', letterSpacing: typography.letterSpacing.wide, marginBottom: spacing[1] }}>
                                    Octaves
                                </div>
                                <div style={{ fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: currentChallengeData.direction === 'lower' ? t.accent.success : t.accent.warning, fontFamily: typography.fontFamilyMono }}>
                                    {currentChallengeData.octaves} {currentChallengeData.direction === 'lower' ? '↓' : '↑'}
                                </div>
                            </div>

                            {currentChallengeData.originalShape !== currentChallengeData.targetShape && (
                                <div
                                    style={{
                                        background: `${t.accent.info}10`,
                                        borderRadius: borderRadius.lg,
                                        padding: spacing[3],
                                        border: `1px solid ${t.accent.info}40`,
                                        textAlign: 'center',
                                        minWidth: '80px',
                                    }}
                                >
                                    <div style={{ fontSize: typography.size.xs, color: t.text.tertiary, textTransform: 'uppercase', letterSpacing: typography.letterSpacing.wide, marginBottom: spacing[1] }}>
                                        Shape
                                    </div>
                                    <div style={{ fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: t.accent.info, fontFamily: typography.fontFamilyMono }}>
                                        CHANGES
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Canvas (dark for visibility) */}
                <div
                    style={{
                        background: canvasTheme.bg,
                        borderRadius: borderRadius.xl,
                        padding: spacing[3],
                        marginBottom: spacing[4],
                        border: `1px solid ${t.border.medium}`,
                        boxShadow: `inset 0 2px 8px rgba(0, 0, 0, 0.2), ${t.shadow.md}`,
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
                        aria-label="Waveform drawing canvas"
                        style={{
                            display: 'block',
                            width: '100%',
                            maxWidth: `${canvasWidth}px`,
                            margin: '0 auto',
                            cursor: 'crosshair',
                            borderRadius: borderRadius.lg,
                            touchAction: 'none',
                        }}
                    />
                </div>

                {/* Legend */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: spacing[8],
                        marginBottom: spacing[4],
                        padding: spacing[3],
                        background: t.bg.primary,
                        borderRadius: borderRadius.lg,
                        border: `1px solid ${t.border.subtle}`,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                        <div style={{ width: '24px', height: '2px', borderTop: `2px dashed ${t.text.tertiary}` }} />
                        <span style={{ color: t.text.tertiary, fontSize: typography.size.sm }}>Original</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                        <div style={{ width: '24px', height: '3px', background: canvasTheme.userLine, borderRadius: '2px' }} />
                        <span style={{ color: t.text.secondary, fontSize: typography.size.sm }}>Your Drawing</span>
                    </div>
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
                    <div style={{ display: 'flex', gap: spacing[3], flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                            onClick={clearDrawing}
                            style={{
                                padding: `${spacing[3]} ${spacing[5]}`,
                                borderRadius: borderRadius.lg,
                                border: `1px solid ${t.border.medium}`,
                                background: t.bg.primary,
                                color: t.text.secondary,
                                fontSize: typography.size.sm,
                                fontWeight: typography.weight.medium,
                                cursor: 'pointer',
                                transition: `all ${transitions.fast} ${transitions.easing}`,
                            }}
                            aria-label="Clear drawing"
                        >
                            Clear
                        </button>
                        <button
                            onClick={submitDrawing}
                            disabled={userPoints.length < 5 || isSubmitting}
                            style={{
                                padding: `${spacing[3]} ${spacing[5]}`,
                                borderRadius: borderRadius.lg,
                                border: 'none',
                                background: userPoints.length >= 5 && !isSubmitting
                                    ? (copyStatus === 'copied' ? t.accent.success : t.accent.primary)
                                    : t.bg.tertiary,
                                color: userPoints.length >= 5 && !isSubmitting ? t.text.inverse : t.text.tertiary,
                                fontSize: typography.size.sm,
                                fontWeight: typography.weight.semibold,
                                cursor: userPoints.length >= 5 && !isSubmitting ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                gap: spacing[2],
                                transition: `all ${transitions.fast} ${transitions.easing}`,
                                boxShadow: userPoints.length >= 5 && !isSubmitting ? t.shadow.md : 'none',
                            }}
                            aria-label={isSubmitting ? 'Marking in progress' : 'Submit drawing for marking'}
                        >
                            {isSubmitting ? 'Marking...' : copyStatus === 'copied' ? '✓ Submitted' : 'Submit Drawing'}
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: spacing[2] }}>
                        <button
                            onClick={prevChallenge}
                            disabled={currentChallenge === 0}
                            style={{
                                padding: `${spacing[3]} ${spacing[5]}`,
                                borderRadius: borderRadius.lg,
                                border: `1px solid ${currentChallenge > 0 ? t.border.medium : t.border.subtle}`,
                                background: t.bg.primary,
                                color: currentChallenge > 0 ? t.text.secondary : t.text.tertiary,
                                fontSize: typography.size.sm,
                                fontWeight: typography.weight.medium,
                                cursor: currentChallenge > 0 ? 'pointer' : 'not-allowed',
                                transition: `all ${transitions.fast} ${transitions.easing}`,
                            }}
                            aria-label="Previous challenge"
                        >
                            ← Prev
                        </button>
                        <button
                            onClick={nextChallenge}
                            disabled={currentChallenge === challenges.length - 1}
                            style={{
                                padding: `${spacing[3]} ${spacing[5]}`,
                                borderRadius: borderRadius.lg,
                                border: `1px solid ${currentChallenge < challenges.length - 1 ? t.border.medium : t.border.subtle}`,
                                background: t.bg.primary,
                                color: currentChallenge < challenges.length - 1 ? t.text.secondary : t.text.tertiary,
                                fontSize: typography.size.sm,
                                fontWeight: typography.weight.medium,
                                cursor: currentChallenge < challenges.length - 1 ? 'pointer' : 'not-allowed',
                                transition: `all ${transitions.fast} ${transitions.easing}`,
                            }}
                            aria-label="Next challenge"
                        >
                            Next →
                        </button>
                    </div>
                </div>

                {/* Completion message */}
                {copiedChallenges.size === 10 && (
                    <div
                        style={{
                            marginTop: spacing[6],
                            background: `${t.accent.success}10`,
                            border: `1px solid ${t.accent.success}40`,
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
                                background: `${t.accent.success}20`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto',
                                marginBottom: spacing[4],
                                fontSize: '1.5rem',
                                color: t.accent.success,
                            }}
                        >
                            ✓
                        </div>
                        <h3 style={{ color: t.accent.success, marginBottom: spacing[2], fontSize: typography.size.lg, fontWeight: typography.weight.semibold }}>
                            Assessment Complete!
                        </h3>
                        <p style={{ color: t.text.secondary, fontSize: typography.size.base }}>
                            All 10 drawings submitted. Your teacher will review and mark your work.
                        </p>
                    </div>
                )}

                {/* AI Feedback Modal */}
                {showFeedbackModal && (
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
                        onClick={() => setShowFeedbackModal(false)}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="feedback-title"
                    >
                        <div
                            style={{
                                background: t.bg.primary,
                                borderRadius: borderRadius['2xl'],
                                padding: spacing[6],
                                maxWidth: '600px',
                                width: '100%',
                                maxHeight: '90vh',
                                overflowY: 'auto',
                                border: `1px solid ${t.border.subtle}`,
                                boxShadow: t.shadow.lg,
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {feedbackError ? (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], marginBottom: spacing[4] }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `${t.accent.error}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                                            ⚠
                                        </div>
                                        <div>
                                            <h3 id="feedback-title" style={{ color: t.accent.error, fontSize: typography.size.lg, fontWeight: typography.weight.semibold, marginBottom: spacing[1] }}>
                                                Submission Error
                                            </h3>
                                            <p style={{ color: t.text.secondary, fontSize: typography.size.sm }}>{feedbackError}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { setShowFeedbackModal(false); setFeedbackError(null); }}
                                        style={{
                                            width: '100%',
                                            padding: spacing[3],
                                            borderRadius: borderRadius.lg,
                                            border: `1px solid ${t.border.medium}`,
                                            background: t.bg.primary,
                                            color: t.text.secondary,
                                            fontSize: typography.size.base,
                                            fontWeight: typography.weight.medium,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Close
                                    </button>
                                </>
                            ) : currentFeedback ? (
                                <>
                                    {/* Header with mark */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing[5] }}>
                                        <div>
                                            <h3 id="feedback-title" style={{ color: t.text.primary, fontSize: typography.size.lg, fontWeight: typography.weight.semibold, marginBottom: spacing[1] }}>
                                                Challenge {currentChallenge + 1} Feedback
                                            </h3>
                                            <p style={{ color: t.text.tertiary, fontSize: typography.size.sm }}>
                                                AI-generated feedback • Your teacher will review
                                            </p>
                                        </div>
                                        <div
                                            style={{
                                                background: currentFeedback.suggestedMark >= 7 ? `${t.accent.success}15` : currentFeedback.suggestedMark >= 4 ? `${t.accent.warning}15` : `${t.accent.error}15`,
                                                border: `2px solid ${currentFeedback.suggestedMark >= 7 ? t.accent.success : currentFeedback.suggestedMark >= 4 ? t.accent.warning : t.accent.error}`,
                                                borderRadius: borderRadius.xl,
                                                padding: `${spacing[3]} ${spacing[4]}`,
                                                textAlign: 'center',
                                                minWidth: '80px',
                                            }}
                                        >
                                            <div style={{ fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: currentFeedback.suggestedMark >= 7 ? t.accent.success : currentFeedback.suggestedMark >= 4 ? t.accent.warning : t.accent.error, fontFamily: typography.fontFamilyMono }}>
                                                {currentFeedback.suggestedMark}/10
                                            </div>
                                        </div>
                                    </div>

                                    {/* Marking criteria */}
                                    <div style={{ display: 'grid', gap: spacing[3], marginBottom: spacing[4] }}>
                                        <div style={{ background: t.bg.tertiary, borderRadius: borderRadius.lg, padding: spacing[4], border: `1px solid ${currentFeedback.cycleCount?.correct ? t.accent.success : t.accent.error}30` }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[2] }}>
                                                <span style={{ color: t.text.secondary, fontSize: typography.size.xs, textTransform: 'uppercase', letterSpacing: typography.letterSpacing.wide }}>Cycle Count</span>
                                                <span style={{ color: currentFeedback.cycleCount?.correct ? t.accent.success : t.accent.error, fontSize: typography.size.sm, fontWeight: typography.weight.semibold, fontFamily: typography.fontFamilyMono }}>
                                                    {currentFeedback.cycleCount?.marks}/4
                                                </span>
                                            </div>
                                            <p style={{ color: t.text.primary, fontSize: typography.size.sm, margin: 0, lineHeight: typography.lineHeight.relaxed }}>
                                                {currentFeedback.cycleCount?.feedback}
                                            </p>
                                        </div>

                                        <div style={{ background: t.bg.tertiary, borderRadius: borderRadius.lg, padding: spacing[4], border: `1px solid ${currentFeedback.shapeAccuracy?.correct ? t.accent.success : t.accent.error}30` }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[2] }}>
                                                <span style={{ color: t.text.secondary, fontSize: typography.size.xs, textTransform: 'uppercase', letterSpacing: typography.letterSpacing.wide }}>Shape Accuracy</span>
                                                <span style={{ color: currentFeedback.shapeAccuracy?.correct ? t.accent.success : t.accent.error, fontSize: typography.size.sm, fontWeight: typography.weight.semibold, fontFamily: typography.fontFamilyMono }}>
                                                    {currentFeedback.shapeAccuracy?.marks}/4
                                                </span>
                                            </div>
                                            <p style={{ color: t.text.primary, fontSize: typography.size.sm, margin: 0, lineHeight: typography.lineHeight.relaxed }}>
                                                {currentFeedback.shapeAccuracy?.feedback}
                                            </p>
                                        </div>

                                        <div style={{ background: t.bg.tertiary, borderRadius: borderRadius.lg, padding: spacing[4], border: `1px solid ${t.border.subtle}` }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[2] }}>
                                                <span style={{ color: t.text.secondary, fontSize: typography.size.xs, textTransform: 'uppercase', letterSpacing: typography.letterSpacing.wide }}>Drawing Quality</span>
                                                <span style={{ color: t.accent.warning, fontSize: typography.size.sm, fontWeight: typography.weight.semibold, fontFamily: typography.fontFamilyMono }}>
                                                    {currentFeedback.drawingQuality?.marks}/2
                                                </span>
                                            </div>
                                            <p style={{ color: t.text.primary, fontSize: typography.size.sm, margin: 0, lineHeight: typography.lineHeight.relaxed }}>
                                                {currentFeedback.drawingQuality?.feedback}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Overall feedback */}
                                    <div style={{ background: t.bg.tertiary, borderRadius: borderRadius.lg, padding: spacing[4], marginBottom: spacing[4], border: `1px solid ${t.border.subtle}` }}>
                                        <p style={{ color: t.text.primary, fontSize: typography.size.base, lineHeight: typography.lineHeight.relaxed, margin: 0 }}>
                                            {currentFeedback.overallFeedback}
                                        </p>
                                    </div>

                                    {/* Strengths and improvements */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[3], marginBottom: spacing[4] }}>
                                        {currentFeedback.strengths?.length > 0 && (
                                            <div style={{ background: `${t.accent.success}10`, borderRadius: borderRadius.lg, padding: spacing[4], border: `1px solid ${t.accent.success}30` }}>
                                                <div style={{ color: t.accent.success, fontSize: typography.size.xs, fontWeight: typography.weight.semibold, textTransform: 'uppercase', letterSpacing: typography.letterSpacing.wide, marginBottom: spacing[2] }}>
                                                    Strengths
                                                </div>
                                                <ul style={{ margin: 0, paddingLeft: spacing[4], color: t.text.secondary, fontSize: typography.size.sm, lineHeight: typography.lineHeight.relaxed }}>
                                                    {currentFeedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                        {currentFeedback.improvements?.length > 0 && (
                                            <div style={{ background: `${t.accent.warning}10`, borderRadius: borderRadius.lg, padding: spacing[4], border: `1px solid ${t.accent.warning}30` }}>
                                                <div style={{ color: t.accent.warning, fontSize: typography.size.xs, fontWeight: typography.weight.semibold, textTransform: 'uppercase', letterSpacing: typography.letterSpacing.wide, marginBottom: spacing[2] }}>
                                                    To Improve
                                                </div>
                                                <ul style={{ margin: 0, paddingLeft: spacing[4], color: t.text.secondary, fontSize: typography.size.sm, lineHeight: typography.lineHeight.relaxed }}>
                                                    {currentFeedback.improvements.map((s, i) => <li key={i}>{s}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    {/* Teacher review notice */}
                                    <div style={{ background: `${challengeColors.purple}10`, borderRadius: borderRadius.lg, padding: spacing[4], marginBottom: spacing[4], border: `1px solid ${challengeColors.purple}30`, display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                                        <span style={{ fontSize: '1.25rem' }}>👨‍🏫</span>
                                        <p style={{ color: t.text.secondary, fontSize: typography.size.sm, margin: 0 }}>
                                            <strong style={{ color: challengeColors.purple }}>Your teacher will review this.</strong>{' '}
                                            The final mark may be adjusted after teacher review.
                                        </p>
                                    </div>

                                    {/* Close button */}
                                    <button
                                        onClick={() => {
                                            setShowFeedbackModal(false);
                                            setCurrentFeedback(null);
                                            if (currentChallenge < challenges.length - 1) nextChallenge();
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: spacing[4],
                                            borderRadius: borderRadius.lg,
                                            border: 'none',
                                            background: t.accent.primary,
                                            color: t.text.inverse,
                                            fontSize: typography.size.base,
                                            fontWeight: typography.weight.semibold,
                                            cursor: 'pointer',
                                            boxShadow: t.shadow.md,
                                        }}
                                    >
                                        {currentChallenge < challenges.length - 1 ? 'Continue to Next Challenge →' : 'Close'}
                                    </button>
                                </>
                            ) : null}
                        </div>
                    </div>
                )}

                {/* Copy Modal (fallback) */}
                {showCopyModal && modalImageUrl && (
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
                        onClick={handleModalClose}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div
                            style={{
                                background: t.bg.primary,
                                borderRadius: borderRadius['2xl'],
                                padding: spacing[6],
                                maxWidth: '800px',
                                width: '100%',
                                border: `1px solid ${t.border.subtle}`,
                                boxShadow: t.shadow.lg,
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing[4] }}>
                                <div>
                                    <h3 style={{ color: t.accent.primary, fontSize: typography.size.lg, fontWeight: typography.weight.semibold, marginBottom: spacing[1] }}>
                                        Confirm your submission
                                    </h3>
                                    <p style={{ color: t.text.secondary, fontSize: typography.size.sm }}>
                                        Click <strong style={{ color: t.text.primary }}>"Submit"</strong> to submit this drawing for marking
                                    </p>
                                </div>
                                <button
                                    onClick={handleModalClose}
                                    style={{ background: 'none', border: 'none', color: t.text.tertiary, fontSize: '1.5rem', cursor: 'pointer', padding: spacing[1], lineHeight: 1 }}
                                    aria-label="Close"
                                >
                                    ×
                                </button>
                            </div>

                            <div style={{ background: t.bg.tertiary, borderRadius: borderRadius.lg, padding: spacing[2], marginBottom: spacing[4], border: `2px dashed ${t.accent.primary}40` }}>
                                <img src={modalImageUrl} alt="Your waveform drawing" style={{ display: 'block', width: '100%', borderRadius: borderRadius.md }} />
                            </div>

                            <div style={{ display: 'flex', gap: spacing[3], justifyContent: 'center' }}>
                                <button
                                    onClick={handleModalCopied}
                                    style={{
                                        padding: `${spacing[3]} ${spacing[6]}`,
                                        borderRadius: borderRadius.lg,
                                        border: 'none',
                                        background: t.accent.primary,
                                        color: t.text.inverse,
                                        fontSize: typography.size.base,
                                        fontWeight: typography.weight.semibold,
                                        cursor: 'pointer',
                                        boxShadow: t.shadow.md,
                                    }}
                                >
                                    ✓ Submit Drawing
                                </button>
                                <button
                                    onClick={handleModalClose}
                                    style={{
                                        padding: `${spacing[3]} ${spacing[6]}`,
                                        borderRadius: borderRadius.lg,
                                        border: `1px solid ${t.border.medium}`,
                                        background: t.bg.primary,
                                        color: t.text.secondary,
                                        fontSize: typography.size.base,
                                        fontWeight: typography.weight.medium,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WaveformAssessment;

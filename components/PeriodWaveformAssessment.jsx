'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { theme as designTheme, typography, borderRadius, spacing, transitions, assessmentColors } from '@/lib/theme';
import waveformPeriodsConfig from '@/lib/assessments/waveform-periods';

// ============================================
// PERIOD WAVEFORM DRAWING ASSESSMENT
// Students draw waveforms with specific periods (ms)
// No reference waveform - draw from scratch
// ============================================

const PeriodWaveformAssessment = ({ initialName = '' }) => {
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

    // Canvas-specific colors (exam-style graph paper)
    const canvasTheme = {
        bg: '#f5f5f5',
        bgGraph: '#ffffff',
        gridFine: '#c0c0c0',
        gridMajor: '#404040',
        centerLine: '#000000',
        axisLine: '#000000',
        text: '#000000',
        textSecondary: '#666666',
        userLine: '#2563eb',
    };

    // Get challenges and shapes from config
    const challenges = waveformPeriodsConfig.challenges;
    const waveformShapes = waveformPeriodsConfig.shapes;

    // Difficulty/type colors
    const challengeColors = {
        green: t.accent.success,
        amber: t.accent.warning,
        cyan: t.accent.info,
        purple: '#8B5CF6',
        red: t.accent.error,
    };

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

        // Graph paper area (white)
        ctx.fillStyle = canvasTheme.bgGraph;
        ctx.fillRect(pad.left, pad.top, graphWidth, graphHeight);

        // Calculate grid spacing
        const majorDivisionsX = 5;
        const minorPerMajorX = 10;
        const totalMinorX = majorDivisionsX * minorPerMajorX;
        const minorSpacingX = graphWidth / totalMinorX;
        const minorSpacingY = minorSpacingX;
        const totalMinorY = Math.floor(graphHeight / minorSpacingY);
        const majorDivisionsY = Math.floor(totalMinorY / minorPerMajorX);

        // Draw fine grid lines
        ctx.strokeStyle = canvasTheme.gridFine;
        ctx.lineWidth = 0.5;

        for (let i = 0; i <= totalMinorX; i++) {
            const x = pad.left + i * minorSpacingX;
            ctx.beginPath();
            ctx.moveTo(x, pad.top);
            ctx.lineTo(x, pad.top + graphHeight);
            ctx.stroke();
        }

        for (let i = 0; i <= totalMinorY; i++) {
            const y = pad.top + i * minorSpacingY;
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(pad.left + graphWidth, y);
            ctx.stroke();
        }

        // Draw major grid lines
        ctx.strokeStyle = canvasTheme.gridMajor;
        ctx.lineWidth = 1.5;

        for (let i = 0; i <= majorDivisionsX; i++) {
            const x = pad.left + (i / majorDivisionsX) * graphWidth;
            ctx.beginPath();
            ctx.moveTo(x, pad.top);
            ctx.lineTo(x, pad.top + graphHeight);
            ctx.stroke();
        }

        const majorSpacingY = minorSpacingY * minorPerMajorX;
        for (let i = 0; i <= majorDivisionsY; i++) {
            const y = pad.top + i * majorSpacingY;
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

        // Axes border
        ctx.strokeStyle = canvasTheme.axisLine;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pad.left, pad.top);
        ctx.lineTo(pad.left, pad.top + graphHeight);
        ctx.lineTo(pad.left + graphWidth, pad.top + graphHeight);
        ctx.stroke();

        // X-axis numbers (0, 1, 2, 3, 4, 5)
        ctx.fillStyle = canvasTheme.text;
        ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        for (let i = 0; i <= majorDivisionsX; i++) {
            const x = pad.left + (i / majorDivisionsX) * graphWidth;
            ctx.fillText(String(i), x, pad.top + graphHeight + 10);
        }

        // X-axis label
        ctx.font = '13px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('Time (ms)', pad.left + graphWidth, pad.top + graphHeight + 35);

        // Draw correct answer (solid green)
        const shape = waveformShapes[challenge.shape];
        if (shape) {
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 3;
            ctx.beginPath();

            for (let i = 0; i <= graphWidth; i++) {
                const progress = i / graphWidth;
                const value = shape.draw(progress, challenge.expectedCycles);
                const x = pad.left + i;
                const y = centerY - (value * graphHeight * 0.35);

                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        // Labels
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(
            `Correct: ${challenge.shape} (${challenge.expectedCycles} cycles, period=${challenge.periodMs}ms)`,
            pad.left,
            pad.top - 8
        );

        return canvas.toDataURL('image/png');
    }, [waveformShapes, canvasTheme]);

    // Draw the waveform grid (exam-style graph paper with Time axis)
    const drawGrid = useCallback((ctx) => {
        const innerWidth = canvasWidth - padding.left - padding.right;
        const innerHeight = canvasHeight - padding.top - padding.bottom;

        // Background
        ctx.fillStyle = canvasTheme.bg;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Graph paper area (white)
        ctx.fillStyle = canvasTheme.bgGraph;
        ctx.fillRect(padding.left, padding.top, innerWidth, innerHeight);

        // Calculate grid spacing for exam-style graph paper
        const majorDivisionsX = 5;
        const minorPerMajorX = 10;
        const totalMinorX = majorDivisionsX * minorPerMajorX;
        const minorSpacingX = innerWidth / totalMinorX;
        const minorSpacingY = minorSpacingX;
        const totalMinorY = Math.floor(innerHeight / minorSpacingY);
        const majorDivisionsY = Math.floor(totalMinorY / minorPerMajorX);

        // Draw fine grid lines
        ctx.strokeStyle = canvasTheme.gridFine;
        ctx.lineWidth = 0.5;

        for (let i = 0; i <= totalMinorX; i++) {
            const x = padding.left + i * minorSpacingX;
            ctx.beginPath();
            ctx.moveTo(x, padding.top);
            ctx.lineTo(x, padding.top + innerHeight);
            ctx.stroke();
        }

        for (let i = 0; i <= totalMinorY; i++) {
            const y = padding.top + i * minorSpacingY;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + innerWidth, y);
            ctx.stroke();
        }

        // Draw major grid lines
        ctx.strokeStyle = canvasTheme.gridMajor;
        ctx.lineWidth = 1.5;

        for (let i = 0; i <= majorDivisionsX; i++) {
            const x = padding.left + (i / majorDivisionsX) * innerWidth;
            ctx.beginPath();
            ctx.moveTo(x, padding.top);
            ctx.lineTo(x, padding.top + innerHeight);
            ctx.stroke();
        }

        const majorSpacingY = minorSpacingY * minorPerMajorX;
        for (let i = 0; i <= majorDivisionsY; i++) {
            const y = padding.top + i * majorSpacingY;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + innerWidth, y);
            ctx.stroke();
        }

        // Center line (zero displacement)
        const centerY = padding.top + innerHeight / 2;
        ctx.strokeStyle = canvasTheme.centerLine;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding.left, centerY);
        ctx.lineTo(padding.left + innerWidth, centerY);
        ctx.stroke();

        // Draw axes border
        ctx.strokeStyle = canvasTheme.axisLine;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top);
        ctx.lineTo(padding.left, padding.top + innerHeight);
        ctx.lineTo(padding.left + innerWidth, padding.top + innerHeight);
        ctx.stroke();

        // X-axis tick marks and numbers (0, 1, 2, 3, 4, 5) - KEY CHANGE: includes zero
        ctx.fillStyle = canvasTheme.text;
        ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        for (let i = 0; i <= majorDivisionsX; i++) {
            const x = padding.left + (i / majorDivisionsX) * innerWidth;
            ctx.beginPath();
            ctx.moveTo(x, padding.top + innerHeight);
            ctx.lineTo(x, padding.top + innerHeight + 6);
            ctx.stroke();
            ctx.fillText(String(i), x, padding.top + innerHeight + 10);
        }

        // X-axis label "Time (ms)"
        ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.fillStyle = canvasTheme.text;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText('Time (ms)', padding.left + innerWidth, padding.top + innerHeight + 35);

        // Y-axis label "Displacement"
        ctx.save();
        ctx.translate(padding.left - 35, padding.top + innerHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.fillText('Displacement', 0, 0);
        ctx.restore();

        // NO original waveform - student draws from scratch

        // Header with challenge info
        ctx.fillStyle = canvasTheme.text;
        ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(
            `Challenge ${currentChallenge + 1}: ${currentChallengeData?.shape?.toUpperCase()} wave, Period = ${currentChallengeData?.periodMs}ms`,
            padding.left,
            padding.top - 8
        );

        ctx.fillStyle = canvasTheme.textSecondary;
        ctx.font = '11px -apple-system, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(studentName || 'Student Name', canvasWidth - padding.right, padding.top - 8);

        // Expected cycles badge
        if (currentChallengeData) {
            const badgeText = `Expected: ${currentChallengeData.expectedCycles} cycles`;
            ctx.font = 'bold 11px ui-monospace, monospace';
            const badgeWidth = ctx.measureText(badgeText).width + 16;
            const badgeX = padding.left + innerWidth - badgeWidth - 8;
            const color = getChallengeColor(currentChallengeData.colorKey);

            ctx.fillStyle = color + '40';
            ctx.beginPath();
            ctx.roundRect(badgeX, padding.top + 8, badgeWidth, 22, 4);
            ctx.fill();

            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(badgeText, badgeX + badgeWidth/2, padding.top + 19);
        }
    }, [currentChallengeData, currentChallenge, studentName, canvasTheme, getChallengeColor]);

    // Draw user's line
    const drawUserLine = useCallback((ctx) => {
        if (userPoints.length < 2) return;

        ctx.strokeStyle = canvasTheme.userLine;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(userPoints[0].x, userPoints[0].y);
        for (let i = 1; i < userPoints.length; i++) {
            ctx.lineTo(userPoints[i].x, userPoints[i].y);
        }
        ctx.stroke();
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
                    assessment_id: 'waveform-periods',
                    student_name: studentName,
                    challenge_number: currentChallenge + 1,
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
                        Period Waveform Drawing
                    </h1>

                    <p
                        style={{
                            color: t.text.secondary,
                            fontSize: typography.size.base,
                            lineHeight: typography.lineHeight.relaxed,
                            marginBottom: spacing[8],
                        }}
                    >
                        Draw waveforms with specific{' '}
                        <strong style={{ color: t.text.primary }}>periods (in milliseconds)</strong>.
                        Given a period, draw the waveform showing the correct number of cycles in a 5ms window.
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
                                <li>Read the <strong style={{ color: t.text.primary }}>period</strong> and shape for each challenge</li>
                                <li>Calculate cycles: <strong style={{ color: t.text.primary }}>5ms / period = cycles</strong></li>
                                <li>Draw the waveform with the <strong style={{ color: t.text.primary }}>correct number of cycles</strong></li>
                                <li>Click <strong style={{ color: t.text.primary }}>"Submit"</strong> to submit for marking</li>
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
                            Period Waveform Drawing Assessment
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
                            <p
                                style={{
                                    fontSize: typography.size.sm,
                                    color: t.text.secondary,
                                    marginTop: spacing[2],
                                }}
                            >
                                {currentChallengeData.hint}
                            </p>
                        </div>

                        {/* Challenge details - Period focused */}
                        <div style={{ display: 'flex', gap: spacing[3], flexWrap: 'wrap' }}>
                            <div
                                style={{
                                    background: `${getChallengeColor(currentChallengeData.colorKey)}10`,
                                    borderRadius: borderRadius.lg,
                                    padding: spacing[3],
                                    border: `1px solid ${getChallengeColor(currentChallengeData.colorKey)}40`,
                                    textAlign: 'center',
                                    minWidth: '80px',
                                }}
                            >
                                <div style={{ fontSize: typography.size.xs, color: t.text.tertiary, textTransform: 'uppercase', letterSpacing: typography.letterSpacing.wide, marginBottom: spacing[1] }}>
                                    Shape
                                </div>
                                <div style={{ fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: getChallengeColor(currentChallengeData.colorKey), fontFamily: typography.fontFamilyMono }}>
                                    {waveformShapes[currentChallengeData.shape]?.name}
                                </div>
                            </div>

                            <div
                                style={{
                                    background: `${t.accent.primary}10`,
                                    borderRadius: borderRadius.lg,
                                    padding: spacing[3],
                                    border: `1px solid ${t.accent.primary}40`,
                                    textAlign: 'center',
                                    minWidth: '80px',
                                }}
                            >
                                <div style={{ fontSize: typography.size.xs, color: t.text.tertiary, textTransform: 'uppercase', letterSpacing: typography.letterSpacing.wide, marginBottom: spacing[1] }}>
                                    Period
                                </div>
                                <div style={{ fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: t.accent.primary, fontFamily: typography.fontFamilyMono }}>
                                    {currentChallengeData.periodMs}ms
                                </div>
                            </div>

                            <div
                                style={{
                                    background: `${t.accent.success}10`,
                                    borderRadius: borderRadius.lg,
                                    padding: spacing[3],
                                    border: `1px solid ${t.accent.success}40`,
                                    textAlign: 'center',
                                    minWidth: '80px',
                                }}
                            >
                                <div style={{ fontSize: typography.size.xs, color: t.text.tertiary, textTransform: 'uppercase', letterSpacing: typography.letterSpacing.wide, marginBottom: spacing[1] }}>
                                    Cycles
                                </div>
                                <div style={{ fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: t.accent.success, fontFamily: typography.fontFamilyMono }}>
                                    {currentChallengeData.expectedCycles}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Canvas */}
                <div
                    style={{
                        background: canvasTheme.bg,
                        borderRadius: borderRadius.xl,
                        padding: spacing[3],
                        marginBottom: spacing[4],
                        border: `2px solid ${t.border.medium}`,
                        boxShadow: t.shadow.md,
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
                        <div style={{ width: '24px', height: '3px', background: '#2563eb', borderRadius: '2px' }} />
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
                                    {/* Header with mark result */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing[5] }}>
                                        <div>
                                            <h3 id="feedback-title" style={{ color: t.text.primary, fontSize: typography.size.lg, fontWeight: typography.weight.semibold, marginBottom: spacing[1] }}>
                                                Challenge {currentChallenge + 1} Result
                                            </h3>
                                            <p style={{ color: t.text.tertiary, fontSize: typography.size.sm }}>
                                                Period: {currentChallengeData.periodMs}ms | Expected: {currentChallengeData.expectedCycles} cycles
                                            </p>
                                        </div>
                                        <div
                                            style={{
                                                background: (currentFeedback.mark === 1) ? `${t.accent.success}15` : `${t.accent.error}15`,
                                                border: `2px solid ${(currentFeedback.mark === 1) ? t.accent.success : t.accent.error}`,
                                                borderRadius: borderRadius.xl,
                                                padding: `${spacing[3]} ${spacing[4]}`,
                                                textAlign: 'center',
                                                minWidth: '80px',
                                            }}
                                        >
                                            <div style={{ fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: (currentFeedback.mark === 1) ? t.accent.success : t.accent.error, fontFamily: typography.fontFamilyMono }}>
                                                {currentFeedback.mark}/1
                                            </div>
                                        </div>
                                    </div>

                                    {/* Marking criteria */}
                                    <div style={{ display: 'grid', gap: spacing[3], marginBottom: spacing[4] }}>
                                        {/* Cycle Count */}
                                        <div style={{
                                            background: t.bg.tertiary,
                                            borderRadius: borderRadius.lg,
                                            padding: spacing[4],
                                            border: `2px solid ${currentFeedback.cycleCount?.correct ? t.accent.success : t.accent.error}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: spacing[3]
                                        }}>
                                            <div style={{
                                                fontSize: '1.5rem',
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                background: currentFeedback.cycleCount?.correct ? `${t.accent.success}20` : `${t.accent.error}20`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                {currentFeedback.cycleCount?.correct ? '✓' : '✗'}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ color: t.text.primary, fontWeight: typography.weight.semibold, marginBottom: spacing[1] }}>
                                                    Cycle Count
                                                </div>
                                                <div style={{ color: t.text.secondary, fontSize: typography.size.sm }}>
                                                    Expected: {currentFeedback.cycleCount?.expected} cycles |
                                                    You drew: {currentFeedback.cycleCount?.detected} cycles
                                                </div>
                                            </div>
                                        </div>

                                        {/* Shape Accuracy */}
                                        <div style={{
                                            background: t.bg.tertiary,
                                            borderRadius: borderRadius.lg,
                                            padding: spacing[4],
                                            border: `2px solid ${currentFeedback.shapeAccuracy?.correct ? t.accent.success : t.accent.error}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: spacing[3]
                                        }}>
                                            <div style={{
                                                fontSize: '1.5rem',
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                background: currentFeedback.shapeAccuracy?.correct ? `${t.accent.success}20` : `${t.accent.error}20`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                {currentFeedback.shapeAccuracy?.correct ? '✓' : '✗'}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ color: t.text.primary, fontWeight: typography.weight.semibold, marginBottom: spacing[1] }}>
                                                    Waveform Shape
                                                </div>
                                                <div style={{ color: t.text.secondary, fontSize: typography.size.sm }}>
                                                    Expected: {currentFeedback.shapeAccuracy?.expected} |
                                                    Detected: {currentFeedback.shapeAccuracy?.detected}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Transition Timing (for square/saw waves) */}
                                        {currentFeedback.transitionTiming && (
                                            <div style={{
                                                background: t.bg.tertiary,
                                                borderRadius: borderRadius.lg,
                                                padding: spacing[4],
                                                border: `2px solid ${currentFeedback.transitionTiming?.correct ? t.accent.success : t.accent.error}`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: spacing[3]
                                            }}>
                                                <div style={{
                                                    fontSize: '1.5rem',
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    background: currentFeedback.transitionTiming?.correct ? `${t.accent.success}20` : `${t.accent.error}20`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    {currentFeedback.transitionTiming?.correct ? '✓' : '✗'}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ color: t.text.primary, fontWeight: typography.weight.semibold, marginBottom: spacing[1] }}>
                                                        Transition Timing
                                                    </div>
                                                    <div style={{ color: t.text.secondary, fontSize: typography.size.sm }}>
                                                        Assessment: {currentFeedback.transitionTiming?.assessment}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Feedback */}
                                    <div style={{ background: t.bg.tertiary, borderRadius: borderRadius.lg, padding: spacing[4], marginBottom: spacing[4], border: `1px solid ${t.border.subtle}` }}>
                                        <p style={{ color: t.text.primary, fontSize: typography.size.base, lineHeight: typography.lineHeight.relaxed, margin: 0 }}>
                                            {currentFeedback.feedback}
                                        </p>
                                    </div>

                                    {/* Result summary */}
                                    <div style={{
                                        background: currentFeedback.mark === 1 ? `${t.accent.success}10` : `${t.accent.error}10`,
                                        borderRadius: borderRadius.lg,
                                        padding: spacing[4],
                                        marginBottom: spacing[4],
                                        border: `1px solid ${currentFeedback.mark === 1 ? t.accent.success : t.accent.error}30`,
                                        textAlign: 'center'
                                    }}>
                                        <p style={{ color: t.text.primary, fontSize: typography.size.base, fontWeight: typography.weight.semibold, margin: 0 }}>
                                            {currentFeedback.mark === 1
                                                ? '1 mark awarded - All criteria met!'
                                                : '0 marks - One or more criteria not met'}
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

export default PeriodWaveformAssessment;

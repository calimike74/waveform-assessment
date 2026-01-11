'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// ============================================
// OCTAVE WAVEFORM DRAWING ASSESSMENT
// Studio Console Aesthetic Edition
// 10 Challenges - Submissions saved for marking
// ============================================

const WaveformAssessment = ({ initialName = '' }) => {
    const [studentName, setStudentName] = useState(initialName);
    const [hasStarted, setHasStarted] = useState(!!initialName);
    const [currentChallenge, setCurrentChallenge] = useState(0);
    const [completedChallenges, setCompletedChallenges] = useState(new Set());
    const [copiedChallenges, setCopiedChallenges] = useState(new Set());

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

    // Design tokens - Studio Console Aesthetic
    const theme = {
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
            color: theme.accent.green
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
            color: theme.accent.amber
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
            color: theme.accent.cyan,
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
            color: theme.accent.green
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
            color: theme.accent.amber,
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
            color: theme.accent.purple
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
            color: theme.accent.cyan,
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
            color: theme.accent.red,
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
            color: theme.accent.amber,
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
            color: theme.accent.amber
        }
    ];

    const currentChallengeData = challenges[currentChallenge];

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
        ctx.fillStyle = '#1a1814';
        ctx.fillRect(0, 0, width, height);

        // Graph background
        ctx.fillStyle = '#252219';
        ctx.fillRect(pad.left, pad.top, graphWidth, graphHeight);

        // Grid lines
        ctx.strokeStyle = 'rgba(245, 240, 230, 0.1)';
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
        ctx.strokeStyle = 'rgba(245, 240, 230, 0.3)';
        ctx.lineWidth = 2;
        const centerY = pad.top + graphHeight / 2;
        ctx.beginPath();
        ctx.moveTo(pad.left, centerY);
        ctx.lineTo(pad.left + graphWidth, centerY);
        ctx.stroke();

        // Draw original waveform (dashed gray)
        const originalShape = waveformShapes[challenge.originalShape];
        if (originalShape) {
            ctx.strokeStyle = 'rgba(150, 150, 150, 0.5)';
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
            ctx.strokeStyle = '#7cb342';
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
        ctx.fillStyle = '#f5f0e6';
        ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(`Original: ${challenge.originalShape} (${challenge.originalCycles} cycles)`, pad.left, 25);

        ctx.fillStyle = '#7cb342';
        ctx.fillText(`Correct: ${challenge.targetShape} (${challenge.targetCycles} cycles)`, pad.left + 300, 25);

        return canvas.toDataURL('image/png');
    }, [waveformShapes]);

    // Draw the waveform grid and reference
    const drawGrid = useCallback((ctx) => {
        const innerWidth = canvasWidth - padding.left - padding.right;
        const innerHeight = canvasHeight - padding.top - padding.bottom;

        // Background
        ctx.fillStyle = '#0f0e0c';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Graph area gradient
        const graphGradient = ctx.createLinearGradient(0, padding.top, 0, canvasHeight - padding.bottom);
        graphGradient.addColorStop(0, '#0a0908');
        graphGradient.addColorStop(0.5, '#0c0b09');
        graphGradient.addColorStop(1, '#0a0908');
        ctx.fillStyle = graphGradient;
        ctx.fillRect(padding.left, padding.top, innerWidth, innerHeight);

        // Vertical grid lines
        for (let i = 0; i <= 8; i++) {
            const x = padding.left + (i / 8) * innerWidth;
            ctx.strokeStyle = 'rgba(245, 240, 230, 0.04)';
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
                ctx.strokeStyle = 'rgba(245, 240, 230, 0.25)';
                ctx.lineWidth = 1.5;
            } else {
                ctx.strokeStyle = 'rgba(245, 240, 230, 0.04)';
                ctx.lineWidth = 1;
            }
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(canvasWidth - padding.right, y);
            ctx.stroke();
        }

        // Axes border
        ctx.strokeStyle = 'rgba(232, 168, 73, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top);
        ctx.lineTo(padding.left, canvasHeight - padding.bottom);
        ctx.lineTo(canvasWidth - padding.right, canvasHeight - padding.bottom);
        ctx.stroke();

        // X-axis label
        ctx.fillStyle = theme.text.secondary;
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

            ctx.strokeStyle = 'rgba(168, 160, 144, 0.6)';
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

            ctx.fillStyle = theme.text.tertiary;
            ctx.font = '10px "SF Mono", "Fira Code", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`Original: ${shapeName}`, padding.left + 8, padding.top + 18);
        }

        // Header with challenge info
        ctx.fillStyle = theme.text.primary;
        ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Challenge ${currentChallenge + 1}: ${currentChallengeData?.name || ''}`, padding.left, 25);

        ctx.fillStyle = theme.text.tertiary;
        ctx.font = '11px -apple-system, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(studentName || 'Student Name', canvasWidth - padding.right, 25);

        // Target shape badge (no cycle count - this is an assessment)
        if (currentChallengeData) {
            const targetShapeName = waveformShapes[currentChallengeData.targetShape]?.name || 'Sine';
            const badgeText = `Draw: ${targetShapeName}`;
            ctx.font = 'bold 10px "SF Mono", monospace';
            const badgeWidth = ctx.measureText(badgeText).width + 16;
            const badgeX = canvasWidth - padding.right - badgeWidth;

            ctx.fillStyle = currentChallengeData.color + '30';
            ctx.beginPath();
            ctx.roundRect(badgeX, padding.top + 8, badgeWidth, 24, 4);
            ctx.fill();

            ctx.fillStyle = currentChallengeData.color;
            ctx.textAlign = 'center';
            ctx.fillText(badgeText, badgeX + badgeWidth/2, padding.top + 24);
        }
    }, [currentChallengeData, currentChallenge, studentName, theme, waveformShapes]);

    // Draw user's line
    const drawUserLine = useCallback((ctx) => {
        if (userPoints.length < 2) return;

        ctx.strokeStyle = theme.accent.blue;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = theme.accent.blue;
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.moveTo(userPoints[0].x, userPoints[0].y);
        for (let i = 1; i < userPoints.length; i++) {
            ctx.lineTo(userPoints[i].x, userPoints[i].y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
    }, [userPoints, theme]);

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

    // Save drawing to Supabase and return submission ID
    const saveToDatabase = async (imageData) => {
        try {
            const { data, error } = await supabase
                .from('submissions')
                .insert({
                    assessment_id: 'waveform-octaves', // For multi-assessment support
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

    // Request AI marking for a submission
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
            // Get canvas image data
            const imageData = canvas.toDataURL('image/png');

            // Save to database
            const submissionId = await saveToDatabase(imageData);
            if (!submissionId) {
                throw new Error('Failed to save submission');
            }

            // Generate correct answer image
            const correctAnswerImage = generateCorrectAnswerImage(currentChallengeData);

            // Request AI marking
            const feedback = await requestAIMarking(submissionId, correctAnswerImage);

            // Show feedback modal
            setCurrentFeedback(feedback);
            setShowFeedbackModal(true);

            // Mark as completed
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

        // Get image data for saving
        const imageData = canvas.toDataURL('image/png');

        try {
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            setCopyStatus('copied');
            setCopiedChallenges(prev => new Set([...prev, currentChallenge]));

            // Save to database
            saveToDatabase(imageData);

            setTimeout(() => setCopyStatus(null), 3000);
        } catch (err) {
            console.error('Clipboard copy failed:', err);
            setModalImageUrl(imageData);
            setShowCopyModal(true);
        }
    };

    const handleModalCopied = () => {
        // Save to database when using right-click copy fallback
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

    // Shared styles
    const styles = {
        container: {
            minHeight: '100vh',
            background: `linear-gradient(180deg, ${theme.bg.deep} 0%, #12110e 100%)`,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        },
        bgPattern: {
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
        },
        panel: {
            background: `linear-gradient(135deg, ${theme.bg.panel} 0%, ${theme.bg.surface} 100%)`,
            borderRadius: '16px',
            border: `1px solid ${theme.border.medium}`,
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
        },
        button: {
            padding: '0.75rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
        },
        buttonPrimary: {
            background: `linear-gradient(135deg, ${theme.accent.amber} 0%, #d4922e 100%)`,
            color: theme.bg.deep,
            boxShadow: `0 2px 8px rgba(232, 168, 73, 0.3)`,
        },
        buttonSecondary: {
            background: theme.bg.elevated,
            color: theme.text.secondary,
            border: `1px solid ${theme.border.medium}`,
        },
        input: {
            width: '100%',
            padding: '1rem',
            background: theme.bg.deep,
            border: `1px solid ${theme.border.medium}`,
            borderRadius: '10px',
            color: theme.text.primary,
            fontSize: '1rem',
            outline: 'none',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        },
    };

    // Start screen
    if (!hasStarted) {
        return (
            <div style={{
                ...styles.container,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
            }}>
                <div style={styles.bgPattern} />

                <div style={{
                    ...styles.panel,
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
                        2.5 Numeracy
                    </div>

                    <h1 style={{
                        fontSize: '1.75rem',
                        fontWeight: '600',
                        color: theme.text.primary,
                        marginBottom: '0.5rem',
                        letterSpacing: '-0.02em',
                    }}>
                        Octave Waveform Drawing
                    </h1>

                    <p style={{
                        color: theme.text.secondary,
                        fontSize: '0.95rem',
                        lineHeight: '1.6',
                        marginBottom: '2rem',
                    }}>
                        You'll see an original waveform. Draw what it would look like at a
                        <strong style={{ color: theme.text.primary }}> different octave</strong>.
                        Each drawing will be <strong style={{ color: theme.accent.amber }}>submitted for marking</strong>.
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
                            style={styles.input}
                            onFocus={(e) => {
                                e.target.style.borderColor = theme.accent.amber;
                                e.target.style.boxShadow = `0 0 0 3px ${theme.accent.amber}20`;
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = theme.border.medium;
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    <div style={{
                        background: theme.bg.deep,
                        borderRadius: '10px',
                        padding: '1rem 1.25rem',
                        marginBottom: '1.5rem',
                        border: `1px solid ${theme.border.subtle}`,
                    }}>
                        <div style={{
                            fontSize: '0.7rem',
                            color: theme.accent.cyan,
                            fontWeight: '600',
                            marginBottom: '0.75rem',
                            fontFamily: '"SF Mono", monospace',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                        }}>
                            Instructions
                        </div>
                        <ol style={{
                            color: theme.text.secondary,
                            fontSize: '0.85rem',
                            lineHeight: '1.8',
                            paddingLeft: '1.25rem',
                            margin: 0,
                        }}>
                            <li>Look at the dashed <strong>original</strong> waveform</li>
                            <li>Draw the <strong>transposed</strong> waveform (solid line)</li>
                            <li>Click <strong>"Submit"</strong> to submit for marking</li>
                            <li>Complete all <strong>10 challenges</strong></li>
                        </ol>
                    </div>

                    <button
                        onClick={() => setHasStarted(true)}
                        disabled={!studentName.trim()}
                        style={{
                            ...styles.button,
                            width: '100%',
                            justifyContent: 'center',
                            padding: '1rem',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            ...(studentName.trim() ? styles.buttonPrimary : {
                                background: theme.bg.elevated,
                                color: theme.text.tertiary,
                                cursor: 'not-allowed',
                            }),
                        }}
                    >
                        Start Assessment
                        <span style={{ fontSize: '1.1rem' }}>→</span>
                    </button>
                </div>
            </div>
        );
    }

    // Main assessment interface
    return (
        <div style={{
            ...styles.container,
            padding: '1.5rem',
        }}>
            <div style={styles.bgPattern} />

            <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.25rem',
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
                            Octave Waveform Drawing Assessment
                        </div>
                        <div style={{
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            color: theme.text.primary,
                        }}>
                            {studentName}
                        </div>
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        background: theme.bg.panel,
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        border: `1px solid ${theme.border.subtle}`,
                    }}>
                        <span style={{
                            color: theme.text.tertiary,
                            fontSize: '0.8rem',
                        }}>Progress</span>
                        <div style={{
                            display: 'flex',
                            gap: '4px',
                        }}>
                            {challenges.map((_, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: copiedChallenges.has(idx)
                                            ? theme.accent.green
                                            : completedChallenges.has(idx)
                                                ? theme.accent.amber
                                                : theme.bg.elevated,
                                        boxShadow: copiedChallenges.has(idx)
                                            ? `0 0 6px ${theme.accent.greenGlow}`
                                            : 'none',
                                        transition: 'all 0.3s ease',
                                    }}
                                />
                            ))}
                        </div>
                        <span style={{
                            color: copiedChallenges.size === 10 ? theme.accent.green : theme.accent.amber,
                            fontWeight: '600',
                            fontFamily: '"SF Mono", monospace',
                            fontSize: '0.85rem',
                        }}>
                            {copiedChallenges.size}/10
                        </span>
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginBottom: '1.25rem',
                    flexWrap: 'wrap',
                }}>
                    {challenges.map((challenge, idx) => (
                        <button
                            key={idx}
                            onClick={() => goToChallenge(idx)}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '6px',
                                border: `1px solid ${
                                    currentChallenge === idx ? theme.accent.amber :
                                    copiedChallenges.has(idx) ? theme.accent.green + '60' :
                                    completedChallenges.has(idx) ? theme.accent.amber + '40' :
                                    theme.border.subtle
                                }`,
                                background: currentChallenge === idx
                                    ? `linear-gradient(135deg, ${theme.accent.amber}20 0%, ${theme.accent.amber}10 100%)`
                                    : copiedChallenges.has(idx)
                                        ? `${theme.accent.green}15`
                                        : theme.bg.panel,
                                color: currentChallenge === idx
                                    ? theme.accent.amber
                                    : copiedChallenges.has(idx)
                                        ? theme.accent.green
                                        : theme.text.secondary,
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {copiedChallenges.has(idx) && (
                                <span style={{ fontSize: '0.9rem' }}>✓</span>
                            )}
                            {idx + 1}
                        </button>
                    ))}
                </div>

                <div style={{
                    ...styles.panel,
                    padding: '1.25rem 1.5rem',
                    marginBottom: '1.25rem',
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '1.5rem',
                        flexWrap: 'wrap',
                    }}>
                        <div style={{ flex: 1 }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                marginBottom: '0.5rem',
                            }}>
                                <span style={{
                                    fontSize: '0.65rem',
                                    color: theme.text.tertiary,
                                    fontFamily: '"SF Mono", monospace',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                }}>
                                    Challenge {currentChallenge + 1} of 10
                                </span>
                                {currentChallengeData.examStyle && (
                                    <span style={{
                                        background: `${theme.accent.red}20`,
                                        border: `1px solid ${theme.accent.red}50`,
                                        color: theme.accent.red,
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: '4px',
                                        fontSize: '0.6rem',
                                        fontWeight: '700',
                                        fontFamily: '"SF Mono", monospace',
                                        letterSpacing: '0.08em',
                                    }}>
                                        EXAM STYLE
                                    </span>
                                )}
                            </div>
                            <h2 style={{
                                fontSize: '1.35rem',
                                fontWeight: '600',
                                color: theme.text.primary,
                                marginBottom: '0.5rem',
                                letterSpacing: '-0.01em',
                            }}>
                                {currentChallengeData.description}
                            </h2>
                        </div>

                        <div style={{
                            display: 'flex',
                            gap: '0.75rem',
                            flexWrap: 'wrap',
                        }}>
                            <div style={{
                                background: theme.bg.deep,
                                borderRadius: '8px',
                                padding: '0.75rem 1rem',
                                border: `1px solid ${theme.text.tertiary}30`,
                                textAlign: 'center',
                                minWidth: '90px',
                            }}>
                                <div style={{
                                    fontSize: '0.6rem',
                                    color: theme.text.tertiary,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    marginBottom: '0.25rem',
                                }}>
                                    Original
                                </div>
                                <div style={{
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    color: theme.text.secondary,
                                    fontFamily: '"SF Mono", monospace',
                                }}>
                                    {waveformShapes[currentChallengeData.originalShape]?.name}
                                </div>
                            </div>

                            <div style={{
                                background: theme.bg.deep,
                                borderRadius: '8px',
                                padding: '0.75rem 1rem',
                                border: `1px solid ${currentChallengeData.color}40`,
                                textAlign: 'center',
                                minWidth: '90px',
                            }}>
                                <div style={{
                                    fontSize: '0.6rem',
                                    color: theme.text.tertiary,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    marginBottom: '0.25rem',
                                }}>
                                    Draw
                                </div>
                                <div style={{
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    color: currentChallengeData.color,
                                    fontFamily: '"SF Mono", monospace',
                                }}>
                                    {waveformShapes[currentChallengeData.targetShape]?.name}
                                </div>
                            </div>

                            <div style={{
                                background: currentChallengeData.direction === 'lower'
                                    ? `${theme.accent.green}15`
                                    : `${theme.accent.amber}15`,
                                borderRadius: '8px',
                                padding: '0.75rem 1rem',
                                border: `1px solid ${currentChallengeData.direction === 'lower'
                                    ? theme.accent.green
                                    : theme.accent.amber}40`,
                                textAlign: 'center',
                                minWidth: '90px',
                            }}>
                                <div style={{
                                    fontSize: '0.6rem',
                                    color: theme.text.tertiary,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    marginBottom: '0.25rem',
                                }}>
                                    Octaves
                                </div>
                                <div style={{
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    color: currentChallengeData.direction === 'lower'
                                        ? theme.accent.green
                                        : theme.accent.amber,
                                    fontFamily: '"SF Mono", monospace',
                                }}>
                                    {currentChallengeData.octaves} {currentChallengeData.direction === 'lower' ? '↓' : '↑'}
                                </div>
                            </div>

                            {currentChallengeData.originalShape !== currentChallengeData.targetShape && (
                                <div style={{
                                    background: `${theme.accent.cyan}15`,
                                    borderRadius: '8px',
                                    padding: '0.75rem 1rem',
                                    border: `1px solid ${theme.accent.cyan}40`,
                                    textAlign: 'center',
                                    minWidth: '90px',
                                }}>
                                    <div style={{
                                        fontSize: '0.6rem',
                                        color: theme.text.tertiary,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.08em',
                                        marginBottom: '0.25rem',
                                    }}>
                                        Shape
                                    </div>
                                    <div style={{
                                        fontSize: '0.9rem',
                                        fontWeight: '600',
                                        color: theme.accent.cyan,
                                        fontFamily: '"SF Mono", monospace',
                                    }}>
                                        CHANGES
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{
                    background: theme.bg.deep,
                    borderRadius: '12px',
                    padding: '0.75rem',
                    marginBottom: '1rem',
                    border: `1px solid ${theme.border.medium}`,
                    boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.3)',
                }}>
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
                            borderRadius: '8px',
                            touchAction: 'none',
                        }}
                    />
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '2rem',
                    marginBottom: '1rem',
                    padding: '0.75rem',
                    background: theme.bg.panel,
                    borderRadius: '8px',
                    border: `1px solid ${theme.border.subtle}`,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                            width: '24px',
                            height: '2px',
                            borderTop: `2px dashed ${theme.text.tertiary}`,
                        }} />
                        <span style={{ color: theme.text.tertiary, fontSize: '0.8rem' }}>Original</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                            width: '24px',
                            height: '3px',
                            background: theme.accent.blue,
                            borderRadius: '2px',
                        }} />
                        <span style={{ color: theme.text.secondary, fontSize: '0.8rem' }}>Your Drawing</span>
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap',
                }}>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                            onClick={clearDrawing}
                            style={{
                                ...styles.button,
                                ...styles.buttonSecondary,
                            }}
                        >
                            Clear
                        </button>
                        <button
                            onClick={submitDrawing}
                            disabled={userPoints.length < 5 || isSubmitting}
                            style={{
                                ...styles.button,
                                ...(userPoints.length >= 5 && !isSubmitting ? (
                                    copyStatus === 'copied' ? {
                                        background: `linear-gradient(135deg, ${theme.accent.green} 0%, #5a9e32 100%)`,
                                        color: '#fff',
                                        boxShadow: `0 2px 8px rgba(124, 179, 66, 0.3)`,
                                    } : styles.buttonPrimary
                                ) : {
                                    background: theme.bg.elevated,
                                    color: theme.text.tertiary,
                                    cursor: 'not-allowed',
                                }),
                            }}
                        >
                            {isSubmitting ? (
                                <>Marking...</>
                            ) : copyStatus === 'copied' ? (
                                <>✓ Submitted</>
                            ) : (
                                <>Submit Drawing</>
                            )}
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={prevChallenge}
                            disabled={currentChallenge === 0}
                            style={{
                                ...styles.button,
                                ...(currentChallenge > 0 ? styles.buttonSecondary : {
                                    background: theme.bg.deep,
                                    color: theme.text.tertiary,
                                    cursor: 'not-allowed',
                                    border: `1px solid ${theme.border.subtle}`,
                                }),
                            }}
                        >
                            ← Prev
                        </button>
                        <button
                            onClick={nextChallenge}
                            disabled={currentChallenge === challenges.length - 1}
                            style={{
                                ...styles.button,
                                ...(currentChallenge < challenges.length - 1 ? styles.buttonSecondary : {
                                    background: theme.bg.deep,
                                    color: theme.text.tertiary,
                                    cursor: 'not-allowed',
                                    border: `1px solid ${theme.border.subtle}`,
                                }),
                            }}
                        >
                            Next →
                        </button>
                    </div>
                </div>

                {copiedChallenges.size === 10 && (
                    <div style={{
                        marginTop: '1.5rem',
                        background: `linear-gradient(135deg, ${theme.accent.green}15 0%, ${theme.accent.green}05 100%)`,
                        border: `1px solid ${theme.accent.green}40`,
                        borderRadius: '12px',
                        padding: '1.5rem',
                        textAlign: 'center',
                    }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: `${theme.accent.green}20`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1rem',
                            fontSize: '1.5rem',
                        }}>
                            ✓
                        </div>
                        <h3 style={{
                            color: theme.accent.green,
                            marginBottom: '0.5rem',
                            fontSize: '1.1rem',
                            fontWeight: '600',
                        }}>
                            Assessment Complete!
                        </h3>
                        <p style={{ color: theme.text.secondary, fontSize: '0.9rem' }}>
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
                            background: 'rgba(0, 0, 0, 0.85)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                            padding: '1rem',
                        }}
                        onClick={() => setShowFeedbackModal(false)}
                    >
                        <div
                            style={{
                                background: theme.bg.panel,
                                borderRadius: '16px',
                                padding: '1.5rem',
                                maxWidth: '600px',
                                width: '100%',
                                maxHeight: '90vh',
                                overflowY: 'auto',
                                border: `1px solid ${theme.border.medium}`,
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {feedbackError ? (
                                <>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        marginBottom: '1rem',
                                    }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: `${theme.accent.red}20`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.25rem',
                                        }}>
                                            ⚠
                                        </div>
                                        <div>
                                            <h3 style={{
                                                color: theme.accent.red,
                                                fontSize: '1.1rem',
                                                fontWeight: '600',
                                                marginBottom: '0.25rem',
                                            }}>
                                                Submission Error
                                            </h3>
                                            <p style={{ color: theme.text.secondary, fontSize: '0.85rem' }}>
                                                {feedbackError}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowFeedbackModal(false);
                                            setFeedbackError(null);
                                        }}
                                        style={{
                                            ...styles.button,
                                            ...styles.buttonSecondary,
                                            width: '100%',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        Close
                                    </button>
                                </>
                            ) : currentFeedback ? (
                                <>
                                    {/* Header with mark */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: '1.25rem',
                                    }}>
                                        <div>
                                            <h3 style={{
                                                color: theme.text.primary,
                                                fontSize: '1.1rem',
                                                fontWeight: '600',
                                                marginBottom: '0.25rem',
                                            }}>
                                                Challenge {currentChallenge + 1} Feedback
                                            </h3>
                                            <p style={{ color: theme.text.secondary, fontSize: '0.8rem' }}>
                                                AI-generated feedback • Your teacher will review
                                            </p>
                                        </div>
                                        <div style={{
                                            background: currentFeedback.suggestedMark >= 7
                                                ? `${theme.accent.green}20`
                                                : currentFeedback.suggestedMark >= 4
                                                    ? `${theme.accent.amber}20`
                                                    : `${theme.accent.red}20`,
                                            border: `2px solid ${
                                                currentFeedback.suggestedMark >= 7
                                                    ? theme.accent.green
                                                    : currentFeedback.suggestedMark >= 4
                                                        ? theme.accent.amber
                                                        : theme.accent.red
                                            }`,
                                            borderRadius: '12px',
                                            padding: '0.75rem 1rem',
                                            textAlign: 'center',
                                            minWidth: '80px',
                                        }}>
                                            <div style={{
                                                fontSize: '1.5rem',
                                                fontWeight: '700',
                                                color: currentFeedback.suggestedMark >= 7
                                                    ? theme.accent.green
                                                    : currentFeedback.suggestedMark >= 4
                                                        ? theme.accent.amber
                                                        : theme.accent.red,
                                                fontFamily: '"SF Mono", monospace',
                                            }}>
                                                {currentFeedback.suggestedMark}/10
                                            </div>
                                        </div>
                                    </div>

                                    {/* Marking criteria */}
                                    <div style={{
                                        display: 'grid',
                                        gap: '0.75rem',
                                        marginBottom: '1rem',
                                    }}>
                                        {/* Cycle count */}
                                        <div style={{
                                            background: theme.bg.deep,
                                            borderRadius: '8px',
                                            padding: '0.75rem 1rem',
                                            border: `1px solid ${currentFeedback.cycleCount?.correct ? theme.accent.green : theme.accent.red}40`,
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '0.35rem',
                                            }}>
                                                <span style={{
                                                    color: theme.text.secondary,
                                                    fontSize: '0.75rem',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                }}>
                                                    Cycle Count
                                                </span>
                                                <span style={{
                                                    color: currentFeedback.cycleCount?.correct ? theme.accent.green : theme.accent.red,
                                                    fontSize: '0.85rem',
                                                    fontWeight: '600',
                                                    fontFamily: '"SF Mono", monospace',
                                                }}>
                                                    {currentFeedback.cycleCount?.marks}/4
                                                </span>
                                            </div>
                                            <p style={{ color: theme.text.primary, fontSize: '0.85rem', margin: 0 }}>
                                                {currentFeedback.cycleCount?.feedback}
                                            </p>
                                        </div>

                                        {/* Shape accuracy */}
                                        <div style={{
                                            background: theme.bg.deep,
                                            borderRadius: '8px',
                                            padding: '0.75rem 1rem',
                                            border: `1px solid ${currentFeedback.shapeAccuracy?.correct ? theme.accent.green : theme.accent.red}40`,
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '0.35rem',
                                            }}>
                                                <span style={{
                                                    color: theme.text.secondary,
                                                    fontSize: '0.75rem',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                }}>
                                                    Shape Accuracy
                                                </span>
                                                <span style={{
                                                    color: currentFeedback.shapeAccuracy?.correct ? theme.accent.green : theme.accent.red,
                                                    fontSize: '0.85rem',
                                                    fontWeight: '600',
                                                    fontFamily: '"SF Mono", monospace',
                                                }}>
                                                    {currentFeedback.shapeAccuracy?.marks}/4
                                                </span>
                                            </div>
                                            <p style={{ color: theme.text.primary, fontSize: '0.85rem', margin: 0 }}>
                                                {currentFeedback.shapeAccuracy?.feedback}
                                            </p>
                                        </div>

                                        {/* Drawing quality */}
                                        <div style={{
                                            background: theme.bg.deep,
                                            borderRadius: '8px',
                                            padding: '0.75rem 1rem',
                                            border: `1px solid ${theme.border.subtle}`,
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '0.35rem',
                                            }}>
                                                <span style={{
                                                    color: theme.text.secondary,
                                                    fontSize: '0.75rem',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                }}>
                                                    Drawing Quality
                                                </span>
                                                <span style={{
                                                    color: theme.accent.amber,
                                                    fontSize: '0.85rem',
                                                    fontWeight: '600',
                                                    fontFamily: '"SF Mono", monospace',
                                                }}>
                                                    {currentFeedback.drawingQuality?.marks}/2
                                                </span>
                                            </div>
                                            <p style={{ color: theme.text.primary, fontSize: '0.85rem', margin: 0 }}>
                                                {currentFeedback.drawingQuality?.feedback}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Overall feedback */}
                                    <div style={{
                                        background: theme.bg.deep,
                                        borderRadius: '8px',
                                        padding: '1rem',
                                        marginBottom: '1rem',
                                        border: `1px solid ${theme.border.subtle}`,
                                    }}>
                                        <p style={{
                                            color: theme.text.primary,
                                            fontSize: '0.9rem',
                                            lineHeight: '1.6',
                                            margin: 0,
                                        }}>
                                            {currentFeedback.overallFeedback}
                                        </p>
                                    </div>

                                    {/* Strengths and improvements */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '0.75rem',
                                        marginBottom: '1rem',
                                    }}>
                                        {currentFeedback.strengths?.length > 0 && (
                                            <div style={{
                                                background: `${theme.accent.green}10`,
                                                borderRadius: '8px',
                                                padding: '0.75rem',
                                                border: `1px solid ${theme.accent.green}30`,
                                            }}>
                                                <div style={{
                                                    color: theme.accent.green,
                                                    fontSize: '0.7rem',
                                                    fontWeight: '600',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                    marginBottom: '0.5rem',
                                                }}>
                                                    Strengths
                                                </div>
                                                <ul style={{
                                                    margin: 0,
                                                    paddingLeft: '1rem',
                                                    color: theme.text.secondary,
                                                    fontSize: '0.8rem',
                                                    lineHeight: '1.5',
                                                }}>
                                                    {currentFeedback.strengths.map((s, i) => (
                                                        <li key={i}>{s}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {currentFeedback.improvements?.length > 0 && (
                                            <div style={{
                                                background: `${theme.accent.amber}10`,
                                                borderRadius: '8px',
                                                padding: '0.75rem',
                                                border: `1px solid ${theme.accent.amber}30`,
                                            }}>
                                                <div style={{
                                                    color: theme.accent.amber,
                                                    fontSize: '0.7rem',
                                                    fontWeight: '600',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                    marginBottom: '0.5rem',
                                                }}>
                                                    To Improve
                                                </div>
                                                <ul style={{
                                                    margin: 0,
                                                    paddingLeft: '1rem',
                                                    color: theme.text.secondary,
                                                    fontSize: '0.8rem',
                                                    lineHeight: '1.5',
                                                }}>
                                                    {currentFeedback.improvements.map((s, i) => (
                                                        <li key={i}>{s}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    {/* Teacher review notice */}
                                    <div style={{
                                        background: `${theme.accent.purple}15`,
                                        borderRadius: '8px',
                                        padding: '0.75rem 1rem',
                                        marginBottom: '1rem',
                                        border: `1px solid ${theme.accent.purple}40`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                    }}>
                                        <span style={{ fontSize: '1.25rem' }}>👨‍🏫</span>
                                        <p style={{
                                            color: theme.text.secondary,
                                            fontSize: '0.85rem',
                                            margin: 0,
                                        }}>
                                            <strong style={{ color: theme.accent.purple }}>Your teacher will review this.</strong>{' '}
                                            The final mark may be adjusted after teacher review.
                                        </p>
                                    </div>

                                    {/* Close button */}
                                    <button
                                        onClick={() => {
                                            setShowFeedbackModal(false);
                                            setCurrentFeedback(null);
                                            // Move to next challenge if not at the end
                                            if (currentChallenge < challenges.length - 1) {
                                                nextChallenge();
                                            }
                                        }}
                                        style={{
                                            ...styles.button,
                                            ...styles.buttonPrimary,
                                            width: '100%',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {currentChallenge < challenges.length - 1 ? 'Continue to Next Challenge →' : 'Close'}
                                    </button>
                                </>
                            ) : null}
                        </div>
                    </div>
                )}

                {showCopyModal && modalImageUrl && (
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.85)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                            padding: '1rem',
                        }}
                        onClick={handleModalClose}
                    >
                        <div
                            style={{
                                background: theme.bg.panel,
                                borderRadius: '16px',
                                padding: '1.5rem',
                                maxWidth: '800px',
                                width: '100%',
                                border: `1px solid ${theme.border.medium}`,
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '1rem',
                            }}>
                                <div>
                                    <h3 style={{
                                        color: theme.accent.amber,
                                        fontSize: '1.1rem',
                                        fontWeight: '600',
                                        marginBottom: '0.25rem',
                                    }}>
                                        Confirm your submission
                                    </h3>
                                    <p style={{
                                        color: theme.text.secondary,
                                        fontSize: '0.85rem',
                                    }}>
                                        Click <strong style={{ color: theme.text.primary }}>"Done"</strong> to submit this drawing for marking
                                    </p>
                                </div>
                                <button
                                    onClick={handleModalClose}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: theme.text.tertiary,
                                        fontSize: '1.5rem',
                                        cursor: 'pointer',
                                        padding: '0.25rem',
                                        lineHeight: 1,
                                    }}
                                >
                                    ×
                                </button>
                            </div>

                            <div style={{
                                background: theme.bg.deep,
                                borderRadius: '8px',
                                padding: '0.5rem',
                                marginBottom: '1rem',
                                border: `2px dashed ${theme.accent.amber}50`,
                            }}>
                                <img
                                    src={modalImageUrl}
                                    alt="Your waveform drawing - right-click to copy"
                                    style={{
                                        display: 'block',
                                        width: '100%',
                                        borderRadius: '4px',
                                    }}
                                />
                            </div>

                            <div style={{
                                display: 'flex',
                                gap: '1rem',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '1rem',
                                padding: '0.75rem',
                                background: theme.bg.deep,
                                borderRadius: '8px',
                                border: `1px solid ${theme.border.subtle}`,
                            }}>
                                <span style={{ color: theme.text.secondary, fontSize: '0.85rem' }}>
                                    Review your drawing above, then click <strong style={{ color: theme.accent.amber }}>"Done"</strong> to submit
                                </span>
                            </div>

                            <div style={{
                                display: 'flex',
                                gap: '0.75rem',
                                justifyContent: 'center',
                            }}>
                                <button
                                    onClick={handleModalCopied}
                                    style={{
                                        ...styles.button,
                                        ...styles.buttonPrimary,
                                        padding: '0.875rem 1.5rem',
                                    }}
                                >
                                    ✓ Submit Drawing
                                </button>
                                <button
                                    onClick={handleModalClose}
                                    style={{
                                        ...styles.button,
                                        ...styles.buttonSecondary,
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

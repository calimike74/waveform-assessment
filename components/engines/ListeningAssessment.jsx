'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { theme, typography, borderRadius, spacing, transitions } from '@/lib/theme';
import { Button, Card, Input } from '@/components/shared';

/**
 * ListeningAssessment Engine
 *
 * Supports:
 * - Audio playback with custom player controls
 * - Timed markers for specific sections
 * - Multiple question types (identification, multiple-choice, short-answer)
 * - Loop sections for focused listening
 * - Progress tracking
 * - Submission to Supabase
 */
export default function ListeningAssessment({ assessment, initialName = '' }) {
    const t = theme.light;

    // State
    const [studentName, setStudentName] = useState(initialName);
    const [hasStarted, setHasStarted] = useState(!!initialName);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [showResults, setShowResults] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // Audio state
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [audioError, setAudioError] = useState(null);
    const [loopRegion, setLoopRegion] = useState(null);
    const [playCount, setPlayCount] = useState(0);

    const questions = assessment?.questions || [];
    const currentQuestion = questions[currentQuestionIndex];
    const audioSrc = assessment?.audioFile || '';
    const maxPlays = assessment?.maxPlays || null; // null = unlimited

    // Format time (seconds to MM:SS)
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Audio event handlers
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
            setIsLoading(false);
        };

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);

            // Handle loop region
            if (loopRegion && audio.currentTime >= loopRegion.end) {
                audio.currentTime = loopRegion.start;
            }
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setPlayCount(prev => prev + 1);
        };

        const handleError = () => {
            setAudioError('Failed to load audio file');
            setIsLoading(false);
        };

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);

        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
        };
    }, [loopRegion]);

    // Play/Pause toggle
    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (maxPlays && playCount >= maxPlays && !isPlaying) {
            return; // Max plays reached
        }

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
    };

    // Seek to position
    const handleSeek = (e) => {
        const audio = audioRef.current;
        if (!audio) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        audio.currentTime = percentage * duration;
    };

    // Jump to timestamp
    const jumpToTime = (seconds) => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = seconds;
    };

    // Set loop region for a question
    const setQuestionLoop = (question) => {
        if (question.startTime !== undefined && question.endTime !== undefined) {
            setLoopRegion({ start: question.startTime, end: question.endTime });
            jumpToTime(question.startTime);
        } else {
            setLoopRegion(null);
        }
    };

    // Clear loop
    const clearLoop = () => {
        setLoopRegion(null);
    };

    // Check if all questions are answered
    const allAnswered = useMemo(() => {
        return questions.every((q, index) => {
            const answer = answers[index];
            if (q.type === 'multiple-choice' || q.type === 'identification') {
                return answer !== undefined;
            }
            return answer && answer.trim().length > 0;
        });
    }, [questions, answers]);

    // Handle answer
    const handleAnswer = (questionIndex, answer) => {
        setAnswers(prev => ({
            ...prev,
            [questionIndex]: answer
        }));
    };

    // Calculate score for auto-scored questions
    const calculateScore = useCallback(() => {
        let correct = 0;
        let total = 0;

        questions.forEach((q, index) => {
            if ((q.type === 'multiple-choice' || q.type === 'identification') && q.correctAnswer !== undefined) {
                total++;
                if (answers[index] === q.correctAnswer) {
                    correct++;
                }
            }
        });

        return { correct, total, percentage: total > 0 ? Math.round((correct / total) * 100) : 0 };
    }, [questions, answers]);

    // Navigation
    const goToQuestion = (index) => {
        setCurrentQuestionIndex(index);
        const question = questions[index];
        if (question) {
            setQuestionLoop(question);
        }
    };

    const goToNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            goToQuestion(currentQuestionIndex + 1);
        }
    };

    const goToPrevious = () => {
        if (currentQuestionIndex > 0) {
            goToQuestion(currentQuestionIndex - 1);
        }
    };

    // Submit assessment
    const handleSubmit = async () => {
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const score = calculateScore();

            const responseData = {
                answers: answers,
                score: score,
                playCount: playCount,
                questions: questions.map((q, i) => ({
                    id: q.id,
                    type: q.type,
                    question: q.question,
                    studentAnswer: answers[i],
                    ...(q.correctAnswer !== undefined && {
                        correctAnswer: q.correctAnswer,
                        isCorrect: answers[i] === q.correctAnswer,
                    }),
                    ...(q.options && { options: q.options })
                }))
            };

            const { error } = await supabase
                .from('submissions')
                .insert({
                    assessment_id: assessment.id,
                    student_name: studentName,
                    challenge_number: 1,
                    response_data: responseData,
                    ai_mark: score.percentage,
                    ai_feedback: {
                        autoScored: true,
                        correctAnswers: score.correct,
                        totalQuestions: score.total,
                        percentage: score.percentage,
                        playCount: playCount
                    }
                });

            if (error) throw error;

            setSubmitSuccess(true);
            setShowResults(true);
        } catch (error) {
            console.error('Submission error:', error);
            setSubmitError('Failed to submit. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Start screen
    if (!hasStarted) {
        return (
            <div style={{
                minHeight: '100vh',
                background: t.bg.secondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: typography.fontFamily,
                padding: spacing[8],
            }}>
                <Card variant="elevated" padding="xl" style={{ maxWidth: '520px', width: '100%' }}>
                    <div style={{ textAlign: 'center', marginBottom: spacing[6] }}>
                        <div style={{ fontSize: '3rem', marginBottom: spacing[3] }} aria-hidden="true">
                            {assessment?.icon || '🎧'}
                        </div>
                        <h1 style={{
                            color: t.text.primary,
                            fontSize: typography.size['2xl'],
                            fontWeight: typography.weight.bold,
                            marginBottom: spacing[2],
                        }}>
                            {assessment?.title || 'Listening Assessment'}
                        </h1>
                        <p style={{
                            color: t.text.secondary,
                            fontSize: typography.size.base,
                            lineHeight: typography.lineHeight.relaxed,
                        }}>
                            {assessment?.description || 'Listen carefully and answer the questions.'}
                        </p>
                    </div>

                    <div style={{
                        background: t.bg.secondary,
                        borderRadius: borderRadius.lg,
                        padding: spacing[4],
                        marginBottom: spacing[6],
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: spacing[2],
                        }}>
                            <span style={{ color: t.text.tertiary, fontSize: typography.size.sm }}>
                                Questions
                            </span>
                            <span style={{ color: t.text.primary, fontWeight: typography.weight.medium }}>
                                {questions.length}
                            </span>
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: spacing[2],
                        }}>
                            <span style={{ color: t.text.tertiary, fontSize: typography.size.sm }}>
                                Estimated time
                            </span>
                            <span style={{ color: t.text.primary, fontWeight: typography.weight.medium }}>
                                {assessment?.estimatedTime || '15-20 minutes'}
                            </span>
                        </div>
                        {maxPlays && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                            }}>
                                <span style={{ color: t.text.tertiary, fontSize: typography.size.sm }}>
                                    Maximum plays
                                </span>
                                <span style={{ color: t.text.primary, fontWeight: typography.weight.medium }}>
                                    {maxPlays}
                                </span>
                            </div>
                        )}
                    </div>

                    <div style={{
                        background: t.accent.warningLight,
                        borderRadius: borderRadius.lg,
                        padding: spacing[4],
                        marginBottom: spacing[6],
                    }}>
                        <p style={{
                            color: t.accent.warning,
                            fontSize: typography.size.sm,
                            margin: 0,
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: spacing[2],
                        }}>
                            <span style={{ fontSize: '1.2em' }}>🎧</span>
                            <span>
                                <strong>Important:</strong> Use headphones for the best listening experience.
                                Make sure you're in a quiet environment before starting.
                            </span>
                        </p>
                    </div>

                    <Input
                        label="Your Name"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="Enter your full name"
                        required
                        hint="This will appear on your submission"
                    />

                    <div style={{ marginTop: spacing[6] }}>
                        <Button
                            variant="primary"
                            size="lg"
                            fullWidth
                            disabled={!studentName.trim()}
                            onClick={() => setHasStarted(true)}
                        >
                            Start Listening Assessment
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    // Results screen
    if (showResults) {
        const score = calculateScore();

        return (
            <div style={{
                minHeight: '100vh',
                background: t.bg.secondary,
                fontFamily: typography.fontFamily,
                padding: spacing[8],
            }}>
                <div style={{ maxWidth: '640px', margin: '0 auto' }}>
                    <Card variant="elevated" padding="xl">
                        <div style={{ textAlign: 'center', marginBottom: spacing[6] }}>
                            <div style={{ fontSize: '4rem', marginBottom: spacing[3] }} aria-hidden="true">
                                {score.percentage >= 80 ? '🎉' : score.percentage >= 60 ? '👍' : '📚'}
                            </div>
                            <h1 style={{
                                color: t.text.primary,
                                fontSize: typography.size['2xl'],
                                fontWeight: typography.weight.bold,
                                marginBottom: spacing[2],
                            }}>
                                Assessment Complete!
                            </h1>
                            <p style={{ color: t.text.secondary, fontSize: typography.size.base }}>
                                {studentName}, here are your results
                            </p>
                        </div>

                        {/* Score display */}
                        <div style={{
                            background: score.percentage >= 80 ? t.accent.successLight :
                                score.percentage >= 60 ? t.accent.warningLight : t.accent.errorLight,
                            borderRadius: borderRadius.xl,
                            padding: spacing[6],
                            textAlign: 'center',
                            marginBottom: spacing[6],
                        }}>
                            <div style={{
                                fontSize: typography.size['4xl'],
                                fontWeight: typography.weight.bold,
                                color: score.percentage >= 80 ? t.accent.success :
                                    score.percentage >= 60 ? t.accent.warning : t.accent.error,
                            }}>
                                {score.percentage}%
                            </div>
                            <div style={{
                                color: t.text.secondary,
                                fontSize: typography.size.base,
                                marginTop: spacing[1],
                            }}>
                                {score.correct} of {score.total} correct
                            </div>
                            <div style={{
                                color: t.text.tertiary,
                                fontSize: typography.size.sm,
                                marginTop: spacing[2],
                            }}>
                                Audio played {playCount} time{playCount !== 1 ? 's' : ''}
                            </div>
                        </div>

                        {/* Review answers */}
                        <h2 style={{
                            color: t.text.primary,
                            fontSize: typography.size.lg,
                            fontWeight: typography.weight.semibold,
                            marginBottom: spacing[4],
                        }}>
                            Review Your Answers
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
                            {questions.map((q, index) => {
                                const studentAnswer = answers[index];
                                const isCorrect = q.correctAnswer !== undefined && studentAnswer === q.correctAnswer;
                                const hasCorrectAnswer = q.correctAnswer !== undefined;

                                return (
                                    <div
                                        key={q.id || index}
                                        style={{
                                            background: t.bg.secondary,
                                            borderRadius: borderRadius.lg,
                                            padding: spacing[4],
                                            borderLeft: `4px solid ${hasCorrectAnswer
                                                ? (isCorrect ? t.accent.success : t.accent.error)
                                                : t.accent.info
                                                }`,
                                        }}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: spacing[2],
                                            marginBottom: spacing[2],
                                        }}>
                                            <span style={{
                                                background: t.accent.primary,
                                                color: t.text.inverse,
                                                borderRadius: borderRadius.full,
                                                width: '24px',
                                                height: '24px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: typography.size.sm,
                                                fontWeight: typography.weight.medium,
                                                flexShrink: 0,
                                            }}>
                                                {index + 1}
                                            </span>
                                            <p style={{
                                                color: t.text.primary,
                                                fontSize: typography.size.base,
                                                margin: 0,
                                            }}>
                                                {q.question}
                                            </p>
                                        </div>

                                        <div style={{ marginLeft: '32px' }}>
                                            <div style={{
                                                fontSize: typography.size.sm,
                                                color: t.text.secondary,
                                            }}>
                                                <strong>Your answer:</strong>{' '}
                                                {q.options
                                                    ? q.options[studentAnswer] || 'Not answered'
                                                    : studentAnswer || 'Not answered'
                                                }
                                            </div>
                                            {hasCorrectAnswer && !isCorrect && (
                                                <div style={{
                                                    fontSize: typography.size.sm,
                                                    color: t.accent.success,
                                                    marginTop: spacing[1],
                                                }}>
                                                    <strong>Correct answer:</strong>{' '}
                                                    {q.options ? q.options[q.correctAnswer] : q.correctAnswer}
                                                </div>
                                            )}
                                            {q.explanation && (
                                                <div style={{
                                                    fontSize: typography.size.sm,
                                                    color: t.text.tertiary,
                                                    marginTop: spacing[2],
                                                    fontStyle: 'italic',
                                                }}>
                                                    {q.explanation}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {submitSuccess && (
                            <div style={{
                                background: t.accent.successLight,
                                color: t.accent.success,
                                borderRadius: borderRadius.lg,
                                padding: spacing[4],
                                marginTop: spacing[6],
                                textAlign: 'center',
                            }}>
                                Your results have been submitted successfully.
                            </div>
                        )}

                        <div style={{ marginTop: spacing[6] }}>
                            <Button
                                variant="secondary"
                                fullWidth
                                onClick={() => window.location.href = '/'}
                            >
                                Back to Hub
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    // Main assessment screen
    return (
        <div style={{
            minHeight: '100vh',
            background: t.bg.secondary,
            fontFamily: typography.fontFamily,
        }}>
            {/* Hidden audio element */}
            <audio ref={audioRef} src={audioSrc} preload="metadata" />

            {/* Header */}
            <header style={{
                background: t.bg.primary,
                borderBottom: `1px solid ${t.border.subtle}`,
                padding: `${spacing[3]} ${spacing[6]}`,
                position: 'sticky',
                top: 0,
                zIndex: 10,
            }}>
                <div style={{
                    maxWidth: '900px',
                    margin: '0 auto',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <div>
                        <h1 style={{
                            color: t.text.primary,
                            fontSize: typography.size.lg,
                            fontWeight: typography.weight.semibold,
                            margin: 0,
                        }}>
                            {assessment?.title || 'Listening Assessment'}
                        </h1>
                        <p style={{
                            color: t.text.tertiary,
                            fontSize: typography.size.sm,
                            margin: 0,
                        }}>
                            {studentName}
                        </p>
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing[4],
                    }}>
                        {maxPlays && (
                            <div style={{
                                color: playCount >= maxPlays ? t.accent.error : t.text.secondary,
                                fontSize: typography.size.sm,
                            }}>
                                Plays: {playCount}/{maxPlays}
                            </div>
                        )}
                        <div style={{
                            color: t.text.secondary,
                            fontSize: typography.size.sm,
                        }}>
                            Question {currentQuestionIndex + 1} of {questions.length}
                        </div>
                    </div>
                </div>
            </header>

            {/* Audio Player */}
            <div style={{
                background: t.bg.primary,
                borderBottom: `1px solid ${t.border.subtle}`,
                padding: `${spacing[4]} ${spacing[6]}`,
            }}>
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    {audioError ? (
                        <div style={{
                            background: t.accent.errorLight,
                            color: t.accent.error,
                            padding: spacing[4],
                            borderRadius: borderRadius.lg,
                            textAlign: 'center',
                        }}>
                            {audioError}
                        </div>
                    ) : (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing[4],
                        }}>
                            {/* Play button */}
                            <button
                                onClick={togglePlay}
                                disabled={isLoading || (maxPlays && playCount >= maxPlays && !isPlaying)}
                                aria-label={isPlaying ? 'Pause' : 'Play'}
                                style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: borderRadius.full,
                                    background: t.accent.primary,
                                    color: t.text.inverse,
                                    border: 'none',
                                    cursor: isLoading || (maxPlays && playCount >= maxPlays && !isPlaying) ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: isLoading || (maxPlays && playCount >= maxPlays && !isPlaying) ? 0.5 : 1,
                                    transition: `all ${transitions.fast} ${transitions.easing}`,
                                    flexShrink: 0,
                                }}
                            >
                                {isLoading ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                                        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                                        <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                                        <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                                    </svg>
                                ) : isPlaying ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <rect x="6" y="4" width="4" height="16" />
                                        <rect x="14" y="4" width="4" height="16" />
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <polygon points="5,3 19,12 5,21" />
                                    </svg>
                                )}
                            </button>

                            {/* Progress bar */}
                            <div style={{ flex: 1 }}>
                                <div
                                    onClick={handleSeek}
                                    style={{
                                        height: '8px',
                                        background: t.border.subtle,
                                        borderRadius: borderRadius.full,
                                        cursor: 'pointer',
                                        position: 'relative',
                                        overflow: 'hidden',
                                    }}
                                    role="slider"
                                    aria-label="Audio progress"
                                    aria-valuemin={0}
                                    aria-valuemax={duration}
                                    aria-valuenow={currentTime}
                                >
                                    {/* Loop region indicator */}
                                    {loopRegion && (
                                        <div style={{
                                            position: 'absolute',
                                            left: `${(loopRegion.start / duration) * 100}%`,
                                            width: `${((loopRegion.end - loopRegion.start) / duration) * 100}%`,
                                            height: '100%',
                                            background: `${t.accent.warning}40`,
                                        }} />
                                    )}
                                    {/* Progress */}
                                    <div style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                        height: '100%',
                                        width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                                        background: t.accent.primary,
                                        borderRadius: borderRadius.full,
                                        transition: 'width 0.1s linear',
                                    }} />
                                </div>

                                {/* Time display */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginTop: spacing[1],
                                    fontSize: typography.size.xs,
                                    color: t.text.tertiary,
                                    fontFamily: typography.fontFamilyMono,
                                }}>
                                    <span>{formatTime(currentTime)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>

                            {/* Loop controls */}
                            {loopRegion && (
                                <button
                                    onClick={clearLoop}
                                    style={{
                                        padding: `${spacing[2]} ${spacing[3]}`,
                                        background: t.accent.warningLight,
                                        color: t.accent.warning,
                                        border: 'none',
                                        borderRadius: borderRadius.lg,
                                        fontSize: typography.size.sm,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: spacing[1],
                                    }}
                                    aria-label="Clear loop"
                                >
                                    🔁 Loop On
                                </button>
                            )}
                        </div>
                    )}

                    {/* Question timestamp buttons */}
                    {currentQuestion?.startTime !== undefined && (
                        <div style={{
                            marginTop: spacing[3],
                            display: 'flex',
                            gap: spacing[2],
                            flexWrap: 'wrap',
                        }}>
                            <button
                                onClick={() => {
                                    jumpToTime(currentQuestion.startTime);
                                    setQuestionLoop(currentQuestion);
                                }}
                                style={{
                                    padding: `${spacing[1]} ${spacing[3]}`,
                                    background: t.bg.secondary,
                                    color: t.text.secondary,
                                    border: `1px solid ${t.border.subtle}`,
                                    borderRadius: borderRadius.full,
                                    fontSize: typography.size.sm,
                                    cursor: 'pointer',
                                }}
                            >
                                Jump to section ({formatTime(currentQuestion.startTime)} - {formatTime(currentQuestion.endTime)})
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Progress bar */}
            <div style={{
                background: t.border.subtle,
                height: '4px',
            }}>
                <div style={{
                    background: t.accent.primary,
                    height: '100%',
                    width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                    transition: `width ${transitions.normal} ${transitions.easing}`,
                }} />
            </div>

            {/* Question navigation */}
            <div style={{
                background: t.bg.primary,
                padding: `${spacing[3]} ${spacing[6]}`,
                borderBottom: `1px solid ${t.border.subtle}`,
            }}>
                <div style={{
                    maxWidth: '900px',
                    margin: '0 auto',
                    display: 'flex',
                    gap: spacing[2],
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                }}>
                    {questions.map((q, index) => {
                        const answer = answers[index];
                        const isAnswered = q.type === 'multiple-choice' || q.type === 'identification'
                            ? answer !== undefined
                            : answer && answer.trim().length > 0;
                        const isCurrent = index === currentQuestionIndex;

                        return (
                            <button
                                key={index}
                                onClick={() => goToQuestion(index)}
                                aria-label={`Go to question ${index + 1}${isAnswered ? ', answered' : ''}`}
                                aria-current={isCurrent ? 'step' : undefined}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: borderRadius.full,
                                    border: isCurrent ? `2px solid ${t.accent.primary}` : `1px solid ${t.border.medium}`,
                                    background: isAnswered ? t.accent.primary : t.bg.primary,
                                    color: isAnswered ? t.text.inverse : t.text.secondary,
                                    fontSize: typography.size.sm,
                                    fontWeight: typography.weight.medium,
                                    cursor: 'pointer',
                                    transition: `all ${transitions.fast} ${transitions.easing}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {index + 1}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main content */}
            <main style={{
                maxWidth: '900px',
                margin: '0 auto',
                padding: spacing[6],
            }}>
                {currentQuestion && (
                    <Card variant="elevated" padding="lg">
                        {/* Question type badge */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing[2],
                            marginBottom: spacing[4],
                        }}>
                            <span style={{
                                display: 'inline-block',
                                background: currentQuestion.type === 'identification'
                                    ? t.accent.infoLight
                                    : currentQuestion.type === 'multiple-choice'
                                        ? t.accent.successLight
                                        : t.accent.warningLight,
                                color: currentQuestion.type === 'identification'
                                    ? t.accent.info
                                    : currentQuestion.type === 'multiple-choice'
                                        ? t.accent.success
                                        : t.accent.warning,
                                fontSize: typography.size.xs,
                                fontWeight: typography.weight.medium,
                                padding: `${spacing[1]} ${spacing[2]}`,
                                borderRadius: borderRadius.full,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            }}>
                                {currentQuestion.type === 'identification' ? 'Identification' :
                                    currentQuestion.type === 'multiple-choice' ? 'Multiple Choice' : 'Short Answer'}
                            </span>
                            {currentQuestion.startTime !== undefined && (
                                <span style={{
                                    fontSize: typography.size.sm,
                                    color: t.text.tertiary,
                                }}>
                                    📍 {formatTime(currentQuestion.startTime)} - {formatTime(currentQuestion.endTime)}
                                </span>
                            )}
                        </div>

                        {/* Question */}
                        <h2 style={{
                            color: t.text.primary,
                            fontSize: typography.size.xl,
                            fontWeight: typography.weight.semibold,
                            lineHeight: typography.lineHeight.relaxed,
                            marginBottom: spacing[6],
                        }}>
                            {currentQuestion.question}
                        </h2>

                        {/* Context/instruction */}
                        {currentQuestion.context && (
                            <p style={{
                                color: t.text.secondary,
                                fontSize: typography.size.base,
                                lineHeight: typography.lineHeight.relaxed,
                                marginBottom: spacing[4],
                                padding: spacing[4],
                                background: t.bg.secondary,
                                borderRadius: borderRadius.lg,
                            }}>
                                {currentQuestion.context}
                            </p>
                        )}

                        {/* Multiple choice / Identification options */}
                        {(currentQuestion.type === 'multiple-choice' || currentQuestion.type === 'identification') && currentQuestion.options && (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: spacing[3],
                            }} role="radiogroup" aria-label="Answer options">
                                {currentQuestion.options.map((option, optIndex) => {
                                    const isSelected = answers[currentQuestionIndex] === optIndex;

                                    return (
                                        <button
                                            key={optIndex}
                                            onClick={() => handleAnswer(currentQuestionIndex, optIndex)}
                                            role="radio"
                                            aria-checked={isSelected}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: spacing[3],
                                                padding: spacing[4],
                                                background: isSelected ? `${t.accent.primary}10` : t.bg.secondary,
                                                border: `2px solid ${isSelected ? t.accent.primary : t.border.subtle}`,
                                                borderRadius: borderRadius.lg,
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                width: '100%',
                                                transition: `all ${transitions.fast} ${transitions.easing}`,
                                            }}
                                        >
                                            <span style={{
                                                width: '28px',
                                                height: '28px',
                                                borderRadius: borderRadius.full,
                                                background: isSelected ? t.accent.primary : t.bg.primary,
                                                border: isSelected ? 'none' : `2px solid ${t.border.medium}`,
                                                color: isSelected ? t.text.inverse : t.text.tertiary,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: typography.size.sm,
                                                fontWeight: typography.weight.medium,
                                                flexShrink: 0,
                                            }}>
                                                {String.fromCharCode(65 + optIndex)}
                                            </span>
                                            <span style={{
                                                color: t.text.primary,
                                                fontSize: typography.size.base,
                                            }}>
                                                {option}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Short answer input */}
                        {currentQuestion.type === 'short-answer' && (
                            <div>
                                <textarea
                                    value={answers[currentQuestionIndex] || ''}
                                    onChange={(e) => handleAnswer(currentQuestionIndex, e.target.value)}
                                    placeholder="Type your answer here..."
                                    rows={4}
                                    style={{
                                        width: '100%',
                                        padding: spacing[4],
                                        fontFamily: typography.fontFamily,
                                        fontSize: typography.size.base,
                                        lineHeight: typography.lineHeight.relaxed,
                                        border: `1px solid ${t.border.input}`,
                                        borderRadius: borderRadius.lg,
                                        resize: 'vertical',
                                        outline: 'none',
                                        transition: `border-color ${transitions.fast} ${transitions.easing}`,
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = t.border.focus;
                                        e.target.style.boxShadow = `0 0 0 3px rgba(37, 99, 235, 0.1)`;
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = t.border.input;
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                                {currentQuestion.hint && (
                                    <p style={{
                                        color: t.text.tertiary,
                                        fontSize: typography.size.sm,
                                        marginTop: spacing[2],
                                        fontStyle: 'italic',
                                    }}>
                                        Hint: {currentQuestion.hint}
                                    </p>
                                )}
                            </div>
                        )}
                    </Card>
                )}

                {/* Navigation buttons */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: spacing[6],
                    gap: spacing[3],
                }}>
                    <Button
                        variant="secondary"
                        onClick={goToPrevious}
                        disabled={currentQuestionIndex === 0}
                    >
                        Previous
                    </Button>

                    <div style={{ display: 'flex', gap: spacing[3] }}>
                        {currentQuestionIndex < questions.length - 1 ? (
                            <Button
                                variant="primary"
                                onClick={goToNext}
                            >
                                Next
                            </Button>
                        ) : (
                            <Button
                                variant="success"
                                onClick={handleSubmit}
                                disabled={!allAnswered || isSubmitting}
                                loading={isSubmitting}
                            >
                                Submit Assessment
                            </Button>
                        )}
                    </div>
                </div>

                {submitError && (
                    <div style={{
                        marginTop: spacing[4],
                        padding: spacing[4],
                        background: t.accent.errorLight,
                        color: t.accent.error,
                        borderRadius: borderRadius.lg,
                        textAlign: 'center',
                    }}>
                        {submitError}
                    </div>
                )}
            </main>
        </div>
    );
}

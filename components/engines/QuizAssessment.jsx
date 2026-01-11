'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { theme, typography, borderRadius, spacing, transitions } from '@/lib/theme';
import { Button, Card, Input } from '@/components/shared';

/**
 * QuizAssessment Engine
 *
 * Supports:
 * - Multiple choice questions (auto-scored)
 * - Short answer questions (AI or manual marking)
 * - Progress tracking
 * - Immediate feedback for auto-scored questions
 * - Submission to Supabase
 */
export default function QuizAssessment({ assessment, initialName = '' }) {
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
    const [showFeedback, setShowFeedback] = useState({});

    const questions = assessment?.questions || [];
    const currentQuestion = questions[currentQuestionIndex];

    // Calculate score for auto-scored questions
    const calculateScore = useCallback(() => {
        let correct = 0;
        let total = 0;

        questions.forEach((q, index) => {
            if (q.type === 'multiple-choice' && q.correctAnswer !== undefined) {
                total++;
                if (answers[index] === q.correctAnswer) {
                    correct++;
                }
            }
        });

        return { correct, total, percentage: total > 0 ? Math.round((correct / total) * 100) : 0 };
    }, [questions, answers]);

    // Check if current question is answered
    const isCurrentAnswered = useMemo(() => {
        const answer = answers[currentQuestionIndex];
        if (currentQuestion?.type === 'multiple-choice') {
            return answer !== undefined;
        }
        return answer && answer.trim().length > 0;
    }, [answers, currentQuestionIndex, currentQuestion]);

    // Check if all questions are answered
    const allAnswered = useMemo(() => {
        return questions.every((q, index) => {
            const answer = answers[index];
            if (q.type === 'multiple-choice') {
                return answer !== undefined;
            }
            return answer && answer.trim().length > 0;
        });
    }, [questions, answers]);

    // Handle answer selection/input
    const handleAnswer = (questionIndex, answer) => {
        setAnswers(prev => ({
            ...prev,
            [questionIndex]: answer
        }));
    };

    // Check answer and show feedback (for multiple choice)
    const checkAnswer = () => {
        if (currentQuestion?.type === 'multiple-choice') {
            setShowFeedback(prev => ({
                ...prev,
                [currentQuestionIndex]: true
            }));
        }
    };

    // Navigation
    const goToNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const goToPrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const goToQuestion = (index) => {
        setCurrentQuestionIndex(index);
    };

    // Submit assessment
    const handleSubmit = async () => {
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const score = calculateScore();

            // Prepare response data
            const responseData = {
                answers: answers,
                score: score,
                questions: questions.map((q, i) => ({
                    id: q.id,
                    type: q.type,
                    question: q.question,
                    studentAnswer: answers[i],
                    ...(q.type === 'multiple-choice' && {
                        correctAnswer: q.correctAnswer,
                        isCorrect: answers[i] === q.correctAnswer,
                        options: q.options
                    })
                }))
            };

            // Save to Supabase
            const { error } = await supabase
                .from('submissions')
                .insert({
                    assessment_id: assessment.id,
                    student_name: studentName,
                    challenge_number: 1, // Quiz is one submission
                    response_data: responseData,
                    ai_mark: score.percentage, // Auto-score percentage
                    ai_feedback: {
                        autoScored: true,
                        correctAnswers: score.correct,
                        totalQuestions: score.total,
                        percentage: score.percentage
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
                <Card variant="elevated" padding="xl" style={{ maxWidth: '480px', width: '100%' }}>
                    <div style={{ textAlign: 'center', marginBottom: spacing[6] }}>
                        <div style={{ fontSize: '3rem', marginBottom: spacing[3] }} aria-hidden="true">
                            {assessment?.icon || '📝'}
                        </div>
                        <h1 style={{
                            color: t.text.primary,
                            fontSize: typography.size['2xl'],
                            fontWeight: typography.weight.bold,
                            marginBottom: spacing[2],
                        }}>
                            {assessment?.title || 'Quiz Assessment'}
                        </h1>
                        <p style={{
                            color: t.text.secondary,
                            fontSize: typography.size.base,
                            lineHeight: typography.lineHeight.relaxed,
                        }}>
                            {assessment?.description || 'Complete the quiz to test your knowledge.'}
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
                        }}>
                            <span style={{ color: t.text.tertiary, fontSize: typography.size.sm }}>
                                Estimated time
                            </span>
                            <span style={{ color: t.text.primary, fontWeight: typography.weight.medium }}>
                                {assessment?.estimatedTime || '10-15 minutes'}
                            </span>
                        </div>
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
                            Start Quiz
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
                            <div style={{
                                fontSize: '4rem',
                                marginBottom: spacing[3],
                            }} aria-hidden="true">
                                {score.percentage >= 80 ? '🎉' : score.percentage >= 60 ? '👍' : '📚'}
                            </div>
                            <h1 style={{
                                color: t.text.primary,
                                fontSize: typography.size['2xl'],
                                fontWeight: typography.weight.bold,
                                marginBottom: spacing[2],
                            }}>
                                Quiz Complete!
                            </h1>
                            <p style={{
                                color: t.text.secondary,
                                fontSize: typography.size.base,
                            }}>
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
                                const isCorrect = q.type === 'multiple-choice' &&
                                    studentAnswer === q.correctAnswer;

                                return (
                                    <div
                                        key={q.id || index}
                                        style={{
                                            background: t.bg.secondary,
                                            borderRadius: borderRadius.lg,
                                            padding: spacing[4],
                                            borderLeft: `4px solid ${q.type === 'multiple-choice'
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
                                                {q.type === 'multiple-choice'
                                                    ? q.options?.[studentAnswer] || 'Not answered'
                                                    : studentAnswer || 'Not answered'
                                                }
                                            </div>
                                            {q.type === 'multiple-choice' && !isCorrect && (
                                                <div style={{
                                                    fontSize: typography.size.sm,
                                                    color: t.accent.success,
                                                    marginTop: spacing[1],
                                                }}>
                                                    <strong>Correct answer:</strong>{' '}
                                                    {q.options?.[q.correctAnswer]}
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

                        <div style={{ marginTop: spacing[6], display: 'flex', gap: spacing[3] }}>
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

    // Question screen
    return (
        <div style={{
            minHeight: '100vh',
            background: t.bg.secondary,
            fontFamily: typography.fontFamily,
        }}>
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
                    maxWidth: '800px',
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
                            {assessment?.title || 'Quiz'}
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
                        color: t.text.secondary,
                        fontSize: typography.size.sm,
                    }}>
                        Question {currentQuestionIndex + 1} of {questions.length}
                    </div>
                </div>
            </header>

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

            {/* Question navigation dots */}
            <div style={{
                background: t.bg.primary,
                padding: `${spacing[3]} ${spacing[6]}`,
                borderBottom: `1px solid ${t.border.subtle}`,
            }}>
                <div style={{
                    maxWidth: '800px',
                    margin: '0 auto',
                    display: 'flex',
                    gap: spacing[2],
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                }}>
                    {questions.map((q, index) => {
                        const isAnswered = answers[index] !== undefined &&
                            (q.type === 'multiple-choice' || answers[index]?.trim().length > 0);
                        const isCurrent = index === currentQuestionIndex;
                        const feedbackShown = showFeedback[index];
                        const isCorrect = q.type === 'multiple-choice' &&
                            feedbackShown && answers[index] === q.correctAnswer;
                        const isIncorrect = q.type === 'multiple-choice' &&
                            feedbackShown && answers[index] !== q.correctAnswer;

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
                                    background: isCorrect ? t.accent.successLight :
                                        isIncorrect ? t.accent.errorLight :
                                            isAnswered ? t.accent.primary :
                                                t.bg.primary,
                                    color: isCorrect ? t.accent.success :
                                        isIncorrect ? t.accent.error :
                                            isAnswered ? t.text.inverse :
                                                t.text.secondary,
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
                maxWidth: '800px',
                margin: '0 auto',
                padding: spacing[6],
            }}>
                {currentQuestion && (
                    <Card variant="elevated" padding="lg">
                        {/* Question type badge */}
                        <div style={{
                            display: 'inline-block',
                            background: currentQuestion.type === 'multiple-choice'
                                ? t.accent.infoLight : t.accent.warningLight,
                            color: currentQuestion.type === 'multiple-choice'
                                ? t.accent.info : t.accent.warning,
                            fontSize: typography.size.xs,
                            fontWeight: typography.weight.medium,
                            padding: `${spacing[1]} ${spacing[2]}`,
                            borderRadius: borderRadius.full,
                            marginBottom: spacing[4],
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                        }}>
                            {currentQuestion.type === 'multiple-choice' ? 'Multiple Choice' : 'Short Answer'}
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

                        {/* Multiple choice options */}
                        {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: spacing[3],
                            }} role="radiogroup" aria-label="Answer options">
                                {currentQuestion.options.map((option, optIndex) => {
                                    const isSelected = answers[currentQuestionIndex] === optIndex;
                                    const feedbackActive = showFeedback[currentQuestionIndex];
                                    const isCorrectOption = optIndex === currentQuestion.correctAnswer;
                                    const showAsCorrect = feedbackActive && isCorrectOption;
                                    const showAsIncorrect = feedbackActive && isSelected && !isCorrectOption;

                                    return (
                                        <button
                                            key={optIndex}
                                            onClick={() => handleAnswer(currentQuestionIndex, optIndex)}
                                            role="radio"
                                            aria-checked={isSelected}
                                            disabled={feedbackActive}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: spacing[3],
                                                padding: spacing[4],
                                                background: showAsCorrect ? t.accent.successLight :
                                                    showAsIncorrect ? t.accent.errorLight :
                                                        isSelected ? `${t.accent.primary}10` :
                                                            t.bg.secondary,
                                                border: `2px solid ${showAsCorrect ? t.accent.success :
                                                    showAsIncorrect ? t.accent.error :
                                                        isSelected ? t.accent.primary :
                                                            t.border.subtle
                                                    }`,
                                                borderRadius: borderRadius.lg,
                                                cursor: feedbackActive ? 'default' : 'pointer',
                                                textAlign: 'left',
                                                width: '100%',
                                                transition: `all ${transitions.fast} ${transitions.easing}`,
                                                opacity: feedbackActive && !isSelected && !isCorrectOption ? 0.6 : 1,
                                            }}
                                        >
                                            <span style={{
                                                width: '28px',
                                                height: '28px',
                                                borderRadius: borderRadius.full,
                                                background: showAsCorrect ? t.accent.success :
                                                    showAsIncorrect ? t.accent.error :
                                                        isSelected ? t.accent.primary :
                                                            t.bg.primary,
                                                border: isSelected || showAsCorrect || showAsIncorrect
                                                    ? 'none'
                                                    : `2px solid ${t.border.medium}`,
                                                color: isSelected || showAsCorrect || showAsIncorrect
                                                    ? t.text.inverse
                                                    : t.text.tertiary,
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
                                            {showAsCorrect && (
                                                <span style={{ marginLeft: 'auto', color: t.accent.success }}>
                                                    ✓
                                                </span>
                                            )}
                                            {showAsIncorrect && (
                                                <span style={{ marginLeft: 'auto', color: t.accent.error }}>
                                                    ✗
                                                </span>
                                            )}
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

                        {/* Feedback message */}
                        {showFeedback[currentQuestionIndex] && currentQuestion.type === 'multiple-choice' && (
                            <div style={{
                                marginTop: spacing[4],
                                padding: spacing[4],
                                background: answers[currentQuestionIndex] === currentQuestion.correctAnswer
                                    ? t.accent.successLight : t.accent.errorLight,
                                borderRadius: borderRadius.lg,
                            }}>
                                <p style={{
                                    color: answers[currentQuestionIndex] === currentQuestion.correctAnswer
                                        ? t.accent.success : t.accent.error,
                                    fontWeight: typography.weight.medium,
                                    margin: 0,
                                    marginBottom: currentQuestion.explanation ? spacing[2] : 0,
                                }}>
                                    {answers[currentQuestionIndex] === currentQuestion.correctAnswer
                                        ? 'Correct!' : 'Incorrect'}
                                </p>
                                {currentQuestion.explanation && (
                                    <p style={{
                                        color: t.text.secondary,
                                        fontSize: typography.size.sm,
                                        margin: 0,
                                    }}>
                                        {currentQuestion.explanation}
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
                        {currentQuestion?.type === 'multiple-choice' &&
                            isCurrentAnswered &&
                            !showFeedback[currentQuestionIndex] && (
                                <Button
                                    variant="ghost"
                                    onClick={checkAnswer}
                                >
                                    Check Answer
                                </Button>
                            )}

                        {currentQuestionIndex < questions.length - 1 ? (
                            <Button
                                variant="primary"
                                onClick={goToNext}
                                disabled={!isCurrentAnswered}
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
                                Submit Quiz
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

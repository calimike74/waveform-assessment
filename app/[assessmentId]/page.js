'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { getAssessment, assessmentExists } from '@/lib/assessments';
import { theme, typography, borderRadius, spacing, transitions } from '@/lib/theme';
import WaveformAssessment from '@/components/WaveformAssessment';
import QuizAssessment from '@/components/engines/QuizAssessment';
import ListeningAssessment from '@/components/engines/ListeningAssessment';

export default function AssessmentPage() {
    const params = useParams();
    const searchParams = useSearchParams();

    const assessmentId = params.assessmentId;
    const studentName = searchParams.get('name') || '';
    const t = theme.light; // Use light theme

    // Check if assessment exists
    if (!assessmentExists(assessmentId)) {
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
                        borderRadius: borderRadius['2xl'],
                        border: `1px solid ${t.border.subtle}`,
                        boxShadow: t.shadow.lg,
                        padding: spacing[10],
                        maxWidth: '480px',
                        textAlign: 'center',
                    }}
                    role="main"
                    aria-labelledby="error-title"
                >
                    <div
                        style={{
                            fontSize: '3.5rem',
                            marginBottom: spacing[4],
                        }}
                        aria-hidden="true"
                    >
                        🔍
                    </div>
                    <h1
                        id="error-title"
                        style={{
                            color: t.text.primary,
                            fontSize: typography.size['2xl'],
                            fontWeight: typography.weight.bold,
                            marginBottom: spacing[2],
                            lineHeight: typography.lineHeight.tight,
                        }}
                    >
                        Assessment Not Found
                    </h1>
                    <p
                        style={{
                            color: t.text.secondary,
                            fontSize: typography.size.base,
                            lineHeight: typography.lineHeight.relaxed,
                            marginBottom: spacing[6],
                        }}
                    >
                        The assessment "{assessmentId}" doesn't exist or may have been removed.
                    </p>
                    <a
                        href="/"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: spacing[2],
                            padding: `${spacing[3]} ${spacing[6]}`,
                            background: t.accent.primary,
                            color: t.text.inverse,
                            borderRadius: borderRadius.lg,
                            textDecoration: 'none',
                            fontWeight: typography.weight.semibold,
                            fontSize: typography.size.base,
                            transition: `all ${transitions.fast} ${transitions.easing}`,
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
                        <span aria-hidden="true">←</span>
                        Back to Assessment Hub
                    </a>
                </main>
            </div>
        );
    }

    const assessment = getAssessment(assessmentId);

    // Route to the appropriate assessment component based on type
    switch (assessment.type) {
        case 'drawing':
            // For now, only waveform-octaves is implemented
            // Later, we'll make DrawingAssessment generic
            if (assessmentId === 'waveform-octaves') {
                return <WaveformAssessment initialName={studentName} />;
            }
            // Future: return <DrawingAssessment assessment={assessment} studentName={studentName} />;
            break;

        case 'quiz':
            return <QuizAssessment assessment={assessment} initialName={studentName} />;

        case 'listening':
            return <ListeningAssessment assessment={assessment} initialName={studentName} />;

        default:
            return (
                <ComingSoon
                    title={assessment.title}
                    type="Assessment"
                    theme={t}
                />
            );
    }

    // Fallback
    return <WaveformAssessment initialName={studentName} />;
}

// Placeholder component for assessments not yet implemented
function ComingSoon({ title, type, theme: t }) {
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
                    borderRadius: borderRadius['2xl'],
                    border: `1px solid ${t.border.subtle}`,
                    boxShadow: t.shadow.lg,
                    padding: spacing[10],
                    maxWidth: '480px',
                    textAlign: 'center',
                }}
                role="main"
                aria-labelledby="coming-soon-title"
            >
                <div
                    style={{
                        fontSize: '3.5rem',
                        marginBottom: spacing[4],
                    }}
                    aria-hidden="true"
                >
                    🚧
                </div>
                <h1
                    id="coming-soon-title"
                    style={{
                        color: t.text.primary,
                        fontSize: typography.size['2xl'],
                        fontWeight: typography.weight.bold,
                        marginBottom: spacing[2],
                        lineHeight: typography.lineHeight.tight,
                    }}
                >
                    {title}
                </h1>
                <p
                    style={{
                        color: t.accent.warning,
                        fontSize: typography.size.base,
                        fontWeight: typography.weight.medium,
                        marginBottom: spacing[2],
                    }}
                >
                    {type} coming soon!
                </p>
                <p
                    style={{
                        color: t.text.tertiary,
                        fontSize: typography.size.sm,
                        lineHeight: typography.lineHeight.relaxed,
                        marginBottom: spacing[6],
                    }}
                >
                    This assessment type is currently being developed. Check back later.
                </p>
                <a
                    href="/"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: spacing[2],
                        padding: `${spacing[3]} ${spacing[6]}`,
                        background: t.accent.primary,
                        color: t.text.inverse,
                        borderRadius: borderRadius.lg,
                        textDecoration: 'none',
                        fontWeight: typography.weight.semibold,
                        fontSize: typography.size.base,
                        transition: `all ${transitions.fast} ${transitions.easing}`,
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
                    <span aria-hidden="true">←</span>
                    Back to Assessment Hub
                </a>
            </main>
        </div>
    );
}

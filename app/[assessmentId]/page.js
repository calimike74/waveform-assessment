'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { getAssessment, assessmentExists } from '@/lib/assessments';
import WaveformAssessment from '@/components/WaveformAssessment';
// Future imports:
// import QuizAssessment from '@/components/engines/QuizAssessment';
// import ListeningAssessment from '@/components/engines/ListeningAssessment';

export default function AssessmentPage() {
    const params = useParams();
    const searchParams = useSearchParams();

    const assessmentId = params.assessmentId;
    const studentName = searchParams.get('name') || '';

    // Check if assessment exists
    if (!assessmentExists(assessmentId)) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(180deg, #1a1814 0%, #12110e 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                padding: '2rem',
            }}>
                <div style={{
                    background: '#252219',
                    borderRadius: '16px',
                    border: '1px solid rgba(245, 240, 230, 0.15)',
                    padding: '2.5rem',
                    maxWidth: '480px',
                    textAlign: 'center',
                }}>
                    <div style={{
                        fontSize: '3rem',
                        marginBottom: '1rem',
                    }}>
                        🔍
                    </div>
                    <h1 style={{
                        color: '#f5f0e6',
                        fontSize: '1.5rem',
                        marginBottom: '0.5rem',
                    }}>
                        Assessment Not Found
                    </h1>
                    <p style={{
                        color: '#a8a090',
                        marginBottom: '1.5rem',
                    }}>
                        The assessment "{assessmentId}" doesn't exist.
                    </p>
                    <a
                        href="/"
                        style={{
                            display: 'inline-block',
                            padding: '0.75rem 1.5rem',
                            background: 'linear-gradient(135deg, #e8a849 0%, #d4922e 100%)',
                            color: '#1a1814',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontWeight: '600',
                        }}
                    >
                        Back to Assessment Hub
                    </a>
                </div>
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
            // Future: return <QuizAssessment assessment={assessment} studentName={studentName} />;
            return (
                <ComingSoon
                    title={assessment.title}
                    type="Quiz Assessment"
                />
            );

        case 'listening':
            // Future: return <ListeningAssessment assessment={assessment} studentName={studentName} />;
            return (
                <ComingSoon
                    title={assessment.title}
                    type="Listening Assessment"
                />
            );

        default:
            return (
                <ComingSoon
                    title={assessment.title}
                    type="Assessment"
                />
            );
    }

    // Fallback
    return <WaveformAssessment initialName={studentName} />;
}

// Placeholder component for assessments not yet implemented
function ComingSoon({ title, type }) {
    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #1a1814 0%, #12110e 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            padding: '2rem',
        }}>
            <div style={{
                background: '#252219',
                borderRadius: '16px',
                border: '1px solid rgba(245, 240, 230, 0.15)',
                padding: '2.5rem',
                maxWidth: '480px',
                textAlign: 'center',
            }}>
                <div style={{
                    fontSize: '3rem',
                    marginBottom: '1rem',
                }}>
                    🚧
                </div>
                <h1 style={{
                    color: '#f5f0e6',
                    fontSize: '1.5rem',
                    marginBottom: '0.5rem',
                }}>
                    {title}
                </h1>
                <p style={{
                    color: '#a8a090',
                    marginBottom: '0.5rem',
                }}>
                    {type} coming soon!
                </p>
                <p style={{
                    color: '#6b6560',
                    fontSize: '0.85rem',
                    marginBottom: '1.5rem',
                }}>
                    This assessment type is being developed.
                </p>
                <a
                    href="/"
                    style={{
                        display: 'inline-block',
                        padding: '0.75rem 1.5rem',
                        background: 'linear-gradient(135deg, #e8a849 0%, #d4922e 100%)',
                        color: '#1a1814',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: '600',
                    }}
                >
                    Back to Assessment Hub
                </a>
            </div>
        </div>
    );
}

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { getAllAssessments, getAssessmentsGroupedByTopic, typeIcons, typeLabels } from '@/lib/assessments';
import { theme, typography, borderRadius, spacing, transitions, focusRing } from '@/lib/theme';

// Student Hub - Assessment Selection Page
// Educational light theme for better readability and accessibility
export default function AssessmentHub() {
    const [studentName, setStudentName] = useState('');
    const [hasEnteredName, setHasEnteredName] = useState(false);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const assessments = getAllAssessments();
    const groupedAssessments = getAssessmentsGroupedByTopic();
    const t = theme.light; // Use light theme

    // Filter assessments based on search query
    const filteredGroups = useMemo(() => {
        if (!searchQuery.trim()) {
            return groupedAssessments;
        }
        const query = searchQuery.toLowerCase();
        return groupedAssessments
            .map(group => ({
                topic: group.topic,
                assessments: group.assessments.filter(
                    a => a.title.toLowerCase().includes(query) ||
                         a.description.toLowerCase().includes(query) ||
                         group.topic.toLowerCase().includes(query)
                )
            }))
            .filter(group => group.assessments.length > 0);
    }, [searchQuery, groupedAssessments]);

    // Name entry screen
    if (!hasEnteredName) {
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
                    aria-labelledby="hub-title"
                >
                    {/* Badge */}
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
                        A-Level Music Technology
                    </div>

                    <h1
                        id="hub-title"
                        style={{
                            fontSize: typography.size['3xl'],
                            fontWeight: typography.weight.bold,
                            color: t.text.primary,
                            marginBottom: spacing[2],
                            letterSpacing: typography.letterSpacing.tight,
                            lineHeight: typography.lineHeight.tight,
                        }}
                    >
                        Assessment Hub
                    </h1>

                    <p
                        style={{
                            color: t.text.secondary,
                            fontSize: typography.size.base,
                            lineHeight: typography.lineHeight.relaxed,
                            marginBottom: spacing[8],
                        }}
                    >
                        Enter your name to access the assessments. Your work will be{' '}
                        <strong style={{ color: t.text.primary, fontWeight: typography.weight.semibold }}>
                            saved and marked
                        </strong>{' '}
                        by your teacher.
                    </p>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (studentName.trim()) {
                                setHasEnteredName(true);
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
                                aria-describedby="name-hint"
                            />
                            <p
                                id="name-hint"
                                style={{
                                    color: t.text.tertiary,
                                    fontSize: typography.size.sm,
                                    marginTop: spacing[2],
                                }}
                            >
                                Use the same name for all assessments
                            </p>
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
                            aria-label="View available assessments"
                        >
                            View Assessments
                            <span aria-hidden="true" style={{ fontSize: '1.2rem' }}>→</span>
                        </button>
                    </form>
                </main>
            </div>
        );
    }

    // Assessment selection hub
    return (
        <div
            style={{
                minHeight: '100vh',
                background: t.bg.secondary,
                padding: spacing[8],
                fontFamily: typography.fontFamily,
            }}
        >
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
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
                            A-Level Music Technology
                        </p>
                        <h1
                            style={{
                                fontSize: typography.size['2xl'],
                                fontWeight: typography.weight.bold,
                                color: t.text.primary,
                                lineHeight: typography.lineHeight.tight,
                            }}
                        >
                            Welcome, {studentName}
                        </h1>
                    </div>

                    <button
                        onClick={() => setHasEnteredName(false)}
                        style={{
                            padding: `${spacing[2]} ${spacing[4]}`,
                            background: t.bg.primary,
                            border: `1px solid ${t.border.medium}`,
                            borderRadius: borderRadius.lg,
                            color: t.text.secondary,
                            fontSize: typography.size.sm,
                            fontWeight: typography.weight.medium,
                            cursor: 'pointer',
                            transition: `all ${transitions.fast} ${transitions.easing}`,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = t.border.strong;
                            e.currentTarget.style.color = t.text.primary;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = t.border.medium;
                            e.currentTarget.style.color = t.text.secondary;
                        }}
                        aria-label="Change your name"
                    >
                        Change Name
                    </button>
                </header>

                {/* Search bar */}
                <div
                    style={{
                        marginBottom: spacing[6],
                    }}
                >
                    <div
                        style={{
                            position: 'relative',
                            maxWidth: '400px',
                        }}
                    >
                        <span
                            style={{
                                position: 'absolute',
                                left: spacing[4],
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: t.text.tertiary,
                                fontSize: typography.size.lg,
                                pointerEvents: 'none',
                            }}
                            aria-hidden="true"
                        >
                            🔍
                        </span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                            placeholder="Search assessments..."
                            style={{
                                width: '100%',
                                padding: `${spacing[3]} ${spacing[4]}`,
                                paddingLeft: spacing[10],
                                background: t.bg.primary,
                                border: `2px solid ${isSearchFocused ? t.border.focus : t.border.medium}`,
                                borderRadius: borderRadius.lg,
                                color: t.text.primary,
                                fontSize: typography.size.base,
                                outline: 'none',
                                transition: `border-color ${transitions.fast} ${transitions.easing}, box-shadow ${transitions.fast} ${transitions.easing}`,
                                boxShadow: isSearchFocused ? `0 0 0 3px ${t.accent.primary}20` : t.shadow.sm,
                                boxSizing: 'border-box',
                            }}
                            aria-label="Search assessments by title or topic"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                style={{
                                    position: 'absolute',
                                    right: spacing[3],
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: t.bg.tertiary,
                                    border: 'none',
                                    borderRadius: borderRadius.full,
                                    width: '24px',
                                    height: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: t.text.secondary,
                                    fontSize: typography.size.sm,
                                }}
                                aria-label="Clear search"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    {searchQuery && (
                        <p
                            style={{
                                fontSize: typography.size.sm,
                                color: t.text.tertiary,
                                marginTop: spacing[2],
                            }}
                        >
                            {filteredGroups.reduce((acc, g) => acc + g.assessments.length, 0)} result{filteredGroups.reduce((acc, g) => acc + g.assessments.length, 0) !== 1 ? 's' : ''} found
                        </p>
                    )}
                </div>

                {/* Topic boxes grid */}
                <main role="main" aria-label="Available assessments">
                    <h2 className="sr-only">Select an Assessment</h2>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                            gap: spacing[6],
                        }}
                    >
                        {filteredGroups.map(({ topic, assessments: topicAssessments }) => (
                            <section
                                key={topic}
                                aria-labelledby={`topic-${topic.replace(/\s+/g, '-')}`}
                                style={{
                                    background: t.bg.primary,
                                    borderRadius: borderRadius.xl,
                                    border: `1px solid ${t.border.subtle}`,
                                    boxShadow: t.shadow.sm,
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Topic box header */}
                                <div
                                    style={{
                                        background: t.bg.tertiary,
                                        padding: `${spacing[4]} ${spacing[5]}`,
                                        borderBottom: `1px solid ${t.border.subtle}`,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <h2
                                            id={`topic-${topic.replace(/\s+/g, '-')}`}
                                            style={{
                                                fontSize: typography.size.base,
                                                fontWeight: typography.weight.semibold,
                                                color: t.text.primary,
                                                margin: 0,
                                            }}
                                        >
                                            {topic}
                                        </h2>
                                        <span
                                            style={{
                                                fontSize: typography.size.xs,
                                                color: t.text.tertiary,
                                                background: t.bg.primary,
                                                padding: `${spacing[1]} ${spacing[2]}`,
                                                borderRadius: borderRadius.full,
                                                fontWeight: typography.weight.medium,
                                            }}
                                        >
                                            {topicAssessments.length}
                                        </span>
                                    </div>
                                </div>

                                {/* Assessments inside the topic box */}
                                <div
                                    style={{
                                        padding: spacing[3],
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: spacing[2],
                                    }}
                                >
                                    {topicAssessments.map((assessment) => (
                                        <Link
                                            key={assessment.id}
                                            href={`/${assessment.id}?name=${encodeURIComponent(studentName)}`}
                                            style={{ textDecoration: 'none' }}
                                        >
                                            <article
                                                style={{
                                                    background: t.bg.primary,
                                                    borderRadius: borderRadius.lg,
                                                    border: `1px solid ${t.border.subtle}`,
                                                    padding: spacing[4],
                                                    cursor: 'pointer',
                                                    transition: `all ${transitions.fast} ${transitions.easing}`,
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = t.bg.secondary;
                                                    e.currentTarget.style.borderColor = t.accent.primary + '60';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = t.bg.primary;
                                                    e.currentTarget.style.borderColor = t.border.subtle;
                                                }}
                                                onFocus={(e) => {
                                                    e.currentTarget.style.outline = `2px solid ${t.border.focus}`;
                                                    e.currentTarget.style.outlineOffset = '1px';
                                                }}
                                                onBlur={(e) => {
                                                    e.currentTarget.style.outline = 'none';
                                                }}
                                                tabIndex={0}
                                                aria-label={`${assessment.title} - ${assessment.description}`}
                                            >
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: spacing[3],
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontSize: '1.25rem',
                                                            lineHeight: 1,
                                                        }}
                                                        aria-hidden="true"
                                                    >
                                                        {typeIcons[assessment.type] || '📋'}
                                                    </span>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <h3
                                                            style={{
                                                                color: t.text.primary,
                                                                fontSize: typography.size.sm,
                                                                fontWeight: typography.weight.medium,
                                                                margin: 0,
                                                                lineHeight: typography.lineHeight.tight,
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                            }}
                                                        >
                                                            {assessment.title}
                                                        </h3>
                                                        <p
                                                            style={{
                                                                color: t.text.tertiary,
                                                                fontSize: typography.size.xs,
                                                                margin: 0,
                                                                marginTop: spacing[1],
                                                            }}
                                                        >
                                                            {typeLabels[assessment.type]} • {assessment.estimatedTime}
                                                        </p>
                                                    </div>
                                                    <span
                                                        style={{
                                                            color: t.accent.primary,
                                                            fontSize: typography.size.base,
                                                        }}
                                                        aria-hidden="true"
                                                    >
                                                        →
                                                    </span>
                                                </div>
                                            </article>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                </main>

                {/* Empty state - no assessments */}
                {assessments.length === 0 && (
                    <div
                        style={{
                            textAlign: 'center',
                            padding: spacing[12],
                            color: t.text.tertiary,
                            background: t.bg.primary,
                            borderRadius: borderRadius.xl,
                            border: `1px solid ${t.border.subtle}`,
                        }}
                        role="status"
                    >
                        <p style={{ fontSize: typography.size.lg }}>
                            No assessments available yet.
                        </p>
                        <p style={{ fontSize: typography.size.sm, marginTop: spacing[2] }}>
                            Check back later or contact your teacher.
                        </p>
                    </div>
                )}

                {/* Empty state - no search results */}
                {assessments.length > 0 && filteredGroups.length === 0 && searchQuery && (
                    <div
                        style={{
                            textAlign: 'center',
                            padding: spacing[12],
                            color: t.text.tertiary,
                            background: t.bg.primary,
                            borderRadius: borderRadius.xl,
                            border: `1px solid ${t.border.subtle}`,
                        }}
                        role="status"
                    >
                        <p style={{ fontSize: typography.size.lg }}>
                            No assessments match "{searchQuery}"
                        </p>
                        <p style={{ fontSize: typography.size.sm, marginTop: spacing[2] }}>
                            Try a different search term or{' '}
                            <button
                                onClick={() => setSearchQuery('')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: t.accent.primary,
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                    fontSize: 'inherit',
                                }}
                            >
                                clear the search
                            </button>
                        </p>
                    </div>
                )}
            </div>

            {/* Screen reader only styles */}
            <style jsx global>{`
                .sr-only {
                    position: absolute;
                    width: 1px;
                    height: 1px;
                    padding: 0;
                    margin: -1px;
                    overflow: hidden;
                    clip: rect(0, 0, 0, 0);
                    white-space: nowrap;
                    border: 0;
                }
            `}</style>
        </div>
    );
}

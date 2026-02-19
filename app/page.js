'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getAllAssessments, getAssessmentsGroupedByTopic, typeIcons, typeLabels } from '@/lib/assessments';
import { theme, typography, borderRadius, spacing, transitions, focusRing } from '@/lib/theme';

// Skeleton card for loading states
function SkeletonCard() {
    const t = theme.light;
    const shimmerBg = `linear-gradient(90deg, ${t.bg.tertiary} 25%, ${t.bg.secondary} 50%, ${t.bg.tertiary} 75%)`;
    return (
        <div style={{
            background: t.bg.primary,
            borderRadius: borderRadius.xl,
            border: `1px solid ${t.border.subtle}`,
            overflow: 'hidden',
        }}>
            <div style={{
                padding: `${spacing[4]} ${spacing[5]}`,
                borderBottom: `1px solid ${t.border.subtle}`,
            }}>
                <div style={{
                    height: '16px',
                    width: '60%',
                    borderRadius: borderRadius.md,
                    background: shimmerBg,
                    backgroundSize: '200% 100%',
                    animation: 'skeletonShimmer 1.5s ease-in-out infinite',
                }} />
            </div>
            <div style={{ padding: spacing[3], display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                {[1, 2].map(i => (
                    <div key={i} style={{
                        padding: spacing[4],
                        borderRadius: borderRadius.lg,
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing[3],
                    }}>
                        <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: borderRadius.full,
                            background: shimmerBg,
                            backgroundSize: '200% 100%',
                            animation: 'skeletonShimmer 1.5s ease-in-out infinite',
                            flexShrink: 0,
                        }} />
                        <div style={{ flex: 1 }}>
                            <div style={{
                                height: '14px',
                                width: '75%',
                                borderRadius: borderRadius.sm,
                                background: shimmerBg,
                                backgroundSize: '200% 100%',
                                animation: 'skeletonShimmer 1.5s ease-in-out infinite',
                                marginBottom: spacing[1],
                            }} />
                            <div style={{
                                height: '10px',
                                width: '50%',
                                borderRadius: borderRadius.sm,
                                background: shimmerBg,
                                backgroundSize: '200% 100%',
                                animation: 'skeletonShimmer 1.5s ease-in-out infinite',
                            }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Student Hub - Assessment Selection Page
// Educational light theme for better readability and accessibility
export default function AssessmentHub() {
    const [studentName, setStudentName] = useState('');
    const [hasEnteredName, setHasEnteredName] = useState(false);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [activeType, setActiveType] = useState('all');
    const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });
    const tabsRef = useRef({});
    const tabContainerRef = useRef(null);

    const assessments = getAllAssessments();
    const groupedAssessments = getAssessmentsGroupedByTopic();
    const t = theme.light; // Use light theme

    const tabs = [
        { key: 'all', label: 'All' },
        { key: 'drawing', label: 'Drawing', icon: '✏️' },
        { key: 'quiz', label: 'Quiz', icon: '📝' },
        { key: 'listening', label: 'Listening', icon: '🎧' },
    ];

    // Measure tab position for sliding pill
    const updatePillPosition = useCallback(() => {
        const activeTab = tabsRef.current[activeType];
        const container = tabContainerRef.current;
        if (activeTab && container) {
            const containerRect = container.getBoundingClientRect();
            const tabRect = activeTab.getBoundingClientRect();
            setPillStyle({
                left: tabRect.left - containerRect.left,
                width: tabRect.width,
            });
        }
    }, [activeType]);

    useEffect(() => {
        updatePillPosition();
        window.addEventListener('resize', updatePillPosition);
        return () => window.removeEventListener('resize', updatePillPosition);
    }, [updatePillPosition]);

    // Filter assessments based on search query AND type filter
    const filteredGroups = useMemo(() => {
        return groupedAssessments
            .map(group => ({
                topic: group.topic,
                assessments: group.assessments.filter(a => {
                    const matchesType = activeType === 'all' || a.type === activeType;
                    if (!searchQuery.trim()) return matchesType;
                    const query = searchQuery.toLowerCase();
                    const matchesSearch =
                        a.title.toLowerCase().includes(query) ||
                        a.description.toLowerCase().includes(query) ||
                        group.topic.toLowerCase().includes(query);
                    return matchesType && matchesSearch;
                })
            }))
            .filter(group => group.assessments.length > 0);
    }, [searchQuery, activeType, groupedAssessments]);

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
                            onMouseDown={(e) => {
                                if (studentName.trim()) {
                                    e.currentTarget.style.transform = 'scale(0.97)';
                                }
                            }}
                            onMouseUp={(e) => {
                                if (studentName.trim()) {
                                    e.currentTarget.style.transform = 'translateY(-1px)';
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
                            e.currentTarget.style.transform = 'none';
                        }}
                        onMouseDown={(e) => {
                            e.currentTarget.style.transform = 'scale(0.97)';
                        }}
                        onMouseUp={(e) => {
                            e.currentTarget.style.transform = 'none';
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
                    {(searchQuery || activeType !== 'all') && (
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

                {/* Type filter tabs */}
                <div
                    style={{
                        marginBottom: spacing[6],
                    }}
                >
                    <div
                        ref={tabContainerRef}
                        style={{
                            display: 'inline-flex',
                            position: 'relative',
                            background: t.bg.tertiary,
                            borderRadius: borderRadius.full,
                            padding: '4px',
                        }}
                        role="tablist"
                        aria-label="Filter by assessment type"
                    >
                        {/* Sliding pill indicator */}
                        <div
                            style={{
                                position: 'absolute',
                                top: '4px',
                                left: pillStyle.left,
                                width: pillStyle.width,
                                height: 'calc(100% - 8px)',
                                background: t.accent.primary,
                                borderRadius: borderRadius.full,
                                transition: 'left 300ms cubic-bezier(0.34, 1.56, 0.64, 1), width 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                                zIndex: 0,
                            }}
                            aria-hidden="true"
                        />
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                ref={(el) => { tabsRef.current[tab.key] = el; }}
                                onClick={() => setActiveType(tab.key)}
                                role="tab"
                                aria-selected={activeType === tab.key}
                                aria-controls="assessment-grid"
                                style={{
                                    position: 'relative',
                                    zIndex: 1,
                                    padding: `${spacing[2]} ${spacing[4]}`,
                                    border: 'none',
                                    background: 'transparent',
                                    borderRadius: borderRadius.full,
                                    fontSize: typography.size.sm,
                                    fontWeight: activeType === tab.key ? typography.weight.semibold : typography.weight.medium,
                                    color: activeType === tab.key ? t.text.inverse : t.text.secondary,
                                    cursor: 'pointer',
                                    transition: `color 200ms ${transitions.easing}`,
                                    whiteSpace: 'nowrap',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: spacing[1],
                                }}
                            >
                                {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Topic boxes grid */}
                <main role="main" aria-label="Available assessments" id="assessment-grid">
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
                                        <AssessmentItem
                                            key={assessment.id}
                                            assessment={assessment}
                                            studentName={studentName}
                                            theme={t}
                                        />
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

                {/* Empty state - no search/filter results */}
                {assessments.length > 0 && filteredGroups.length === 0 && (searchQuery || activeType !== 'all') && (
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
                            No assessments match{searchQuery ? ` "${searchQuery}"` : ''}{activeType !== 'all' ? ` in ${tabs.find(tab => tab.key === activeType)?.label}` : ''}
                        </p>
                        <p style={{ fontSize: typography.size.sm, marginTop: spacing[2] }}>
                            Try a different search term or{' '}
                            <button
                                onClick={() => { setSearchQuery(''); setActiveType('all'); }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: t.accent.primary,
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                    fontSize: 'inherit',
                                }}
                            >
                                clear all filters
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

// Assessment item with cursor-tracking glow effect
function AssessmentItem({ assessment, studentName, theme: t }) {
    const [isHovered, setIsHovered] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const itemRef = useRef(null);

    const handleMouseMove = useCallback((e) => {
        const rect = itemRef.current?.getBoundingClientRect();
        if (!rect) return;
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }, []);

    return (
        <Link
            href={`/${assessment.id}?name=${encodeURIComponent(studentName)}`}
            style={{ textDecoration: 'none' }}
        >
            <article
                ref={itemRef}
                onMouseEnter={(e) => {
                    setIsHovered(true);
                    e.currentTarget.style.borderColor = t.accent.primary + '60';
                }}
                onMouseLeave={(e) => {
                    setIsHovered(false);
                    e.currentTarget.style.borderColor = t.border.subtle;
                }}
                onMouseMove={handleMouseMove}
                onFocus={(e) => {
                    e.currentTarget.style.outline = `2px solid ${t.border.focus}`;
                    e.currentTarget.style.outlineOffset = '1px';
                }}
                onBlur={(e) => {
                    e.currentTarget.style.outline = 'none';
                }}
                tabIndex={0}
                aria-label={`${assessment.title} - ${assessment.description}`}
                style={{
                    position: 'relative',
                    overflow: 'hidden',
                    background: t.bg.primary,
                    borderRadius: borderRadius.lg,
                    border: `1px solid ${t.border.subtle}`,
                    padding: spacing[4],
                    cursor: 'pointer',
                    transition: `all ${transitions.fast} ${transitions.easing}`,
                }}
            >
                {/* Glow layer */}
                <div
                    style={{
                        position: 'absolute',
                        top: mousePos.y - 120,
                        left: mousePos.x - 120,
                        width: 240,
                        height: 240,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(255, 107, 53, 0.4) 0%, rgba(255, 107, 53, 0.12) 40%, transparent 70%)',
                        filter: 'blur(24px) saturate(3) brightness(1.1)',
                        pointerEvents: 'none',
                        opacity: isHovered ? 1 : 0,
                        transition: 'opacity 300ms ease',
                        zIndex: 0,
                    }}
                    aria-hidden="true"
                />
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                    <span style={{ fontSize: '1.25rem', lineHeight: 1 }} aria-hidden="true">
                        {typeIcons[assessment.type] || '📋'}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{
                            color: t.text.primary,
                            fontSize: typography.size.sm,
                            fontWeight: typography.weight.medium,
                            margin: 0,
                            lineHeight: typography.lineHeight.tight,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}>
                            {assessment.title}
                        </h3>
                        <p style={{
                            color: t.text.tertiary,
                            fontSize: typography.size.xs,
                            margin: 0,
                            marginTop: spacing[1],
                        }}>
                            {typeLabels[assessment.type]} • {assessment.estimatedTime}
                        </p>
                    </div>
                    <span style={{ color: t.accent.primary, fontSize: typography.size.base }} aria-hidden="true">
                        →
                    </span>
                </div>
            </article>
        </Link>
    );
}

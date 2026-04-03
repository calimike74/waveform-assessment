// Educational Design Token System
// Research-backed color palette and typography for A-level assessment platform
// Prioritizes accessibility (WCAG 2.1 AA), readability, and professional appearance

/**
 * Educational Theme
 * Light mode default - studies show better reading comprehension
 * Dark mode available for accessibility (light sensitivity)
 */
export const theme = {
    // Light mode (default) - warm, elegant aesthetic matching landing page
    light: {
        bg: {
            primary: '#FFFBF5',      // Warm off-white (main background)
            secondary: '#FFF8F0',    // Subtle warm sections
            tertiary: '#F5E6D3',     // Cards, panels (warm)
            canvas: '#FFFBF5',       // Drawing area
            elevated: '#FFFFFF',     // Modals, dropdowns
        },
        text: {
            primary: '#2D2D2D',      // Dark gray (headings)
            secondary: '#4A4A4A',    // Body text
            tertiary: '#6B7280',     // Captions, hints, disabled
            inverse: '#FFFFFF',      // On dark/accent backgrounds
            link: '#FF6B35',         // Orange links
        },
        accent: {
            primary: '#FF6B35',      // Orange (primary actions)
            primaryHover: '#E85D75', // Coral (hover state)
            success: '#059669',      // Correct, complete (green - unchanged)
            successLight: '#D1FAE5', // Success background
            warning: '#F59E0B',      // Brighter amber
            warningLight: '#FFF9E6', // Warning background
            error: '#DC2626',        // Errors (red - unchanged)
            errorLight: '#FEE2E2',   // Error background
            info: '#F7C948',         // Gold (information)
            infoLight: '#FFF9E6',    // Info background (warm)
        },
        border: {
            subtle: '#F5E6D3',       // Warm subtle separators
            medium: '#E8D5C4',       // Warm card borders
            strong: '#D4C4B0',       // Warm emphasized borders
            focus: '#FF6B35',        // Orange focus rings
            input: '#E8D5C4',        // Warm input borders
        },
        shadow: {
            sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        },
    },

    // Dark mode (optional toggle) - for extended sessions or light sensitivity
    dark: {
        bg: {
            primary: '#1A1A2E',      // Main background
            secondary: '#16213E',    // Subtle sections
            tertiary: '#0F3460',     // Cards, panels
            canvas: '#252549',       // Drawing area
            elevated: '#1F1F3D',     // Modals, dropdowns
        },
        text: {
            primary: '#F8FAFC',      // Headings
            secondary: '#CBD5E1',    // Body text
            tertiary: '#94A3B8',     // Captions, hints
            inverse: '#1A1A2E',      // On light backgrounds
            link: '#60A5FA',         // Links
        },
        accent: {
            primary: '#3B82F6',      // Primary actions
            primaryHover: '#60A5FA', // Primary hover
            success: '#10B981',      // Correct, complete
            successLight: '#064E3B', // Success background
            warning: '#F59E0B',      // Attention
            warningLight: '#78350F', // Warning background
            error: '#EF4444',        // Errors
            errorLight: '#7F1D1D',   // Error background
            info: '#22D3EE',         // Information
            infoLight: '#164E63',    // Info background
        },
        border: {
            subtle: '#374151',
            medium: '#4B5563',
            strong: '#6B7280',
            focus: '#3B82F6',
            input: '#4B5563',
        },
        shadow: {
            sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
            md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
            lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
        },
    },
};

export const glass = {
    bg: 'rgba(255, 255, 255, 0.65)',
    bgHover: 'rgba(255, 255, 255, 0.85)',
    bgPrimary: 'rgba(255, 107, 53, 0.88)',
    bgPrimaryHover: 'rgba(232, 93, 117, 0.92)',
    bgSuccess: 'rgba(5, 150, 105, 0.85)',
    bgSuccessHover: 'rgba(4, 120, 87, 0.90)',
    bgDanger: 'rgba(220, 38, 38, 0.85)',
    bgDangerHover: 'rgba(185, 28, 28, 0.90)',
    bgWarning: 'rgba(245, 158, 11, 0.85)',
    bgWarningHover: 'rgba(180, 83, 9, 0.90)',
    bgGhost: 'transparent',
    bgGhostHover: 'rgba(255, 255, 255, 0.5)',
    border: 'rgba(255, 255, 255, 0.6)',
    borderOuter: 'rgba(0, 0, 0, 0.08)',
    shadow: '0 2px 16px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
    shadowHover: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
    shadowPrimary: '0 4px 20px rgba(255, 107, 53, 0.3), 0 1px 4px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
    shadowPrimaryHover: '0 8px 32px rgba(255, 107, 53, 0.4), 0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
    blur: '12px',
    radius: '12px',
    radiusPill: '999px',
    iconBg: 'rgba(255, 255, 255, 0.7)',
    iconBorder: 'rgba(255, 255, 255, 0.8)',
    iconShadow: '0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
};

/**
 * Typography System
 * Using system fonts for fast loading and native feel
 * Minimum 16px body text for readability
 */
export const typography = {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontFamilyMono: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',

    size: {
        xs: '0.75rem',      // 12px - Tiny labels
        sm: '0.875rem',     // 14px - Small text, captions
        base: '1rem',       // 16px - Body text (minimum for accessibility)
        lg: '1.125rem',     // 18px - Emphasized body
        xl: '1.25rem',      // 20px - Card titles, h4
        '2xl': '1.5rem',    // 24px - Section headings, h3
        '3xl': '1.875rem',  // 30px - Page subtitles, h2
        '4xl': '2.25rem',   // 36px - Page titles, h1
    },

    lineHeight: {
        tight: 1.25,        // Headings
        snug: 1.375,        // Subheadings
        normal: 1.5,        // Body text
        relaxed: 1.625,     // Extended reading
        loose: 1.75,        // Instructions, hints
    },

    weight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
    },

    letterSpacing: {
        tight: '-0.025em',  // Headings
        normal: '0',
        wide: '0.025em',    // All caps, labels
    },
};

/**
 * Spacing System (8px base)
 */
export const spacing = {
    0: '0',
    0.5: '0.125rem',   // 2px
    1: '0.25rem',      // 4px
    2: '0.5rem',       // 8px
    3: '0.75rem',      // 12px
    4: '1rem',         // 16px
    5: '1.25rem',      // 20px
    6: '1.5rem',       // 24px
    8: '2rem',         // 32px
    10: '2.5rem',      // 40px
    12: '3rem',        // 48px
    16: '4rem',        // 64px
    20: '5rem',        // 80px
};

/**
 * Border Radius
 */
export const borderRadius = {
    none: '0',
    sm: '0.25rem',     // 4px
    md: '0.375rem',    // 6px
    lg: '0.5rem',      // 8px
    xl: '0.75rem',     // 12px
    '2xl': '1rem',     // 16px
    full: '9999px',    // Pills, circles
};

/**
 * Breakpoints for responsive design
 */
export const breakpoints = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
};

/**
 * Transition durations
 */
export const transitions = {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'linear(0, 0.18, 0.42, 0.72, 0.95, 1.06, 1.04, 1.01, 0.99, 1)',
    springDuration: '500ms',
};

/**
 * Focus ring styles for accessibility
 */
export const focusRing = (mode = 'light') => ({
    outline: 'none',
    boxShadow: `0 0 0 2px ${mode === 'light' ? theme.light.bg.primary : theme.dark.bg.primary}, 0 0 0 4px ${mode === 'light' ? theme.light.border.focus : theme.dark.border.focus}`,
});

/**
 * Common button styles
 */
export const buttonStyles = {
    base: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: typography.fontFamily,
        fontWeight: typography.weight.medium,
        fontSize: typography.size.base,
        lineHeight: typography.lineHeight.tight,
        borderRadius: borderRadius.lg,
        cursor: 'pointer',
        transition: `all ${transitions.fast} ${transitions.easing}`,
        border: 'none',
    },
    sizes: {
        sm: {
            padding: `${spacing[2]} ${spacing[3]}`,
            fontSize: typography.size.sm,
        },
        md: {
            padding: `${spacing[2.5] || '0.625rem'} ${spacing[4]}`,
            fontSize: typography.size.base,
        },
        lg: {
            padding: `${spacing[3]} ${spacing[6]}`,
            fontSize: typography.size.lg,
        },
    },
    primary: (mode = 'light') => ({
        backgroundColor: mode === 'light' ? theme.light.accent.primary : theme.dark.accent.primary,
        color: theme.light.text.inverse,
    }),
    secondary: (mode = 'light') => ({
        backgroundColor: 'transparent',
        color: mode === 'light' ? theme.light.text.primary : theme.dark.text.primary,
        border: `1px solid ${mode === 'light' ? theme.light.border.medium : theme.dark.border.medium}`,
    }),
    success: (mode = 'light') => ({
        backgroundColor: mode === 'light' ? theme.light.accent.success : theme.dark.accent.success,
        color: theme.light.text.inverse,
    }),
    danger: (mode = 'light') => ({
        backgroundColor: mode === 'light' ? theme.light.accent.error : theme.dark.accent.error,
        color: theme.light.text.inverse,
    }),
};

/**
 * Common input styles
 */
export const inputStyles = {
    base: (mode = 'light') => ({
        fontFamily: typography.fontFamily,
        fontSize: typography.size.base,
        lineHeight: typography.lineHeight.normal,
        padding: `${spacing[2.5] || '0.625rem'} ${spacing[3]}`,
        borderRadius: borderRadius.lg,
        border: `1px solid ${mode === 'light' ? theme.light.border.input : theme.dark.border.input}`,
        backgroundColor: mode === 'light' ? theme.light.bg.primary : theme.dark.bg.primary,
        color: mode === 'light' ? theme.light.text.primary : theme.dark.text.primary,
        transition: `border-color ${transitions.fast} ${transitions.easing}, box-shadow ${transitions.fast} ${transitions.easing}`,
        outline: 'none',
        width: '100%',
    }),
    focus: (mode = 'light') => ({
        borderColor: mode === 'light' ? theme.light.border.focus : theme.dark.border.focus,
        boxShadow: `0 0 0 3px ${mode === 'light' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(59, 130, 246, 0.2)'}`,
    }),
};

/**
 * Card styles
 */
export const cardStyles = {
    base: (mode = 'light') => ({
        backgroundColor: mode === 'light' ? theme.light.bg.primary : theme.dark.bg.elevated,
        borderRadius: borderRadius.xl,
        border: `1px solid ${mode === 'light' ? theme.light.border.subtle : theme.dark.border.subtle}`,
        boxShadow: mode === 'light' ? theme.light.shadow.md : theme.dark.shadow.md,
    }),
    interactive: (mode = 'light') => ({
        cursor: 'pointer',
        transition: `all ${transitions.normal} ${transitions.easing}`,
    }),
};

/**
 * Assessment-specific colors
 * For waveform drawing and other assessment types
 */
export const assessmentColors = {
    // Drawing canvas colors (warmer tones)
    canvas: {
        background: '#FFFBF5',
        grid: '#F5E6D3',
        gridMajor: '#E8D5C4',
        centerLine: '#D4C4B0',
    },
    // Waveform colors
    waveform: {
        original: '#FF6B35',       // Orange for reference waveform
        student: '#10B981',        // Green for student drawing
        correct: '#059669',        // Dark green for correct
        incorrect: '#DC2626',      // Red for incorrect
    },
    // Challenge difficulty/type indicators
    difficulty: {
        easy: '#10B981',           // Green
        medium: '#F7C948',         // Gold (was amber)
        hard: '#E85D75',           // Coral (was red)
        examStyle: '#A89BC8',      // Soft purple (from iridescent)
    },
};

/**
 * Helper to get current theme based on mode
 */
export function getTheme(mode = 'light') {
    return theme[mode] || theme.light;
}

/**
 * Helper to create CSS custom properties from theme
 */
export function getCSSVariables(mode = 'light') {
    const t = getTheme(mode);
    return {
        '--bg-primary': t.bg.primary,
        '--bg-secondary': t.bg.secondary,
        '--bg-tertiary': t.bg.tertiary,
        '--bg-canvas': t.bg.canvas,
        '--bg-elevated': t.bg.elevated,
        '--text-primary': t.text.primary,
        '--text-secondary': t.text.secondary,
        '--text-tertiary': t.text.tertiary,
        '--text-inverse': t.text.inverse,
        '--text-link': t.text.link,
        '--accent-primary': t.accent.primary,
        '--accent-primary-hover': t.accent.primaryHover,
        '--accent-success': t.accent.success,
        '--accent-warning': t.accent.warning,
        '--accent-error': t.accent.error,
        '--accent-info': t.accent.info,
        '--border-subtle': t.border.subtle,
        '--border-medium': t.border.medium,
        '--border-strong': t.border.strong,
        '--border-focus': t.border.focus,
        '--shadow-sm': t.shadow.sm,
        '--shadow-md': t.shadow.md,
        '--shadow-lg': t.shadow.lg,
    };
}

// Default export for convenience
export default {
    theme,
    glass,
    typography,
    spacing,
    borderRadius,
    breakpoints,
    transitions,
    focusRing,
    buttonStyles,
    inputStyles,
    cardStyles,
    assessmentColors,
    getTheme,
    getCSSVariables,
};

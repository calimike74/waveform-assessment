'use client';

import { forwardRef } from 'react';
import { theme, typography, borderRadius, spacing, transitions, glass } from '@/lib/theme';

/**
 * Accessible Button Component
 *
 * Features:
 * - WCAG 2.1 AA compliant contrast ratios
 * - Visible focus indicators
 * - Keyboard navigation support
 * - Multiple variants and sizes
 * - Loading state with spinner
 * - Disabled state styling
 */
const Button = forwardRef(function Button(
    {
        children,
        variant = 'primary',
        size = 'md',
        disabled = false,
        loading = false,
        fullWidth = false,
        type = 'button',
        onClick,
        ariaLabel,
        ariaDescribedBy,
        className,
        style,
        ...props
    },
    ref
) {
    const t = theme.light;

    // Variant styles
    const variants = {
        primary: {
            background: glass.bgPrimary,
            color: t.text.inverse,
            border: '1px solid ' + glass.border,
            boxShadow: glass.shadowPrimary,
            hoverBackground: glass.bgPrimaryHover,
            hoverBoxShadow: glass.shadowPrimaryHover,
        },
        secondary: {
            background: glass.bg,
            color: t.text.primary,
            border: '1px solid ' + glass.border,
            boxShadow: glass.shadow,
            hoverBackground: glass.bgHover,
            hoverBoxShadow: glass.shadowHover,
        },
        success: {
            background: glass.bgSuccess,
            color: t.text.inverse,
            border: '1px solid ' + glass.border,
            boxShadow: glass.shadow,
            hoverBackground: glass.bgSuccessHover,
            hoverBoxShadow: glass.shadowHover,
        },
        danger: {
            background: glass.bgDanger,
            color: t.text.inverse,
            border: '1px solid ' + glass.border,
            boxShadow: glass.shadow,
            hoverBackground: glass.bgDangerHover,
            hoverBoxShadow: glass.shadowHover,
        },
        warning: {
            background: glass.bgWarning,
            color: t.text.inverse,
            border: '1px solid ' + glass.border,
            boxShadow: glass.shadow,
            hoverBackground: glass.bgWarningHover,
            hoverBoxShadow: glass.shadowHover,
        },
        ghost: {
            background: glass.bgGhost,
            color: t.text.secondary,
            border: 'none',
            boxShadow: 'none',
            hoverBackground: glass.bgGhostHover,
            hoverBoxShadow: 'none',
        },
    };

    // Size styles
    const sizes = {
        sm: {
            padding: `${spacing[2]} ${spacing[3]}`,
            fontSize: typography.size.sm,
            gap: spacing[1],
        },
        md: {
            padding: `${spacing[2]} ${spacing[4]}`,
            fontSize: typography.size.base,
            gap: spacing[2],
        },
        lg: {
            padding: `${spacing[3]} ${spacing[6]}`,
            fontSize: typography.size.lg,
            gap: spacing[2],
        },
    };

    const currentVariant = variants[variant] || variants.primary;
    const currentSize = sizes[size] || sizes.md;

    const baseStyles = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: currentSize.gap,
        fontFamily: typography.fontFamily,
        fontWeight: typography.weight.semibold,
        fontSize: currentSize.fontSize,
        lineHeight: typography.lineHeight.tight,
        padding: currentSize.padding,
        borderRadius: borderRadius.lg,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        transition: `all ${transitions.springDuration} ${transitions.spring}`,
        textDecoration: 'none',
        whiteSpace: 'nowrap',
        width: fullWidth ? '100%' : 'auto',
        opacity: disabled ? 0.5 : 1,
        background: currentVariant.background,
        color: currentVariant.color,
        border: currentVariant.border,
        boxShadow: currentVariant.boxShadow,
        backdropFilter: 'blur(' + glass.blur + ')',
        WebkitBackdropFilter: 'blur(' + glass.blur + ')',
        ...style,
    };

    const handleMouseEnter = (e) => {
        if (!disabled && !loading) {
            e.currentTarget.style.background = currentVariant.hoverBackground;
            e.currentTarget.style.boxShadow = currentVariant.hoverBoxShadow;
            e.currentTarget.style.transform = 'translateY(-1px)';
        }
    };

    const handleMouseLeave = (e) => {
        if (!disabled && !loading) {
            e.currentTarget.style.background = currentVariant.background;
            e.currentTarget.style.boxShadow = currentVariant.boxShadow;
            e.currentTarget.style.transform = 'none';
        }
    };

    const handleMouseDown = (e) => {
        if (!disabled && !loading) {
            e.currentTarget.style.transform = 'scale(0.97)';
        }
    };

    const handleMouseUp = (e) => {
        if (!disabled && !loading) {
            e.currentTarget.style.transform = 'translateY(-1px)';
        }
    };

    const handleFocus = (e) => {
        // Only show focus ring for keyboard navigation
    };

    const handleBlur = (e) => {
        // Focus ring handled by :focus-visible in CSS
    };

    // Loading spinner
    const LoadingSpinner = () => (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{
                animation: 'spin 1s linear infinite',
            }}
            aria-hidden="true"
        >
            <style>
                {`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
            </style>
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
        </svg>
    );

    return (
        <button
            ref={ref}
            type={type}
            disabled={disabled || loading}
            onClick={onClick}
            aria-label={ariaLabel}
            aria-describedby={ariaDescribedBy}
            aria-busy={loading}
            aria-disabled={disabled}
            style={baseStyles}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            {...props}
        >
            {loading && <LoadingSpinner />}
            {children}
        </button>
    );
});

export default Button;

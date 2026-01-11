'use client';

import { forwardRef } from 'react';
import { theme, typography, borderRadius, spacing, transitions } from '@/lib/theme';

/**
 * Accessible Card Component
 *
 * Features:
 * - Clean, professional appearance
 * - Optional header and footer sections
 * - Interactive variant with hover effects
 * - Proper semantic structure
 * - Accessible focus states for interactive cards
 */
const Card = forwardRef(function Card(
    {
        children,
        variant = 'default',
        padding = 'md',
        interactive = false,
        onClick,
        header,
        footer,
        ariaLabel,
        ariaDescribedBy,
        role,
        style,
        ...props
    },
    ref
) {
    const t = theme.light;

    // Variant styles
    const variants = {
        default: {
            background: t.bg.primary,
            border: `1px solid ${t.border.subtle}`,
            shadow: t.shadow.sm,
        },
        elevated: {
            background: t.bg.primary,
            border: `1px solid ${t.border.subtle}`,
            shadow: t.shadow.md,
        },
        outlined: {
            background: 'transparent',
            border: `1px solid ${t.border.medium}`,
            shadow: 'none',
        },
        filled: {
            background: t.bg.secondary,
            border: 'none',
            shadow: 'none',
        },
    };

    // Padding sizes
    const paddings = {
        none: '0',
        sm: spacing[3],
        md: spacing[4],
        lg: spacing[6],
        xl: spacing[8],
    };

    const currentVariant = variants[variant] || variants.default;
    const currentPadding = paddings[padding] || paddings.md;

    const baseStyles = {
        fontFamily: typography.fontFamily,
        borderRadius: borderRadius.xl,
        background: currentVariant.background,
        border: currentVariant.border,
        boxShadow: currentVariant.shadow,
        overflow: 'hidden',
        transition: interactive ? `all ${transitions.normal} ${transitions.easing}` : 'none',
        cursor: interactive ? 'pointer' : 'default',
        ...style,
    };

    const contentStyles = {
        padding: currentPadding,
    };

    const headerStyles = {
        padding: `${spacing[3]} ${currentPadding}`,
        borderBottom: `1px solid ${t.border.subtle}`,
        background: t.bg.secondary,
    };

    const footerStyles = {
        padding: `${spacing[3]} ${currentPadding}`,
        borderTop: `1px solid ${t.border.subtle}`,
        background: t.bg.secondary,
    };

    const handleMouseEnter = (e) => {
        if (interactive) {
            e.currentTarget.style.boxShadow = t.shadow.lg;
            e.currentTarget.style.transform = 'translateY(-2px)';
        }
    };

    const handleMouseLeave = (e) => {
        if (interactive) {
            e.currentTarget.style.boxShadow = currentVariant.shadow;
            e.currentTarget.style.transform = 'none';
        }
    };

    const handleFocus = (e) => {
        if (interactive) {
            e.currentTarget.style.outline = `2px solid ${t.border.focus}`;
            e.currentTarget.style.outlineOffset = '2px';
        }
    };

    const handleBlur = (e) => {
        if (interactive) {
            e.currentTarget.style.outline = 'none';
        }
    };

    const handleKeyDown = (e) => {
        if (interactive && onClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick(e);
        }
    };

    const CardComponent = interactive ? 'button' : 'div';
    const cardRole = role || (interactive ? 'button' : undefined);

    return (
        <CardComponent
            ref={ref}
            role={cardRole}
            tabIndex={interactive ? 0 : undefined}
            onClick={interactive ? onClick : undefined}
            onKeyDown={interactive ? handleKeyDown : undefined}
            aria-label={ariaLabel}
            aria-describedby={ariaDescribedBy}
            style={baseStyles}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
        >
            {header && (
                <div style={headerStyles}>
                    {header}
                </div>
            )}
            <div style={contentStyles}>
                {children}
            </div>
            {footer && (
                <div style={footerStyles}>
                    {footer}
                </div>
            )}
        </CardComponent>
    );
});

export default Card;

'use client';

import { forwardRef, useState, useId } from 'react';
import { theme, typography, borderRadius, spacing, transitions } from '@/lib/theme';

/**
 * Accessible Input Component
 *
 * Features:
 * - WCAG 2.1 AA compliant
 * - Associated labels (required for accessibility)
 * - Clear focus states
 * - Error and hint text support
 * - Required field indicator
 * - Character count (optional)
 */
const Input = forwardRef(function Input(
    {
        label,
        type = 'text',
        value,
        onChange,
        placeholder,
        disabled = false,
        required = false,
        error,
        hint,
        maxLength,
        showCharCount = false,
        fullWidth = true,
        size = 'md',
        id: providedId,
        name,
        autoComplete,
        autoFocus,
        ariaDescribedBy,
        style,
        inputStyle,
        ...props
    },
    ref
) {
    const t = theme.light;
    const [isFocused, setIsFocused] = useState(false);
    const generatedId = useId();
    const id = providedId || generatedId;
    const hintId = `${id}-hint`;
    const errorId = `${id}-error`;

    // Size styles
    const sizes = {
        sm: {
            padding: `${spacing[2]} ${spacing[3]}`,
            fontSize: typography.size.sm,
        },
        md: {
            padding: `${spacing[2]} ${spacing[3]}`,
            fontSize: typography.size.base,
        },
        lg: {
            padding: `${spacing[3]} ${spacing[4]}`,
            fontSize: typography.size.lg,
        },
    };

    const currentSize = sizes[size] || sizes.md;

    const containerStyles = {
        display: 'flex',
        flexDirection: 'column',
        gap: spacing[1],
        width: fullWidth ? '100%' : 'auto',
        ...style,
    };

    const labelStyles = {
        fontFamily: typography.fontFamily,
        fontSize: typography.size.sm,
        fontWeight: typography.weight.medium,
        color: error ? t.accent.error : t.text.primary,
        display: 'flex',
        alignItems: 'center',
        gap: spacing[1],
    };

    const inputBaseStyles = {
        fontFamily: typography.fontFamily,
        fontSize: currentSize.fontSize,
        lineHeight: typography.lineHeight.normal,
        padding: currentSize.padding,
        borderRadius: borderRadius.lg,
        border: `1px solid ${error ? t.accent.error : isFocused ? t.border.focus : t.border.input}`,
        backgroundColor: disabled ? t.bg.secondary : t.bg.primary,
        color: disabled ? t.text.tertiary : t.text.primary,
        transition: `border-color ${transitions.fast} ${transitions.easing}, box-shadow ${transitions.fast} ${transitions.easing}`,
        outline: 'none',
        width: '100%',
        cursor: disabled ? 'not-allowed' : 'text',
        boxShadow: isFocused ? `0 0 0 3px ${error ? 'rgba(220, 38, 38, 0.1)' : 'rgba(37, 99, 235, 0.1)'}` : 'none',
        ...inputStyle,
    };

    const hintStyles = {
        fontFamily: typography.fontFamily,
        fontSize: typography.size.sm,
        color: t.text.tertiary,
        lineHeight: typography.lineHeight.normal,
    };

    const errorStyles = {
        fontFamily: typography.fontFamily,
        fontSize: typography.size.sm,
        color: t.accent.error,
        lineHeight: typography.lineHeight.normal,
        display: 'flex',
        alignItems: 'center',
        gap: spacing[1],
    };

    const charCountStyles = {
        fontFamily: typography.fontFamily,
        fontSize: typography.size.xs,
        color: t.text.tertiary,
        textAlign: 'right',
    };

    // Build aria-describedby
    const describedByParts = [];
    if (hint) describedByParts.push(hintId);
    if (error) describedByParts.push(errorId);
    if (ariaDescribedBy) describedByParts.push(ariaDescribedBy);
    const finalDescribedBy = describedByParts.length > 0 ? describedByParts.join(' ') : undefined;

    return (
        <div style={containerStyles}>
            {label && (
                <label htmlFor={id} style={labelStyles}>
                    {label}
                    {required && (
                        <span aria-hidden="true" style={{ color: t.accent.error }}>
                            *
                        </span>
                    )}
                </label>
            )}

            <input
                ref={ref}
                id={id}
                name={name || id}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
                maxLength={maxLength}
                autoComplete={autoComplete}
                autoFocus={autoFocus}
                aria-invalid={!!error}
                aria-describedby={finalDescribedBy}
                aria-required={required}
                style={inputBaseStyles}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                {...props}
            />

            {/* Hint text */}
            {hint && !error && (
                <span id={hintId} style={hintStyles}>
                    {hint}
                </span>
            )}

            {/* Error message */}
            {error && (
                <span id={errorId} style={errorStyles} role="alert">
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {error}
                </span>
            )}

            {/* Character count */}
            {showCharCount && maxLength && (
                <span style={charCountStyles} aria-live="polite">
                    {(value?.length || 0)} / {maxLength}
                </span>
            )}
        </div>
    );
});

export default Input;

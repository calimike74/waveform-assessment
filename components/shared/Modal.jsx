'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { theme, typography, borderRadius, spacing, transitions } from '@/lib/theme';

/**
 * Accessible Modal Component
 *
 * Features:
 * - WCAG 2.1 AA compliant
 * - Focus trap (keyboard navigation stays within modal)
 * - Focus restoration on close
 * - Escape key to close
 * - Click outside to close (optional)
 * - Proper ARIA attributes
 * - Prevents body scroll when open
 */
export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    closeOnOverlayClick = true,
    closeOnEscape = true,
    showCloseButton = true,
    footer,
    ariaDescribedBy,
}) {
    const t = theme.light;
    const modalRef = useRef(null);
    const previousActiveElement = useRef(null);

    // Size styles
    const sizes = {
        sm: { maxWidth: '400px' },
        md: { maxWidth: '560px' },
        lg: { maxWidth: '720px' },
        xl: { maxWidth: '900px' },
        full: { maxWidth: '95vw', maxHeight: '95vh' },
    };

    const currentSize = sizes[size] || sizes.md;

    // Focus trap - get all focusable elements
    const getFocusableElements = useCallback(() => {
        if (!modalRef.current) return [];
        const focusableSelectors = [
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            'a[href]',
            '[tabindex]:not([tabindex="-1"])',
        ].join(', ');
        return Array.from(modalRef.current.querySelectorAll(focusableSelectors));
    }, []);

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
        (e) => {
            if (!isOpen) return;

            // Close on Escape
            if (e.key === 'Escape' && closeOnEscape) {
                e.preventDefault();
                onClose();
                return;
            }

            // Focus trap with Tab
            if (e.key === 'Tab') {
                const focusableElements = getFocusableElements();
                if (focusableElements.length === 0) return;

                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (e.shiftKey) {
                    // Shift + Tab
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    // Tab
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        },
        [isOpen, closeOnEscape, onClose, getFocusableElements]
    );

    // Handle overlay click
    const handleOverlayClick = (e) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) {
            onClose();
        }
    };

    // Effect: Focus management and body scroll lock
    useEffect(() => {
        if (isOpen) {
            // Store currently focused element
            previousActiveElement.current = document.activeElement;

            // Focus first focusable element in modal
            const focusableElements = getFocusableElements();
            if (focusableElements.length > 0) {
                setTimeout(() => focusableElements[0].focus(), 0);
            }

            // Prevent body scroll
            document.body.style.overflow = 'hidden';

            // Add keyboard listener
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            if (isOpen) {
                // Restore body scroll
                document.body.style.overflow = '';

                // Remove keyboard listener
                document.removeEventListener('keydown', handleKeyDown);

                // Restore focus
                if (previousActiveElement.current) {
                    previousActiveElement.current.focus();
                }
            }
        };
    }, [isOpen, handleKeyDown, getFocusableElements]);

    if (!isOpen) return null;

    const overlayStyles = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing[4],
        zIndex: 1000,
        animation: 'fadeIn 200ms ease-out',
    };

    const modalStyles = {
        background: t.bg.primary,
        borderRadius: borderRadius['2xl'],
        boxShadow: t.shadow.lg,
        width: '100%',
        ...currentSize,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideIn 200ms ease-out',
    };

    const headerStyles = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${spacing[4]} ${spacing[6]}`,
        borderBottom: `1px solid ${t.border.subtle}`,
    };

    const titleStyles = {
        fontFamily: typography.fontFamily,
        fontSize: typography.size['xl'],
        fontWeight: typography.weight.semibold,
        color: t.text.primary,
        margin: 0,
        lineHeight: typography.lineHeight.tight,
    };

    const closeButtonStyles = {
        background: 'none',
        border: 'none',
        padding: spacing[2],
        cursor: 'pointer',
        borderRadius: borderRadius.md,
        color: t.text.tertiary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: `all ${transitions.fast} ${transitions.easing}`,
    };

    const contentStyles = {
        padding: spacing[6],
        overflowY: 'auto',
        flex: 1,
    };

    const footerStyles = {
        padding: `${spacing[4]} ${spacing[6]}`,
        borderTop: `1px solid ${t.border.subtle}`,
        display: 'flex',
        justifyContent: 'flex-end',
        gap: spacing[3],
    };

    // Animation keyframes
    const styleSheet = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;

    const modalContent = (
        <>
            <style>{styleSheet}</style>
            <div
                style={overlayStyles}
                onClick={handleOverlayClick}
                aria-hidden="true"
            >
                <div
                    ref={modalRef}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                    aria-describedby={ariaDescribedBy}
                    style={modalStyles}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div style={headerStyles}>
                        <h2 id="modal-title" style={titleStyles}>
                            {title}
                        </h2>
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                style={closeButtonStyles}
                                aria-label="Close modal"
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = t.bg.secondary;
                                    e.currentTarget.style.color = t.text.primary;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'none';
                                    e.currentTarget.style.color = t.text.tertiary;
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.outline = `2px solid ${t.border.focus}`;
                                    e.currentTarget.style.outlineOffset = '2px';
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.outline = 'none';
                                }}
                            >
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <div style={contentStyles}>
                        {children}
                    </div>

                    {/* Footer */}
                    {footer && (
                        <div style={footerStyles}>
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </>
    );

    // Use portal to render at document body level
    if (typeof document !== 'undefined') {
        return createPortal(modalContent, document.body);
    }

    return null;
}

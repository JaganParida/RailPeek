import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth,
  size = 'md',
  footer,
  className,
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const dialogRef = useRef(null);

  // Smooth enter and exit transition controller
  useEffect(() => {
    let timer;
    if (isOpen) {
      setIsMounted(true);
      // Small tick for CSS transition to trigger
      timer = setTimeout(() => {
        setIsVisible(true);
      }, 15);
    } else {
      setIsVisible(false);
      // Wait for exit animation to complete before removing from DOM
      timer = setTimeout(() => {
        setIsMounted(false);
      }, 200);
    }
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Close on ESC key and lock background scrolling
  useEffect(() => {
    if (!isMounted) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isMounted, onClose]);

  if (!isMounted) return null;

  const sizeClasses =
    size === 'lg'
      ? 'max-w-2xl sm:max-w-3xl'
      : size === 'xl'
      ? 'max-w-4xl'
      : size === 'sm'
      ? 'max-w-md'
      : maxWidth || 'max-w-lg';

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200 ease-out select-none',
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={dialogRef}
        className={cn(
          'w-full bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-400 dark:border-slate-600 p-5 sm:p-6 text-slate-900 dark:text-slate-100 relative transition-all duration-200 ease-out flex flex-col max-h-[90vh]',
          isVisible
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-2 pointer-events-none',
          sizeClasses,
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4 shrink-0">
          <div>
            {title && (
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 pr-1 -mr-1 py-1 space-y-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

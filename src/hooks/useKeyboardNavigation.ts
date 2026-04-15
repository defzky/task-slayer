import { useCallback } from 'react';

interface UseKeyboardNavigationOptions {
  onEnter?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onTab?: () => void;
}

/**
 * Hook for handling common keyboard navigation patterns
 */
export const useKeyboardNavigation = ({
  onEnter,
  onEscape,
  onArrowUp,
  onArrowDown,
  onArrowLeft,
  onArrowRight,
  onTab
}: UseKeyboardNavigationOptions = {}) => {
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent | KeyboardEvent) => {
      switch (event.key) {
        case 'Enter':
          if (onEnter) {
            event.preventDefault();
            onEnter();
          }
          break;
        case 'Escape':
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;
        case 'ArrowUp':
          if (onArrowUp) {
            event.preventDefault();
            onArrowUp();
          }
          break;
        case 'ArrowDown':
          if (onArrowDown) {
            event.preventDefault();
            onArrowDown();
          }
          break;
        case 'ArrowLeft':
          if (onArrowLeft) {
            event.preventDefault();
            onArrowLeft();
          }
          break;
        case 'ArrowRight':
          if (onArrowRight) {
            event.preventDefault();
            onArrowRight();
          }
          break;
        case 'Tab':
          if (onTab) {
            onTab();
          }
          break;
      }
    },
    [onEnter, onEscape, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onTab]
  );

  return { handleKeyDown };
};

/**
 * Hook for creating accessible button handlers
 */
export const useAccessibleButton = (onClick: () => void, options?: {
  disabled?: boolean;
  label?: string;
}) => {
  const { disabled = false, label } = options || {};

  const handleClick = useCallback(
    (event: React.MouseEvent | React.KeyboardEvent) => {
      if (disabled) return;

      if (
        event.type === 'click' ||
        (event.type === 'keydown' && (event.key === 'Enter' || event.key === ' '))
      ) {
        event.preventDefault();
        onClick();
      }
    },
    [disabled, onClick]
  );

  return {
    onClick: handleClick,
    onKeyDown: handleClick,
    role: 'button' as const,
    tabIndex: disabled ? -1 : 0,
    'aria-disabled': disabled,
    'aria-label': label,
    style: disabled ? { cursor: 'not-allowed', opacity: 0.5 } : { cursor: 'pointer' }
  };
};

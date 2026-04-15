import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, fireEvent } from '@testing-library/react';
import { useKeyboardNavigation, useAccessibleButton } from '../hooks';

describe('useKeyboardNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls onEnter when Enter key is pressed', () => {
    const onEnter = vi.fn();
    const { result } = renderHook(() => useKeyboardNavigation({ onEnter }));

    const mockEvent = {
      key: 'Enter',
      preventDefault: vi.fn()
    } as unknown as React.KeyboardEvent;

    result.current.handleKeyDown(mockEvent);

    expect(onEnter).toHaveBeenCalled();
    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('calls onEscape when Escape key is pressed', () => {
    const onEscape = vi.fn();
    const { result } = renderHook(() => useKeyboardNavigation({ onEscape }));

    const mockEvent = {
      key: 'Escape',
      preventDefault: vi.fn()
    } as unknown as React.KeyboardEvent;

    result.current.handleKeyDown(mockEvent);

    expect(onEscape).toHaveBeenCalled();
    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('calls onArrowDown when ArrowDown key is pressed', () => {
    const onArrowDown = vi.fn();
    const { result } = renderHook(() => useKeyboardNavigation({ onArrowDown }));

    const mockEvent = {
      key: 'ArrowDown',
      preventDefault: vi.fn()
    } as unknown as React.KeyboardEvent;

    result.current.handleKeyDown(mockEvent);

    expect(onArrowDown).toHaveBeenCalled();
    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('calls onArrowUp when ArrowUp key is pressed', () => {
    const onArrowUp = vi.fn();
    const { result } = renderHook(() => useKeyboardNavigation({ onArrowUp }));

    const mockEvent = {
      key: 'ArrowUp',
      preventDefault: vi.fn()
    } as unknown as React.KeyboardEvent;

    result.current.handleKeyDown(mockEvent);

    expect(onArrowUp).toHaveBeenCalled();
    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('does not call callbacks for unhandled keys', () => {
    const onEnter = vi.fn();
    const { result } = renderHook(() => useKeyboardNavigation({ onEnter }));

    const mockEvent = {
      key: 'A',
      preventDefault: vi.fn()
    } as unknown as React.KeyboardEvent;

    result.current.handleKeyDown(mockEvent);

    expect(onEnter).not.toHaveBeenCalled();
  });

  it('works without any callbacks', () => {
    const { result } = renderHook(() => useKeyboardNavigation());

    const mockEvent = {
      key: 'Enter',
      preventDefault: vi.fn()
    } as unknown as React.KeyboardEvent;

    expect(() => result.current.handleKeyDown(mockEvent)).not.toThrow();
  });
});

describe('useAccessibleButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns button props with correct role and tabIndex', () => {
    const onClick = vi.fn();
    const { result } = renderHook(() => useAccessibleButton(onClick));

    expect(result.current.role).toBe('button');
    expect(result.current.tabIndex).toBe(0);
    expect(result.current['aria-disabled']).toBe(false);
  });

  it('calls onClick on click event', () => {
    const onClick = vi.fn();
    const { result } = renderHook(() => useAccessibleButton(onClick));

    const mockEvent = {
      type: 'click',
      preventDefault: vi.fn()
    } as unknown as React.MouseEvent;

    result.current.onClick(mockEvent);

    expect(onClick).toHaveBeenCalled();
  });

  it('calls onClick on Enter keydown', () => {
    const onClick = vi.fn();
    const { result } = renderHook(() => useAccessibleButton(onClick));

    const mockEvent = {
      type: 'keydown',
      key: 'Enter',
      preventDefault: vi.fn()
    } as unknown as React.KeyboardEvent;

    result.current.onKeyDown(mockEvent);

    expect(onClick).toHaveBeenCalled();
  });

  it('calls onClick on Space keydown', () => {
    const onClick = vi.fn();
    const { result } = renderHook(() => useAccessibleButton(onClick));

    const mockEvent = {
      type: 'keydown',
      key: ' ',
      preventDefault: vi.fn()
    } as unknown as React.KeyboardEvent;

    result.current.onKeyDown(mockEvent);

    expect(onClick).toHaveBeenCalled();
  });

  it('does not call onClick when disabled', () => {
    const onClick = vi.fn();
    const { result } = renderHook(() => useAccessibleButton(onClick, { disabled: true }));

    const mockEvent = {
      type: 'click',
      preventDefault: vi.fn()
    } as unknown as React.MouseEvent;

    result.current.onClick(mockEvent);

    expect(onClick).not.toHaveBeenCalled();
    expect(result.current.tabIndex).toBe(-1);
    expect(result.current['aria-disabled']).toBe(true);
  });

  it('includes aria-label when provided', () => {
    const onClick = vi.fn();
    const { result } = renderHook(() =>
      useAccessibleButton(onClick, { label: 'Click me' })
    );

    expect(result.current['aria-label']).toBe('Click me');
  });

  it('has not-allowed cursor when disabled', () => {
    const onClick = vi.fn();
    const { result } = renderHook(() => useAccessibleButton(onClick, { disabled: true }));

    expect(result.current.style).toEqual({
      cursor: 'not-allowed',
      opacity: 0.5
    });
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Component that throws an error
const BrokenComponent = () => {
  throw new Error('Something went wrong!');
};

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Normal Content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Normal Content')).toBeInTheDocument();
  });

  it('renders fallback UI when error occurs', () => {
    // Suppress console.error for this test
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Reload Application')).toBeInTheDocument();

    vi.restoreAllMocks();
  });

  it('renders custom fallback when provided', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary fallback={<div>Custom Error UI</div>}>
        <BrokenComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();

    vi.restoreAllMocks();
  });

  it('calls onError callback when error occurs', () => {
    const onErrorMock = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary onError={onErrorMock}>
        <BrokenComponent />
      </ErrorBoundary>
    );

    expect(onErrorMock).toHaveBeenCalled();

    vi.restoreAllMocks();
  });
});

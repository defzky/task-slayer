import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f0f10] text-[#e0e0e0] p-4">
          <div className="max-w-md w-full bg-[#1a181a] border border-red-900/50 rounded-lg p-6 shadow-[0_0_30px_rgba(220,38,38,0.3)]">
            <div className="text-center mb-4">
              <span className="text-5xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-red-400 mb-2 text-center">
              Something went wrong
            </h2>
            <p className="text-gray-400 text-sm mb-4 text-center">
              The application encountered an unexpected error.
            </p>
            {this.state.error && (
              <div className="bg-[#0f0f10] border border-[#333] rounded p-3 mb-4">
                <code className="text-xs text-red-300 break-all">
                  {this.state.error.message}
                </code>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-[#d4af37] text-black font-bold py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

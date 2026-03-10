/**
 * Generic React Error Boundary [module: components]
 * Catches unhandled render errors in child component trees and displays
 * a graceful fallback instead of a blank white screen.
 * Usage: wrap any section that may fail (e.g. MagicMirror, wardrobe grid).
 */
"use client";

import React, { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Optional custom fallback. Receives the caught error. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    const { children, fallback } = this.props;

    if (error) {
      if (fallback) return fallback(error, this.reset);

      return (
        <div className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl bg-[#FDF8F3] border-2 border-[#C9B89C] text-center">
          <span className="material-symbols-outlined text-5xl text-[#8B4513]/40">
            error_outline
          </span>
          <div>
            <h3 className="font-bold text-[#8B4513] text-lg mb-1">
              Something went wrong
            </h3>
            <p className="text-sm text-[#857266] max-w-xs">
              {error.message || "An unexpected error occurred. Please try again."}
            </p>
          </div>
          <button
            onClick={this.reset}
            className="px-5 py-2 bg-[#8B5E3C] text-white text-sm font-semibold rounded-full hover:bg-[#6B4226] transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;

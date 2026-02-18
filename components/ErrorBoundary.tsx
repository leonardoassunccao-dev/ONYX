

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen bg-black flex flex-col items-center justify-center text-white p-8 text-center">
          <h1 className="text-2xl font-black text-red-600 uppercase tracking-widest mb-4">CRITICAL SYSTEM FAILURE</h1>
          <p className="text-xs font-mono text-zinc-500 max-w-md mb-8">
            The core interface encountered an unrecoverable error.
            <br/>
            {this.state.error?.message}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 border border-red-900/30 bg-red-900/10 text-red-500 hover:bg-red-900 hover:text-white transition-all text-xs font-black uppercase tracking-widest rounded"
          >
            Force System Reboot
          </button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

export default ErrorBoundary;

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Suppress errors during external navigation (e.g. Viva payment redirect)
    if (typeof window !== "undefined" && (window as any).__isNavigatingAway) {
      console.warn("ErrorBoundary: suppressed error during navigation away:", error.message);
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Don't log if navigating away - these are expected teardown errors
    if (typeof window !== "undefined" && (window as any).__isNavigatingAway) {
      console.warn("ErrorBoundary: suppressed componentDidCatch during navigation away");
      return;
    }
    console.error("ErrorBoundary caught:", error.message, error.stack, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    // Double-check: if navigating away, never show error UI
    if (typeof window !== "undefined" && (window as any).__isNavigatingAway) {
      return this.props.children;
    }

    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-xl font-semibold text-foreground mb-2">
              Une erreur est survenue
            </h1>
            <p className="text-muted-foreground mb-6 text-sm">
              L'application a rencontré un problème inattendu. Veuillez recharger la page.
            </p>
            <button
              onClick={this.handleReload}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

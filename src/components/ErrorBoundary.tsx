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
    if (typeof window !== "undefined" && (window as any).__isNavigatingAway) {
      console.warn("ErrorBoundary: suppressed componentDidCatch during navigation away");
      return;
    }
    console.error("ErrorBoundary caught:", error.message, error.stack, errorInfo);
  }

  componentDidMount() {
    // Listen for route changes to reset error state
    this.resetOnNavigation();
  }

  componentDidUpdate() {
    this.resetOnNavigation();
  }

  private resetOnNavigation() {
    if (this.state.hasError) {
      // Reset error state after a short delay to allow navigation to complete
      const handlePopState = () => {
        this.setState({ hasError: false, error: null });
      };
      window.addEventListener("popstate", handlePopState, { once: true });
    }
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (typeof window !== "undefined" && (window as any).__isNavigatingAway) {
      return this.props.children;
    }

    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", backgroundColor: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ textAlign: "center", maxWidth: "28rem" }}>
            <div style={{ width: "4rem", height: "4rem", margin: "0 auto 1.5rem", borderRadius: "50%", backgroundColor: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "1.5rem" }}>⚠️</span>
            </div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#111827", marginBottom: "0.5rem" }}>
              Une erreur est survenue
            </h1>
            <p style={{ color: "#6b7280", marginBottom: "1.5rem", fontSize: "0.875rem" }}>
              L'application a rencontré un problème inattendu.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button
                onClick={this.handleReload}
                style={{ padding: "0.75rem 1.5rem", backgroundColor: "#b8860b", color: "#ffffff", borderRadius: "0.5rem", border: "none", cursor: "pointer", fontWeight: 500, fontSize: "0.875rem" }}
              >
                Recharger la page
              </button>
              <button
                onClick={this.handleGoHome}
                style={{ padding: "0.5rem", backgroundColor: "transparent", color: "#6b7280", border: "none", cursor: "pointer", fontSize: "0.875rem" }}
              >
                Retour à l'accueil
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

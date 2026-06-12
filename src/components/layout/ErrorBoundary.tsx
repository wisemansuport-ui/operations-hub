import React, { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches any unhandled JavaScript error in the component tree below and
 * renders a recovery UI instead of a blank/black screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] Unhandled error:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Navigate back to dashboard
    window.location.href = "/app";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "hsl(var(--background))",
            color: "hsl(var(--foreground))",
            padding: "2rem",
            textAlign: "center",
            gap: "1rem",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "hsl(var(--destructive) / 0.15)",
              border: "1px solid hsl(var(--destructive) / 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              marginBottom: 8,
            }}
          >
            ⚠️
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>
            Ops! Algo deu errado
          </h2>
          <p
            style={{
              fontSize: "0.875rem",
              color: "hsl(var(--muted-foreground))",
              maxWidth: 340,
              margin: 0,
            }}
          >
            Ocorreu um erro inesperado nessa página. Clique abaixo para voltar ao
            Dashboard.
          </p>
          {this.state.error && (
            <code
              style={{
                fontSize: "0.75rem",
                color: "hsl(var(--muted-foreground))",
                background: "hsl(var(--muted) / 0.4)",
                borderRadius: 6,
                padding: "6px 12px",
                maxWidth: 420,
                overflow: "auto",
              }}
            >
              {this.state.error.message}
            </code>
          )}
          <button
            onClick={this.handleReset}
            style={{
              marginTop: 8,
              padding: "10px 28px",
              borderRadius: 10,
              background: "hsl(var(--primary))",
              color: "hsl(var(--primary-foreground))",
              border: "none",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Voltar ao Dashboard
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

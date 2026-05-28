import { Component, type ReactNode } from "react";

type Props = {
  fallback?: ReactNode;
  children: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("ErrorBoundary caught:", error);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="error-boundary">
            <h2>Something tipped over.</h2>
            <p>{this.state.error?.message || "An unexpected error occurred."}</p>
            <button className="primary-button" onClick={this.reset} type="button">
              Try again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

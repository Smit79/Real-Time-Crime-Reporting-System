import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('UI ErrorBoundary:', error, errorInfo);

    // If it's a chunk load error (happens after new deployments when user has old tab open)
    const isChunkLoadError = 
      error?.name === 'ChunkLoadError' || 
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Loading chunk');

    if (isChunkLoadError) {
      // Force a hard reload to get the new JavaScript chunks from the server
      window.location.reload();
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="mx-auto mt-20 w-full max-w-xl rounded-2xl border border-danger/30 bg-danger/10 p-8 text-center">
        <h2 className="text-2xl font-bold text-danger">Something went wrong</h2>
        <p className="mt-2 text-sm text-text-muted">
          The app hit an unexpected error. Refresh the page or try again in a moment.
        </p>
        {this.state.error ? (
          <p className="mt-3 rounded-lg bg-surface p-3 text-left text-xs text-text-muted">
            {this.state.error.message}
          </p>
        ) : null}
      </div>
    );
  }
}

export default ErrorBoundary;

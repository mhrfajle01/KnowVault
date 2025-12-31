import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mt-5 text-center">
            <div className="alert alert-danger shadow-sm p-5">
                <h1 className="display-4">Something went wrong.</h1>
                <p className="lead">Don't worry, your data is safe in the database.</p>
                <p className="font-monospace bg-light p-3 rounded text-danger small">
                    {this.state.error && this.state.error.toString()}
                </p>
                <button className="btn btn-primary mt-3" onClick={() => window.location.reload()}>
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

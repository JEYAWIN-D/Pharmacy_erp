import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm my-4">
          <div className="text-center max-w-md space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-base font-extrabold text-slate-800 uppercase tracking-wider">
              Component Error Occurred
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Something went wrong while rendering this section of the procurement workspace.
            </p>
            {this.state.error && (
              <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl text-left">
                <p className="text-[11px] font-mono font-bold text-rose-700 break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}
            <div className="flex justify-center gap-2.5 pt-2">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm cursor-pointer"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught render error:', error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return <FallbackScreen onReload={this.handleReload} />;
    }
    return this.props.children;
  }
}

function FallbackScreen({ onReload }: { onReload: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-gray-50 p-8 text-center">
      <svg
        className="h-16 w-16 text-indigo-200"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" />
        <line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round" />
      </svg>

      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold text-gray-800">Terjadi kesalahan tak terduga</h1>
        <p className="text-sm text-gray-500">
          Coba muat ulang halaman. Jika masalah berlanjut, hubungi dukungan.
        </p>
      </div>

      <button
        type="button"
        onClick={onReload}
        className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        Muat Ulang
      </button>
    </div>
  );
}

export default ErrorBoundary;

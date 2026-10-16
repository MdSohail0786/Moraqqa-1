import { Component } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';

export function ErrorState({ error, onRetry, title = 'We could not load this', compact = false }) {
  return (
    <div className={`state ${compact ? 'state--compact' : ''}`} role="alert">
      <p className="eyebrow">Something went wrong</p>
      <h2 className="state__title">{title}</h2>
      <p className="state__text">{error?.message || 'Please check your connection and try again.'}</p>
      {onRetry && (
        <button type="button" className="btn btn--line" onClick={onRetry}>
          <RefreshCw size={15} aria-hidden="true" /> Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title = 'Nothing here yet', text, action, compact = false }) {
  return (
    <div className={`state ${compact ? 'state--compact' : ''}`}>
      <p className="eyebrow">Empty</p>
      <h2 className="state__title">{title}</h2>
      {text && <p className="state__text">{text}</p>}
      {action}
    </div>
  );
}

/** Catches render errors so a failing section never leaves a blank screen. */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('UI error:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.silent) return null;
    return (
      <div className="state state--page" role="alert">
        <p className="eyebrow">Unexpected error</p>
        <h1 className="state__title">This page ran into a problem</h1>
        <p className="state__text">Please refresh, or return to the homepage.</p>
        <div className="state__actions">
          <button type="button" className="btn btn--solid" onClick={() => window.location.reload()}>
            Refresh
          </button>
          <Link className="btn btn--line" to="/" onClick={() => this.setState({ error: null })}>
            Go home
          </Link>
        </div>
      </div>
    );
  }
}

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// Without this, an uncaught render error on any tab (e.g. an unexpected data
// shape on the Growth page) unmounts the whole React tree and the tab just
// goes blank with nothing but a console error. This catches it and gives the
// user a way back instead of a dead screen.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    console.error("Render error caught by ErrorBoundary:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <p className="text-[13.5px] text-danger">This tab hit an error and couldn&rsquo;t load.</p>
          <button onClick={() => window.location.reload()} className="btn btn-ghost">
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

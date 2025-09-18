// src/routes/ErrorBoundary.tsx
import { useRouteError, isRouteErrorResponse, Link } from "react-router-dom";

export function RouteErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error)) {
    const status = error.status;
    const message = error.statusText || "Something went wrong";
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Route Error</h1>
        <p className="mt-2">Status: {status}</p>
        <p className="mt-1">{message}</p>
        <div className="mt-4 flex gap-2">
          <Link className="btn btn-primary" to="/">
            Home
          </Link>
          <Link className="btn" to="/workspaces">
            Workspaces
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Unexpected Error</h1>
      <pre className="mt-2 text-sm opacity-80">{String(error)}</pre>
      <div className="mt-4">
        <a className="btn" href="/" onClick={() => location.reload()}>
          Reload
        </a>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';

import PageTransition from '../components/common/PageTransition';

const NotFoundPage = () => {
  return (
    <PageTransition className="grid min-h-[60vh] place-items-center px-4 py-16">
      <div className="max-w-lg rounded-3xl border border-border bg-surface p-8 text-center shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-widest text-danger">404 error</p>
        <h1 className="mt-2 font-heading text-3xl font-bold text-text">Page not found</h1>
        <p className="mt-3 text-sm text-text-muted">
          The route you are trying to access does not exist or you may not have permission.
        </p>
        <Link to="/home" className="btn-primary mt-6 inline-flex" aria-label="Go to home page">
          Back to home
        </Link>
      </div>
    </PageTransition>
  );
};

export default NotFoundPage;

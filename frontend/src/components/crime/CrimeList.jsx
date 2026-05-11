import EmptyState from '../common/EmptyState';
import CrimeCard from './CrimeCard';

const CrimeList = ({ reports = [], onSelect }) => {
  if (reports.length === 0) {
    return <EmptyState title="No crime reports available" />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {reports.map((report) => (
        <CrimeCard key={report._id} report={report} onClick={onSelect} />
      ))}
    </div>
  );
};

export default CrimeList;

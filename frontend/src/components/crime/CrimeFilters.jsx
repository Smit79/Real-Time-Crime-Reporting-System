const CrimeFilters = ({
  filters,
  onChange,
}) => {
  const handleInput = (event) => {
    onChange?.({ [event.target.name]: event.target.value, page: 1 });
  };

  return (
    <div className="grid gap-3 rounded-2xl border border-border bg-surface p-4 md:grid-cols-4">
      <input
        name="search"
        className="input-field"
        placeholder="Search reports"
        value={filters.search || ''}
        onChange={handleInput}
        aria-label="Search reports"
      />
      <select name="crimeType" className="input-field" value={filters.crimeType || ''} onChange={handleInput} aria-label="Filter crime type">
        <option value="">All types</option>
        <option value="theft">Theft</option>
        <option value="robbery">Robbery</option>
        <option value="assault">Assault</option>
        <option value="fraud">Fraud</option>
      </select>
      <select name="severity" className="input-field" value={filters.severity || ''} onChange={handleInput} aria-label="Filter severity">
        <option value="">All severity</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="5">5</option>
      </select>
      <select name="status" className="input-field" value={filters.status || ''} onChange={handleInput} aria-label="Filter status">
        <option value="">All status</option>
        <option value="pending">Pending</option>
        <option value="verified">Verified</option>
        <option value="investigating">Investigating</option>
        <option value="resolved">Resolved</option>
      </select>
    </div>
  );
};

export default CrimeFilters;

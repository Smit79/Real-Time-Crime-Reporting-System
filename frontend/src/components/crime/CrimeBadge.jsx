import { CRIME_TYPE_COLORS, CRIME_TYPE_LABELS } from '../../utils/constants';

const CrimeBadge = ({ type = 'other' }) => {
  const color = CRIME_TYPE_COLORS[type] || CRIME_TYPE_COLORS.other;
  const label = CRIME_TYPE_LABELS[type] || CRIME_TYPE_LABELS.other;

  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold text-white" style={{ backgroundColor: color }}>
      {label}
    </span>
  );
};

export default CrimeBadge;

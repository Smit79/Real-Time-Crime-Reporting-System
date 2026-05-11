import { SEVERITY_COLORS } from '../../utils/constants';

const SeverityBadge = ({ severity = 3 }) => {
  const color = SEVERITY_COLORS[severity] || SEVERITY_COLORS[3];

  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold text-white" style={{ backgroundColor: color }}>
      Severity {severity}
    </span>
  );
};

export default SeverityBadge;

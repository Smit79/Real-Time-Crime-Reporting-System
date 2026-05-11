import { STATUS_COLORS } from '../../utils/constants';

const StatusBadge = ({ status = 'pending' }) => {
  const color = STATUS_COLORS[status] || STATUS_COLORS.pending;

  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize text-white" style={{ backgroundColor: color }}>
      {status}
    </span>
  );
};

export default StatusBadge;

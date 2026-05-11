import { motion } from 'framer-motion';

import { clampText, formatRelativeTime } from '../../utils/formatters';
import CrimeBadge from './CrimeBadge';
import SeverityBadge from './SeverityBadge';
import StatusBadge from './StatusBadge';

const CrimeCard = ({ report, onClick }) => {
  return (
    <motion.article
      className="cursor-pointer rounded-2xl border border-border bg-surface p-4 shadow-soft"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick?.(report)}
    >
      <div className="flex flex-wrap items-center gap-2">
        <CrimeBadge type={report.crimeType} />
        <SeverityBadge severity={report.severity} />
        <StatusBadge status={report.status} />
      </div>
      <h3 className="mt-3 text-lg font-semibold text-text">{report.title}</h3>
      <p className="mt-2 text-sm text-text-muted">{clampText(report.description)}</p>
      <p className="mt-3 text-xs text-text-muted">{formatRelativeTime(report.createdAt)}</p>
    </motion.article>
  );
};

export default CrimeCard;

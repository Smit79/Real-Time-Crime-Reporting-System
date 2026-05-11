import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { CRIME_TYPE_COLORS } from '../../utils/constants';

const CrimeTypeChart = ({ data = [] }) => {
  return (
    <div className="h-72 rounded-2xl border border-border bg-surface p-4 shadow-soft">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="crimeType" cx="50%" cy="50%" outerRadius={88}>
            {data.map((entry) => (
              <Cell key={entry.crimeType} fill={CRIME_TYPE_COLORS[entry.crimeType] || '#475569'} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CrimeTypeChart;

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const HeatmapChart = ({ data = [] }) => {
  return (
    <div className="h-72 rounded-2xl border border-border bg-surface p-4 shadow-soft">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
          <XAxis dataKey="area" interval={2} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Line
            type="linear"
            dataKey="count"
            stroke="var(--color-secondary)"
            strokeWidth={3}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HeatmapChart;

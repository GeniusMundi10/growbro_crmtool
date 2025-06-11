import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Props: expects an array of durations in minutes
interface ConversationDurationPieChartProps {
  durations: number[];
}

const BUCKETS = [
  { label: "≤ 2 min", min: 0, max: 2, color: "#60a5fa" },
  { label: "2-5 min", min: 2, max: 5, color: "#34d399" },
  { label: "5-10 min", min: 5, max: 10, color: "#f59e42" },
  { label: "10-15 min", min: 10, max: 15, color: "#f472b6" },
  { label: "> 15 min", min: 15, max: Infinity, color: "#a78bfa" },
];

function bucketizeDurations(durations: number[]) {
  const counts = BUCKETS.map((bucket) => ({ ...bucket, value: 0 }));
  durations.forEach((duration) => {
    const idx = BUCKETS.findIndex(
      (b) => duration >= b.min && duration < b.max
    );
    if (idx !== -1) counts[idx].value += 1;
  });
  return counts.filter((b) => b.value > 0);
}

const ConversationDurationPieChart: React.FC<ConversationDurationPieChartProps> = ({ durations }) => {
  const data = bucketizeDurations(durations);

  return (
    <div className="bg-white rounded shadow p-4 mb-6">
      <h3 className="font-semibold text-lg mb-2">Conversation Duration Distribution</h3>
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
          >
            {data.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(_value: any, name: any, props: any) => {
              // _value is count, but we want percent
              const percent = props && props.payload && props.payload.percent;
              return [`${(percent * 100).toFixed(1)}%`, name];
            }}
          />
          <Legend
            formatter={(_value: string, entry: any) => {
              // entry.payload.percent is available
              if (entry && entry.payload && typeof entry.payload.percent === 'number') {
                return `${entry.value}: ${(entry.payload.percent * 100).toFixed(1)}%`;
              }
              return entry.value;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ConversationDurationPieChart;

import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface UserSegmentPieChartProps {
  data: Array<{ label: string; value: number; color: string }>;
}

const COLORS = ["#60a5fa", "#34d399"];

const UserSegmentPieChart: React.FC<UserSegmentPieChartProps> = ({ data }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="bg-white rounded shadow p-4 mb-6">
      <h3 className="font-semibold text-lg mb-2">User Segment Distribution</h3>
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ value }) => {
              const percent = total > 0 ? (value / total) : 0;
              return `${(percent * 100).toFixed(1)}%`;
            }}
          >
            {data.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={entry.color || COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Legend
            formatter={(_value: string, entry: any) => {
              const percent = total > 0 ? (entry.payload.value / total) : 0;
              return `${entry.value}: ${(percent * 100).toFixed(1)}%`;
            }}
          />
          <Tooltip
            formatter={(value: number) => {
              const percent = total > 0 ? (value / total) : 0;
              return [`${(percent * 100).toFixed(1)}%`, "Percentage"];
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default UserSegmentPieChart;

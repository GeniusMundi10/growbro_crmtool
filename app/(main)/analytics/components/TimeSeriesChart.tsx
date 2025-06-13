import React from "react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";

export interface TimeSeriesChartProps {
  data: Array<{ day: string; [key: string]: number }>; // e.g. [{ day: '2025-06-10', messages: 22, conversations: 4 }]
  series: Array<{ key: string; label: string; color: string }>;
  title?: string;
  description?: string;
}

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ data, series, title, description }) => {
  return (
    <div className="bg-white rounded shadow p-4 mb-6">
      {title && <h3 className="font-semibold text-lg mb-1">{title}</h3>}
      {description && <p className="text-gray-500 text-sm mb-2">{description}</p>}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis allowDecimals={true} />
            <Tooltip />
            <Legend />
            {series.map(({ key, label, color }) => (
              <Line key={key} type="monotone" dataKey={key} stroke={color} name={label} dot />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TimeSeriesChart;

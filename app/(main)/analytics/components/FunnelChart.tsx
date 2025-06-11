import React from "react";

export interface FunnelChartProps {
  stages: Array<{ label: string; value: number; color?: string }>;
  title?: string;
  description?: string;
}

const FunnelChart: React.FC<FunnelChartProps> = ({ stages, title, description }) => {
  // Calculate max for proportional widths
  const maxValue = Math.max(...stages.map((s) => s.value), 1);

  return (
    <div className="bg-white rounded shadow p-4 mb-6">
      {title && <h3 className="font-semibold text-lg mb-1">{title}</h3>}
      {description && <p className="text-gray-500 text-sm mb-2">{description}</p>}
      <div className="space-y-4">
        {stages.map((stage, idx) => (
          <div key={stage.label} className="flex items-center">
            <div
              className="h-10 rounded-l rounded-r-full flex items-center justify-between px-4 font-medium text-white shadow"
              style={{
                width: `${(stage.value / maxValue) * 100}%`,
                backgroundColor: stage.color || '#0ea5e9',
                minWidth: 80,
                transition: 'width 0.4s',
              }}
            >
              <span>{stage.label}</span>
              <span className="ml-4 text-lg">{stage.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FunnelChart;

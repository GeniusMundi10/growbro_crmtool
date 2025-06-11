import React from "react";

export interface FunnelChartProps {
  stages: Array<{ label: string; value: number; color?: string }>;
  title?: string;
  description?: string;
}

const FunnelChart: React.FC<FunnelChartProps> = ({ stages, title, description }) => {
  // Calculate max for proportional widths
  const maxValue = Math.max(...stages.map((s) => s.value), 1);

  // Calculate conversion rates between each stage
  const conversions = stages.map((stage, idx) => {
    if (idx === 0) return null;
    const prev = stages[idx - 1];
    const rate = prev.value > 0 ? (stage.value / prev.value) * 100 : 0;
    return {
      from: prev.label,
      to: stage.label,
      percent: rate,
      idx,
    };
  });

  return (
    <div className="bg-white rounded shadow p-4 mb-6">
      {title && <h3 className="font-semibold text-lg mb-1">{title}</h3>}
      {description && <p className="text-gray-500 text-sm mb-2">{description}</p>}
      <div className="space-y-4 relative">
        {stages.map((stage, idx) => (
          <React.Fragment key={stage.label}>
            <div className="flex items-center">
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
            {/* Conversion rate label between bars */}
            {idx > 0 && (
              <div className="flex items-center justify-center mb-1" style={{ minHeight: 18 }}>
                <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded shadow-sm border border-gray-200">
                  {conversions[idx] && !isNaN(conversions[idx]!.percent)
                    ? `${conversions[idx]!.percent.toFixed(1)}% converted from ${stages[idx - 1].label}`
                    : '—'}
                </span>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default FunnelChart;

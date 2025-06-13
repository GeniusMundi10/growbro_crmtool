import React from "react";

export interface FunnelChartProps {
  stages: Array<{ label: string; value: number; color?: string }>;
  title?: string;
  description?: string;
}

import { MessageSquare, Users, User } from "lucide-react";

const ICONS: Record<string, JSX.Element> = {
  "Messages": <MessageSquare className="w-5 h-5 mr-2 text-blue-500" aria-label="Messages" />,
  "Conversations": <Users className="w-5 h-5 mr-2 text-green-600" aria-label="Conversations" />,
  "Leads (Unique)": <User className="w-5 h-5 mr-2 text-orange-500" aria-label="Leads" />,
};

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

  // Helper for gradient backgrounds
  const getGradient = (color: string, idx: number) => {
    if (color === "#0ea5e9") return "bg-gradient-to-r from-blue-400 to-blue-600";
    if (color === "#16a34a") return "bg-gradient-to-r from-green-400 to-green-600";
    if (color === "#f59e42") return "bg-gradient-to-r from-orange-400 to-orange-500";
    return "bg-gradient-to-r from-gray-400 to-gray-600";
  };

  return (
    <div className="bg-white rounded shadow p-4 mb-6" aria-label="Funnel Chart">
      {title && <h3 className="font-semibold text-lg mb-1">{title}</h3>}
      {description && <p className="text-gray-500 text-sm mb-2">{description}</p>}
      <div className="space-y-4 relative">
        {stages.map((stage, idx) => (
          <React.Fragment key={stage.label}>
            <div className="flex flex-row items-center w-full">
  {/* Icon + Label: fixed width */}
  <div className="flex items-center min-w-[140px] max-w-[180px] pr-3 text-gray-700 font-medium">
    {ICONS[stage.label] || null}
    {stage.label}
  </div>
  {/* Bar container: fixed width for all bars */}
  <div className="flex-1 flex items-center">
    <div className="w-full relative">
      <div
        className={`h-12 rounded-l rounded-r-full flex items-center justify-end px-4 font-semibold text-white shadow transition-all duration-500 overflow-visible ${getGradient(stage.color || "#0ea5e9", idx)}`}
        style={{
          width: `${(stage.value / maxValue) * 100}%`,
          minWidth: 40,
          border: '1.5px solid #e5e7eb',
          boxShadow: '0 2px 8px 0 rgba(0,0,0,0.07)',
          position: 'relative',
        }}
        aria-label={`${stage.label}: ${stage.value}`}
      >
        <span
          className="text-xl font-bold drop-shadow-sm"
          style={{
            fontSize: (stage.value / maxValue) > 0.12 ? '1.25rem' : '1rem',
            whiteSpace: 'nowrap',
            transition: 'font-size 0.3s',
          }}
        >
          {stage.value}
        </span>
      </div>
    </div>
  </div>
</div>
            {/* Conversion rate label between bars */}
            {idx > 0 && (
              <div className="flex items-center justify-center mb-1" style={{ minHeight: 18 }}>
                <span className="bg-gray-50 text-gray-700 text-xs px-2 py-0.5 rounded shadow-sm border border-gray-200 font-medium">
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

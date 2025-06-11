import React from "react";

export interface LeaderboardTableProps {
  rows: Array<{ rank: number; name: string; value: number; subtitle?: string; iconUrl?: string }>;
  title?: string;
  description?: string;
  valueLabel?: string;
}

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({ rows, title, description, valueLabel }) => {
  return (
    <div className="bg-white rounded shadow p-4 mb-6">
      {title && <h3 className="font-semibold text-lg mb-1">{title}</h3>}
      {description && <p className="text-gray-500 text-sm mb-2">{description}</p>}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr>
              <th className="py-2 px-3">#</th>
              <th className="py-2 px-3">Name</th>
              {rows[0]?.subtitle && <th className="py-2 px-3">Info</th>}
              <th className="py-2 px-3">{valueLabel || "Value"}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.rank} className="border-t">
                <td className="py-2 px-3 font-semibold">{row.rank}</td>
                <td className="py-2 px-3 flex items-center gap-2">
                  {row.iconUrl && <img src={row.iconUrl} alt="icon" className="w-6 h-6 rounded-full" />}
                  {row.name}
                </td>
                {row.subtitle && <td className="py-2 px-3 text-gray-500">{row.subtitle}</td>}
                <td className="py-2 px-3 font-bold">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaderboardTable;

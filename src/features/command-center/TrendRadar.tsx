import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MarketTrendPoint } from "../../shared/contracts";

type Props = {
  trends: MarketTrendPoint[];
  onViewDrivers: () => void;
};

export function TrendRadar({ trends, onViewDrivers }: Props) {
  return (
    <article className="panel large-panel">
      <div className="panel-heading">
        <div>
          <span>Trend Radar</span>
          <h2>Demand signals across the market</h2>
        </div>
        <button type="button" className="ghost-button" onClick={onViewDrivers}>
          View drivers
        </button>
      </div>
      <div className="chart-frame">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trends}>
            <defs>
              <linearGradient id="quickCommerce" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="premiumProducts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: '#71717a' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a' }} />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="quickCommerce"
              name="Quick commerce"
              stroke="#10b981"
              fill="url(#quickCommerce)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="premiumProducts"
              name="Premium products"
              stroke="#14b8a6"
              fill="url(#premiumProducts)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

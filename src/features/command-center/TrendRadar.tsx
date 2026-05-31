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
        <ResponsiveContainer width="100%" height="100%" minHeight={240}>
          <AreaChart data={trends}>
            <defs>
              <linearGradient id="quickCommerce" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#166534" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#166534" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="premiumProducts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C5FFD6" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#C5FFD6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
            <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: '#6b6b7b', fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b6b7b', fontSize: 11 }} />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="quickCommerce"
              name="Quick commerce"
              stroke="#166534"
              fill="url(#quickCommerce)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="premiumProducts"
              name="Premium products"
              stroke="#059669"
              fill="url(#premiumProducts)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

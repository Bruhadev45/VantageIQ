import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MarketTrendPoint } from "../../shared/contracts";

type Props = {
  trends: MarketTrendPoint[];
};

export function MomentumForecast({ trends }: Props) {
  return (
    <article className="panel line-panel">
      <div className="panel-heading compact">
        <div>
          <span>Momentum Forecast</span>
          <h2>Projected category pull</h2>
        </div>
      </div>
      <div className="chart-frame small">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trends}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: '#71717a' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a' }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="quickCommerce"
              name="Quick commerce"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
            />
            <Line type="monotone" dataKey="loyalty" name="Loyalty" stroke="#14b8a6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

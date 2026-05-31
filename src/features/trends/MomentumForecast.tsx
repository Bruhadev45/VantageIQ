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
        <ResponsiveContainer width="100%" height="100%" minHeight={240}>
          <LineChart data={trends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
            <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: '#6b6b7b', fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b6b7b', fontSize: 11 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="quickCommerce"
              name="Quick commerce"
              stroke="#166534"
              strokeWidth={2}
              dot={false}
            />
            <Line type="monotone" dataKey="loyalty" name="Loyalty" stroke="#1a1a2e" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

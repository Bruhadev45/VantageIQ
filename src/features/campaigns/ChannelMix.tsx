import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MarketTrendPoint } from "../../shared/contracts";

type Props = {
  trends: MarketTrendPoint[];
};

export function ChannelMix({ trends }: Props) {
  const data = trends.slice(-4);
  return (
    <article className="panel">
      <div className="panel-heading compact">
        <div>
          <span>Channel Mix</span>
          <h2>Where demand is shifting</h2>
        </div>
      </div>
      <div className="chart-frame small">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: '#71717a' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a' }} />
            <Tooltip />
            <Bar dataKey="premiumProducts" name="Premium products" fill="#10b981" radius={[8, 8, 0, 0]} />
            <Bar dataKey="festiveDemand" name="Festive demand" fill="#14b8a6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

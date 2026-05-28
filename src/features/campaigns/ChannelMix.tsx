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
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
            <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: '#6b6b7b', fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b6b7b', fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="premiumProducts" name="Premium products" fill="#166534" radius={[6, 6, 0, 0]} />
            <Bar dataKey="festiveDemand" name="Festive demand" fill="#C5FFD6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

import { Legend, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";
import type { MarketCompetitor } from "../../shared/contracts";

type Props = {
  competitors: MarketCompetitor[];
};

export function PostureRadar({ competitors }: Props) {
  const data = competitors.map((competitor) => ({
    company: competitor.name,
    // sentiment and engagement are already on a 0-100 scale from the API.
    Sentiment: Math.round(competitor.sentiment),
    Engagement: Math.round(competitor.engagement),
  }));

  return (
    <article className="panel">
      <div className="panel-heading compact">
        <div>
          <span>Competitive posture</span>
          <h2>Relative strength map</h2>
        </div>
      </div>
      <div className="radar-frame">
        <ResponsiveContainer width="100%" height="100%" minHeight={240}>
          <RadarChart data={data}>
            <PolarGrid stroke="#e5e5e5" />
            <PolarAngleAxis dataKey="company" tick={{ fontSize: 11, fill: '#6b6b7b' }} />
            <Radar dataKey="Sentiment" stroke="#166534" fill="#C5FFD6" fillOpacity={0.5} />
            <Radar dataKey="Engagement" stroke="#1a1a2e" fill="#ECFFA3" fillOpacity={0.4} />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

import { Legend, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";
import type { MarketCompetitor } from "../../shared/contracts";

type Props = {
  competitors: MarketCompetitor[];
};

export function PostureRadar({ competitors }: Props) {
  const data = competitors.map((competitor) => ({
    company: competitor.name,
    Sentiment: Math.round(competitor.sentiment * 100),
    Engagement: competitor.engagement,
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
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="rgba(255,255,255,0.08)" />
            <PolarAngleAxis dataKey="company" tick={{ fontSize: 11, fill: '#71717a' }} />
            <Radar dataKey="Sentiment" stroke="#10b981" fill="#10b981" fillOpacity={0.25} />
            <Radar dataKey="Engagement" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.2} />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

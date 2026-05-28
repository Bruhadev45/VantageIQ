import { ClipboardList, Target, Users } from "lucide-react";
import type { MarketCompetitor } from "../../shared/contracts";

type Props = {
  competitor: MarketCompetitor;
};

const formatSigned = (value: number) => `+${value}%`;

export function FastestMover({ competitor }: Props) {
  return (
    <article className="panel">
      <div className="panel-heading compact">
        <div>
          <span>Fastest mover</span>
          <h2>{competitor.name}</h2>
        </div>
        <div className="score-badge">{formatSigned(competitor.growth)}</div>
      </div>
      <p className="insight-copy">{competitor.insight}</p>
      <div className="reason-list">
        <div>
          <Target size={17} />
          <span>{competitor.fastestChannel}</span>
        </div>
        <div>
          <Users size={17} />
          <span>{competitor.moat}</span>
        </div>
        <div>
          <ClipboardList size={17} />
          <span>{competitor.pricing} pricing motion</span>
        </div>
      </div>
    </article>
  );
}

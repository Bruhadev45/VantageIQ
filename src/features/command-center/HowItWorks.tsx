import { FileText, MessageSquareText, Users } from "lucide-react";

const STEPS = [
  {
    icon: MessageSquareText,
    step: "1 · You ask",
    title: "Pose a market question",
    body: "Tell VantageIQ your company, market and rivals — e.g. \"How do I grow BB Now against Blinkit & Zepto?\"",
  },
  {
    icon: Users,
    step: "2 · Agents analyze",
    title: "Four AI analysts work in parallel",
    body: "Research, Trends, Campaigns and Strategy agents study competitors, demand signals and winning campaigns — live, from cited sources.",
  },
  {
    icon: FileText,
    step: "3 · You decide",
    title: "Get a board-ready strategy",
    body: "Prioritized growth plays with impact and confidence scores — exportable as a board memo PDF in one click.",
  },
];

export function HowItWorks() {
  return (
    <section className="how-it-works">
      <div className="how-it-works-head">
        <span className="eyebrow">How it works</span>
        <p>
          VantageIQ replaces ~20 hours of manual competitor research and strategy work with a 90-second,
          fully-cited run.
        </p>
      </div>
      <div className="how-steps">
        {STEPS.map(({ icon: Icon, step, title, body }) => (
          <div className="how-step" key={step}>
            <div className="how-step-icon">
              <Icon size={18} />
            </div>
            <span className="how-step-label">{step}</span>
            <strong>{title}</strong>
            <p>{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

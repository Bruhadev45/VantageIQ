export function HeroPanel() {
  return (
    <section className="hero-panel">
      <div className="hero-copy">
        <span className="eyebrow">Live competitive intelligence</span>
        <h1>Decode India's quick-commerce race, then turn competitor signals into sharper growth moves.</h1>
        <p>
          VantageIQ studies Blinkit, Zepto, Swiggy Instamart, and emerging challengers across market share, campaign
          patterns, city expansion, basket behavior, and customer engagement.
        </p>
      </div>
      <div className="signal-board" aria-label="AI signal workflow visualization">
        <div className="signal-node source">Sources</div>
        <div className="signal-node model">AI Pattern Engine</div>
        <div className="signal-node action">Growth Plays</div>
        <span className="signal-line one" />
        <span className="signal-line two" />
      </div>
    </section>
  );
}

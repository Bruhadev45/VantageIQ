import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Sparkles, X } from "lucide-react";

export const TOUR_STORAGE_KEY = "vaniq_tour_done";

type TourStep = {
  selector: string | null;
  title: string;
  body: string;
};

const STEPS: TourStep[] = [
  {
    selector: ".hero-panel",
    title: "Welcome to VantageIQ 👋",
    body: "This is your AI analyst team. Give it a market question and it returns a board-ready growth strategy in ~90 seconds — every claim cited.",
  },
  {
    selector: ".mission-builder",
    title: "1 · Set the mission",
    body: "Pick your company, market, competitors and goal here. This is the brief your four AI analysts will work from.",
  },
  {
    selector: ".hero-cta",
    title: "2 · Run the analyst team",
    body: "Hit this to launch all four agents — Research, Trends, Campaigns and Strategy — at once.",
  },
  {
    selector: ".sidebar",
    title: "3 · Explore the workspace",
    body: "Jump between Command Center, Competitors, Trends, Campaigns, Strategy and Alerts from here.",
  },
  {
    selector: null,
    title: "4 · Watch it think, then export",
    body: "Open the Strategy Room to watch the agents reason live, then export the finished board memo as a PDF. That's it — you're ready.",
  },
];

const PADDING = 8;
const TOOLTIP_WIDTH = 340;

type Props = {
  onClose: () => void;
};

export function ProductTour({ onClose }: Props) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: -9999, left: -9999 });

  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;

  const finish = useCallback(() => {
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, "1");
    } catch {
      // ignore storage failures (private mode etc.)
    }
    onClose();
  }, [onClose]);

  // Measure the highlighted element for the current step.
  useLayoutEffect(() => {
    if (!step.selector) {
      setRect(null);
      return;
    }
    const el = document.querySelector(step.selector);
    if (!el) {
      setRect(null);
      return;
    }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    // Re-measure after the scroll settles.
    const measure = () => setRect(el.getBoundingClientRect());
    measure();
    const timer = window.setTimeout(measure, 350);
    return () => window.clearTimeout(timer);
  }, [step.selector, index]);

  // Keep the highlight aligned on resize/scroll.
  useEffect(() => {
    if (!step.selector) return;
    const handler = () => {
      const el = document.querySelector(step.selector!);
      if (el) setRect(el.getBoundingClientRect());
    };
    window.addEventListener("resize", handler);
    window.addEventListener("scroll", handler, true);
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("scroll", handler, true);
    };
  }, [step.selector]);

  // Keyboard navigation.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
      if (event.key === "ArrowRight") setIndex((i) => Math.min(i + 1, STEPS.length - 1));
      if (event.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finish]);

  const next = () => (isLast ? finish() : setIndex((i) => i + 1));
  const back = () => setIndex((i) => Math.max(i - 1, 0));

  // Position the tooltip so the WHOLE card always stays inside the viewport.
  // Measures the card's real height, prefers below the target, then above,
  // then clamps — never pushing the card off the top or bottom edge.
  useLayoutEffect(() => {
    const margin = 16;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cardH = tooltipRef.current?.offsetHeight ?? 220;

    if (!rect) {
      setPos({
        top: Math.max(margin, (vh - cardH) / 2),
        left: Math.max(margin, (vw - TOOLTIP_WIDTH) / 2),
      });
      return;
    }

    const left = Math.min(Math.max(rect.left, margin), vw - TOOLTIP_WIDTH - margin);
    const below = rect.bottom + 14;
    const above = rect.top - 14 - cardH;
    let top: number;
    if (below + cardH <= vh - margin) top = below;
    else if (above >= margin) top = above;
    else top = Math.max(margin, vh - cardH - margin);

    setPos({ top, left });
  }, [rect, index, step.title]);

  return (
    <div className="tour-overlay" role="dialog" aria-modal="true" aria-label="Product tour">
      {rect ? (
        <div
          className="tour-spotlight"
          style={{
            top: rect.top - PADDING,
            left: rect.left - PADDING,
            width: rect.width + PADDING * 2,
            height: rect.height + PADDING * 2,
          }}
        />
      ) : (
        <div className="tour-scrim" />
      )}

      <div ref={tooltipRef} className="tour-tooltip" style={{ width: TOOLTIP_WIDTH, top: pos.top, left: pos.left }}>
        <div className="tour-tooltip-head">
          <span className="tour-badge">
            <Sparkles size={13} /> Tour · {index + 1}/{STEPS.length}
          </span>
          <button type="button" className="tour-close" onClick={finish} aria-label="Skip tour">
            <X size={16} />
          </button>
        </div>
        <h3>{step.title}</h3>
        <p>{step.body}</p>
        <div className="tour-actions">
          <button type="button" className="tour-skip" onClick={finish}>
            Skip
          </button>
          <div className="tour-nav">
            {index > 0 ? (
              <button type="button" className="ghost-button" onClick={back}>
                <ArrowLeft size={15} /> Back
              </button>
            ) : null}
            <button type="button" className="primary-button" onClick={next}>
              {isLast ? "Get started" : "Next"}
              {!isLast ? <ArrowRight size={15} /> : null}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

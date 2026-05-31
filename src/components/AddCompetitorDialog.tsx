import { useState } from "react";
import { Loader2, X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string, category: string) => Promise<void> | void;
};

export function AddCompetitorDialog({ open, onClose, onAdd }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Challenger");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await onAdd(trimmed, category.trim() || "Challenger");
      setName("");
      setCategory("Challenger");
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <form className="dialog" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <header>
          <h3>Track a competitor</h3>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <p>
          The competitor is saved to your workspace, appears across every view, and is analyzed in future agent runs.
          Run a live market scan to enrich its profile with real metrics.
        </p>
        <input
          autoFocus
          placeholder="Competitor name — e.g. Flipkart Minutes"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <input
          placeholder="Category — e.g. Quick commerce, Marketplace"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        />
        <div className="dialog-actions">
          <button type="button" className="ghost-button" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="primary-button" disabled={submitting || !name.trim()}>
            {submitting ? <Loader2 size={16} className="spin" /> : null}
            {submitting ? "Adding…" : "Add competitor"}
          </button>
        </div>
      </form>
    </div>
  );
}

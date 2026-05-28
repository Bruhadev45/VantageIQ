import { useState } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string) => void;
};

export function AddCompetitorDialog({ open, onClose, onAdd }: Props) {
  const [name, setName] = useState("");

  if (!open) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setName("");
    onClose();
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
        <p>Add a competitor name to your next agent run. Live ingestion will be wired in a follow-up phase.</p>
        <input
          autoFocus
          placeholder="e.g. Zepto, Blinkit, BigBasket"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <div className="dialog-actions">
          <button type="button" className="ghost-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary-button">
            Add competitor
          </button>
        </div>
      </form>
    </div>
  );
}

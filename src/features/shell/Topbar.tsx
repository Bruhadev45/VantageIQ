import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, Clock, Download, LogOut, Search } from "lucide-react";
import type { ApiStatus } from "../../hooks/useDataset";
import type { RunSummary } from "../../shared/contracts";
import { GlobalSearch } from "../search/GlobalSearch";

type Props = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  apiStatus: ApiStatus;
  recentRuns: RunSummary[];
  onSelectRun: (id: string) => void;
  onExport: () => void;
  onShowNotifications: () => void;
  notificationsCount: number;
  onSourcesAdded?: () => void;
  userEmail?: string;
  onLogout?: () => void;
};

export function Topbar({
  searchValue,
  onSearchChange,
  apiStatus,
  recentRuns,
  onSelectRun,
  onExport,
  onShowNotifications,
  notificationsCount,
  onSourcesAdded,
  userEmail,
  onLogout,
}: Props) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (historyOpen && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setHistoryOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [historyOpen]);

  const statusLabel =
    apiStatus === "live"
      ? "OpenAI agents live"
      : apiStatus === "connecting"
        ? "Connecting API"
        : apiStatus === "offline"
          ? "API offline"
          : "Demo agents";

  return (
    <header className="topbar">
      <div className="search-box">
        <Search size={18} />
        <input
          aria-label="Filter competitors and campaigns"
          placeholder="Filter competitors & campaigns..."
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
      <GlobalSearch onSourcesAdded={onSourcesAdded} />
      <button type="button" className={`market-select status-${apiStatus}`}>
        {statusLabel}
        <ChevronDown size={16} />
      </button>
      <div className="run-history-wrapper" ref={containerRef}>
        <button
          type="button"
          className="icon-button"
          aria-label="Run history"
          onClick={() => setHistoryOpen((open) => !open)}
        >
          <Clock size={19} />
        </button>
        {historyOpen ? (
          <div className="run-history-popover" role="dialog">
            <header>
              <strong>Recent runs</strong>
              <span>{recentRuns.length}</span>
            </header>
            {recentRuns.length === 0 ? (
              <p className="empty-state">No runs yet. Trigger a board brief to start.</p>
            ) : (
              <ul>
                {recentRuns.slice(0, 8).map((run) => (
                  <li key={run.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectRun(run.id);
                        setHistoryOpen(false);
                      }}
                    >
                      <div>
                        <strong>{run.market}</strong>
                        <span className={`status-pill status-${run.status}`}>{run.status}</span>
                      </div>
                      <small>{new Date(run.startedAt).toLocaleString()}</small>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>
      <button
        type="button"
        className="icon-button has-badge"
        aria-label={`Notifications (${notificationsCount})`}
        onClick={onShowNotifications}
      >
        <Bell size={19} />
        {notificationsCount > 0 ? <span className="badge">{notificationsCount}</span> : null}
      </button>
      <button type="button" className="export-button" onClick={onExport}>
        <Download size={17} />
        Export
      </button>
      {onLogout ? (
        <div className="account-chip" title={userEmail ? `Signed in as ${userEmail}` : "Account"}>
          <span className="account-avatar">{(userEmail?.[0] ?? "U").toUpperCase()}</span>
          <button type="button" className="icon-button" aria-label="Log out" onClick={onLogout}>
            <LogOut size={18} />
          </button>
        </div>
      ) : null}
    </header>
  );
}

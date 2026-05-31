import { useState, useRef, useEffect } from "react";
import { Globe, Loader2, Search, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "../../services/apiClient";

type SearchResult = {
  source: {
    id: string;
    title: string;
    publisher: string;
    url: string;
    date: string;
    notes: string;
  };
  extractedSignals: string[];
};

type SearchResponse = {
  query: string;
  providers: string[];
  sources: SearchResult[];
};

type GlobalSearchProps = {
  onSourcesAdded?: () => void;
};

export function GlobalSearch({ onSourcesAdded }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [providers, setProviders] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleSearch = async () => {
    if (!query.trim() || searching) return;

    setSearching(true);
    setResults([]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/intelligence/research/live`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          market: query,
          company: "Research",
          region: "Global",
          objective: "Find information",
          horizon: "Recent",
          competitors: [],
        }),
      });

      if (!response.ok) throw new Error("Search failed");

      const data: SearchResponse = await response.json();
      setResults(data.sources);
      setProviders(data.providers);

      if (data.sources.length === 0) {
        toast.message("No results found", { description: "Try different keywords" });
      } else {
        toast.success(`Found ${data.sources.length} sources`, {
          description: `Saved to your Evidence Layer via ${data.providers.join(", ")}`,
        });
        // Sources are persisted server-side; refresh the dashboard dataset.
        onSourcesAdded?.();
      }
    } catch (error) {
      toast.error("Search failed", {
        description: error instanceof Error ? error.message : "Try again",
      });
    } finally {
      setSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="global-search-wrapper" ref={containerRef}>
      <button
        type="button"
        className="global-search-trigger"
        onClick={() => setIsOpen(true)}
        title="Global Web Search (Exa + SerpApi)"
      >
        <Globe size={18} />
        <span>Web Search</span>
      </button>

      {isOpen && (
        <div className="global-search-modal">
          <div className="global-search-header">
            <div className="global-search-input-wrapper">
              <Search size={20} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search the web for market intelligence..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              {searching && <Loader2 size={20} className="spin" />}
            </div>
            <button type="button" className="close-btn" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="global-search-actions">
            <button
              type="button"
              className="search-btn"
              onClick={handleSearch}
              disabled={!query.trim() || searching}
            >
              {searching ? "Searching..." : "Search Web"}
            </button>
            <span className="provider-info">
              Powered by Exa AI + SerpApi
            </span>
          </div>

          {results.length > 0 && (
            <div className="global-search-results">
              <div className="results-header">
                <span>{results.length} sources found</span>
                <span className="providers-used">via {providers.join(", ")}</span>
              </div>
              <ul>
                {results.map((result) => (
                  <li key={result.source.id}>
                    <a href={result.source.url} target="_blank" rel="noopener noreferrer">
                      <div className="result-meta">
                        <span className="publisher">{result.source.publisher}</span>
                        <span className="date">{result.source.date}</span>
                      </div>
                      <strong>{result.source.title}</strong>
                      <p>{result.extractedSignals[0]}</p>
                      <ExternalLink size={14} className="external-icon" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!searching && results.length === 0 && query && (
            <div className="search-hint">
              <p>Press Enter or click "Search Web" to find market intelligence</p>
              <div className="example-queries">
                <span>Try:</span>
                <button type="button" onClick={() => setQuery("Zepto funding 2024")}>
                  Zepto funding
                </button>
                <button type="button" onClick={() => setQuery("Blinkit dark stores expansion")}>
                  Blinkit expansion
                </button>
                <button type="button" onClick={() => setQuery("Quick commerce India market share")}>
                  Market share
                </button>
              </div>
            </div>
          )}

          {!query && (
            <div className="search-hint">
              <p>Search across the web for competitor news, market data, and trends</p>
              <div className="example-queries">
                <span>Examples:</span>
                <button type="button" onClick={() => setQuery("Zepto funding 2024")}>
                  Zepto funding
                </button>
                <button type="button" onClick={() => setQuery("Blinkit dark stores expansion")}>
                  Blinkit expansion
                </button>
                <button type="button" onClick={() => setQuery("Quick commerce India market share")}>
                  Market share
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

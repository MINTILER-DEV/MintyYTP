"use client";

import { useMemo, useState } from "react";
import {
  Copy,
  ExternalLink,
  Loader2,
  PlayCircle,
  Search,
  Server,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { MintyPlayer } from "@/components/minty-player";
import { QUALITY_OPTIONS, type VideoQuality } from "@/lib/quality";

type VideoInfo = {
  title: string;
  uploader: string;
  duration: number | null;
  thumbnail: string;
  webpageUrl: string;
  qualities: VideoQuality[];
};

type SearchResult = {
  id: string;
  url: string;
  title: string;
  description: string;
  duration: number | null;
  channel: string;
  thumbnail: string;
};

const TRENDING_SEARCHES = [
  "music videos",
  "gaming highlights",
  "science explained",
  "lofi study"
];

export function HomeClient() {
  const [query, setQuery] = useState("");
  const [quality, setQuality] = useState<VideoQuality>(1080);
  const [info, setInfo] = useState<VideoInfo | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeQuery, setActiveQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const streamSrc = useMemo(() => {
    if (!info) {
      return "";
    }

    const params = new URLSearchParams({
      url: info.webpageUrl,
      quality: String(quality)
    });

    return `/api/stream?${params.toString()}`;
  }, [info, quality]);

  const embedCode = useMemo(() => {
    if (typeof window === "undefined" || !info) {
      return "";
    }

    const params = new URLSearchParams({
      url: info.webpageUrl,
      quality: String(quality),
      title: info.title
    });

    if (info.thumbnail) {
      params.set("poster", info.thumbnail);
    }

    if (info.duration) {
      params.set("duration", String(info.duration));
    }

    return `<iframe src="${window.location.origin}/embed?${params.toString()}" title="${escapeAttribute(
      info.title
    )}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
  }, [info, quality]);

  const relatedVideos = useMemo(() => {
    if (!info) {
      return results.slice(0, 5);
    }

    return results
      .filter((result) => result.url !== info.webpageUrl)
      .slice(0, 5);
  }, [info, results]);

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = query.trim();
    if (!term) {
      return;
    }

    if (looksLikeUrl(term)) {
      await loadVideo(term);
      return;
    }

    await searchFor(term);
  }

  async function searchFor(term: string) {
    setError("");
    setCopied(false);
    setIsSearching(true);
    setActiveQuery(term);
    setInfo(null);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(term)}&max=12`
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Search failed.");
      }

      setResults(payload.results ?? []);
    } catch (searchError) {
      setResults([]);
      setError(
        searchError instanceof Error
          ? searchError.message
          : "MintyYTP could not search right now."
      );
    } finally {
      setIsSearching(false);
    }
  }

  async function loadVideo(videoUrl: string) {
    setError("");
    setCopied(false);
    setIsLoadingVideo(true);

    try {
      const response = await fetch(
        `/api/info?url=${encodeURIComponent(videoUrl)}`
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Could not inspect that video.");
      }

      setInfo(payload);
      setQuery(payload.webpageUrl || videoUrl);
      const highestQuality = [...payload.qualities].sort((a, b) => b - a)[0];
      setQuality(highestQuality ?? 1080);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Something went sideways while loading that video."
      );
    } finally {
      setIsLoadingVideo(false);
    }
  }

  async function copyEmbed() {
    if (!embedCode) {
      return;
    }

    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main className="app-shell">
      <nav className="topbar" aria-label="MintyYTP navigation">
        <a className="nav-brand" href="#home" aria-label="MintyYTP home">
          <img src="/icon.svg" alt="" />
          <span>MintyYTP</span>
        </a>

        <form className="nav-search" onSubmit={handleSearch}>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search or paste URL..."
            aria-label="Search or paste video URL"
            required
          />
          <button type="submit" disabled={isSearching || isLoadingVideo}>
            {isSearching || isLoadingVideo ? (
              <Loader2 aria-hidden="true" className="spin" size={18} />
            ) : (
              <Search aria-hidden="true" size={18} />
            )}
          </button>
        </form>
      </nav>

      <section className="legacy-shell" id="home">
        <div className="hero-panel">
          <div className="hero-copy">
            <p className="eyebrow">Server-side yt-dlp streaming</p>
            <h1>Welcome to MintyYTP</h1>
            <p>
              Search for YouTube videos with the classic YDeblockedT layout,
              then stream them through your own Vercel-ready TypeScript server.
            </p>
          </div>

          <form onSubmit={handleSearch} className="hero-search">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="What are you looking for?"
              required
            />
            <button type="submit" disabled={isSearching || isLoadingVideo}>
              {isSearching || isLoadingVideo ? (
                <Loader2 aria-hidden="true" className="spin" size={19} />
              ) : (
                <Search aria-hidden="true" size={19} />
              )}
              Search
            </button>
          </form>

          <div className="status-pills" aria-label="Streaming features">
            <span>
              <Server aria-hidden="true" size={16} />
              Server pipe
            </span>
            <span>
              <ShieldCheck aria-hidden="true" size={16} />
              No saved files
            </span>
            <span>
              <Sparkles aria-hidden="true" size={16} />
              1080p cap
            </span>
          </div>
        </div>

        {error ? <p className="form-error">{error}</p> : null}

        {info ? (
          <section className="watch-layout" aria-label="Video player">
            <div className="watch-main">
              <div className="player-frame">
                <MintyPlayer
                  src={streamSrc}
                  poster={info.thumbnail}
                  title={info.title}
                  quality={quality}
                  qualities={info.qualities ?? QUALITY_OPTIONS}
                  onQualityChange={setQuality}
                  totalDuration={info.duration ?? undefined}
                />
              </div>

              <div className="watch-meta">
                <p className="eyebrow">Now playing</p>
                <h2>{info.title}</h2>
                <p>{info.uploader || "Unknown creator"}</p>
                <div className="embed-actions">
                  <button type="button" onClick={copyEmbed}>
                    <Copy aria-hidden="true" size={17} />
                    {copied ? "Copied" : "Copy embed"}
                  </button>
                  <a href={streamSrc} target="_blank" rel="noreferrer">
                    <ExternalLink aria-hidden="true" size={17} />
                    Stream URL
                  </a>
                </div>
              </div>
            </div>

            <aside className="related-panel">
              <h3>Related Videos</h3>
              {relatedVideos.length ? (
                <div className="related-list">
                  {relatedVideos.map((result) => (
                    <button
                      type="button"
                      className="related-item"
                      key={result.id}
                      onClick={() => loadVideo(result.url)}
                    >
                      <img src={result.thumbnail || "/icon.svg"} alt="" />
                      <span>
                        <strong>{result.title}</strong>
                        <small>{result.channel}</small>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="muted-copy">Search first to fill this sidebar.</p>
              )}
            </aside>
          </section>
        ) : (
          <section className="results-section" aria-live="polite">
            <div className="section-heading">
              <h2>
                {activeQuery
                  ? `Search Results for "${activeQuery}"`
                  : "Trending Searches"}
              </h2>
              <p>
                {activeQuery
                  ? "Choose a video to open the streamed watch layout."
                  : "Start with one of these, or paste a direct video URL."}
              </p>
            </div>

            {results.length ? (
              <div className="results-list">
                {results.map((result) => (
                  <button
                    type="button"
                    className="video-item"
                    key={result.id}
                    onClick={() => loadVideo(result.url)}
                  >
                    <img src={result.thumbnail || "/icon.svg"} alt="" />
                    <span className="video-content">
                      <strong>{result.title}</strong>
                      <span>{result.description || "No description available."}</span>
                      <small>
                        {result.channel}
                        {result.duration ? ` | ${formatDuration(result.duration)}` : ""}
                      </small>
                    </span>
                    <PlayCircle aria-hidden="true" size={24} />
                  </button>
                ))}
              </div>
            ) : (
              <div className="trending-grid">
                {TRENDING_SEARCHES.map((term) => (
                  <button
                    type="button"
                    className="trend-card"
                    key={term}
                    onClick={() => {
                      setQuery(term);
                      void searchFor(term);
                    }}
                  >
                    <Search aria-hidden="true" size={20} />
                    <span>{term}</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}
      </section>

      <footer className="site-footer">
        <p>MintyYTP streams through your server without storing downloads.</p>
      </footer>
    </main>
  );
}

function looksLikeUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function escapeAttribute(value: string) {
  return value.replace(/"/g, "&quot;");
}

function formatDuration(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0:00";
  }

  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, "0");

  if (hours) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds}`;
  }

  return `${minutes}:${seconds}`;
}

"use client";

import { useMemo, useState } from "react";
import {
  Copy,
  ExternalLink,
  Link2,
  Loader2,
  PlayCircle,
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

export function HomeClient() {
  const [url, setUrl] = useState("");
  const [quality, setQuality] = useState<VideoQuality>(1080);
  const [info, setInfo] = useState<VideoInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const streamSrc = useMemo(() => {
    if (!info) {
      return "";
    }

    const params = new URLSearchParams({
      url: info.webpageUrl || url,
      quality: String(quality)
    });

    return `/api/stream?${params.toString()}`;
  }, [info, quality, url]);

  const embedCode = useMemo(() => {
    if (typeof window === "undefined" || !info) {
      return "";
    }

    const params = new URLSearchParams({
      url: info.webpageUrl || url,
      quality: String(quality),
      title: info.title
    });

    if (info.thumbnail) {
      params.set("poster", info.thumbnail);
    }

    return `<iframe src="${window.location.origin}/embed?${params.toString()}" title="${escapeAttribute(
      info.title
    )}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
  }, [info, quality, url]);

  async function loadVideo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setCopied(false);
    setIsLoading(true);
    setInfo(null);

    try {
      const response = await fetch(`/api/info?url=${encodeURIComponent(url)}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Could not inspect that video.");
      }

      setInfo(payload);
      const highestQuality = [...payload.qualities].sort((a, b) => b - a)[0];
      setQuality(highestQuality ?? 1080);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Something went sideways while loading that video."
      );
    } finally {
      setIsLoading(false);
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
      <section className="workspace">
        <div className="brand-rail">
          <div className="brand-lockup">
            <img src="/icon.svg" alt="" className="brand-icon" />
            <div>
              <p className="eyebrow">MintyYTP</p>
              <h1>Server-side video streaming with a fresh custom player.</h1>
            </div>
          </div>
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

        <div className="player-stage">
          <MintyPlayer
            src={streamSrc}
            poster={info?.thumbnail}
            title={info?.title ?? "MintyYTP player"}
            quality={quality}
            qualities={info?.qualities ?? QUALITY_OPTIONS}
            onQualityChange={setQuality}
          />
        </div>

        <div className="control-band">
          <form onSubmit={loadVideo} className="url-form">
            <label htmlFor="video-url">Video URL</label>
            <div className="url-row">
              <Link2 aria-hidden="true" size={20} />
              <input
                id="video-url"
                type="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                required
              />
              <button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 aria-hidden="true" className="spin" size={19} />
                ) : (
                  <PlayCircle aria-hidden="true" size={19} />
                )}
                Load
              </button>
            </div>
            {error ? <p className="form-error">{error}</p> : null}
          </form>

          <aside className="video-details" aria-live="polite">
            {info ? (
              <>
                <div>
                  <p className="eyebrow">Now ready</p>
                  <h2>{info.title}</h2>
                  <p>{info.uploader || "Unknown creator"}</p>
                </div>
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
              </>
            ) : (
              <>
                <p className="eyebrow">How it works</p>
                <h2>Paste a video link and MintyYTP keeps the media path on the server.</h2>
                <p>
                  The browser talks only to this app. yt-dlp resolves media
                  sources server-side, then ffmpeg remuxes the stream when
                  separate audio and video tracks are selected.
                </p>
              </>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}

function escapeAttribute(value: string) {
  return value.replace(/"/g, "&quot;");
}

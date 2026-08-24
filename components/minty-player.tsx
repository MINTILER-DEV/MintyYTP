"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  RotateCcw,
  Volume1,
  Volume2,
  VolumeX
} from "lucide-react";
import { type VideoQuality } from "@/lib/quality";

type MintyPlayerProps = {
  src: string;
  poster?: string;
  title: string;
  quality: VideoQuality;
  qualities: readonly VideoQuality[];
  onQualityChange?: (quality: VideoQuality) => void;
  totalDuration?: number;
  compact?: boolean;
};

export function MintyPlayer({
  src,
  poster,
  title,
  quality,
  qualities,
  onQualityChange,
  totalDuration,
  compact = false
}: MintyPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [progress, setProgress] = useState(0);
  const [streamDuration, setStreamDuration] = useState(0);
  const [bufferedRanges, setBufferedRanges] = useState<Array<{ start: number; end: number }>>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const timelineDuration = totalDuration || streamDuration;
  const progressPercent =
    timelineDuration > 0 ? Math.min(100, (progress / timelineDuration) * 100) : 0;

  const progressLabel = useMemo(
    () => `${formatTime(progress)} / ${formatTime(timelineDuration)}`,
    [timelineDuration, progress]
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    video.volume = volume;
    video.muted = isMuted;
  }, [isMuted, volume]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === frameRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    setHasStarted(false);
    setProgress(0);
    setStreamDuration(0);
    setBufferedRanges([]);
  }, [src]);

  function refreshBufferedRanges(video: HTMLVideoElement) {
    const ranges: Array<{ start: number; end: number }> = [];

    for (let index = 0; index < video.buffered.length; index++) {
      ranges.push({
        start: video.buffered.start(index),
        end: video.buffered.end(index)
      });
    }

    setBufferedRanges(ranges);
  }

  async function togglePlayback() {
    const video = videoRef.current;
    if (!video || !src) {
      return;
    }

    if (video.paused) {
      await video.play();
      setHasStarted(true);
    } else {
      video.pause();
    }
  }

  function seek(value: number) {
    const video = videoRef.current;
    if (!video || !timelineDuration) {
      return;
    }

    video.currentTime = value;
    setProgress(value);
  }

  function restart() {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    video.currentTime = 0;
    setProgress(0);
    void video.play();
    setHasStarted(true);
  }

  async function toggleFullscreen() {
    const frame = frameRef.current;
    if (!frame) {
      return;
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await frame.requestFullscreen();
    }
  }

  async function openPictureInPicture() {
    const video = videoRef.current;
    if (!video || !document.pictureInPictureEnabled) {
      return;
    }

    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else {
      await video.requestPictureInPicture();
    }
  }

  return (
    <div
      ref={frameRef}
      className={`minty-player${compact ? " minty-player-compact" : ""}`}
    >
      <video
        key={src}
        ref={videoRef}
        className="minty-video"
        src={src || undefined}
        poster={poster}
        preload="metadata"
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onLoadedMetadata={(event) => {
          const duration = event.currentTarget.duration;
          setStreamDuration(Number.isFinite(duration) ? duration : 0);
          refreshBufferedRanges(event.currentTarget);
        }}
        onDurationChange={(event) => {
          const duration = event.currentTarget.duration;
          setStreamDuration(Number.isFinite(duration) ? duration : 0);
        }}
        onProgress={(event) => refreshBufferedRanges(event.currentTarget)}
        onTimeUpdate={(event) => {
          setProgress(event.currentTarget.currentTime || 0);
          refreshBufferedRanges(event.currentTarget);
        }}
        onClick={togglePlayback}
      />

      {!src ? (
        <div className="player-empty">
          <img src="/icon.svg" alt="" />
          <p>Paste a URL to open the stream.</p>
        </div>
      ) : null}

      {src && !hasStarted ? (
        <button
          className="center-play"
          type="button"
          onClick={togglePlayback}
          aria-label={`Play ${title}`}
          title="Play"
        >
          <Play aria-hidden="true" size={34} fill="currentColor" />
        </button>
      ) : null}

      <div className="player-controls">
        <div className="timeline-row">
          <div className="timeline-shell">
            <div className="timeline-buffer" aria-hidden="true">
              {bufferedRanges.map((range) => {
                const left = getPercent(range.start, timelineDuration);
                const width = Math.max(
                  0,
                  getPercent(range.end, timelineDuration) - left
                );

                return (
                  <span
                    key={`${range.start}-${range.end}`}
                    className="buffer-range"
                    style={{ left: `${left}%`, width: `${width}%` }}
                  />
                );
              })}
              <span
                className="progress-range"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <input
              aria-label="Seek"
              type="range"
              min={0}
              max={timelineDuration || 0}
              step={0.1}
              value={Math.min(progress, timelineDuration || progress)}
              onChange={(event) => seek(Number(event.target.value))}
              disabled={!timelineDuration}
            />
          </div>
          <span>{progressLabel}</span>
        </div>

        <div className="control-row">
          <div className="button-cluster">
            <button
              type="button"
              onClick={togglePlayback}
              aria-label={isPlaying ? "Pause" : "Play"}
              title={isPlaying ? "Pause" : "Play"}
              disabled={!src}
            >
              {isPlaying ? (
                <Pause aria-hidden="true" size={19} fill="currentColor" />
              ) : (
                <Play aria-hidden="true" size={19} fill="currentColor" />
              )}
            </button>
            <button
              type="button"
              onClick={restart}
              aria-label="Restart"
              title="Restart"
              disabled={!src}
            >
              <RotateCcw aria-hidden="true" size={18} />
            </button>
            <button
              type="button"
              onClick={() => setIsMuted((current) => !current)}
              aria-label={isMuted ? "Unmute" : "Mute"}
              title={isMuted ? "Unmute" : "Mute"}
              disabled={!src}
            >
              {isMuted ? (
                <VolumeX aria-hidden="true" size={19} />
              ) : volume > 0.55 ? (
                <Volume2 aria-hidden="true" size={19} />
              ) : (
                <Volume1 aria-hidden="true" size={19} />
              )}
            </button>
            <input
              className="volume-slider"
              aria-label="Volume"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(event) => {
                setVolume(Number(event.target.value));
                setIsMuted(false);
              }}
              disabled={!src}
            />
          </div>

          <div className="button-cluster">
            <select
              aria-label="Quality"
              value={quality}
              onChange={(event) =>
                onQualityChange?.(Number(event.target.value) as VideoQuality)
              }
              disabled={!src || qualities.length < 2}
            >
              {qualities.map((option) => (
                <option key={option} value={option}>
                  {option}p
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={openPictureInPicture}
              aria-label="Picture in picture"
              title="Picture in picture"
              disabled={!src}
            >
              <PictureInPicture2 aria-hidden="true" size={18} />
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              disabled={!src}
            >
              {isFullscreen ? (
                <Minimize aria-hidden="true" size={18} />
              ) : (
                <Maximize aria-hidden="true" size={18} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getPercent(value: number, duration: number) {
  if (!duration || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, (value / duration) * 100));
}

function formatTime(value: number) {
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

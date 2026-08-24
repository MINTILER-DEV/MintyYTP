"use client";

import { MintyPlayer } from "@/components/minty-player";
import { type VideoQuality } from "@/lib/quality";

type EmbedClientProps = {
  sourceUrl: string;
  streamSrc: string;
  title: string;
  poster?: string;
  quality: VideoQuality;
};

export function EmbedClient({
  sourceUrl,
  streamSrc,
  title,
  poster,
  quality
}: EmbedClientProps) {
  if (!sourceUrl) {
    return (
      <div className="embed-empty">
        <img src="/icon.svg" alt="" />
        <p>Missing video URL.</p>
      </div>
    );
  }

  return (
    <MintyPlayer
      src={streamSrc}
      poster={poster}
      title={title}
      quality={quality}
      qualities={[quality]}
      compact
    />
  );
}

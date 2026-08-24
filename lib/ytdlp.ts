import { createRequire } from "node:module";
import ffmpegStatic from "ffmpeg-static";
import type { VideoQuality } from "@/lib/quality";

const require = createRequire(import.meta.url);

type YtDlpRunner = {
  (
    url: string,
    flags: Record<string, unknown>,
    options?: Record<string, unknown>
  ): Promise<YtDlpInfo>;
  exec: (
    url: string,
    flags: Record<string, unknown>,
    options?: Record<string, unknown>
  ) => Promise<string> & {
    stdout?: NodeJS.ReadableStream;
    stderr?: NodeJS.ReadableStream;
    cancel?: () => void;
  };
  create: (binaryPath: string) => YtDlpRunner;
};

export type YtDlpInfo = {
  id?: string;
  title?: string;
  uploader?: string;
  channel?: string;
  duration?: number;
  thumbnail?: string;
  webpage_url?: string;
  formats?: Array<{
    format_id?: string;
    height?: number | null;
    ext?: string;
    vcodec?: string;
    acodec?: string;
  }>;
};

type SearchEntry = {
  id?: string;
  url?: string;
  title?: string;
  description?: string;
  duration?: number | null;
  channel?: string;
  uploader?: string;
  thumbnails?: Array<{
    url?: string;
    width?: number;
    height?: number;
  }>;
};

type SearchOutput = {
  entries?: SearchEntry[];
};

export type VideoSearchResult = {
  id: string;
  url: string;
  title: string;
  description: string;
  duration: number | null;
  channel: string;
  thumbnail: string;
};

const youtubeDl = require("youtube-dl-exec") as YtDlpRunner;

export function getFfmpegPath() {
  return process.env.FFMPEG_PATH || ffmpegStatic || "ffmpeg";
}

function getYtDlpRunner() {
  if (process.env.YTDLP_PATH) {
    return youtubeDl.create(process.env.YTDLP_PATH);
  }

  return youtubeDl;
}

export async function getVideoInfo(url: string) {
  return getYtDlpRunner()(
    url,
    {
      dumpSingleJson: true,
      noPlaylist: true,
      noWarnings: true,
      skipDownload: true
    },
    {
      timeout: 60000,
      killSignal: "SIGKILL",
      windowsHide: true
    }
  );
}

export async function getStreamUrls(url: string, quality: VideoQuality) {
  const output = await getYtDlpRunner()(
    url,
    {
      getUrl: true,
      format: streamFormatSelector(quality),
      noPlaylist: true,
      noWarnings: true,
      forceIpv4: true
    },
    {
      timeout: 60000,
      killSignal: "SIGKILL",
      windowsHide: true
    }
  );

  return String(output)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function searchVideos(query: string, maxResults = 12) {
  const trimmed = query.trim();
  if (!trimmed) {
    throw new Error("Search for something first.");
  }

  const safeMax = Math.min(20, Math.max(1, maxResults));
  const output = (await getYtDlpRunner()(
    `ytsearch${safeMax}:${trimmed}`,
    {
      dumpSingleJson: true,
      flatPlaylist: true,
      noWarnings: true,
      skipDownload: true
    },
    {
      timeout: 60000,
      killSignal: "SIGKILL",
      windowsHide: true
    }
  )) as SearchOutput;

  return (output.entries ?? [])
    .filter((entry) => entry.id && entry.url && entry.title)
    .map((entry) => ({
      id: entry.id as string,
      url: entry.url as string,
      title: entry.title as string,
      description: entry.description ?? "",
      duration: entry.duration ?? null,
      channel: entry.channel ?? entry.uploader ?? "Unknown channel",
      thumbnail: getBestThumbnail(entry.thumbnails)
    })) satisfies VideoSearchResult[];
}

function streamFormatSelector(quality: VideoQuality) {
  const cap = `height<=${quality}`;

  return [
    `bv*[${cap}][ext=mp4][vcodec^=avc1]+ba[ext=m4a]`,
    `bv*[${cap}][ext=mp4]+ba[ext=m4a]`,
    `b[${cap}][ext=mp4]`,
    `best[${cap}]`,
    "best"
  ].join("/");
}

function getBestThumbnail(thumbnails: SearchEntry["thumbnails"]) {
  if (!thumbnails?.length) {
    return "";
  }

  return [...thumbnails]
    .sort((a, b) => (b.width ?? 0) - (a.width ?? 0))
    .find((thumbnail) => thumbnail.url)?.url ?? "";
}

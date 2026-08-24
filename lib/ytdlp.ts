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

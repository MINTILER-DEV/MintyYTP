import { spawn } from "node:child_process";
import { NextResponse } from "next/server";
import { getFfmpegPath, getStreamUrls } from "@/lib/ytdlp";
import { normalizeQuality } from "@/lib/quality";
import { parseVideoUrl } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const encoder = new TextEncoder();

export async function GET(request: Request) {
  const parsedUrl = new URL(request.url);

  try {
    const url = parseVideoUrl(parsedUrl.searchParams.get("url"));
    const quality = normalizeQuality(parsedUrl.searchParams.get("quality"));
    const streamUrls = await getStreamUrls(url, quality);

    if (streamUrls.length === 0) {
      throw new Error("yt-dlp did not return a playable stream.");
    }

    const ffmpeg = spawnFfmpeg(streamUrls);

    request.signal.addEventListener("abort", () => {
      stopProcess(ffmpeg);
    });

    let stderr = "";
    ffmpeg.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
      if (stderr.length > 6000) {
        stderr = stderr.slice(-6000);
      }
    });

    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        ffmpeg.stdout.on("data", (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk));
        });

        ffmpeg.stdout.on("end", () => {
          controller.close();
        });

        ffmpeg.once("error", (error) => {
          controller.error(error);
        });

        ffmpeg.once("close", (code) => {
          if (code && code !== 0) {
            controller.error(
              new Error(stderr.trim() || `ffmpeg exited with code ${code}`)
            );
          }
        });
      },
      cancel() {
        stopProcess(ffmpeg);
      }
    });

    return new Response(body, {
      headers: {
        "Content-Type": "video/mp4",
        "Cache-Control": "no-store, no-transform",
        "X-Content-Type-Options": "nosniff",
        "Accept-Ranges": "none"
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "MintyYTP could not start the stream."
      },
      { status: 400 }
    );
  }
}

function spawnFfmpeg(streamUrls: string[]) {
  const ffmpegPath = getFfmpegPath();
  const ffmpegArgs = [
    "-hide_banner",
    "-loglevel",
    "warning",
    "-nostdin",
    "-reconnect",
    "1",
    "-reconnect_streamed",
    "1",
    "-reconnect_delay_max",
    "5"
  ];

  for (const input of streamUrls.slice(0, 2)) {
    ffmpegArgs.push("-thread_queue_size", "1024", "-i", input);
  }

  if (streamUrls.length > 1) {
    ffmpegArgs.push("-map", "0:v:0", "-map", "1:a:0");
  } else {
    ffmpegArgs.push("-map", "0:v:0?", "-map", "0:a:0?");
  }

  ffmpegArgs.push(
    "-c",
    "copy",
    "-movflags",
    "frag_keyframe+empty_moov+default_base_moof",
    "-f",
    "mp4",
    "pipe:1"
  );

  return spawn(ffmpegPath, ffmpegArgs, {
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true
  });
}

function stopProcess(process: { killed: boolean; kill: (signal: NodeJS.Signals) => boolean }) {
  if (!process.killed) {
    process.kill("SIGKILL");
  }
}

export function OPTIONS() {
  return new Response(encoder.encode("ok"), {
    headers: {
      Allow: "GET, OPTIONS"
    }
  });
}

import { NextResponse } from "next/server";
import { getVideoInfo } from "@/lib/ytdlp";
import { getAvailableQualities } from "@/lib/quality";
import { parseVideoUrl } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const parsedUrl = new URL(request.url);
  const target = parsedUrl.searchParams.get("url");

  try {
    const url = parseVideoUrl(target);
    const info = await getVideoInfo(url);
    const qualities = getAvailableQualities(info.formats);

    return NextResponse.json({
      id: info.id,
      title: info.title ?? "Untitled video",
      uploader: info.uploader ?? info.channel ?? "",
      duration: info.duration ?? null,
      thumbnail: info.thumbnail ?? "",
      webpageUrl: info.webpage_url ?? url,
      qualities
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "MintyYTP could not read that video."
      },
      { status: 400 }
    );
  }
}

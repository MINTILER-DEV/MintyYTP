import { NextResponse } from "next/server";
import { searchVideos } from "@/lib/ytdlp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const parsedUrl = new URL(request.url);
  const query = parsedUrl.searchParams.get("q") ?? "";
  const max = Number(parsedUrl.searchParams.get("max") ?? 12);

  try {
    const results = await searchVideos(query, max);
    return NextResponse.json({ query, results });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "MintyYTP could not search right now."
      },
      { status: 400 }
    );
  }
}

import { EmbedClient } from "@/components/embed-client";
import { normalizeQuality } from "@/lib/quality";

type EmbedPageProps = {
  searchParams: Promise<{
    url?: string;
    quality?: string;
    title?: string;
    poster?: string;
  }>;
};

export default async function EmbedPage({ searchParams }: EmbedPageProps) {
  const params = await searchParams;
  const quality = normalizeQuality(params.quality);
  const sourceUrl = params.url ?? "";
  const streamSrc = sourceUrl
    ? `/api/stream?url=${encodeURIComponent(sourceUrl)}&quality=${quality}`
    : "";

  return (
    <main className="embed-shell">
      <EmbedClient
        sourceUrl={sourceUrl}
        streamSrc={streamSrc}
        title={params.title ?? "MintyYTP stream"}
        poster={params.poster}
        quality={quality}
      />
    </main>
  );
}

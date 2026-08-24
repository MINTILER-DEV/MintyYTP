export function parseVideoUrl(value: string | null) {
  if (!value) {
    throw new Error("Paste a video URL first.");
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("That does not look like a valid URL.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("MintyYTP only accepts http and https video URLs.");
  }

  return parsed.toString();
}

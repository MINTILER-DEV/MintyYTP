export const QUALITY_OPTIONS = [360, 480, 720, 1080] as const;
export type VideoQuality = (typeof QUALITY_OPTIONS)[number];

export function normalizeQuality(value: string | number | null | undefined) {
  const numeric = Number(value);
  if (QUALITY_OPTIONS.includes(numeric as VideoQuality)) {
    return numeric as VideoQuality;
  }

  return 1080;
}

type YtDlpFormat = {
  height?: number | null;
  vcodec?: string;
};

export function getAvailableQualities(formats: YtDlpFormat[] | undefined) {
  if (!formats?.length) {
    return QUALITY_OPTIONS;
  }

  const maxHeight = formats.reduce((highest, format) => {
    if (!format.height || format.vcodec === "none") {
      return highest;
    }

    return Math.max(highest, format.height);
  }, 0);

  const available = QUALITY_OPTIONS.filter((quality) => quality <= maxHeight);
  return available.length ? available : QUALITY_OPTIONS;
}

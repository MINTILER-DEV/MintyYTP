# MintyYTP

MintyYTP is a Vercel-ready Next.js web app with a server-side video stream proxy. The browser never receives direct upstream media URLs and the server does not save video files. It asks `yt-dlp` for streamable media URLs, then pipes them through `ffmpeg` as fragmented MP4.

## Features

- Custom reusable React video player with play, pause, seek, volume, quality, PiP, fullscreen, and embed support.
- Server-side `/api/info` endpoint for title, thumbnail, duration, and available qualities.
- Server-side `/api/stream` endpoint that streams through `ffmpeg` without writing downloads to disk.
- Separate video/audio formats are remuxed on the fly with `ffmpeg`.
- Quality selector capped at 1080p.
- Bluish green MintyYTP interface and first-pass SVG icon.
- `/embed` route for reusable iframe embeds.

## Requirements

- Node.js 20 or newer.
- Python 3.9 or newer, required by `youtube-dl-exec`.
- `ffmpeg`, either from the included `ffmpeg-static` package or a system install.
- `yt-dlp`, either from the included `youtube-dl-exec` package or a system install.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`, paste a supported video URL, choose a quality, and press Load.

## Start Your Own Server

For a normal Node server:

```bash
npm install
npm run build
npm run start
```

By default, Next starts on `http://localhost:3000`. To use another port:

```bash
npx next start -p 8080
```

For production behind a reverse proxy, point your proxy to the Next server and make sure long-lived streaming responses are allowed.

## Binary Configuration

MintyYTP works with the npm-packaged binaries by default. If you want to use your own system binaries instead, set:

```bash
YTDLP_PATH=/usr/local/bin/yt-dlp
FFMPEG_PATH=/usr/local/bin/ffmpeg
```

On Windows, use the full `.exe` paths:

```powershell
$env:YTDLP_PATH="C:\tools\yt-dlp.exe"
$env:FFMPEG_PATH="C:\tools\ffmpeg.exe"
npm run dev
```

## Vercel

Deploy the repo to Vercel like any Next.js app. The API routes run on the Node.js runtime, not Edge. `vercel.json` sets longer function durations for video metadata and streaming routes, but your actual limit still depends on your Vercel plan.

Streaming full videos through serverless functions can hit timeout, bandwidth, and concurrency limits. For heavier usage, run MintyYTP on your own Node server or a container host.

## Embed Player

MintyYTP generates iframe markup in the UI. The route format is:

```html
<iframe
  src="https://your-domain.example/embed?url=VIDEO_URL&quality=1080"
  title="MintyYTP player"
  allow="autoplay; fullscreen; picture-in-picture"
  allowfullscreen
></iframe>
```

## Notes

Use MintyYTP only for content you have the right to access and stream. Some platforms restrict proxying, automated access, or redistribution in their terms.

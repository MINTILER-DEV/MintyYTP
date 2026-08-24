import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MintyYTP",
  description: "A mint-fresh video player that streams through your own server.",
  icons: {
    icon: "/icon.svg"
  },
  openGraph: {
    title: "MintyYTP",
    description: "Stream videos through a server-side yt-dlp and ffmpeg pipeline.",
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

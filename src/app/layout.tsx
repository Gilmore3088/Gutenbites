import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GütenBites — Classic Literature as Podcasts",
  description:
    "The world's great literature, beautifully narrated by AI. Free podcast episodes of public domain classics on Spotify, Apple Podcasts, and everywhere you listen.",
  openGraph: {
    title: "GütenBites — Classic Literature as Podcasts",
    description:
      "Free AI-narrated audiobook podcasts from the world's greatest literature.",
    url: "https://gutenbites.com",
    siteName: "GütenBites",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,400;0,500;1,400&family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

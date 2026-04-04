export const metadata = {
  title: "GütenBites",
  description: "Classic literature as AI-narrated podcasts",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

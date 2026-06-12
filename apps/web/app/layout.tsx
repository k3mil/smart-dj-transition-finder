import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart DJ Transition Finder",
  description: "Find smooth Apple Music inspired transitions from playlist screenshots and web metadata."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl" className="dark">
      <body>{children}</body>
    </html>
  );
}

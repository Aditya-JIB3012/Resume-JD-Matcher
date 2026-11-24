import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resume ↔ Job Description Matcher | Semantic ATS Fit Analyzer",
  description:
    "AI-powered semantic fit scoring using sentence embeddings and TF-IDF vectors, requirement-by-requirement breakdown, and Claude-powered critique. Deployed on Vercel.",
  keywords: [
    "resume matcher",
    "job description analyzer",
    "ats checker",
    "semantic matching",
    "embeddings",
    "vercel",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.15),rgba(255,255,255,0))]"></div>
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_50%_50%_at_80%_80%,rgba(16,185,129,0.08),rgba(255,255,255,0))]"></div>
        {children}
      </body>
    </html>
  );
}

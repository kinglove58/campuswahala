import type { Metadata } from "next";
import "@campuswahala/ui/styles.css";
import "./style.css";
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "CampusWahala — Your campus. Your story.",
    template: "%s | CampusWahala",
  },
  description:
    "Explore a playable university world. Start a guest journey inspired by FUTA, OAU and UNILAG.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "CampusWahala",
    description: "Your campus. Your story. Your wahala.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

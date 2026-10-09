import "@campuswahala/ui/styles.css";
export const metadata = {
  title: "CampusWahala administration",
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

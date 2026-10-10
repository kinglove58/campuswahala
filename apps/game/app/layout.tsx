import "@campuswahala/ui/styles.css";
import "./style.css";
import { OfflineFoundation } from "./offline";
export const metadata = {
  manifest: "/manifest.webmanifest",
  title: "Your campus story | CampusWahala",
  description: "A temporary guest campus journey.",
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <OfflineFoundation />
        {children}
      </body>
    </html>
  );
}

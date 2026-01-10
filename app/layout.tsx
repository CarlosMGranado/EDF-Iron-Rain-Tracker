import "./globals.scss";

import type { ReactNode } from "react";

export const metadata = {
  title: "Earth Defense Force: Iron Rain Tracker",
  description: "Track your progress in Earth Defense Force: Iron Rain.",
  icons: {
    icon: "/favicon.ico"
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main id="main-content">{children}</main>
      </body>
    </html>
  );
}

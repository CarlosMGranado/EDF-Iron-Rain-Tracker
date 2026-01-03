import "./globals.scss";
import type { ReactNode } from "react";

export const metadata = {
  title: "Earth Defense Force: Iron Rain Tracker",
  description: "Client-only EDF: Iron Rain tracker "
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "../index.css";
import { LayoutWrapper } from "../components/LayoutWrapper";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Dev Portfolio",
  description: "Fullstack developer portfolio built with Next.js, Supabase, and Drizzle",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono, Kanit, Prompt } from "next/font/google";
import "./globals.css";
import { FontLoader } from "@/components/font-loader";
import { ThemeProvider } from "@/components/theme-provider";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const kanit = Kanit({
  variable: "--font-kanit",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "thai"],
});

const prompt = Prompt({
  variable: "--font-prompt",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "thai"],
});

export const metadata: Metadata = {
  title: "Odyssi",
  description: "A private, self-hosted diary and blogging platform.",
  icons: {
    icon: "/assets/odyssi_logo.png",
  },
};



import { getAppConfig } from "@/app/lib/actions";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = await getAppConfig();

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${kanit.variable} ${prompt.variable}`} suppressHydrationWarning>
      <head>
        {config.analyticSnippet && (
          <script
            dangerouslySetInnerHTML={{
              __html: config.analyticSnippet
            }}
          />
        )}
      </head>
      <body className="antialiased">
        <FontLoader />
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}

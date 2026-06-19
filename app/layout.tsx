import type { Metadata } from "next";
import { Geist, Geist_Mono, Kanit, Prompt, JetBrains_Mono, Fira_Code, Roboto, Lora } from "next/font/google";
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

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
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

const roboto = Roboto({
  variable: "--font-roboto",
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Odyssi",
  description: "A private, self-hosted diary and blogging platform.",
  icons: {
    icon: "/assets/odyssi_logo.png",
  },
};



import { getAppConfig } from "@/app/lib/actions";
import { AnalyticsInjector } from "@/components/analytics-injector";
import { Toaster } from "@/components/ui/sonner";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = await getAppConfig();

  const htmlStyles: React.CSSProperties = {};
  if (config?.themeAccent === "custom") {
    htmlStyles["--custom-primary" as any] = config?.themeCustomAccent || "#768882";
  }
  if (config?.themeBg === "custom") {
    htmlStyles["--custom-background" as any] = config?.themeCustomBg || "#ffffff";
  }

  return (
    <html 
      lang="en" 
      className={`${geistSans.variable} ${geistMono.variable} ${jetbrainsMono.variable} ${firaCode.variable} ${kanit.variable} ${prompt.variable} ${roboto.variable} ${lora.variable}`} 
      data-font={config?.themeFont || "inter"}
      data-blog-font={config?.themeBlogFont || "inter"}
      data-blog-size={config?.themeBlogSize || "medium"}
      data-code-font={config?.themeCodeFont || "geist"}
      data-accent={config?.themeAccent || "sage"}
      data-bg={config?.themeBg || "white"}
      style={Object.keys(htmlStyles).length > 0 ? htmlStyles : undefined}
      suppressHydrationWarning
    >
      <head>
        {!!config?.analyticSnippet && (
          <AnalyticsInjector snippet={config.analyticSnippet} />
        )}
      </head>
      <body className="antialiased bg-background text-foreground">
        <FontLoader />
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}

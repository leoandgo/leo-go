import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/LanguageContext";

export const metadata: Metadata = {
  title: "Simulateur de prix | Leo&Go",
  description: "Estimez le coût de votre location de véhicule Leo&Go en quelques clics. Location de voitures en libre-service à Lyon.",
  keywords: ["location voiture", "Lyon", "libre-service", "simulateur prix", "Leo&Go"],
  authors: [{ name: "Leo&Go" }],
  openGraph: {
    title: "Simulateur de prix | Leo&Go",
    description: "Estimez le coût de votre location de véhicule Leo&Go",
    url: "https://www.leoandgo.com",
    siteName: "Leo&Go",
    locale: "fr_FR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300..700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "dalley.",
  description: "Professional Roblox UI Animation Studio - Create dynamic and animated user interfaces with dalley.",
  other: {
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: "https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/thumbnail_e21a635c-0632-4a5c-8d32-57ce1d855631-mM6wZTkXIIehXIVHH7L2w108WfaLnA",
      button: {
        title: "Open with Ohara",
        action: {
          type: "launch_frame",
          name: "dalley.",
          url: "https://plural-poem-676.preview.series.engineering",
          splashImageUrl: "https://cdn.builder.io/api/v1/image/assets/TEMP/9756b3248bdd48d596519e7d98958e9df5588654dadf0bb17a71fc435bcb37b3?placeholderIfAbsent=true&apiKey=ad3941e5ec034c87bd50708c966e7b84",
          splashBackgroundColor: "#000000"
        }
      }
    })
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} font-outfit antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

import "./globals.css";
import GoogleAnalyticsScript from "@/components/GoogleAnalyticsScript";
import Providers from "./providers";

export const metadata = {
  title: "さくぶんゼミ",
  description: "AI添削で小論文を鍛える",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="font-sans antialiased">
        <GoogleAnalyticsScript />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

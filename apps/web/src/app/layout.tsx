import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "さくぶんゼミ",
  description: "AI添削で小論文を鍛える",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

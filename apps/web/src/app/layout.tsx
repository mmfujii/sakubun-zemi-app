import "./globals.css";

export const metadata = {
  title: "さくぶんゼミ",
  description: "AI添削で小論文を鍛える",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}

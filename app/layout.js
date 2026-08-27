import "./globals.css";

export const metadata = {
  title: "FutbolCanlı",
  description: "Canlı skorlar ve futbol haberleri"
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}

import "./globals.css";

export const metadata = {
  title: "YouTube to MP3 Converter",
  description: "Convert YouTube videos to MP3 files with customizable bitrate",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

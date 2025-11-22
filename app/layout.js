import './globals.css';

export const metadata = {
  title: 'Restaurant QR Ordering System',
  description: 'Contactless ordering through QR codes with AI-powered assistance',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
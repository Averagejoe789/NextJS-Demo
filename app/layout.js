import './globals.css';

export const metadata = {
  title: 'Restaurant QR Ordering System',
  description: 'Contactless ordering through QR codes with AI-powered assistance',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
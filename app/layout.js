export const metadata = {
  title: 'Chat App',
  description: 'Simple chat interface',
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
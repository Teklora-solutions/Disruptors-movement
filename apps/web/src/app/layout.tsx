import './globals.css';
import Header from './components/Header';

export const metadata = {
  title: 'Disruptors Movement',
  description: 'Platform for events, fellowships, and activities',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-warmPaper font-sans antialiased">
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}

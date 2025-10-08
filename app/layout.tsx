import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Calm Newspaper',
  description: 'A quiet, cross-platform personal newspaper',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto max-w-3xl p-4">
          <header className="flex items-center justify-between py-3">
            <Link href="/" className="text-xl font-semibold">Calm Newspaper</Link>
            <nav className="flex gap-4 text-sm text-gray-600">
              <Link href="/add">Add source</Link>
              <Link href="/login">Login</Link>
            </nav>
          </header>
          <main>{children}</main>
          <footer className="py-10 text-center text-sm text-gray-500">© Calm Newspaper MVP</footer>
        </div>
      </body>
    </html>
  );
}

import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gestión de horarios',
  description: 'Aplicación de horarios con Next.js, Prisma y Tailwind',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-100 text-slate-900">
        {children}
      </body>
    </html>
  );
}

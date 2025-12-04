import Link from "next/link";
import Image from "next/image";
import { Inter } from "next/font/google";
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata = {
  title: "Acompanhamento Alpha",
  description: "Painel do cliente",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body
        className={`${inter.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <header className="w-full bg-black border-b border-yellow-500">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo-alpha.png"
                alt="Alpha Assessoria"
                width={160}
                height={52}
                priority
              />
            </Link>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}

import "../globals.css";
import AppShell from "@/components/AppShell";

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
        className="antialiased overflow-x-hidden"
        suppressHydrationWarning
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

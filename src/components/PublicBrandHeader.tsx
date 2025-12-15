import Image from "next/image";
import Link from "next/link";

export default function PublicBrandHeader({
  title = "Acompanhamento Alpha",
  subtitle = "Painéis e sprints",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="glass glow px-4 py-3 flex items-center justify-between gap-4">
      <Link href="/" className="flex items-center gap-3 min-w-0">
        <Image
          src="/logo-alpha.png"
          alt="Alpha Assessoria"
          width={160}
          height={52}
          priority
          className="h-auto w-[110px] sm:w-[130px]"
        />
        <div className="min-w-0">
          <div className="text-sm sm:text-base font-bold tracking-tight truncate">{title}</div>
          <div className="text-xs text-[rgba(255,255,255,0.65)] truncate">{subtitle}</div>
        </div>
      </Link>

      <Link href="/acesso" className="btn-glass px-3 py-2 text-sm font-semibold whitespace-nowrap">
        Trocar acesso
      </Link>
    </div>
  );
}

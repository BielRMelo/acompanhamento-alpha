import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <main className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 2xl:px-10 py-10 sm:py-14 space-y-6 sm:space-y-10">
        {/* Hero */}
        <section className="glass glow p-6 sm:p-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
            <div className="min-w-0">
              <div className="flex items-center gap-4">
                <Image
                  src="/logo-alpha.png"
                  alt="Alpha Assessoria"
                  width={220}
                  height={72}
                  priority
                  className="h-auto w-[160px] sm:w-[190px]"
                />
              </div>

              <h1 className="mt-6 text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                Acompanhamento Alpha
              </h1>

              <p className="mt-4 text-[rgba(255,255,255,0.78)] text-sm sm:text-lg max-w-2xl leading-relaxed">
                Um painel único para organizar demandas, acompanhar o status de entrega e dar transparência do que está
                em avaliação, na fila e em produção — sem ruído e sem perder histórico.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full">
                <Link href="/acesso" className="btn-primary w-full sm:w-auto px-6 py-3 font-bold text-center">
                  Acesso do Cliente
                </Link>
                <Link href="/admin/login" className="btn-glass w-full sm:w-auto px-6 py-3 font-bold text-center">
                  Acesso do Admin
                </Link>
              </div>

              <div className="mt-4 text-xs text-[rgba(255,255,255,0.55)]">
                Cliente entra com um código de acesso. Admin entra com e-mail e senha.
              </div>
            </div>

            <div className="w-full lg:max-w-[520px]">
              <div className="glass p-5 sm:p-6">
                <div className="text-sm font-bold mb-3">O que você acompanha aqui</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="btn-glass p-4">
                    <div className="text-sm font-semibold">Status em tempo real</div>
                    <div className="mt-1 text-xs text-[rgba(255,255,255,0.65)]">Avaliação, fila, produção e entregue.</div>
                  </div>
                  <div className="btn-glass p-4">
                    <div className="text-sm font-semibold">Transparência</div>
                    <div className="mt-1 text-xs text-[rgba(255,255,255,0.65)]">Links e histórico por demanda.</div>
                  </div>
                  <div className="btn-glass p-4">
                    <div className="text-sm font-semibold">Subtarefas</div>
                    <div className="mt-1 text-xs text-[rgba(255,255,255,0.65)]">Checklist do que compõe a entrega.</div>
                  </div>
                  <div className="btn-glass p-4">
                    <div className="text-sm font-semibold">Organização por sprint</div>
                    <div className="mt-1 text-xs text-[rgba(255,255,255,0.65)]">Planejamento e execução semana a semana.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Como funciona */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="glass p-6">
            <div className="text-xs text-[rgba(255,255,255,0.65)] font-bold">PASSO 1</div>
            <div className="mt-2 text-lg font-bold">Você envia as demandas</div>
            <div className="mt-2 text-sm text-[rgba(255,255,255,0.72)] leading-relaxed">
              O cliente registra solicitações com contexto e links. Tudo fica centralizado.
            </div>
          </div>
          <div className="glass p-6">
            <div className="text-xs text-[rgba(255,255,255,0.65)] font-bold">PASSO 2</div>
            <div className="mt-2 text-lg font-bold">A equipe prioriza e organiza</div>
            <div className="mt-2 text-sm text-[rgba(255,255,255,0.72)] leading-relaxed">
              Admin aprova, move para sprint e acompanha execução com subtarefas.
            </div>
          </div>
          <div className="glass p-6">
            <div className="text-xs text-[rgba(255,255,255,0.65)] font-bold">PASSO 3</div>
            <div className="mt-2 text-lg font-bold">Entrega com transparência</div>
            <div className="mt-2 text-sm text-[rgba(255,255,255,0.72)] leading-relaxed">
              Cada entrega pode ter link e histórico. O cliente vê tudo num lugar só.
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="glass glow p-6 sm:p-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="min-w-0">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight">Pronto para acessar?</div>
              <div className="mt-2 text-[rgba(255,255,255,0.72)]">
                Escolha seu tipo de acesso e continue.
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Link href="/acesso" className="btn-primary w-full sm:w-auto px-6 py-3 font-bold text-center">
                Entrar como Cliente
              </Link>
              <Link href="/admin/login" className="btn-glass w-full sm:w-auto px-6 py-3 font-bold text-center">
                Entrar como Admin
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}


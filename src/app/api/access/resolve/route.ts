import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { code?: string };
    const code = String(body.code || "").trim();

    if (!code) {
      return NextResponse.json({ ok: false, message: "Código inválido" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("clients")
      .select("name,slug")
      .eq("slug", code)
      .limit(2);

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ ok: false, message: "Código não encontrado" }, { status: 404 });
    }

    if (data.length > 1) {
      return NextResponse.json(
        { ok: false, message: "Código duplicado. Fale com o suporte." },
        { status: 409 }
      );
    }

    return NextResponse.json({ ok: true, name: data[0].name });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : "Erro" },
      { status: 500 }
    );
  }
}

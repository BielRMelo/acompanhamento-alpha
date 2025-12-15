import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  createAdminToken,
  getAdminEmail,
  getAdminPassword,
} from "@/lib/adminAuth";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; password?: string; next?: string };
    const email = String(body.email || "").trim();
    const password = String(body.password || "");

    const ok = email.toLowerCase() === getAdminEmail().toLowerCase() && password === getAdminPassword();
    if (!ok) {
      return NextResponse.json({ ok: false, message: "Credenciais inválidas" }, { status: 401 });
    }

    const token = await createAdminToken({ email, iat: Math.floor(Date.now() / 1000) });

    const res = NextResponse.json({ ok: true });
    res.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return res;
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : "Erro" },
      { status: 500 }
    );
  }
}

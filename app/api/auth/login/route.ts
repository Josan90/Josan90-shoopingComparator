import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, setSessionCookie, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as LoginBody;
  const email = body.email?.trim().toLowerCase();
  const password = body.password?.trim();

  if (!email || !password) {
    return NextResponse.json({ error: "Email y password son obligatorios" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, passwordHash: true }
  });

  if (!user?.passwordHash) {
    return NextResponse.json({ error: "Credenciales invalidas" }, { status: 401 });
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: "Credenciales invalidas" }, { status: 401 });
  }

  const token = await createSessionToken({ userId: user.id, email: user.email, name: user.name });
  const response = NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name }
  });
  setSessionCookie(response, token);
  return response;
}

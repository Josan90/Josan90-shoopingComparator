import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, hashPassword, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RegisterBody = {
  email?: string;
  password?: string;
  name?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as RegisterBody;
  const email = body.email?.trim().toLowerCase();
  const password = body.password?.trim();
  const name = body.name?.trim();

  if (!email || !password) {
    return NextResponse.json({ error: "Email y password son obligatorios" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "La password debe tener al menos 8 caracteres" }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({
    where: { email },
    select: { id: true }
  });
  if (exists) {
    return NextResponse.json({ error: "Ese email ya esta registrado" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      name: name || null,
      passwordHash
    },
    select: { id: true, email: true, name: true }
  });

  const token = await createSessionToken({ userId: user.id, email: user.email, name: user.name });
  const response = NextResponse.json({ ok: true, user }, { status: 201 });
  setSessionCookie(response, token);
  return response;
}

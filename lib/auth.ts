import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE_NAME = "priceradar_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

type SessionClaims = {
  userId: number;
  email: string;
  name: string | null;
};

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length >= 32) {
    return new TextEncoder().encode(secret);
  }

  if (process.env.NODE_ENV !== "production") {
    return new TextEncoder().encode("dev-only-auth-secret-change-before-prod");
  }

  throw new Error("AUTH_SECRET no esta configurado o es demasiado corto (minimo 32 caracteres).");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export async function createSessionToken(claims: SessionClaims): Promise<string> {
  const key = getAuthSecret();
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(key);
}

async function readSessionClaims(token: string): Promise<SessionClaims | null> {
  try {
    const key = getAuthSecret();
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });

    if (typeof payload.userId !== "number" || typeof payload.email !== "string") {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      name: typeof payload.name === "string" ? payload.name : null
    };
  } catch {
    return null;
  }
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS
  };
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE_NAME, token, cookieOptions());
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...cookieOptions(),
    maxAge: 0
  });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const claims = await readSessionClaims(token);
  if (!claims) return null;

  return prisma.user.findUnique({
    where: { id: claims.userId },
    select: { id: true, email: true, name: true }
  });
}

export async function getUserFromRequest(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const claims = await readSessionClaims(token);
  if (!claims) return null;

  return prisma.user.findUnique({
    where: { id: claims.userId },
    select: { id: true, email: true, name: true }
  });
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "No autenticado" }, { status: 401 });
}

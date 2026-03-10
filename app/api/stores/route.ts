import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type StoreBody = {
  name?: string;
  website?: string;
};

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const body = (await request.json()) as StoreBody;
  const name = body.name?.trim();

  if (!name || name.length < 2) {
    return NextResponse.json({ error: "El nombre del supermercado es obligatorio" }, { status: 400 });
  }

  const exists = await prisma.store.findUnique({ where: { name } });
  if (exists) {
    return NextResponse.json({ error: "Ese supermercado ya existe" }, { status: 409 });
  }

  const website = body.website?.trim();

  await prisma.store.create({
    data: {
      name,
      website: website || null
    }
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

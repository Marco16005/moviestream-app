import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

interface NumericDoc { _id: number; [key: string]: unknown }

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = await getDb();
  const { id } = await params;
  const movie = await db.collection<NumericDoc>("movies").findOne({ _id: parseInt(id) });
  if (!movie) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(movie);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = await getDb();
  const { id } = await params;
  const body = await req.json();

  const update = {
    title: body.title,
    year: parseInt(body.year),
    runtime: body.runtime ? parseInt(body.runtime) : null,
    summary: body.summary || null,
    list_price: body.list_price ? parseFloat(body.list_price) : null,
    main_subject: body.main_subject || null,
    genre: Array.isArray(body.genre) ? body.genre : (body.genre ? [body.genre] : []),
    cast: Array.isArray(body.cast) ? body.cast : (body.cast ? body.cast.split(",").map((s: string) => s.trim()) : []),
    studio: body.studio ? [body.studio] : [],
    image_url: body.image_url || null,
  };

  await db.collection<NumericDoc>("movies").updateOne({ _id: parseInt(id) }, { $set: update });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = await getDb();
  const { id } = await params;
  await db.collection<NumericDoc>("movies").deleteOne({ _id: parseInt(id) });
  return NextResponse.json({ ok: true });
}

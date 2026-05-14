import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

interface NumericDoc { _id: number; [key: string]: unknown }

export async function GET(req: NextRequest) {
  const db = await getDb();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const genre = searchParams.get("genre") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 12;

  const filter: Record<string, unknown> = {};
  if (q) filter.title = { $regex: q, $options: "i" };
  if (genre) filter.genre = genre;

  const [movies, total] = await Promise.all([
    db.collection<NumericDoc>("movies").find(filter).sort({ year: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
    db.collection<NumericDoc>("movies").countDocuments(filter),
  ]);

  return NextResponse.json({ movies, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const db = await getDb();
  const body = await req.json();

  const lastMovie = await db.collection<NumericDoc>("movies").find().sort({ _id: -1 }).limit(1).toArray();
  const newId = lastMovie.length > 0 ? (lastMovie[0]._id as number) + 1 : 9000;

  const doc = {
    _id: newId,
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
    views: 0,
  };

  await db.collection<NumericDoc>("movies").insertOne(doc);
  return NextResponse.json(doc, { status: 201 });
}

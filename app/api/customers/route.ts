import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

interface NumericDoc { _id: number; [key: string]: unknown }

export async function GET(req: NextRequest) {
  const db = await getDb();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const country = searchParams.get("country") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 12;

  const filter: Record<string, unknown> = {};
  if (q) filter.$or = [
    { "name.first": { $regex: q, $options: "i" } },
    { "name.last": { $regex: q, $options: "i" } },
    { email: { $regex: q, $options: "i" } },
  ];
  if (country) filter["location.country"] = country;

  const [customers, total] = await Promise.all([
    db.collection<NumericDoc>("customers").find(filter).sort({ _id: 1 }).skip((page - 1) * limit).limit(limit).toArray(),
    db.collection<NumericDoc>("customers").countDocuments(filter),
  ]);

  return NextResponse.json({ customers, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const db = await getDb();
  const body = await req.json();

  const last = await db.collection<NumericDoc>("customers").find().sort({ _id: -1 }).limit(1).toArray();
  const newId = last.length > 0 ? (last[0]._id as number) + 1 : 2000000;

  const doc = {
    _id: newId,
    name: { first: body.first_name, last: body.last_name },
    email: body.email,
    location: {
      city: body.city || null,
      state: body.state || null,
      country: body.country || null,
      continent: body.continent || null,
    },
    demographics: {
      age: body.age ? parseInt(body.age) : null,
      gender: body.gender || null,
      income_level: body.income_level || null,
      education: body.education || null,
    },
    segment_id: body.segment_id ? parseInt(body.segment_id) : null,
    yrs_customer: body.yrs_customer ? parseFloat(body.yrs_customer) : null,
    feedback: [],
  };

  await db.collection<NumericDoc>("customers").insertOne(doc);
  return NextResponse.json(doc, { status: 201 });
}

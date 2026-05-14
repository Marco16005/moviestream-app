import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

interface NumericDoc { _id: number; [key: string]: unknown }

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = await getDb();
  const { id } = await params;
  const customer = await db.collection<NumericDoc>("customers").findOne({ _id: parseInt(id) });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(customer);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = await getDb();
  const { id } = await params;
  const body = await req.json();

  const update = {
    name: { first: body.first_name, last: body.last_name },
    email: body.email,
    "location.city": body.city || null,
    "location.state": body.state || null,
    "location.country": body.country || null,
    "location.continent": body.continent || null,
    "demographics.age": body.age ? parseInt(body.age) : null,
    "demographics.gender": body.gender || null,
    "demographics.income_level": body.income_level || null,
    "demographics.education": body.education || null,
    segment_id: body.segment_id ? parseInt(body.segment_id) : null,
    yrs_customer: body.yrs_customer ? parseFloat(body.yrs_customer) : null,
  };

  await db.collection<NumericDoc>("customers").updateOne({ _id: parseInt(id) }, { $set: update });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = await getDb();
  const { id } = await params;
  await db.collection<NumericDoc>("customers").deleteOne({ _id: parseInt(id) });
  return NextResponse.json({ ok: true });
}

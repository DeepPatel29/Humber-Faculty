import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const rooms = await db.room.findMany({ select: { name: true, building: true }, take: 10 });
    return NextResponse.json({ success: true, rooms });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) });
  }
}

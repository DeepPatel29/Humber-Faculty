import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const courses = await db.sharedCourse.findMany({ select: { code: true, name: true }, take: 10 });
    return NextResponse.json({ success: true, courses });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) });
  }
}

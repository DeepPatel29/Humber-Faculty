import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getServerSession } from "@/lib/api/auth-helper";

interface RouteParams {
  params: Promise<{ name: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { name: tableName } = await params;
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = (page - 1) * limit;

    const tableCheck = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name = ${tableName}
    `;

    const tableCheckRows = tableCheck as { table_name: string }[];
    if (tableCheckRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Table not found" },
        { status: 404 },
      );
    }

    const columns = await sql`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${tableName}
      ORDER BY ordinal_position
    `;

    const columnRows = columns as {
      column_name: string;
      data_type: string;
      is_nullable: string;
      column_default: string | null;
    }[];

    const data = await sql.unsafe(`
      SELECT * FROM "${tableName}"
      ORDER BY 1
      LIMIT ${limit} OFFSET ${offset}
    `);

    const countResult = await sql`
      SELECT COUNT(*) as count FROM ${sql.unsafe(`"${tableName}"`)}
    `;

    const countRows = countResult as { count: string }[];
    const totalRows = parseInt(countRows[0].count);

    return NextResponse.json({
      success: true,
      data: {
        tableName,
        columns: columnRows.map((col) => ({
          name: col.column_name,
          type: col.data_type,
          nullable: col.is_nullable === "YES",
          default: col.column_default,
        })),
        rows: data,
        pagination: {
          page,
          limit,
          totalRows,
          totalPages: Math.ceil(totalRows / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching table data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch table data" },
      { status: 500 },
    );
  }
}

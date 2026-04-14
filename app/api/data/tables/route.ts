import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getServerSession } from "@/lib/api/auth-helper";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const tables = await sql`
      SELECT
        table_name,
        (
          SELECT COUNT(*)
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = t.table_name
        ) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    const tablesWithCounts = await Promise.all(
      (tables as { table_name: string; column_count: string }[]).map(
        async (table) => {
          const countResult = await sql`
            SELECT COUNT(*) as count
            FROM ${sql.unsafe(`"${table.table_name}"`)}
          `;
          const rows = countResult as { count: string }[];
          return {
            name: table.table_name,
            columnCount: parseInt(table.column_count),
            rowCount: parseInt(rows[0].count),
          };
        },
      ),
    );

    return NextResponse.json({
      success: true,
      data: tablesWithCounts,
    });
  } catch (error) {
    console.error("Error fetching tables:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tables" },
      { status: 500 },
    );
  }
}

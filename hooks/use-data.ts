"use client";

import useSWR from "swr";

// ============================================================================
// Types
// ============================================================================

export interface TableInfo {
  name: string;
  columnCount: number;
  rowCount: number;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  default: string | null;
}

export interface TableData {
  tableName: string;
  columns: ColumnInfo[];
  rows: Record<string, unknown>[];
  pagination: {
    page: number;
    limit: number;
    totalRows: number;
    totalPages: number;
  };
}

// ============================================================================
// API Functions
// ============================================================================

async function fetchTables() {
  const res = await fetch("/api/data/tables");
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || "Failed to fetch tables");
  }
  return data.data as TableInfo[];
}

async function fetchTableData(tableName: string, page = 1, limit = 50) {
  const res = await fetch(`/api/data/tables/${tableName}?page=${page}&limit=${limit}`);
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || "Failed to fetch table data");
  }
  return data.data as TableData;
}

// ============================================================================
// Hooks
// ============================================================================

export function useTables() {
  return useSWR("data-tables", fetchTables, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  });
}

export function useTableData(tableName: string | null, page = 1, limit = 50) {
  return useSWR(
    tableName ? ["table-data", tableName, page, limit] : null,
    () => fetchTableData(tableName!, page, limit),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );
}

"use client";

import { useState } from "react";
import { useTables, useTableData } from "@/hooks/use-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Database, 
  Table as TableIcon, 
  ChevronLeft, 
  ChevronRight,
  Rows,
  Columns,
  RefreshCw
} from "lucide-react";

function formatValue(value: unknown): string {
  if (value === null) return "NULL";
  if (value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "object") return JSON.stringify(value);
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function TablesList({
  tables,
  selectedTable,
  onSelectTable,
}: {
  tables: { name: string; columnCount: number; rowCount: number }[];
  selectedTable: string | null;
  onSelectTable: (name: string) => void;
}) {
  return (
    <div className="space-y-2">
      {tables.map((table) => (
        <button
          key={table.name}
          onClick={() => onSelectTable(table.name)}
          className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors ${
            selectedTable === table.name
              ? "border-primary bg-primary/5"
              : "border-border hover:bg-muted/50"
          }`}
        >
          <div className="flex items-center gap-3">
            <TableIcon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{table.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <Rows className="mr-1 h-3 w-3" />
              {table.rowCount}
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Columns className="mr-1 h-3 w-3" />
              {table.columnCount}
            </Badge>
          </div>
        </button>
      ))}
    </div>
  );
}

function TableView({
  tableName,
  page,
  onPageChange,
}: {
  tableName: string;
  page: number;
  onPageChange: (page: number) => void;
}) {
  const { data, isLoading, error, mutate } = useTableData(tableName, page);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-destructive">Failed to load table data</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => mutate()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{data.tableName}</h2>
          <p className="text-sm text-muted-foreground">
            {data.pagination.totalRows} rows, {data.columns.length} columns
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => mutate()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Column Types */}
      <div className="flex flex-wrap gap-2">
        {data.columns.slice(0, 8).map((col) => (
          <Badge key={col.name} variant="outline" className="text-xs">
            {col.name}: <span className="ml-1 text-muted-foreground">{col.type}</span>
          </Badge>
        ))}
        {data.columns.length > 8 && (
          <Badge variant="secondary" className="text-xs">
            +{data.columns.length - 8} more
          </Badge>
        )}
      </div>

      {/* Data Table */}
      <div className="rounded-lg border">
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                {data.columns.map((col) => (
                  <TableHead key={col.name} className="whitespace-nowrap">
                    {col.name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={data.columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No data in this table
                  </TableCell>
                </TableRow>
              ) : (
                data.rows.map((row, index) => (
                  <TableRow key={index}>
                    {data.columns.map((col) => (
                      <TableCell key={col.name} className="max-w-[200px] truncate font-mono text-xs">
                        {formatValue(row[col.name])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* Pagination */}
      {data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= data.pagination.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DataBrowserPage() {
  const { data: tables, isLoading, error, mutate } = useTables();
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const handleSelectTable = (name: string) => {
    setSelectedTable(name);
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="mb-8">
          <Skeleton className="mb-2 h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Database className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Failed to load database tables</h2>
          <p className="text-muted-foreground">Please try again later</p>
          <Button variant="outline" className="mt-4" onClick={() => mutate()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Data Browser</h1>
        <p className="text-muted-foreground">
          View and explore your Neon database tables
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Tables List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4" />
              Tables
            </CardTitle>
            <CardDescription>{tables?.length || 0} tables found</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              {tables && (
                <TablesList
                  tables={tables}
                  selectedTable={selectedTable}
                  onSelectTable={handleSelectTable}
                />
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Table Data */}
        <Card>
          <CardContent className="pt-6">
            {selectedTable ? (
              <TableView
                tableName={selectedTable}
                page={page}
                onPageChange={setPage}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <TableIcon className="mb-4 h-12 w-12 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Select a table</h2>
                <p className="text-muted-foreground">
                  Choose a table from the list to view its data
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

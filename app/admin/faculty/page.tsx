"use client";

import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Building2, User } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminFacultyPage() {
  const { data, isLoading } = useSWR("/api/admin/faculty", fetcher);
  const faculty = data?.data?.faculty || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Faculty Management</h1>
        <p className="text-muted-foreground">View and manage faculty members</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {faculty.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex min-h-[200px] items-center justify-center">
                <p className="text-muted-foreground">No faculty members found</p>
              </CardContent>
            </Card>
          ) : (
            faculty.map((f: any) => (
              <Card key={f.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                      <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{f.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{f.designation}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {f.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    {f.department}
                  </div>
                  <div className="pt-2">
                    <Badge variant="outline">{f.role}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

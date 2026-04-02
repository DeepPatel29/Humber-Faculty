"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
      <div className="text-center max-w-md p-8">
        <div className="mx-auto h-20 w-20 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center mb-6">
          <Shield className="h-10 w-10 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-3xl font-bold text-red-800 dark:text-red-300 mb-4">
          Access Denied
        </h1>
        <p className="text-muted-foreground mb-6">
          You don&apos;t have permission to access this page. Please contact your
          administrator if you believe this is an error.
        </p>
        <div className="space-y-3">
          <Link href="/faculty/dashboard">
            <Button className="w-full">Go to Faculty Dashboard</Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

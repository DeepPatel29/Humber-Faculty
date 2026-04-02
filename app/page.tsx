import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/api/auth-helper";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  Calendar, 
  Users, 
  Clock, 
  FileText, 
  Database,
  Shield,
  GraduationCap,
  BarChart3
} from "lucide-react";

export default async function HomePage() {
  const session = await getServerSession();

  if (session) {
    redirect("/faculty/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-foreground">FacultyHub</span>
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex flex-1 flex-col">
        <section className="flex flex-col items-center justify-center px-6 py-24 text-center">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              Secure Faculty Management Portal
            </div>
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Streamline your academic workflow
            </h1>
            <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">
              Manage your classes, schedules, availability, and requests all in one place.
              A modern dashboard built for faculty members with real-time data synchronization.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Create Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Sign in to Dashboard</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border bg-muted/30 px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-12 text-center text-2xl font-bold text-foreground">
              Everything you need to manage your academic life
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { 
                  icon: Calendar, 
                  title: "Timetable", 
                  desc: "View and manage your weekly teaching schedule with real-time updates" 
                },
                { 
                  icon: Clock, 
                  title: "Availability", 
                  desc: "Set your office hours and availability preferences easily" 
                },
                { 
                  icon: FileText, 
                  title: "Requests", 
                  desc: "Submit and track swap, reschedule, and leave requests" 
                },
                { 
                  icon: Users, 
                  title: "Profile", 
                  desc: "Maintain your academic profile and contact information" 
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Data Browser Feature */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-col items-center gap-8 lg:flex-row lg:gap-12">
              <div className="flex-1 text-center lg:text-left">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  <Database className="h-4 w-4" />
                  Data Browser
                </div>
                <h2 className="text-3xl font-bold text-foreground">
                  View your Neon database tables
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Explore and browse your database tables directly from the dashboard. 
                  See real-time data with pagination, column types, and row counts.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:justify-start">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BarChart3 className="h-4 w-4" />
                    <span>Real-time data</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span>Secure access</span>
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-destructive" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                      <span className="text-sm font-medium">users</span>
                      <span className="text-xs text-muted-foreground">12 rows</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                      <span className="text-sm font-medium">faculty</span>
                      <span className="text-xs text-muted-foreground">8 rows</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                      <span className="text-sm font-medium">courses</span>
                      <span className="text-xs text-muted-foreground">24 rows</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              FacultyHub - Faculty Management Portal
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Powered by Neon PostgreSQL
          </p>
        </div>
      </footer>
    </div>
  );
}

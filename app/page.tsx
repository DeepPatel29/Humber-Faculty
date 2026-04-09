import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/api/auth-helper";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Calendar,
  Clock,
  FileText,
  User,
  Bell,
  Shield,
  GraduationCap,
  LayoutDashboard,
  Users,
  ClipboardList,
} from "lucide-react";

export default async function HomePage() {
  const session = await getServerSession();

  if (session) {
    redirect("/faculty/dashboard");
  }

  const features = [
    {
      icon: Calendar,
      title: "Timetable",
      desc: "View and manage your weekly teaching schedule with real-time updates",
    },
    {
      icon: Clock,
      title: "Availability",
      desc: "Set your office hours and availability preferences for easy scheduling",
    },
    {
      icon: FileText,
      title: "Requests",
      desc: "Submit and track swap, reschedule, and leave requests in one place",
    },
    {
      icon: User,
      title: "Profile",
      desc: "Maintain your academic profile, contact info, and credentials",
    },
    {
      icon: Bell,
      title: "Notifications",
      desc: "Stay updated with real-time alerts and important announcements",
    },
  ];

  const roles = [
    {
      icon: User,
      title: "Faculty",
      desc: "Manage your schedule, availability, and requests",
    },
    {
      icon: Users,
      title: "Administrator",
      desc: "Manage faculty profiles and oversee all requests",
    },
    {
      icon: ClipboardList,
      title: "Scheduler",
      desc: "Create and manage course timetables across departments",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">FacultyHub</span>
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild className="hidden sm:flex">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex flex-1 flex-col">
        <section className="relative flex flex-col items-center justify-center overflow-hidden px-6 py-24 lg:py-32">
          {/* Background Pattern */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 translate-x-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
          </div>

          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Secure Faculty Management Portal</span>
            </div>

            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Manage Your Academic Life
              <span className="text-primary"> in One Place</span>
            </h1>

            <p className="mt-6 max-w-2xl mx-auto text-lg leading-relaxed text-muted-foreground">
              FacultyHub streamlines your academic workflow. Manage timetables,
              set availability, submit requests, and stay connected — all from a
              modern, intuitive dashboard.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild className="group">
                <Link href="/signup">
                  Create Free Account
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Sign in to Dashboard</Link>
              </Button>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              No credit card required · Start managing your academic life today
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t border-border bg-muted/30 px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Everything You Need to Manage Your Academic Life
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Five powerful features designed specifically for faculty members
                to simplify their daily workflow.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:scale-110">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Role Highlights Section */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                One Platform, Three Roles
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                FacultyHub adapts to your needs — whether you're a faculty
                member, administrator, or scheduler.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {roles.map((role) => (
                <div
                  key={role.title}
                  className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-card to-muted/20 p-8"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="relative">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                      <role.icon className="h-7 w-7" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">
                      {role.title}
                    </h3>
                    <p className="mt-2 text-muted-foreground">{role.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Dashboard Preview Section */}
        <section className="border-t border-border bg-muted/30 px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
              <div className="flex-1 text-center lg:text-left">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Modern Dashboard</span>
                </div>
                <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
                  Your Command Center
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Get instant access to your schedule, pending requests,
                  notifications, and more — all from a beautifully designed
                  dashboard.
                </p>
                <ul className="mt-6 space-y-3 text-muted-foreground">
                  <li className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                      <ArrowRight className="h-3 w-3 text-primary" />
                    </div>
                    <span>Real-time schedule updates</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                      <ArrowRight className="h-3 w-3 text-primary" />
                    </div>
                    <span>Quick request submission</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                      <ArrowRight className="h-3 w-3 text-primary" />
                    </div>
                    <span>Instant notifications</span>
                  </li>
                </ul>
              </div>
              <div className="flex-1 w-full max-w-lg">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-destructive" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                  </div>
                  {/* Mock Dashboard Preview */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10" />
                      <div className="space-y-2">
                        <div className="h-3 w-32 rounded bg-muted" />
                        <div className="h-2 w-24 rounded bg-muted/70" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="h-20 rounded-xl bg-muted/50 p-3">
                        <div className="h-2 w-12 rounded bg-muted mb-2" />
                        <div className="h-6 w-16 rounded bg-primary/20" />
                      </div>
                      <div className="h-20 rounded-xl bg-muted/50 p-3">
                        <div className="h-2 w-12 rounded bg-muted mb-2" />
                        <div className="h-6 w-16 rounded bg-primary/20" />
                      </div>
                      <div className="h-20 rounded-xl bg-muted/50 p-3">
                        <div className="h-2 w-12 rounded bg-muted mb-2" />
                        <div className="h-6 w-16 rounded bg-primary/20" />
                      </div>
                    </div>
                    <div className="h-32 rounded-xl bg-muted/50 p-4">
                      <div className="h-2 w-20 rounded bg-muted mb-3" />
                      <div className="space-y-2">
                        <div className="h-2 w-full rounded bg-muted/70" />
                        <div className="h-2 w-3/4 rounded bg-muted/70" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Ready to streamline your workflow?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join thousands of faculty members who trust FacultyHub to manage
              their academic life.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild className="group">
                <Link href="/signup">
                  Get Started for Free
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="ghost" asChild>
                <Link href="/login">Sign in to existing account</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              FacultyHub
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Secure faculty management portal · Powered by Neon PostgreSQL
          </p>
        </div>
      </footer>
    </div>
  );
}

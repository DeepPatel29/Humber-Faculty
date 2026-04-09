import Link from "next/link";
import { GraduationCap, Calendar, Users, Shield, Clock } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const features = [
    { icon: Calendar, text: "Manage your schedule" },
    { icon: Users, text: "Track student progress" },
    { icon: Clock, text: "Set availability hours" },
    { icon: Shield, text: "Secure faculty portal" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Panel - Branding */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-primary via-primary/95 to-primary/80 p-12 text-primary-foreground">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/50 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <GraduationCap className="h-7 w-7" />
            </div>
            <span className="text-2xl font-bold">FacultyHub</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-bold leading-tight">
              Streamline your
              <br />
              academic workflow
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/80 max-w-sm">
              Manage your classes, schedules, availability, and requests all in
              one place.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {features.map((feature) => (
              <div
                key={feature.text}
                className="flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3"
              >
                <feature.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-sm text-primary-foreground/60">
            Trusted by faculty across 500+ institutions
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex flex-1 flex-col">
        {/* Mobile Header */}
        <header className="flex items-center justify-between border-b border-border px-6 py-4 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">
              FacultyHub
            </span>
          </Link>
        </header>

        {/* Main Content */}
        <main className="flex flex-1 items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-border px-6 py-4 text-center text-sm text-muted-foreground">
          <p>Secure faculty management portal. Your data is protected.</p>
        </footer>
      </div>
    </div>
  );
}

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Smartphone, BarChart3, Store, ShieldCheck } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <Link className="flex items-center justify-center gap-2" href="/">
          <div className="bg-primary p-1.5 rounded-lg">
            <Smartphone className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-primary">StoreStack</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="/login">
            Login
          </Link>
          <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
            <Link href="/signup">Get Started</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-background to-white">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-primary">
                  The Complete Multi-Tenant Gadget Store SaaS
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Manage your inventory, track sales, and generate public catalogs with zero effort. Built for modern Nigerian retail businesses.
                </p>
              </div>
              <div className="space-x-4">
                <Button asChild size="lg" className="px-8 bg-primary">
                  <Link href="/signup">Start Free Trial</Link>
                </Button>
                <Button variant="outline" size="lg" className="px-8 border-primary text-primary hover:bg-primary/5">
                  View Demo
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary/30">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-4 text-center p-6 bg-white rounded-2xl shadow-sm border border-primary/10">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Store className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Multi-Store Magic</h3>
                <p className="text-muted-foreground">Each owner gets a unique store ID and isolated dashboard for total data privacy.</p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center p-6 bg-white rounded-2xl shadow-sm border border-primary/10">
                <div className="bg-primary/10 p-3 rounded-full">
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Profit Analytics</h3>
                <p className="text-muted-foreground">Real-time tracking of revenue, profit, and overcharges with interactive charts.</p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center p-6 bg-white rounded-2xl shadow-sm border border-primary/10">
                <div className="bg-primary/10 p-3 rounded-full">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Secure Local Storage</h3>
                <p className="text-muted-foreground">Your data stays in your browser. Fast, private, and always available offline.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">© 2024 StoreStack. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
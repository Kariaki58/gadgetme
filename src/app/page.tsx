"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { BarChart3, Store, ShieldCheck, ShoppingBag, TrendingUp, Users, Zap, CheckCircle2, ArrowRight, LayoutDashboard, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

export default function Home() {
  const { user, loading } = useAuth();
  const isAuthenticated = !!user;
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'monthly' | 'yearly' | null>(null);

  // Load saved preference from localStorage
  useEffect(() => {
    const savedBilling = localStorage.getItem('preferredBillingCycle') as 'monthly' | 'yearly' | null;
    if (savedBilling) {
      setBillingCycle(savedBilling);
    }
  }, []);

  // Save preference when changed
  const handleBillingToggle = (checked: boolean) => {
    const newCycle = checked ? 'yearly' : 'monthly';
    setBillingCycle(newCycle);
    localStorage.setItem('preferredBillingCycle', newCycle);
  };

  const handlePlanSelect = (plan: 'free' | 'monthly' | 'yearly') => {
    setSelectedPlan(plan);
    if (plan !== 'free') {
      localStorage.setItem('preferredBillingCycle', plan);
      setBillingCycle(plan);
    }
    // Navigate to signup with plan preference
    const params = new URLSearchParams();
    if (plan !== 'free') {
      params.set('plan', plan);
    }
    window.location.href = `/signup?${params.toString()}`;
  };
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-20 flex items-center border-b bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <Link className="flex items-center justify-center gap-3" href="/">
          <div className="relative w-20 h-20">
            <Image
              src="/store-logo.png"
              alt="Store Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          {/* <span className="text-2xl font-bold tracking-tight text-primary">Karigad</span> */}
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          {isAuthenticated ? (
            <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
              <Link href="/dashboard" className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          ) : (
            <>
              <Link className="text-sm font-medium hover:text-primary transition-colors" href="/login">
                Login
              </Link>
              <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
                <Link href="/signup">Get Started</Link>
              </Button>
            </>
          )}
        </nav>
      </header>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-16 md:py-24 lg:py-32 xl:py-40 bg-gradient-to-br from-primary/5 via-background to-primary/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="container px-4 md:px-6 mx-auto relative z-10">
            <div className="flex flex-col items-center space-y-8 text-center max-w-4xl mx-auto">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Powerful E-Commerce Platform</span>
                </div>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Your Store, Your Way
                </h1>
                <p className="mx-auto max-w-[700px] text-lg md:text-xl text-muted-foreground leading-relaxed">
                  Manage your inventory, track sales, and generate beautiful public catalogs with zero effort. 
                  Built for modern Nigerian retail businesses who want to grow online.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                {isAuthenticated ? (
                  <Button asChild size="lg" className="px-8 py-6 text-lg bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all">
                    <Link href="/dashboard" className="flex items-center gap-2">
                      <LayoutDashboard className="h-5 w-5" />
                      Go to Dashboard
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild size="lg" className="px-8 py-6 text-lg bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all">
                      <Link href="/signup" className="flex items-center gap-2">
                        Get Started Free
                        <ArrowRight className="h-5 w-5" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="lg" className="px-8 py-6 text-lg border-2 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-all">
                      <Link href="/login">Sign In</Link>
                    </Button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-8 pt-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span>14-Day Free Trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span>No Credit Card Required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span>Setup in Minutes</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-20 md:py-28 lg:py-32 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                Everything You Need to Run Your Store
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Powerful features designed to help you manage, grow, and scale your business effortlessly
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="group flex flex-col space-y-4 p-8 bg-gradient-to-br from-white to-primary/5 rounded-2xl shadow-sm border border-primary/10 hover:shadow-xl hover:border-primary/30 transition-all duration-300">
                <div className="bg-primary/10 p-4 rounded-xl w-fit group-hover:bg-primary/20 transition-colors">
                  <Store className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Multi-Store Magic</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Each owner gets a unique store ID and isolated dashboard for total data privacy and security.
                </p>
              </div>
              <div className="group flex flex-col space-y-4 p-8 bg-gradient-to-br from-white to-primary/5 rounded-2xl shadow-sm border border-primary/10 hover:shadow-xl hover:border-primary/30 transition-all duration-300">
                <div className="bg-primary/10 p-4 rounded-xl w-fit group-hover:bg-primary/20 transition-colors">
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Real-Time Analytics</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Track revenue, profit, and sales with beautiful interactive charts and detailed reports.
                </p>
              </div>
              <div className="group flex flex-col space-y-4 p-8 bg-gradient-to-br from-white to-primary/5 rounded-2xl shadow-sm border border-primary/10 hover:shadow-xl hover:border-primary/30 transition-all duration-300">
                <div className="bg-primary/10 p-4 rounded-xl w-fit group-hover:bg-primary/20 transition-colors">
                  <ShoppingBag className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Public Catalog</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Generate beautiful, shareable product catalogs with QR codes for easy customer access.
                </p>
              </div>
              <div className="group flex flex-col space-y-4 p-8 bg-gradient-to-br from-white to-primary/5 rounded-2xl shadow-sm border border-primary/10 hover:shadow-xl hover:border-primary/30 transition-all duration-300">
                <div className="bg-primary/10 p-4 rounded-xl w-fit group-hover:bg-primary/20 transition-colors">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">POS System</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Complete point-of-sale system with cash and transfer tracking, inventory management, and more.
                </p>
              </div>
              <div className="group flex flex-col space-y-4 p-8 bg-gradient-to-br from-white to-primary/5 rounded-2xl shadow-sm border border-primary/10 hover:shadow-xl hover:border-primary/30 transition-all duration-300">
                <div className="bg-primary/10 p-4 rounded-xl w-fit group-hover:bg-primary/20 transition-colors">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Order Management</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Handle online and in-person orders with delivery tracking, payment confirmation, and status updates.
                </p>
              </div>
              <div className="group flex flex-col space-y-4 p-8 bg-gradient-to-br from-white to-primary/5 rounded-2xl shadow-sm border border-primary/10 hover:shadow-xl hover:border-primary/30 transition-all duration-300">
                <div className="bg-primary/10 p-4 rounded-xl w-fit group-hover:bg-primary/20 transition-colors">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Secure & Fast</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Built on modern infrastructure with enterprise-grade security and lightning-fast performance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="w-full py-20 md:py-28 lg:py-32 bg-gradient-to-br from-background via-primary/5 to-background">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                Simple, Transparent Pricing
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Start with a 14-day free trial. No credit card required. Choose the plan that works for you.
              </p>
              
              {/* Billing Toggle */}
              <div className="flex items-center justify-center gap-4 mt-8">
                <Label 
                  htmlFor="billing-toggle" 
                  className={`text-base font-medium cursor-pointer transition-colors ${
                    billingCycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  Monthly
                </Label>
                <Switch
                  id="billing-toggle"
                  checked={billingCycle === 'yearly'}
                  onCheckedChange={handleBillingToggle}
                />
                <Label 
                  htmlFor="billing-toggle" 
                  className={`text-base font-medium cursor-pointer transition-colors ${
                    billingCycle === 'yearly' ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  Yearly
                </Label>
                {billingCycle === 'yearly' && (
                  <Badge className="bg-green-500 text-white ml-2">Save ₦40,000</Badge>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
              {/* Free Trial Plan */}
              <Card className="border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 relative">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl">Free Trial</CardTitle>
                  <CardDescription>Perfect for getting started</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary">₦0</div>
                    <div className="text-sm text-muted-foreground mt-1">14 days free</div>
                  </div>
                  <Separator />
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      <span>Full access to all features</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      <span>Unlimited products</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      <span>POS system</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      <span>Analytics & reports</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      <span>Public catalog with QR code</span>
                    </li>
                  </ul>
                  <Button
                    className="w-full h-12 text-base"
                    variant="outline"
                    onClick={() => handlePlanSelect('free')}
                  >
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              {/* Monthly/Yearly Plan */}
              <Card className="border-2 border-primary hover:border-primary transition-all duration-300 relative md:scale-105 shadow-xl">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">
                    {billingCycle === 'yearly' ? 'Best Value' : 'Popular'}
                  </Badge>
                </div>
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl">
                    {billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}
                  </CardTitle>
                  <CardDescription>
                    {billingCycle === 'monthly' 
                      ? 'Perfect for growing businesses' 
                      : 'Best value - Save ₦40,000'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary">
                      ₦{billingCycle === 'monthly' ? '20,000' : '200,000'}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      per {billingCycle === 'monthly' ? 'month' : 'year'}
                    </div>
                    {billingCycle === 'yearly' && (
                      <div className="text-xs text-green-600 font-semibold mt-2">
                        Only ₦16,667/month (billed annually)
                      </div>
                    )}
                  </div>
                  <Separator />
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      <span>Full access to all features</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      <span>Unlimited products</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      <span>POS system access</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      <span>Analytics & reports</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      <span>Public catalog with QR code</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      <span>{billingCycle === 'yearly' ? 'Priority support' : 'Customer support'}</span>
                    </li>
                    {billingCycle === 'yearly' && (
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        <span>Early access to new features</span>
                      </li>
                    )}
                  </ul>
                  <Button
                    className="w-full h-12 text-base bg-primary hover:bg-primary/90"
                    onClick={() => handlePlanSelect(billingCycle)}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Subscribe {billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              {/* Comparison Card - Shows both plans */}
              <Card className="border-2 border-primary/20 hover:border-primary/40 transition-all duration-300">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl">Compare Plans</CardTitle>
                  <CardDescription>See what's included</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between p-2 bg-secondary/50 rounded">
                      <span className="font-medium">All Features</span>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-secondary/50 rounded">
                      <span className="font-medium">Unlimited Products</span>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-secondary/50 rounded">
                      <span className="font-medium">POS System</span>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-secondary/50 rounded">
                      <span className="font-medium">Analytics</span>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-secondary/50 rounded">
                      <span className="font-medium">Public Catalog</span>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </div>
                  </div>
                  <Separator />
                  <div className="text-center text-sm text-muted-foreground">
                    <p className="font-semibold mb-1">All plans include:</p>
                    <p>• 14-day free trial</p>
                    <p>• No credit card required</p>
                    <p>• Cancel anytime</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-12">
              <p className="text-sm text-muted-foreground">
                All plans include a 14-day free trial. No credit card required to start.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-20 md:py-28 bg-gradient-to-r from-primary to-primary/80">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                Ready to Grow Your Business?
              </h2>
              <p className="text-lg md:text-xl text-white/90 leading-relaxed">
                Join hundreds of Nigerian retailers who are already using Karigad to manage their stores and reach more customers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-4">
                {isAuthenticated ? (
                  <Button asChild size="lg" className="px-8 py-6 text-lg bg-white text-primary hover:bg-white/90 shadow-xl">
                    <Link href="/dashboard" className="flex items-center gap-2">
                      <LayoutDashboard className="h-5 w-5" />
                      Go to Dashboard
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild size="lg" className="px-8 py-6 text-lg bg-white text-primary hover:bg-white/90 shadow-xl">
                      <Link href="/signup" className="flex items-center gap-2">
                        Start Free Trial
                        <ArrowRight className="h-5 w-5" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="lg" className="px-8 py-6 text-lg border-2 border-white text-white hover:bg-white/10">
                      <Link href="/login">Sign In</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-4 sm:flex-row py-8 w-full shrink-0 items-center justify-between px-4 md:px-6 border-t bg-secondary/30">
        <div className="flex items-center gap-3">
          <div className="relative w-20 h-20">
            <Image
              src="/store-logo.png"
              alt="Store Logo"
              fill
              className="object-contain"
            />
          </div>
          <p className="text-sm text-muted-foreground">© 2024 Karigad. All rights reserved.</p>
        </div>
        <nav className="flex gap-6">
          <Link className="text-sm hover:text-primary transition-colors" href="/terms">
            Terms of Service
          </Link>
          <Link className="text-sm hover:text-primary transition-colors" href="/privacy">
            Privacy Policy
          </Link>
          <Link className="text-sm hover:text-primary transition-colors" href="/contact">
            Contact
          </Link>
        </nav>
      </footer>
    </div>
  );
}
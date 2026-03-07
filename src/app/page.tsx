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
import { BarChart3, Store, ShieldCheck, ShoppingBag, TrendingUp, Users, Zap, CheckCircle2, ArrowRight, LayoutDashboard, CreditCard, AlertCircle, X, DollarSign, Package, FileText, Globe, Eye, Star, Gift, Copy, Check } from 'lucide-react';
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
                  <span className="text-sm font-medium text-primary">All-in-One Store Management</span>
                </div>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Stop Managing Your Gadget Business the Hard Way
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
                  <span>Affordable Pricing</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span>Secure Payment</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span>Setup in Minutes</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pain Points Section */}
        <section className="w-full py-20 md:py-28 lg:py-32 bg-red-50/30">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center space-y-4 mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 rounded-full border border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-600">Common Struggles</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                Are These Problems Killing Your Business?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Most gadget store owners face these daily challenges. Sound familiar?
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              <div className="flex flex-col space-y-3 p-6 bg-white rounded-xl shadow-sm border border-red-100 hover:shadow-md transition-all">
                <div className="bg-red-100 p-3 rounded-lg w-fit">
                  <Package className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-foreground">No Proper Inventory Tracking</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <span>Don't know what's in stock</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <span>Sell items that are already finished</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <span>Staff steal small accessories unnoticed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <span>Don't know your exact profit</span>
                  </li>
                </ul>
                <p className="text-sm font-medium text-red-600 italic mt-2">
                  "I'm selling but I don't know where my money is going."
                </p>
              </div>

              <div className="flex flex-col space-y-3 p-6 bg-white rounded-xl shadow-sm border border-red-100 hover:shadow-md transition-all">
                <div className="bg-red-100 p-3 rounded-lg w-fit">
                  <FileText className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-foreground">No Clear Record of Sales</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <span>Everything written in notebooks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <span>WhatsApp orders are scattered</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <span>Transfers not tracked properly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <span>End of month = confusion</span>
                  </li>
                </ul>
                <p className="text-sm font-medium text-red-600 italic mt-2">
                  "I'm working every day but I can't calculate my real income."
                </p>
              </div>

              <div className="flex flex-col space-y-3 p-6 bg-white rounded-xl shadow-sm border border-red-100 hover:shadow-md transition-all">
                <div className="bg-red-100 p-3 rounded-lg w-fit">
                  <Globe className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Poor Online Presence</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <span>Post on WhatsApp status manually</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <span>No proper product catalog</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <span>Customers keep asking: "Price?" "Available?"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <span>No checkout link</span>
                  </li>
                </ul>
                <p className="text-sm font-medium text-red-600 italic mt-2">
                  "Customers stress me too much with repetitive questions."
                </p>
              </div>

              <div className="flex flex-col space-y-3 p-6 bg-white rounded-xl shadow-sm border border-red-100 hover:shadow-md transition-all">
                <div className="bg-red-100 p-3 rounded-lg w-fit">
                  <Users className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Staff Issues</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <span>Staff change prices</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <span>Staff sell without recording</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <span>No way to monitor them remotely</span>
                  </li>
                </ul>
                <p className="text-sm font-medium text-red-600 italic mt-2">
                  "When I'm not in the shop, anything can happen."
                </p>
              </div>

              <div className="flex flex-col space-y-3 p-6 bg-white rounded-xl shadow-sm border border-red-100 hover:shadow-md transition-all">
                <div className="bg-red-100 p-3 rounded-lg w-fit">
                  <BarChart3 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-foreground">No Growth Insight</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <span>Don't know best selling products</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <span>Don't know slow moving products</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <span>Can't track daily profit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <span>Restock blindly</span>
                  </li>
                </ul>
                <p className="text-sm font-medium text-red-600 italic mt-2">
                  "I don't know what is actually growing my business."
                </p>
              </div>

              <div className="flex flex-col space-y-3 p-6 bg-white rounded-xl shadow-sm border border-red-100 hover:shadow-md transition-all">
                <div className="bg-red-100 p-3 rounded-lg w-fit">
                  <DollarSign className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Profit Confusion</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <span>Can't separate revenue from profit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <span>No monthly performance reports</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <span>Guessing instead of knowing</span>
                  </li>
                </ul>
                <p className="text-sm font-medium text-red-600 italic mt-2">
                  "I need to see my real numbers, not guesswork."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Solutions Section */}
        <section className="w-full py-20 md:py-28 lg:py-32 bg-gradient-to-br from-green-50/50 via-white to-primary/5">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center space-y-4 mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full border border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">How We Solve It</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                Your Complete Business Solution
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Stop struggling. Start growing. Here's exactly how we solve your problems.
              </p>
            </div>
            <div className="grid gap-8 lg:grid-cols-2 max-w-6xl mx-auto">
              <div className="flex flex-col space-y-4 p-8 bg-white rounded-2xl shadow-lg border border-green-100 hover:shadow-xl transition-all">
                <div className="bg-green-100 p-4 rounded-xl w-fit">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Know Your Real Profit Daily</h3>
                <p className="text-lg font-semibold text-green-600">"See exactly how much you make every single day."</p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Automatic profit calculation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Revenue tracking in real-time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Monthly performance reports</span>
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground italic mt-2">This removes guessing. You see your numbers instantly.</p>
              </div>

              <div className="flex flex-col space-y-4 p-8 bg-white rounded-2xl shadow-lg border border-green-100 hover:shadow-xl transition-all">
                <div className="bg-green-100 p-4 rounded-xl w-fit">
                  <Package className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Never Lose Track of Inventory Again</h3>
                <p className="text-lg font-semibold text-green-600">"Real-time stock updates that prevent losses."</p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Real-time stock updates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Low stock alerts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Automatic deduction when sold</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Track by product, variant, IMEI</span>
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground italic mt-2">Stops accidental overselling, hidden theft, and dead stock waste.</p>
              </div>

              <div className="flex flex-col space-y-4 p-8 bg-white rounded-2xl shadow-lg border border-green-100 hover:shadow-xl transition-all">
                <div className="bg-green-100 p-4 rounded-xl w-fit">
                  <ShoppingBag className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Proper POS System</h3>
                <p className="text-lg font-semibold text-green-600">"Record everything. Track everyone. Control your sales."</p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Record cash and transfers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Print or send receipts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Track staff sales</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>See who sold what, when</span>
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground italic mt-2">Monitor performance. See daily totals. Track your business metrics.</p>
              </div>

              <div className="flex flex-col space-y-4 p-8 bg-white rounded-2xl shadow-lg border border-green-100 hover:shadow-xl transition-all">
                <div className="bg-green-100 p-4 rounded-xl w-fit">
                  <Globe className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Instant Online Catalog</h3>
                <p className="text-lg font-semibold text-green-600">"One link. Professional catalog. Zero stress."</p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Share one link instead of sending pictures</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Customers see product image, price, description</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Order button for instant checkout</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>QR code for easy access</span>
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground italic mt-2">Reduces stress, looks professional, increases trust, increases orders.</p>
              </div>

              <div className="flex flex-col space-y-4 p-8 bg-white rounded-2xl shadow-lg border border-green-100 hover:shadow-xl transition-all">
                <div className="bg-green-100 p-4 rounded-xl w-fit">
                  <BarChart3 className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Business Intelligence</h3>
                <p className="text-lg font-semibold text-green-600">"Know what's working. Restock smartly."</p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Best selling products</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Slow moving stock alerts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Revenue trends</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Profit margins</span>
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground italic mt-2">Restock smartly. Focus on what makes money. Stop wasting on dead stock.</p>
              </div>

              <div className="flex flex-col space-y-4 p-8 bg-white rounded-2xl shadow-lg border border-green-100 hover:shadow-xl transition-all">
                <div className="bg-green-100 p-4 rounded-xl w-fit">
                  <Eye className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Control Even When Away</h3>
                <p className="text-lg font-semibold text-green-600">"Login from anywhere. Monitor everything."</p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Login from anywhere</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>See live sales</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Monitor staff</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Approve orders remotely</span>
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground italic mt-2">Peace of mind. Your business is always under control, even when you're not there.</p>
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
                Simple, affordable pricing. Choose the plan that works for you. Pay immediately to get started.
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
                  <Badge className="bg-green-500 text-white ml-2">Save ₦15,000</Badge>
                )}
              </div>
            </div>

            <div className="flex justify-center max-w-2xl mx-auto">
              {/* Monthly/Yearly Plan */}
              <Card className="border-2 border-primary hover:border-primary transition-all duration-300 relative w-full shadow-xl">
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
                      : 'Best value - Save ₦15,000'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary">
                      ₦{billingCycle === 'monthly' ? '7,500' : '75,000'}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      per {billingCycle === 'monthly' ? 'month' : 'year'}
                    </div>
                    {billingCycle === 'yearly' && (
                      <div className="text-xs text-green-600 font-semibold mt-2">
                        Only ₦6,250/month (billed annually)
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
            </div>

            <div className="text-center mt-12">
              <p className="text-sm text-muted-foreground">
                Secure payment processing. Get started immediately after payment.
              </p>
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section className="w-full py-20 md:py-28 lg:py-32 bg-gradient-to-br from-background via-primary/5 to-background">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center space-y-4 mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                <Star className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Customer Reviews</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                What Store Owners Are Saying
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Join hundreds of Nigerian retailers who transformed their business with Karigad
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
              {/* Review 1 */}
              <Card className="border-primary/10 shadow-md hover:shadow-xl transition-all">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-bold">AO</span>
                      </div>
                      <div>
                        <CardTitle className="text-base">Adebayo Ojo</CardTitle>
                        <CardDescription className="text-xs">Phone Store, Lagos</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    "Before Karigad, I was losing money daily. I didn't know what was in stock, staff were selling without recording. Now I see everything in real-time. My profit increased by 40% in just 2 months!"
                  </p>
                </CardContent>
              </Card>

              {/* Review 2 */}
              <Card className="border-primary/10 shadow-md hover:shadow-xl transition-all">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-bold">CK</span>
                      </div>
                      <div>
                        <CardTitle className="text-base">Chinwe Kalu</CardTitle>
                        <CardDescription className="text-xs">Gadget Hub, Abuja</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    "The online catalog feature is a game changer! Instead of sending pictures on WhatsApp, I just share one link. Customers can see prices, order directly. My sales doubled because it's so professional."
                  </p>
                </CardContent>
              </Card>

              {/* Review 3 */}
              <Card className="border-primary/10 shadow-md hover:shadow-xl transition-all">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-bold">IM</span>
                      </div>
                      <div>
                        <CardTitle className="text-base">Ibrahim Musa</CardTitle>
                        <CardDescription className="text-xs">Tech Store, Kano</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    "The POS system saved my business. I can track cash and transfers properly now. I know exactly who sold what, when. No more confusion at month end. Everything is clear and organized."
                  </p>
                </CardContent>
              </Card>

              {/* Review 4 */}
              <Card className="border-primary/10 shadow-md hover:shadow-xl transition-all">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-bold">FE</span>
                      </div>
                      <div>
                        <CardTitle className="text-base">Fatima Eze</CardTitle>
                        <CardDescription className="text-xs">Mobile World, Port Harcourt</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    "The analytics dashboard is incredible! I finally know my best selling products. I restock smartly now, not blindly. The low stock alerts prevent me from running out of popular items."
                  </p>
                </CardContent>
              </Card>

              {/* Review 5 */}
              <Card className="border-primary/10 shadow-md hover:shadow-xl transition-all">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-bold">TO</span>
                      </div>
                      <div>
                        <CardTitle className="text-base">Tunde Okafor</CardTitle>
                        <CardDescription className="text-xs">Gadget Zone, Ibadan</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    "I can monitor my store even when I'm not there. I login from home, see live sales, check what staff are doing. This gives me peace of mind. The remote control feature is amazing!"
                  </p>
                </CardContent>
              </Card>

              {/* Review 6 */}
              <Card className="border-primary/10 shadow-md hover:shadow-xl transition-all">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-bold">AA</span>
                      </div>
                      <div>
                        <CardTitle className="text-base">Amina Abdullahi</CardTitle>
                        <CardDescription className="text-xs">Phone Palace, Kaduna</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    "No more selling items that are finished! The inventory tracking is real-time. When something is sold, it automatically updates. I never oversell anymore. This alone saved me thousands."
                  </p>
                </CardContent>
              </Card>

              {/* Review 7 */}
              <Card className="border-primary/10 shadow-md hover:shadow-xl transition-all">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-bold">DE</span>
                      </div>
                      <div>
                        <CardTitle className="text-base">David Emeka</CardTitle>
                        <CardDescription className="text-xs">Tech Solutions, Enugu</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    "The profit calculation is automatic now. I see my real profit daily, not guesses. The monthly reports show me exactly where my money is going. This transparency changed everything."
                  </p>
                </CardContent>
              </Card>

              {/* Review 8 */}
              <Card className="border-primary/10 shadow-md hover:shadow-xl transition-all">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-bold">BO</span>
                      </div>
                      <div>
                        <CardTitle className="text-base">Blessing Okoro</CardTitle>
                        <CardDescription className="text-xs">Gadget Express, Owerri</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    "Setup was so easy! I thought it would be complicated but I was up and running in minutes. The QR code for my catalog is everywhere now - on my business cards, WhatsApp status, everywhere!"
                  </p>
                </CardContent>
              </Card>

              {/* Review 9 */}
              <Card className="border-primary/10 shadow-md hover:shadow-xl transition-all">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-bold">JA</span>
                      </div>
                      <div>
                        <CardTitle className="text-base">James Adeyemi</CardTitle>
                        <CardDescription className="text-xs">Mobile Tech, Benin</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    "The staff tracking feature is a lifesaver. I can see who sold what, when. No more staff changing prices or selling without recording. Everything is transparent now. My business is under control."
                  </p>
                </CardContent>
              </Card>

              {/* Review 10 */}
              <Card className="border-primary/10 shadow-md hover:shadow-xl transition-all">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-bold">PO</span>
                      </div>
                      <div>
                        <CardTitle className="text-base">Peace Okafor</CardTitle>
                        <CardDescription className="text-xs">Smart Devices, Uyo</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    "Best investment I made for my business. The affordable pricing and powerful features make it perfect for my store. My revenue tracking, inventory, everything is perfect!"
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Referral Section */}
        <section className="w-full py-20 md:py-28 bg-gradient-to-br from-primary/10 via-background to-primary/5">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-4xl mx-auto">
              <div className="text-center space-y-4 mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                  <Gift className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Referral Program</span>
                </div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                  Earn ₦2,500 Per Referral
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Share Karigad with others and earn money when they subscribe after their free trial
                </p>
              </div>

              <Card className="border-primary/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl">How It Works</CardTitle>
                  <CardDescription>Start earning today with our simple referral program</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                        <span className="text-2xl font-bold text-primary">1</span>
                      </div>
                      <h3 className="font-semibold">Share Your Link</h3>
                      <p className="text-sm text-muted-foreground">
                        Get your unique referral link and share it with friends
                      </p>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                        <span className="text-2xl font-bold text-primary">2</span>
                      </div>
                      <h3 className="font-semibold">They Sign Up</h3>
                      <p className="text-sm text-muted-foreground">
                        They sign up and subscribe to the platform
                      </p>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                        <span className="text-2xl font-bold text-primary">3</span>
                      </div>
                      <h3 className="font-semibold">You Earn</h3>
                      <p className="text-sm text-muted-foreground">
                        When they subscribe, you earn ₦2,500!
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                      {isAuthenticated ? (
                        <Button asChild size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                          <Link href="/referral" className="flex items-center gap-2">
                            <Gift className="h-5 w-5" />
                            View My Referrals
                            <ArrowRight className="h-5 w-5" />
                          </Link>
                        </Button>
                      ) : (
                        <>
                          <Button asChild size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                            <Link href="/signup" className="flex items-center gap-2">
                              <Gift className="h-5 w-5" />
                              Get Started & Earn
                              <ArrowRight className="h-5 w-5" />
                            </Link>
                          </Button>
                          <Button variant="outline" size="lg" className="w-full sm:w-auto">
                            <Link href="/referral">Learn More</Link>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                        Get Started
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
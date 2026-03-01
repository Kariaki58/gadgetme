"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, MessageCircle, Mail, Phone } from 'lucide-react';
import Image from 'next/image';

export default function ContactPage() {
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
        </Link>
        <nav className="ml-auto">
          <Button asChild variant="ghost">
            <Link href="/">Back to Home</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1 container mx-auto px-4 md:px-6 py-12 max-w-4xl">
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <h1 className="text-4xl font-bold text-primary mb-4">Contact Us</h1>
          <p className="text-muted-foreground">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* WhatsApp Contact */}
          <Card className="border-primary/20 hover:border-primary/40 transition-all">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <MessageCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle>WhatsApp</CardTitle>
                  <CardDescription>Chat with us on WhatsApp</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Get instant support via WhatsApp. We typically respond within a few hours.
              </p>
              <Button 
                asChild 
                className="w-full bg-green-500 hover:bg-green-600 text-white"
              >
                <a 
                  href="https://wa.me/2348107920394" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat on WhatsApp
                </a>
              </Button>
              <p className="text-sm text-muted-foreground mt-3 text-center">
                +234 810 792 0394
              </p>
            </CardContent>
          </Card>

          {/* Phone Contact */}
          <Card className="border-primary/20 hover:border-primary/40 transition-all">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Phone</CardTitle>
                  <CardDescription>Call us directly</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Prefer to speak with us? Give us a call during business hours.
              </p>
              <Button 
                asChild 
                variant="outline"
                className="w-full"
              >
                <a 
                  href="tel:+2348107920394"
                  className="flex items-center justify-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  Call Us
                </a>
              </Button>
              <p className="text-sm text-muted-foreground mt-3 text-center">
                +234 810 792 0394
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Information */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Business Hours</CardTitle>
            <CardDescription>When you can reach us</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-muted-foreground">
              <div className="flex justify-between">
                <span className="font-medium">Monday - Friday:</span>
                <span>9:00 AM - 6:00 PM WAT</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Saturday:</span>
                <span>10:00 AM - 4:00 PM WAT</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Sunday:</span>
                <span>Closed</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <Card className="border-primary/10">
              <CardHeader>
                <CardTitle className="text-lg">How do I get started?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Simply sign up for a free account and start your 14-day free trial. No credit card required!
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/10">
              <CardHeader>
                <CardTitle className="text-lg">What happens after my free trial?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  After your 14-day free trial, you can choose to subscribe to our monthly (₦20,000) or yearly (₦200,000) plan 
                  to continue using all features.
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/10">
              <CardHeader>
                <CardTitle className="text-lg">Can I cancel my subscription?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes, you can cancel your subscription at any time from your account settings. Your access will continue until 
                  the end of your current billing period.
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/10">
              <CardHeader>
                <CardTitle className="text-lg">Is my data secure?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Absolutely! We use industry-standard security measures to protect your data. All information is encrypted and 
                  stored securely. See our Privacy Policy for more details.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="flex flex-col gap-4 sm:flex-row py-8 w-full shrink-0 items-center justify-between px-4 md:px-6 border-t bg-secondary/30 mt-12">
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


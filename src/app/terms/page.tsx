"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';

export default function TermsPage() {
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
          <h1 className="text-4xl font-bold text-primary mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-lg max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using GadgetMe, you accept and agree to be bound by the terms and provision of this agreement. 
              If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">2. Use License</h2>
            <p className="text-muted-foreground leading-relaxed">
              Permission is granted to temporarily use GadgetMe for personal and commercial purposes. This is the grant of a license, 
              not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mt-4">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to reverse engineer any software contained on GadgetMe</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">3. Subscription and Payment</h2>
            <p className="text-muted-foreground leading-relaxed">
              GadgetMe requires a subscription to use the service. You can choose from our monthly (₦7,500) or yearly (₦75,000) plans. 
              All payments are processed securely through Flutterwave.
            </p>
            {/* <p className="text-muted-foreground leading-relaxed mt-4">
              Subscriptions automatically renew unless cancelled. You may cancel your subscription at any time through your account settings.
            </p> */}
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">4. User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed">
              You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility 
              for all activities that occur under your account or password.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">5. Prohibited Uses</h2>
            <p className="text-muted-foreground leading-relaxed">
              You may not use GadgetMe:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mt-4">
              <li>In any way that violates any applicable national or international law or regulation</li>
              <li>To transmit, or procure the sending of, any advertising or promotional material</li>
              <li>To impersonate or attempt to impersonate the company, a company employee, another user, or any other person or entity</li>
              <li>In any way that infringes upon the rights of others</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">6. Content</h2>
            <p className="text-muted-foreground leading-relaxed">
              You retain all rights to any content you submit, post, or display on or through GadgetMe. By submitting content, 
              you grant GadgetMe a worldwide, non-exclusive, royalty-free license to use, reproduce, and distribute your content 
              solely for the purpose of providing and improving the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">7. Disclaimer</h2>
            <p className="text-muted-foreground leading-relaxed">
              The materials on GadgetMe are provided on an 'as is' basis. GadgetMe makes no warranties, expressed or implied, 
              and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions 
              of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">8. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              In no event shall GadgetMe or its suppliers be liable for any damages (including, without limitation, damages for loss 
              of data or profit, or due to business interruption) arising out of the use or inability to use the materials on GadgetMe.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">9. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              GadgetMe may revise these terms of service at any time without notice. By using this website you are agreeing to be 
              bound by the then current version of these terms of service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">10. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              WhatsApp: <a href="https://wa.me/2348107920394" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">+234 810 792 0394</a>
            </p>
          </section>
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


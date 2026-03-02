'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="relative w-16 h-16">
            <Image
              src="/store-logo.png"
              alt="Karigad Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
        <Card className="border-primary/20 shadow-xl">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Check your email</CardTitle>
            <CardDescription className="text-center">
              We've sent a verification link to your email address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {email && (
              <div className="bg-muted/50 p-4 rounded-lg text-center">
                <p className="text-xs font-medium text-foreground mb-1">Email sent to:</p>
                <p className="text-sm text-primary font-semibold">{email}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Verify your email address</p>
                  <p className="text-xs text-muted-foreground mt-1 text-balance">
                    Click the verification link in the email we sent to activate your account.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Can't find the email?</p>
                  <p className="text-xs text-muted-foreground mt-1 text-balance">
                    Check your spam folder or wait a few minutes for it to arrive.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <Button asChild className="w-full bg-primary hover:bg-primary/90 text-white">
                <Link href="/login">
                  Continue to Login
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full border-primary/20 hover:bg-primary/5 hover:text-primary">
                <Link href="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </div>

            <p className="text-[10px] text-center text-muted-foreground pt-4 border-t">
              Didn't receive the email? Make sure you entered the correct email address during registration.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
           <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
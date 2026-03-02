"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { XCircle, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Suspense } from 'react';

function FailureContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [redirecting, setRedirecting] = useState(false);
  const reason = searchParams.get('reason');

  const getFailureMessage = () => {
    switch (reason) {
      case 'payment_cancelled':
        return 'Your payment was cancelled. No charges were made.';
      case 'no_reference':
        return 'Unable to verify payment. Please contact support if payment was deducted.';
      case 'verification_failed':
        return 'Payment verification failed. Please contact support if payment was deducted.';
      case 'error':
        return 'An error occurred during payment processing.';
      default:
        return 'Your payment could not be processed. Please try again or contact support.';
    }
  };

  const handleRetry = () => {
    setRedirecting(true);
    router.push('/dashboard/subscription');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-red-600 dark:text-red-400">
            Payment Failed
          </CardTitle>
          <CardDescription className="mt-4 text-lg">
            {getFailureMessage()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-200 text-center">
              If you were charged, the amount will be refunded within 3-5 business days.
            </p>
          </div>

          <div className="space-y-2 pt-4">
            <Button
              onClick={handleRetry}
              className="w-full"
              size="lg"
              disabled={redirecting}
            >
              {redirecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirecting...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </>
              )}
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full"
            >
              <Link href="/dashboard/subscription">
                Go to Subscription Page
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="w-full"
            >
              <Link href="/dashboard">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-center text-muted-foreground">
              Need help? Contact our support team for assistance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentFailurePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    }>
      <FailureContent />
    </Suspense>
  );
}


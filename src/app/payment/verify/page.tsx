"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

function VerifyPaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get transaction reference from URL params
        const txRef = searchParams.get('tx_ref');
        const transactionId = searchParams.get('transaction_id');
        const statusParam = searchParams.get('status');

        // If status is already failed in URL, redirect to failure page
        if (statusParam === 'cancelled' || statusParam === 'failed') {
          router.push('/payment/failure?reason=payment_cancelled');
          return;
        }

        if (!txRef && !transactionId) {
          setStatus('failed');
          setMessage('No transaction reference found');
          setTimeout(() => {
            router.push('/payment/failure?reason=no_reference');
          }, 3000);
          return;
        }

        // Verify payment with backend
        const response = await fetch('/api/subscriptions/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tx_ref: txRef,
            transaction_id: transactionId,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setStatus('success');
          setMessage('Payment verified successfully! Your subscription is now active.');
          setTimeout(() => {
            router.push('/payment/success');
          }, 2000);
        } else {
          setStatus('failed');
          setMessage(data.message || data.error || 'Payment verification failed');
          setTimeout(() => {
            router.push(`/payment/failure?reason=${encodeURIComponent(data.message || 'verification_failed')}`);
          }, 3000);
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        setStatus('failed');
        setMessage('An error occurred while verifying your payment');
        setTimeout(() => {
          router.push('/payment/failure?reason=error');
        }, 3000);
      }
    };

    verifyPayment();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'verifying' && (
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            )}
            {status === 'failed' && (
              <XCircle className="h-12 w-12 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === 'verifying' && 'Verifying Payment'}
            {status === 'success' && 'Payment Verified'}
            {status === 'failed' && 'Verification Failed'}
          </CardTitle>
          <CardDescription className="mt-2">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {status === 'verifying' && (
            <p className="text-sm text-muted-foreground">
              Please wait while we verify your payment...
            </p>
          )}
          {status === 'success' && (
            <p className="text-sm text-muted-foreground">
              Redirecting you to the success page...
            </p>
          )}
          {status === 'failed' && (
            <p className="text-sm text-muted-foreground">
              Redirecting you to the failure page...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    }>
      <VerifyPaymentContent />
    </Suspense>
  );
}


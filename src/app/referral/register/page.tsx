'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Gift, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import Image from 'next/image';

const formSchema = z.object({
  accountName: z.string().min(2, 'Account name must be at least 2 characters'),
  accountNumber: z.string().regex(/^[0-9]{10}$/, 'Account number must be 10 digits'),
  bankName: z.string().min(2, 'Bank name is required'),
});

type FormValues = z.infer<typeof formSchema>;

export default function ReferralRegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountName: '',
      accountNumber: '',
      bankName: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to register for referrals.',
        variant: 'destructive',
      });
      router.push('/login');
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();

    try {
      // Check if user already has a referral code
      const { data: existingCode } = await supabase
        .from('referral_codes')
        .select('id, code')
        .eq('user_id', user.id)
        .maybeSingle();

      let referralCode = existingCode?.code;

      // Create referral code if doesn't exist
      if (!existingCode) {
        const generateReferralCode = () => {
          const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
          let result = '';
          for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          return result;
        };

        let refCode = generateReferralCode();
        let attempts = 0;
        while (attempts < 10) {
          const { data: existing } = await supabase
            .from('referral_codes')
            .select('id')
            .eq('code', refCode)
            .maybeSingle();
          
          if (!existing) break;
          refCode = generateReferralCode();
          attempts++;
        }

        const { error: codeError } = await supabase
          .from('referral_codes')
          .insert({
            user_id: user.id,
            code: refCode,
            is_vendor: false,
          });

        if (codeError) throw codeError;
        referralCode = refCode;
      }

      // Save bank account details
      const { error: bankError } = await supabase
        .from('referral_bank_accounts')
        .upsert({
          user_id: user.id,
          account_name: values.accountName,
          account_number: values.accountNumber,
          bank_name: values.bankName,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (bankError) throw bankError;

      toast({
        title: 'Registration successful!',
        description: `Your referral code is: ${referralCode}`,
      });

      router.push('/referral');
    } catch (error: any) {
      console.error('Error registering for referrals:', error);
      toast({
        title: 'Registration failed',
        description: error.message || 'Failed to register for referrals. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

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
            <div className="flex items-center justify-center mb-2">
              <div className="bg-primary/10 p-3 rounded-full">
                <Gift className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Register for Referrals</CardTitle>
            <CardDescription className="text-center">
              Earn ₦2,500 for every successful referral
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="accountName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} className="focus-visible:ring-primary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input placeholder="1234567890" {...field} className="focus-visible:ring-primary" />
                      </FormControl>
                      <FormDescription>
                        Must be 10 digits
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Access Bank" {...field} className="focus-visible:ring-primary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Register for Referrals
                    </>
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 p-4 bg-primary/5 rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                You'll earn ₦2,500 when someone you refer subscribes to a monthly or yearly plan.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


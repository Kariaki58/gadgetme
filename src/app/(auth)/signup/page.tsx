'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Smartphone, Loader2, Sparkles } from 'lucide-react';

const formSchema = z.object({
  storeName: z.string().min(2, 'Store name must be at least 2 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().regex(/^\+?[0-9\s\-()]{10,}$/, 'Please enter a valid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type FormValues = z.infer<typeof formSchema>;

import { useActionState, useEffect } from 'react';
import { signup } from '@/app/auth/actions';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [state, formAction, isPending] = useActionState(signup, null);

  useEffect(() => {
    if (state?.error) {
      toast({
        title: 'Registration failed',
        description: state.error,
        variant: 'destructive',
      });
    } else if (state?.requiresVerification) {
      router.push(`/verify-email?email=${encodeURIComponent(state.email)}`);
      toast({
        title: 'Check your email',
        description: 'We sent a verification link. Please verify before continuing.',
      });
    }
  }, [state, router, toast]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      storeName: '',
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formAction(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Smartphone className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold text-primary">Karigad</span>
        </div>
        <Card className="border-primary/20 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Create Your Store</CardTitle>
            <CardDescription className="text-center">
              Launch your gadget business in seconds
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="storeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Gadget Hub" {...field} className="focus-visible:ring-primary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} className="focus-visible:ring-primary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} className="focus-visible:ring-primary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 234 567 8900" {...field} className="focus-visible:ring-primary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} className="focus-visible:ring-primary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} className="focus-visible:ring-primary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Launch My Store <Sparkles className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </div>

            <p className="mt-4 text-[10px] text-center text-muted-foreground">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="underline underline-offset-2 hover:text-primary">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="underline underline-offset-2 hover:text-primary">
                Privacy Policy
              </Link>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
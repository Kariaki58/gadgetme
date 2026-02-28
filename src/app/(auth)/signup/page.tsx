"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStoreData } from '@/hooks/use-store-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Smartphone, Sparkles } from 'lucide-react';

export default function SignupPage() {
  const [storeName, setStoreName] = useState('');
  const [email, setEmail] = useState('');
  const { signup } = useStoreData();
  const router = useRouter();

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    signup(storeName, email);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Smartphone className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold text-primary">StoreStack</span>
        </div>
        <Card className="border-primary/20 shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">Create Your Store</CardTitle>
            <CardDescription>
              Launch your gadget business in seconds
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSignup}>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="storeName">Store Name</Label>
                <Input 
                  id="storeName" 
                  placeholder="Stephen's Gadgets" 
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  required 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="stephen@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                Launch My Store <Sparkles className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already have a store? <Link href="/login" className="text-primary hover:underline">Login with Store ID</Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
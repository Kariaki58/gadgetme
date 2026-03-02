'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Gift, Copy, Check, Users, DollarSign, TrendingUp, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ReferralStats {
  code: string;
  totalReferrals: number;
  successfulReferrals: number;
  pendingEarnings: number;
  totalEarnings: number;
  paidEarnings: number;
}

interface ReferralEarning {
  id: string;
  referred_user_email: string;
  amount: number;
  status: string;
  created_at: string;
  payment_date: string | null;
}

export default function ReferralPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [earnings, setEarnings] = useState<ReferralEarning[]>([]);
  const [copied, setCopied] = useState(false);
  const [hasBankAccount, setHasBankAccount] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadReferralData();
    }
  }, [user, authLoading, router]);

  const loadReferralData = async () => {
    if (!user) return;

    setLoading(true);
    const supabase = createClient();

    try {
      // Get referral code
      const { data: referralCode } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('user_id', user.id)
        .single();

      if (!referralCode) {
        setLoading(false);
        return;
      }

      // Get referral stats
      const { data: referrals } = await supabase
        .from('referral_registrations')
        .select('id, referred_user_id')
        .eq('referrer_user_id', user.id);

      const { data: earningsData } = await supabase
        .from('referral_earnings')
        .select(`
          id,
          referred_user_id,
          amount,
          status,
          created_at,
          payment_date
        `)
        .eq('referrer_user_id', user.id)
        .order('created_at', { ascending: false });

      // Get user emails separately
      const userIds = [...new Set((earningsData || []).map((e: any) => e.referred_user_id))];
      const { data: users } = await supabase
        .from('users')
        .select('id, email')
        .in('id', userIds);

      const usersMap = new Map(users?.map(u => [u.id, u.email]) || []);

      const totalReferrals = referrals?.length || 0;
      const successfulReferrals = earningsData?.length || 0;
      const pendingEarnings = earningsData?.filter(e => e.status === 'pending').reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0) || 0;
      const paidEarnings = earningsData?.filter(e => e.status === 'paid').reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0) || 0;
      const totalEarnings = pendingEarnings + paidEarnings;

      setStats({
        code: referralCode.code,
        totalReferrals,
        successfulReferrals,
        pendingEarnings,
        totalEarnings,
        paidEarnings,
      });

      // Format earnings
      const formattedEarnings: ReferralEarning[] = (earningsData || []).map((e: any) => ({
        id: e.id,
        referred_user_email: usersMap.get(e.referred_user_id) || 'Unknown',
        amount: parseFloat(e.amount.toString()),
        status: e.status,
        created_at: e.created_at,
        payment_date: e.payment_date,
      }));

      setEarnings(formattedEarnings);

      // Check if bank account exists
      const { data: bankAccount } = await supabase
        .from('referral_bank_accounts')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      setHasBankAccount(!!bankAccount);
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (!stats) return;

    const referralLink = `${window.location.origin}/signup?ref=${stats.code}`;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({
      title: 'Copied!',
      description: 'Referral link copied to clipboard',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Register for Referrals</CardTitle>
            <CardDescription>You need to register first to start earning from referrals</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/referral/register')} className="w-full">
              <Gift className="mr-2 h-4 w-4" />
              Register Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Referral Program</h1>
            <p className="text-muted-foreground mt-1">Earn ₦5,000 for every successful referral</p>
          </div>
          {!hasBankAccount && (
            <Button onClick={() => router.push('/referral/register')} variant="outline">
              <Gift className="mr-2 h-4 w-4" />
              Add Bank Details
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Referral Code</CardTitle>
              <Gift className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.code}</div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={copyReferralLink}
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReferrals}</div>
              <p className="text-xs text-muted-foreground mt-1">People you've referred</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Successful Referrals</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.successfulReferrals}</div>
              <p className="text-xs text-muted-foreground mt-1">Who completed payment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{stats.totalEarnings.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                ₦{stats.paidEarnings.toLocaleString()} paid, ₦{stats.pendingEarnings.toLocaleString()} pending
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Earnings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Earnings History</CardTitle>
            <CardDescription>Track your referral earnings</CardDescription>
          </CardHeader>
          <CardContent>
            {earnings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referred User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {earnings.map((earning) => (
                    <TableRow key={earning.id}>
                      <TableCell>{earning.referred_user_email}</TableCell>
                      <TableCell>₦{earning.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={earning.status === 'paid' ? 'default' : 'secondary'}>
                          {earning.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(earning.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No earnings yet. Start sharing your referral link!
              </div>
            )}
          </CardContent>
        </Card>

        {/* How it works */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold">Share Your Link</h3>
                <p className="text-sm text-muted-foreground">
                  Copy your referral link and share it with friends, family, or on social media.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold">They Sign Up</h3>
                <p className="text-sm text-muted-foreground">
                  When someone uses your link to sign up, they get a 14-day free trial.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold">They Pay</h3>
                <p className="text-sm text-muted-foreground">
                  After their trial, if they subscribe (monthly or yearly), you earn ₦5,000!
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold">Get Paid</h3>
                <p className="text-sm text-muted-foreground">
                  Payments are processed manually. Make sure you've added your bank account details.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


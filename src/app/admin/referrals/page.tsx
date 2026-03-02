'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Search, DollarSign, Users, TrendingUp, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ReferralStats {
  totalReferrers: number;
  totalReferrals: number;
  successfulReferrals: number;
  totalPendingAmount: number;
  totalPaidAmount: number;
  totalEarnings: number;
}

interface ReferralEarning {
  id: string;
  referrer_user_id: string;
  referrer_email: string;
  referrer_name: string;
  referred_user_email: string;
  amount: number;
  status: string;
  created_at: string;
  payment_date: string | null;
  payment_notes: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_name: string | null;
}

export default function AdminReferralsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [earnings, setEarnings] = useState<ReferralEarning[]>([]);
  const [filteredEarnings, setFilteredEarnings] = useState<ReferralEarning[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [selectedEarning, setSelectedEarning] = useState<ReferralEarning | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentNotes, setPaymentNotes] = useState('');
  const { toast } = useToast();

  // Check admin access
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (authLoading) return;

      if (!user) {
        router.push('/login');
        return;
      }

      const adminEmailsEnv = typeof window !== 'undefined' 
        ? (window as any).__ADMIN_EMAILS__ 
        : process.env.NEXT_PUBLIC_ADMIN_EMAILS;
      
      const adminEmails = adminEmailsEnv?.split(',').map((e: string) => e.trim()) || [];
      
      const allAdminEmails = [...adminEmails];
      
      if (allAdminEmails.length === 0 || allAdminEmails.includes(user.email || '')) {
        setIsAdmin(true);
        loadData();
      } else {
        setIsAdmin(false);
        setLoading(false);
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to access this page.',
          variant: 'destructive',
        });
        setTimeout(() => router.push('/dashboard'), 2000);
      }
    };

    checkAdminAccess();
  }, [user, authLoading, router, toast]);

  useEffect(() => {
    filterEarnings();
  }, [earnings, searchTerm, statusFilter]);

  const loadData = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/admin/referrals');
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to access this page.',
            variant: 'destructive',
          });
          router.push('/dashboard');
          return;
        }
        throw new Error('Failed to load data');
      }

      const data = await response.json();
      
      setStats(data.stats);
      setEarnings(data.earnings);
    } catch (error) {
      console.error('Error loading referral data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load referral data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterEarnings = () => {
    let filtered = [...earnings];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(e => e.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(e =>
        e.referrer_email.toLowerCase().includes(term) ||
        e.referrer_name.toLowerCase().includes(term) ||
        e.referred_user_email.toLowerCase().includes(term) ||
        e.bank_account_number?.includes(term)
      );
    }

    setFilteredEarnings(filtered);
  };

  const handleMarkAsPaid = async () => {
    if (!selectedEarning) return;

    try {
      const response = await fetch('/api/admin/referrals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          earningId: selectedEarning.id,
          paymentNotes: paymentNotes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to mark as paid');
      }

      toast({
        title: 'Success',
        description: 'Payment marked as paid',
      });

      setPaymentDialogOpen(false);
      setSelectedEarning(null);
      setPaymentNotes('');
      loadData();
    } catch (error: any) {
      console.error('Error marking as paid:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark as paid',
        variant: 'destructive',
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center justify-center mb-2">
              <ShieldAlert className="h-12 w-12 text-red-500" />
            </div>
            <CardTitle className="text-center">Access Denied</CardTitle>
            <CardDescription className="text-center">
              You do not have permission to access the admin dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Referral System Admin</h1>
          <p className="text-muted-foreground mt-1">Manage referrals and payments</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Referrers</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalReferrers || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalReferrals || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{stats?.totalPendingAmount.toLocaleString() || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{stats?.totalPaidAmount.toLocaleString() || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Earnings Management</CardTitle>
            <CardDescription>View and manage referral payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email, name, or account number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === 'pending' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('pending')}
                >
                  Pending
                </Button>
                <Button
                  variant={statusFilter === 'paid' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('paid')}
                >
                  Paid
                </Button>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referrer</TableHead>
                  <TableHead>Referred User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Bank Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEarnings.length > 0 ? (
                  filteredEarnings.map((earning) => (
                    <TableRow key={earning.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{earning.referrer_name}</div>
                          <div className="text-sm text-muted-foreground">{earning.referrer_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{earning.referred_user_email}</TableCell>
                      <TableCell>₦{earning.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        {earning.bank_account_name ? (
                          <div className="text-sm">
                            <div>{earning.bank_account_name}</div>
                            <div className="text-muted-foreground">{earning.bank_account_number}</div>
                            <div className="text-muted-foreground">{earning.bank_name}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not provided</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={earning.status === 'paid' ? 'default' : 'secondary'}>
                          {earning.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(earning.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {earning.status === 'pending' ? (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedEarning(earning);
                              setPaymentDialogOpen(true);
                            }}
                          >
                            Mark as Paid
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {earning.payment_date ? new Date(earning.payment_date).toLocaleDateString() : '-'}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No earnings found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Payment Dialog */}
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark Payment as Paid</DialogTitle>
              <DialogDescription>
                Confirm that you have paid {selectedEarning?.referrer_name} (₦{selectedEarning?.amount.toLocaleString()})
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedEarning && (
                <div className="space-y-2">
                  <div>
                    <Label>Bank Details</Label>
                    <div className="p-3 bg-muted rounded-md">
                      {selectedEarning.bank_account_name ? (
                        <>
                          <div className="font-medium">{selectedEarning.bank_account_name}</div>
                          <div className="text-sm text-muted-foreground">{selectedEarning.bank_account_number}</div>
                          <div className="text-sm text-muted-foreground">{selectedEarning.bank_name}</div>
                        </>
                      ) : (
                        <div className="text-muted-foreground">Bank details not provided</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="notes">Payment Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      placeholder="Add any notes about this payment..."
                    />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleMarkAsPaid}>
                Mark as Paid
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, User, CreditCard, History } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function SettingsPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [profile, setProfile] = useState<any>(null);
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        business_name: '',
        business_gstin: ''
    });

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    async function loadData() {
        try {
            const { data: profileData } = await supabase
                .from('users')
                .select('*')
                .eq('id', user?.id)
                .single();

            if (profileData) {
                setProfile(profileData);
                setFormData({
                    full_name: profileData.full_name || '',
                    phone: profileData.phone || '',
                    business_name: profileData.business_name || '',
                    business_gstin: profileData.business_gstin || ''
                });
            }

            const { data: txData } = await supabase
                .from('credit_transactions')
                .select('*')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (txData) setTransactions(txData);
        } catch (error) {
            console.error('Failed to load settings', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault();
        const { error } = await supabase
            .from('users')
            .update(formData)
            .eq('id', user?.id);

        if (error) toast.error('Failed to update profile');
        else toast.success('Profile updated successfully');
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 px-4 space-y-8 max-w-5xl">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
                <p className="text-muted-foreground">Manage your profile and view credit history.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-[1fr_300px]">
                <div className="space-y-8">
                    {/* Profile Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Profile Information
                            </CardTitle>
                            <CardDescription>Update your personal and business details.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleUpdate} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Full Name</label>
                                        <Input
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Phone Number</label>
                                        <Input
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="+91 98765 43210"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Business Name</label>
                                        <Input
                                            value={formData.business_name}
                                            onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                                            placeholder="Acme Corp"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Business GSTIN</label>
                                        <Input
                                            value={formData.business_gstin}
                                            onChange={(e) => setFormData({ ...formData, business_gstin: e.target.value })}
                                            placeholder="22AAAAA0000A1Z5"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end pt-2">
                                    <Button type="submit">Save Changes</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Transaction History */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-5 w-5" />
                                Credit History
                            </CardTitle>
                            <CardDescription>Recent credit usage and purchases.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Change</TableHead>
                                        <TableHead className="text-right">Balance</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                                No transactions found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        transactions.map((txn) => (
                                            <TableRow key={txn.id}>
                                                <TableCell className="font-medium">
                                                    {new Date(txn.created_at).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>{txn.description}</TableCell>
                                                <TableCell className={`text-right font-medium ${txn.transaction_type === 'usage' ? 'text-red-500' : 'text-green-600'
                                                    }`}>
                                                    {txn.transaction_type === 'usage' ? '-' : '+'}
                                                    {txn.credits_used || txn.credits_added}
                                                </TableCell>
                                                <TableCell className="text-right text-muted-foreground">
                                                    {txn.credits_balance}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    <Card className="bg-primary text-primary-foreground">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-medium opacity-90 flex items-center gap-2">
                                <CreditCard className="h-4 w-4" /> Credits Available
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">{profile?.credits_remaining || 0}</div>
                            <p className="text-sm opacity-80 mt-1">
                                {profile?.credits_used || 0} used lifetime
                            </p>
                            <Button variant="secondary" className="w-full mt-4" asChild>
                                <a href="/pricing">Buy More Credits</a>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-muted-foreground">Current Plan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold capitalize">
                                {(profile?.current_plan || 'Free').replace('_', ' ')}
                            </div>
                            {profile?.credits_expire_at && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    Expires: {new Date(profile.credits_expire_at).toLocaleDateString()}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

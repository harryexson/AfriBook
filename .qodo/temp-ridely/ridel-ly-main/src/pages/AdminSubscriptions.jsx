import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Ban, RefreshCcw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { format } from 'date-fns';

const statusColors = {
    active: "bg-green-100 text-green-800",
    cancelled: "bg-yellow-100 text-yellow-800",
    refunded: "bg-red-100 text-red-800",
    expired: "bg-gray-100 text-gray-800",
    pending: "bg-blue-100 text-blue-800",
};

const SubscriptionActions = ({ subscription, user }) => {
    const queryClient = useQueryClient();

    const updateSubscriptionMutation = useMutation({
        mutationFn: (data) => base44.entities.PrimeSubscription.update(subscription.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminSubscriptions'] });
            queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
        },
    });

    const updateUserMutation = useMutation({
        mutationFn: (data) => base44.entities.User.update(subscription.user_id, data),
    });

    const handleCancel = async () => {
        await updateSubscriptionMutation.mutateAsync({ status: 'cancelled', cancelled_at: new Date().toISOString() });
        await updateUserMutation.mutateAsync({ is_prime_member: false });
        toast.success(`Subscription for ${user.full_name} has been cancelled.`);
    };
    
    const handleRefund = async () => {
        // NOTE: This does not process a real financial transaction.
        // It only updates the application's database state.
        await updateSubscriptionMutation.mutateAsync({ status: 'refunded' });
        await updateUserMutation.mutateAsync({ is_prime_member: false });
        toast.info(`Subscription for ${user.full_name} marked as refunded. Financial transaction must be handled separately.`);
    };

    return (
        <AlertDialog>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    {subscription.status === 'active' && (
                        <DropdownMenuItem onClick={handleCancel}>
                            <Ban className="mr-2 h-4 w-4" />
                            Cancel Subscription
                        </DropdownMenuItem>
                    )}
                    {subscription.status === 'active' && (
                         <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-red-600">
                                <RefreshCcw className="mr-2 h-4 w-4" />
                                Process Refund
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will mark the subscription for {user?.full_name} as refunded and revoke their Prime access. This action cannot be undone. You must process the actual financial refund separately via your payment provider (e.g., Stripe).
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRefund} className="bg-red-600 hover:bg-red-700">Continue</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default function AdminSubscriptions() {
    const { data: subscriptions, isLoading: isLoadingSubs } = useQuery({
        queryKey: ['adminSubscriptions'],
        queryFn: () => base44.entities.PrimeSubscription.list('-created_date', 500)
    });

    const { data: users, isLoading: isLoadingUsers } = useQuery({
        queryKey: ['adminUsers'],
        queryFn: () => base44.entities.User.list(null, 1000)
    });

    const usersById = useMemo(() => {
        if (!users) return new Map();
        return new Map(users.map(user => [user.id, user]));
    }, [users]);

    const isLoading = isLoadingSubs || isLoadingUsers;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Subscription Management</h1>
            <Card>
                <CardHeader>
                    <CardTitle>All Prime Subscriptions</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Start Date</TableHead>
                                <TableHead>Renews/Expires</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={6} className="text-center">Loading subscriptions...</TableCell></TableRow>
                            ) : subscriptions && subscriptions.length > 0 ? (
                                subscriptions.map(sub => {
                                    const user = usersById.get(sub.user_id);
                                    if (!user) return null;

                                    return (
                                        <TableRow key={sub.id}>
                                            <TableCell>
                                                <div className="font-medium">{user.full_name}</div>
                                                <div className="text-sm text-muted-foreground">{user.email}</div>
                                            </TableCell>
                                            <TableCell className="capitalize">{sub.plan_id.split('_')[0]}</TableCell>
                                            <TableCell>
                                                <Badge className={statusColors[sub.status]}>{sub.status}</Badge>
                                            </TableCell>
                                            <TableCell>{format(new Date(sub.started_at), 'MMM d, yyyy')}</TableCell>
                                            <TableCell>{sub.renews_at ? format(new Date(sub.renews_at), 'MMM d, yyyy') : 'N/A'}</TableCell>
                                            <TableCell>
                                               <SubscriptionActions subscription={sub} user={user} />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow><TableCell colSpan={6} className="text-center">No subscriptions found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
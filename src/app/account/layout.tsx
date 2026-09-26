'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Car,
  Heart,
  Bell,
  Settings,
  CreditCard,
  LogOut,
  User,
  HeartHandshake,
} from 'lucide-react';
import { createClient } from '@/lib/neon/client';

const navItems = [
  { href: '/account', label: 'Overview', icon: LayoutDashboard },
  { href: '/account/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/account/trips', label: 'Trips', icon: Car },
  { href: '/account/dependents', label: 'People I Look After', icon: HeartHandshake },
  { href: '/account/favorites', label: 'Favorites', icon: Heart },
  { href: '/account/notifications', label: 'Notifications', icon: Bell },
  { href: '/account/payment-methods', label: 'Payment Methods', icon: CreditCard },
  { href: '/account/settings', label: 'Settings', icon: Settings },
];

interface Profile {
  full_name: string | null;
  email: string;
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from('profiles').select('full_name, email').eq('id', user.id).single();
      if (data) setProfile(data as Profile);
    });
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0">
            <div className="bg-surface-secondary rounded-2xl border border-border p-6 sticky top-24">
              {/* User Avatar */}
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-heading font-bold text-text-primary text-sm truncate">
                    {profile?.full_name ?? 'Loading…'}
                  </p>
                  <p className="text-text-tertiary text-xs truncate">{profile?.email ?? ''}</p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-amber-500 text-white'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                      }`}
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Logout */}
              <div className="mt-6 pt-6 border-t border-border">
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-colors w-full"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}

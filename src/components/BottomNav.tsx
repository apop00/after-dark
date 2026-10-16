'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusCircle, LogIn, BookOpen } from 'lucide-react';
import { triggerHaptic } from '@/lib/haptics/vibration';
import { sounds } from '@/lib/audio/sound';

interface BottomNavProps {
  isFrameMode?: boolean;
}

export function BottomNav({ isFrameMode = false }: BottomNavProps) {
  const pathname = usePathname();

  // Non mostrare la bottom nav durante il gioco attivo (ha già la sua HUD dock)
  if (pathname.startsWith('/game/')) {
    return null;
  }

  const navItems = [
    { href: '/', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { href: '/create', label: 'Crea', icon: <PlusCircle className="w-5 h-5" /> },
    { href: '/join', label: 'Entra', icon: <LogIn className="w-5 h-5" /> },
    { href: '/rules', label: 'Regole', icon: <BookOpen className="w-5 h-5" /> },
  ];

  const containerClasses = isFrameMode
    ? 'fixed md:relative bottom-0 inset-x-0 md:bottom-auto md:inset-auto z-40 w-full max-w-md mx-auto bg-[#090514]/95 backdrop-blur-xl border-t border-white/10 px-3 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:pb-1.5 shadow-[0_-10px_25px_rgba(0,0,0,0.7)] shrink-0'
    : 'fixed bottom-0 inset-x-0 z-40 w-full max-w-md mx-auto bg-[#090514]/95 backdrop-blur-xl border-t border-white/10 px-3 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-10px_25px_rgba(0,0,0,0.7)] shrink-0';

  return (
    <nav className={containerClasses}>
      <div className="grid grid-cols-4 gap-1 max-w-sm mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                triggerHaptic('light');
                sounds.playClick();
              }}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all ${
                isActive
                  ? 'bg-rose-500/20 text-rose-400 font-extrabold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 font-medium'
              }`}
            >
              <div className={isActive ? 'scale-110 text-rose-400 transition-transform' : 'transition-transform'}>
                {item.icon}
              </div>
              <span className="text-[10px] mt-0.5 uppercase tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Wifi, BatteryCharging, Sparkles } from 'lucide-react';

export function SmartphoneFrame({ children }: { children: React.ReactNode }) {
  const [currentTime, setCurrentTime] = useState('23:45');
  const [isFrameEnabled, setIsFrameEnabled] = useState(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#040208] text-slate-100 relative">
      
      {/* Background Ambient Glows (Desktop) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden hidden md:block">
        <div className="absolute top-1/4 left-1/3 -translate-x-1/2 w-[550px] h-[550px] bg-rose-600/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-1/4 right-1/3 translate-x-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-cyan-600/08 rounded-full blur-[120px]" />
      </div>

      {/* Desktop Mode Toggle Bar */}
      <div className="hidden md:flex items-center gap-3 py-3 px-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl mb-4 z-50 text-xs shadow-2xl">
        <span className="text-slate-400 font-bold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-rose-400" />
          <span>AFTER DARK Simulator</span>
        </span>
        <div className="w-px h-4 bg-white/10" />
        <button
          onClick={() => setIsFrameEnabled(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold transition-all ${
            isFrameEnabled
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/60'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Vista Smartphone</span>
        </button>
        <button
          onClick={() => setIsFrameEnabled(false)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold transition-all ${
            !isFrameEnabled
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/60'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Schermo Intero</span>
        </button>
      </div>

      {/* Main Container: Smartphone Chassis on Desktop, Full Screen on Mobile */}
      <div
        className={`w-full transition-all duration-300 relative ${
          isFrameEnabled
            ? 'md:max-w-[410px] md:h-[840px] md:rounded-[52px] md:border-[10px] md:border-[#1e1533] md:shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_40px_rgba(244,63,94,0.25)] md:overflow-hidden md:flex md:flex-col md:bg-[#07050f]'
            : 'max-w-md w-full min-h-screen bg-[#07050f]'
        }`}
      >
        {/* Smartphone Hardware Elements (Only visible in frame mode on desktop) */}
        {isFrameEnabled && (
          <>
            {/* Dynamic Island / Notch */}
            <div className="hidden md:flex items-center justify-between px-7 pt-3 pb-1 shrink-0 bg-transparent z-50 select-none">
              <span className="text-[12px] font-bold text-white tracking-tight">{currentTime}</span>
              
              {/* Dynamic Island Capsule */}
              <div className="w-24 h-5 bg-black rounded-full flex items-center justify-end px-2 border border-white/10 shadow-inner">
                <div className="w-2.5 h-2.5 rounded-full bg-[#120a22] border border-[#2b194f]" />
              </div>

              {/* Status Icons */}
              <div className="flex items-center gap-1.5 text-slate-300 text-[11px]">
                <Wifi className="w-3.5 h-3.5" />
                <span className="font-bold">5G</span>
                <BatteryCharging className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
          </>
        )}

        {/* Scrollable Phone App Content */}
        <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col relative">
          {children}
        </div>

        {/* Smartphone Home Indicator Bar (Desktop Chassis) */}
        {isFrameEnabled && (
          <div className="hidden md:flex justify-center py-2 shrink-0 bg-transparent z-50">
            <div className="w-32 h-1 bg-white/25 rounded-full" />
          </div>
        )}
      </div>

    </div>
  );
}

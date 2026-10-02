"use client";

import React from "react";
import { Hand } from "lucide-react";

interface NavbarProps {
  onHomeClick: () => void;
  activeScenarioTitle?: string;
}

export default function Navbar({ onHomeClick }: NavbarProps) {
  return (
    <>
      <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <div
            onClick={onHomeClick}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-[#58cc02] border-b-2 border-[#46a302] flex items-center justify-center text-white font-bold shadow-xs">
              <Hand className="w-4 h-4 fill-white" />
            </div>
            <span className="font-extrabold text-slate-900 text-sm tracking-tight">SgSL Bridge</span>
          </div>

        </div>
      </header>
    </>
  );
}

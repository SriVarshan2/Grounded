import React from 'react';
import { Check, X } from 'lucide-react';

/**
 * ClaimBadge Component
 * Renders an inline pill badge indicating if a claim is grounded or ungrounded.
 * Shows a detailed explanation tooltip on hover.
 * 
 * Props:
 * - type (string): "grounded" | "ungrounded"
 * - reason (string): The description/context explaining the grounding verification.
 */
export default function ClaimBadge({ type, reason }) {
  const isGrounded = type === 'grounded';
  
  return (
    <span className="relative group inline-flex items-center align-middle mx-1">
      {isGrounded ? (
        <span className="inline-flex items-center gap-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-extrabold tracking-wide uppercase px-2 py-0.5 rounded-full transition-colors cursor-help">
          <Check className="w-2.5 h-2.5 text-emerald-400 stroke-[3]" />
          <span>Grounded</span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-0.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-extrabold tracking-wide uppercase px-2 py-0.5 rounded-full transition-colors cursor-help">
          <X className="w-2.5 h-2.5 text-rose-400 stroke-[3]" />
          <span>Ungrounded</span>
        </span>
      )}

      {/* Tooltip detailing validation reason */}
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-slate-900 border border-slate-700 text-slate-100 text-[11px] rounded-lg p-2.5 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 leading-relaxed font-normal normal-case text-center">
        {reason || "No grounding reasoning available"}
        <span className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-r border-b border-slate-700 rotate-45 -mt-1"></span>
      </span>
    </span>
  );
}

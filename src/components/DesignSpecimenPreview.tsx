'use client'

import { Sparkles, Check, AlertCircle, Upload, Zap, ShieldCheck, ArrowRight } from 'lucide-react'
import { DesignAuditSpecimen, VisualPrincipleItem } from '@/data/prefinalQuestions'

export function AuditSpecimenVisual({ visualKey }: { visualKey: DesignAuditSpecimen['visualKey'] }) {
  switch (visualKey) {
    case 'slop_hero':
      return (
        <div
          className="rounded-xl p-3.5 text-white relative overflow-hidden border border-fuchsia-400/50"
          style={{
            background: 'linear-gradient(135deg, #3b0764 0%, #4c1d95 45%, #0e7490 100%)',
            boxShadow: '0 0 22px rgba(168, 85, 247, 0.35)'
          }}
        >
          <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/15 border border-white/25 mb-2">
            <Sparkles className="w-2.5 h-2.5 text-amber-300" />
            <span>AI-Powered Magic Event!</span>
          </div>
          <div
            className="text-sm font-extrabold tracking-tight leading-snug"
            style={{
              backgroundImage: 'linear-gradient(90deg, #f0abfc, #67e8f9)',
              WebkitBackgroundClip: 'text',
              color: 'transparent'
            }}
          >
            Unlock Seamless Next-Gen Tech Week!
          </div>
          <p className="text-[11px] text-white/75 mt-1">Revolutionize campus synergy today!!</p>
          <div className="mt-2.5 flex items-center gap-2">
            <span className="px-3 py-1 rounded-lg text-[11px] font-semibold bg-white/20 border border-white/30">
              Proceed
            </span>
          </div>
        </div>
      )

    case 'good_clinic':
      return (
        <div className="rounded-xl p-3.5 bg-white border border-black/[0.08] space-y-2.5 text-[#1d1d1f]">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-[#1d1d1f]">Dr. Santos In · Losartan: 45 Packs</span>
            <span className="text-[#0071e3] font-medium">Draft auto-saved</span>
          </div>
          <div className="space-y-1">
            <div className="text-[11px] font-medium text-[#1d1d1f]">
              Mobile Number <span className="text-red-700 font-semibold">* Required</span>
            </div>
            <div className="px-2.5 py-1.5 rounded-lg bg-[#f5f5f7] border border-black/[0.08] text-[11px] text-[#515154]">
              0917 482 1904
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-[#0071e3] text-white text-[11px] font-semibold text-center">
            Get Morning Queue # via SMS
          </div>
        </div>
      )

    case 'slop_checkout':
      return (
        <div className="rounded-xl p-3.5 bg-neutral-950 text-white border border-cyan-400/40 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span>Shuttle Fare Summary</span>
            <span>PHP 30.00</span>
          </div>
          <div className="space-y-1">
            <div className="px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-red-500 text-[11px] text-neutral-400">
              Student ID
            </div>
            <p className="text-[10px] text-red-400">Error 422: Process Terminated.</p>
          </div>
          <p className="text-[9px] text-neutral-500">
            * PHP 15 mandatory terminal convenience fee added after Pay Now.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <span
              className="py-1.5 rounded-lg text-[11px] font-semibold text-center border border-cyan-400/60"
              style={{ boxShadow: '0 0 12px rgba(34, 211, 238, 0.35)' }}
            >
              Submit
            </span>
            <span
              className="py-1.5 rounded-lg text-[11px] font-semibold text-center border border-fuchsia-400/60"
              style={{ boxShadow: '0 0 12px rgba(232, 121, 249, 0.35)' }}
            >
              Cancel
            </span>
          </div>
        </div>
      )

    case 'good_medialab':
      return (
        <div className="rounded-xl p-3.5 bg-white border border-black/[0.08] space-y-2.5 text-[#1d1d1f]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">4 Wireless Mics Available</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-black/[0.05] text-[#515154]">
              4th Floor Lab
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="px-2 py-1.5 rounded-lg bg-[#f5f5f7] border border-black/[0.08] text-[#515154]">
              ID * Required
            </div>
            <div className="px-2 py-1.5 rounded-lg bg-[#f5f5f7] border border-black/[0.08] text-[#515154]">
              Return 3:00 PM
            </div>
          </div>
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#1d1d1f] text-white text-[11px] font-medium">
            <span>Processing reservation...</span>
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>
      )

    case 'slop_bento':
    default:
      return (
        <div className="rounded-xl p-3 bg-slate-900 text-white border border-indigo-400/30 grid grid-cols-3 gap-2">
          {['01 // FAST', '02 // SMART', '03 // MAGIC'].map((label) => (
            <div
              key={label}
              className="rounded-lg p-2 bg-white/5 border border-white/10 flex flex-col items-start space-y-1"
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #818cf8, #e879f9)' }}
              >
                <Zap className="w-3 h-3 text-white" />
              </span>
              <span className="text-[9px] tracking-widest text-indigo-300">{label}</span>
              <span className="text-[10px] font-semibold leading-tight">Supercharge Synergy!</span>
            </div>
          ))}
        </div>
      )
  }
}

export function PrincipleSpecimenVisual({ visualKey }: { visualKey: VisualPrincipleItem['visualKey'] }) {
  switch (visualKey) {
    case 'hierarchy':
      return (
        <div className="rounded-2xl p-4 bg-white border border-black/[0.08] grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          <div className="rounded-xl p-3 bg-[#f5f5f7] border border-black/[0.06] space-y-1.5 opacity-70">
            <span className="text-[10px] font-medium text-[#6e6e73]">Before (Flat)</span>
            <div className="text-xs text-[#515154]">Tech Summit 2026</div>
            <div className="text-xs text-[#515154]">Nov 28 · Hall B · 12 Slots Left</div>
            <div className="text-xs text-[#515154] underline">Reserve Seat</div>
          </div>
          <div className="rounded-xl p-3.5 bg-white border border-[#0071e3]/30 shadow-xs space-y-2">
            <span className="text-[10px] font-semibold text-[#0071e3]">After</span>
            <div className="text-base font-bold tracking-tight text-[#1d1d1f]">
              Tech Summit 2026
            </div>
            <div className="text-xs text-[#515154]">Nov 28 · Hall B · 12 Slots Left</div>
            <div className="px-3 py-1.5 rounded-lg bg-[#0071e3] text-white text-xs font-semibold text-center">
              Reserve Seat
            </div>
          </div>
        </div>
      )

    case 'accessibility':
      return (
        <div className="rounded-2xl p-4 bg-white border border-black/[0.08] grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl p-3 bg-[#f5f5f7] border border-black/[0.06] space-y-1.5">
            <span className="text-[10px] font-medium text-[#6e6e73]">Before (Color only)</span>
            <div className="text-xs text-[#1d1d1f]">School Email</div>
            <div className="px-2.5 py-1.5 rounded-lg bg-white border border-red-500 text-xs text-[#6e6e73]">
              name@school.edu.ph
            </div>
          </div>
          <div className="rounded-xl p-3 bg-white border border-[#0071e3]/30 space-y-1.5">
            <span className="text-[10px] font-semibold text-[#0071e3]">After</span>
            <div className="flex items-center justify-between text-xs font-medium text-[#1d1d1f]">
              <span>School Email</span>
              <span className="text-red-700 font-semibold">* Required</span>
            </div>
            <div className="px-2.5 py-1.5 rounded-lg bg-white border-2 border-red-600 text-xs text-[#1d1d1f] flex items-center space-x-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span>Enter a valid .edu.ph address</span>
            </div>
          </div>
        </div>
      )

    case 'whitespace':
      return (
        <div className="rounded-2xl p-4 bg-white border border-black/[0.08] grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl p-2 bg-[#f5f5f7] border border-black/[0.06] space-y-0.5">
            <span className="text-[10px] font-medium text-[#6e6e73]">Before (Cramped)</span>
            <div className="bg-white border border-black/15 px-1.5 py-0.5 text-[10px]">Name</div>
            <div className="bg-white border border-black/15 px-1.5 py-0.5 text-[10px]">Section</div>
            <div className="bg-[#1d1d1f] text-white px-1.5 py-0.5 text-[10px]">Submit</div>
          </div>
          <div className="rounded-xl p-3.5 bg-white border border-[#0071e3]/30 space-y-3">
            <span className="text-[10px] font-semibold text-[#0071e3]">After</span>
            <div className="space-y-1.5">
              <div className="bg-[#f5f5f7] border border-black/[0.08] rounded-lg px-2.5 py-1.5 text-[11px]">
                Full Name
              </div>
              <div className="bg-[#f5f5f7] border border-black/[0.08] rounded-lg px-2.5 py-1.5 text-[11px]">
                Section
              </div>
            </div>
            <div className="bg-[#0071e3] text-white rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-center">
              Submit
            </div>
          </div>
        </div>
      )

    case 'vector':
      return (
        <div className="rounded-2xl p-4 bg-white border border-black/[0.08] grid grid-cols-2 gap-3 text-center">
          <div className="rounded-xl p-3 bg-[#f5f5f7] border border-black/[0.06] flex flex-col items-center space-y-2">
            <span className="text-[10px] font-medium text-[#515154]">JPEG at 400% Zoom</span>
            <div className="grid grid-cols-5 gap-0 w-12 h-12 rounded overflow-hidden border border-black/10">
              {[
                0, 1, 1, 1, 0,
                1, 1, 0, 1, 1,
                1, 0, 0, 0, 1,
                1, 1, 0, 1, 1,
                0, 1, 1, 1, 0
              ].map((cell, i) => (
                <span key={i} className={cell ? 'bg-[#1d1d1f]' : 'bg-white'} />
              ))}
            </div>
            <span className="text-[10px] text-[#6e6e73]">Jagged pixel blocks</span>
          </div>
          <div className="rounded-xl p-3 bg-white border border-[#0071e3]/30 flex flex-col items-center space-y-2">
            <span className="text-[10px] font-semibold text-[#0071e3]">SVG at 400% Zoom</span>
            <div className="w-12 h-12 flex items-center justify-center">
              <ShieldCheck className="w-10 h-10 text-[#0071e3]" strokeWidth={2} />
            </div>
            <span className="text-[10px] text-[#515154]">Crisp math curves</span>
          </div>
        </div>
      )

    case 'feedback':
    default:
      return (
        <div className="rounded-2xl p-4 bg-white border border-black/[0.08] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="px-3 py-2 rounded-xl bg-black/[0.05] font-medium text-[#1d1d1f]">
            1. Tap Submit
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-[#6e6e73]" />
          <div className="px-3 py-2 rounded-xl bg-[#0071e3]/10 text-[#0071e3] font-medium flex items-center space-x-1.5">
            <Upload className="w-3.5 h-3.5" />
            <span>2. Uploading 64%...</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-[#6e6e73]" />
          <div className="px-3 py-2 rounded-xl bg-emerald-500/12 text-emerald-700 font-semibold flex items-center space-x-1.5">
            <Check className="w-3.5 h-3.5" />
            <span>3. Saved · Ref #402</span>
          </div>
        </div>
      )
  }
}

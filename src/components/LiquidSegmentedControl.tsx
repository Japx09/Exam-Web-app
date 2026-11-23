'use client'

import React, { useLayoutEffect, useRef } from 'react'

export interface SegmentedOption<T extends string> {
  value: T
  label: React.ReactNode
}

interface LiquidSegmentedControlProps<T extends string> {
  options: readonly SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  fullWidth?: boolean
  size?: 'xs' | 'sm' | 'md'
  className?: string
  ariaLabel?: string
}

/** Updates --mx/--my CSS custom properties on a .liquid-specular card with zero React re-renders. */
export function handleSpecularMove(e: React.PointerEvent<HTMLElement>) {
  if (e.pointerType !== 'mouse') return
  const rect = e.currentTarget.getBoundingClientRect()
  e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`)
  e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`)
}

export function LiquidSegmentedControl<T extends string>({
  options,
  value,
  onChange,
  fullWidth = false,
  size = 'sm',
  className = '',
  ariaLabel
}: LiquidSegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const pillRef = useRef<HTMLSpanElement | null>(null)
  const innerRef = useRef<HTMLSpanElement | null>(null)
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([])
  const initializedRef = useRef(false)

  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value)
  )

  useLayoutEffect(() => {
    const pill = pillRef.current
    const inner = innerRef.current
    const activeBtn = buttonRefs.current[activeIndex]
    const container = containerRef.current
    if (!pill || !activeBtn || !container) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const syncGeometry = (animate: boolean) => {
      const left = activeBtn.offsetLeft
      const width = activeBtn.offsetWidth
      pill.style.transition =
        animate && !reducedMotion
          ? 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1), width 260ms cubic-bezier(0.16, 1, 0.3, 1)'
          : 'none'
      pill.style.transform = `translate3d(${left}px, 0, 0)`
      pill.style.width = `${width}px`
      pill.style.opacity = '1'
    }

    syncGeometry(initializedRef.current)

    if (initializedRef.current && inner && !reducedMotion) {
      inner.animate(
        [
          { transform: 'scaleX(1.045) scaleY(0.96)' },
          { transform: 'scaleX(1) scaleY(1)' }
        ],
        { duration: 220, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
      )
    }

    initializedRef.current = true

    const ro = new ResizeObserver(() => syncGeometry(false))
    ro.observe(container)
    return () => ro.disconnect()
  }, [activeIndex, options.length])

  const outerRadius = size === 'md' ? 'rounded-2xl' : 'rounded-xl'
  const pillRadius = size === 'md' ? 'rounded-xl' : 'rounded-lg'
  const buttonPadding =
    size === 'md' ? 'py-2 px-3' : size === 'sm' ? 'px-3 py-1.5' : 'px-2.5 py-1'

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label={ariaLabel}
      className={`relative p-1 ${outerRadius} bg-black/[0.045] border border-black/[0.06] shadow-[inset_0_1px_2px_rgba(15,23,42,0.05)] ${
        fullWidth ? 'w-full grid' : 'inline-flex items-center'
      } ${className}`}
      style={
        fullWidth
          ? { gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }
          : undefined
      }
    >
      {/* Gliding Liquid Glass Lens */}
      <span
        ref={pillRef}
        aria-hidden="true"
        className="pointer-events-none absolute top-1 bottom-1 left-0 opacity-0"
      >
        <span
          ref={innerRef}
          className={`block w-full h-full ${pillRadius} bg-white/92 backdrop-blur-md border border-white/90 shadow-[0_3px_10px_-3px_rgba(15,23,42,0.14),inset_0_1px_0_rgba(255,255,255,1)]`}
        />
      </span>

      {options.map((opt, idx) => {
        const isActive = opt.value === value
        return (
          <button
            key={opt.value}
            ref={(el) => {
              buttonRefs.current[idx] = el
            }}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative z-10 flex items-center justify-center whitespace-nowrap ${pillRadius} ${buttonPadding} text-xs font-medium liquid-transition ${
              isActive ? 'text-[#1d1d1f] font-semibold' : 'text-[#515154] hover:text-[#1d1d1f]'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

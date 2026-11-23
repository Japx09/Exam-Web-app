'use client'

import { useEffect, useState } from 'react'

// Cumulus cloud path designed on a 1440px tile: starts and ends at y=225 for 100% seamless tiling
const BACK_CUMULUS_PATH =
  'M0 225 C35 190, 75 185, 110 205 C140 155, 210 140, 265 170 C295 110, 390 95, 455 140 C495 115, 555 120, 590 155 C635 90, 745 85, 810 140 C860 115, 925 125, 960 165 C1015 105, 1125 100, 1190 155 C1240 130, 1305 140, 1345 175 C1380 155, 1415 175, 1440 225 L1440 360 L0 360 Z'

// Taller foreground cumulus billows (1440px seamless tile starting/ending at y=250)
const FRONT_CUMULUS_PATH =
  'M0 250 C40 200, 95 195, 135 220 C175 145, 275 135, 330 185 C375 110, 495 95, 565 160 C610 135, 675 145, 710 190 C765 115, 890 110, 960 175 C1005 145, 1070 150, 1105 195 C1165 120, 1295 125, 1365 190 C1395 175, 1420 200, 1440 250 L1440 360 L0 360 Z'

export function SkyCloudBackdrop() {
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  const playStyle = { animationPlayState: paused ? ('paused' as const) : ('running' as const) }

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #CFE2FA 0%, #D7E8FC 58%, #E4F0FE 100%)'
      }}
    >
      {/* Top-right dithered sky accent matching course.marwieang.com */}
      <svg
        className="absolute top-0 right-0 w-[480px] h-[280px] opacity-75"
        viewBox="0 0 480 280"
        fill="none"
      >
        <defs>
          <pattern id="sky-dither-top" width="6" height="6" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="2" height="2" fill="#7FB3EC" />
            <rect x="3" y="3" width="2" height="2" fill="#9BC3F2" />
          </pattern>
          <radialGradient id="sky-dither-fade" cx="86%" cy="14%" r="82%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="55%" stopColor="white" stopOpacity="0.55" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="sky-dither-mask">
            <rect width="480" height="280" fill="url(#sky-dither-fade)" />
          </mask>
        </defs>
        <rect width="480" height="280" fill="url(#sky-dither-top)" mask="url(#sky-dither-mask)" />
      </svg>

      {/* Back Cumulus Layer: slower leftward drift with crisp halftone dithered silhouettes */}
      <div
        className="absolute bottom-0 left-0 w-[200%] h-[46vh] min-h-[290px] flex animate-cloud-slow"
        style={playStyle}
      >
        {[0, 1].map((tile) => (
          <svg
            key={tile}
            className="w-1/2 h-full shrink-0"
            viewBox="0 0 1440 360"
            preserveAspectRatio="none"
            fill="none"
          >
            <defs>
              <pattern
                id={`bayer-back-${tile}`}
                width="6"
                height="6"
                patternUnits="userSpaceOnUse"
              >
                <rect x="0" y="0" width="2.2" height="2.2" fill="#77AEEB" />
                <rect x="3" y="3" width="2.2" height="2.2" fill="#9CC6F4" />
              </pattern>
              <linearGradient id={`back-rim-grad-${tile}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="white" stopOpacity="0.95" />
                <stop offset="45%" stopColor="white" stopOpacity="0.55" />
                <stop offset="100%" stopColor="white" stopOpacity="0.08" />
              </linearGradient>
              <mask id={`back-rim-mask-${tile}`}>
                <rect width="1440" height="360" fill={`url(#back-rim-grad-${tile})`} />
              </mask>
            </defs>
            {/* Pure white cloud core */}
            <path d={BACK_CUMULUS_PATH} fill="#F8FBFF" />
            {/* Halftone stipple along upper/outer cloud ridges */}
            <path
              d={BACK_CUMULUS_PATH}
              fill={`url(#bayer-back-${tile})`}
              mask={`url(#back-rim-mask-${tile})`}
            />
          </svg>
        ))}
      </div>

      {/* Front Cumulus Layer: crisp white billows with halftone edge shading */}
      <div
        className="absolute bottom-0 left-0 w-[200%] h-[36vh] min-h-[230px] flex animate-cloud-fast"
        style={playStyle}
      >
        {[0, 1].map((tile) => (
          <svg
            key={tile}
            className="w-1/2 h-full shrink-0"
            viewBox="0 0 1440 360"
            preserveAspectRatio="none"
            fill="none"
          >
            <defs>
              <pattern
                id={`bayer-front-${tile}`}
                width="5"
                height="5"
                patternUnits="userSpaceOnUse"
              >
                <rect x="0" y="0" width="2" height="2" fill="#6AA5E8" />
                <rect x="2.5" y="2.5" width="1.8" height="1.8" fill="#9BC6F5" />
              </pattern>
              <linearGradient id={`front-dither-grad-${tile}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="white" stopOpacity="0.88" />
                <stop offset="32%" stopColor="white" stopOpacity="0.28" />
                <stop offset="70%" stopColor="white" stopOpacity="0.05" />
                <stop offset="100%" stopColor="white" stopOpacity="0.45" />
              </linearGradient>
              <mask id={`front-dither-mask-${tile}`}>
                <rect width="1440" height="360" fill={`url(#front-dither-grad-${tile})`} />
              </mask>
            </defs>
            <path d={FRONT_CUMULUS_PATH} fill="#FFFFFF" />
            <path
              d={FRONT_CUMULUS_PATH}
              fill={`url(#bayer-front-${tile})`}
              mask={`url(#front-dither-mask-${tile})`}
            />
          </svg>
        ))}
      </div>
    </div>
  )
}

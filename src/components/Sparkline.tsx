import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface SparklineProps {
  data: (number | null)[]
  /** Checkpoint name per data point, used for the hover readout. */
  labels?: string[]
  /** Heading for the hover readout, e.g. the book name. */
  title?: string
  width?: number
  height?: number
  className?: string
  /** 'up' = drifted, price out (green); 'down' = firmed, price in (red); null = flat */
  direction?: 'up' | 'down' | null
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/**
 * Tiny inline-SVG price-fluctuation sparkline. Plots the series left→right
 * (open → current), auto-scaled to its own min/max. No dependencies.
 *
 * The opening price is drawn as a dashed baseline and the area between it and
 * the line is filled, so the shape reads as "out from" or "in from" the open
 * at a glance rather than as an unanchored squiggle.
 *
 * Hovering reveals the whole series. The readout is portalled to the body
 * because the odds card clips its overflow, which would cut off a tooltip
 * positioned inside it.
 */
export default function Sparkline({
  data,
  labels,
  title,
  width = 62,
  height = 22,
  className = '',
  direction = null,
}: SparklineProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(null)

  // Keep each price paired with its checkpoint — the plot drops empty buckets,
  // so position in the plotted series is not position in `data`.
  const points = data
    .map((v, i) => ({ v, label: labels?.[i] ?? '' }))
    .filter((p): p is { v: number; label: string } => p.v != null && Number.isFinite(p.v) && p.v > 0)

  const stroke =
    direction === 'up' ? 'text-emerald-400' : direction === 'down' ? 'text-red-400' : 'text-gray-500'

  const readout =
    hover && points.length > 0
      ? createPortal(
          <div
            className="fixed z-50 pointer-events-none rounded-lg border border-gray-700 bg-gray-950/95 px-2.5 py-2 shadow-xl backdrop-blur-sm"
            style={{
              left: clamp(hover.x + 14, 8, window.innerWidth - 148),
              top: clamp(hover.y + 14, 8, window.innerHeight - (points.length * 18 + 46)),
            }}
          >
            {title && (
              <div className="mb-1 pb-1 border-b border-gray-800 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {title}
              </div>
            )}
            <table className="text-[11px] tabular-nums">
              <tbody>
                {points.map((p, i) => (
                  <tr key={i} className={i === hover.i ? 'text-white' : 'text-gray-400'}>
                    <td className="pr-3 uppercase tracking-wide">{p.label}</td>
                    <td className="text-right font-medium">{p.v.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
          document.body,
        )
      : null

  if (points.length < 2) {
    // Flat baseline so the cell keeps its height even with no move.
    return (
      <svg width={width} height={height} className={className} aria-hidden>
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="currentColor"
          strokeWidth={1}
          strokeDasharray="2 2"
          className="text-gray-700"
        />
      </svg>
    )
  }

  const values = points.map((p) => p.v)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pad = 2.5
  const w = width - pad * 2
  const h = height - pad * 2

  // Higher price → higher on chart (invert y). Firming visually descends.
  const yFor = (v: number) => pad + (1 - (v - min) / span) * h
  const coords = values.map((v, i) => [pad + (i / (values.length - 1)) * w, yFor(v)] as const)

  const line = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const openY = yFor(values[0])
  // Close the path along the opening price to shade the move away from it.
  const area = `${line} L${coords[coords.length - 1][0].toFixed(1)} ${openY.toFixed(1)} L${pad} ${openY.toFixed(1)} Z`
  const [lastX, lastY] = coords[coords.length - 1]

  const track = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const rel = (e.clientX - rect.left - pad) / (w || 1)
    setHover({ i: clamp(Math.round(rel * (values.length - 1)), 0, values.length - 1), x: e.clientX, y: e.clientY })
  }

  const marker = hover ? coords[hover.i] : null

  return (
    <>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className={`${stroke} ${className} cursor-crosshair`}
        onMouseEnter={track}
        onMouseMove={track}
        onMouseLeave={() => setHover(null)}
      >
        <path d={area} fill="currentColor" fillOpacity={0.16} stroke="none" />
        <line
          x1={pad}
          y1={openY}
          x2={width - pad}
          y2={openY}
          stroke="currentColor"
          strokeWidth={0.75}
          strokeDasharray="2 2"
          opacity={0.45}
        />
        <path
          d={line}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle cx={lastX} cy={lastY} r={2.2} fill="currentColor" />
        {marker && (
          <>
            <line
              x1={marker[0]}
              y1={0}
              x2={marker[0]}
              y2={height}
              stroke="currentColor"
              strokeWidth={0.75}
              opacity={0.5}
            />
            <circle cx={marker[0]} cy={marker[1]} r={2.6} fill="white" />
          </>
        )}
      </svg>
      {readout}
    </>
  )
}

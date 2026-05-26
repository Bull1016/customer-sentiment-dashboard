import React, { useState, useRef, useEffect } from "react";
import { TrendPoint } from "../types";
import { TrendingUp, RefreshCcw, Landmark, Info } from "lucide-react";
import { motion } from "motion/react";

interface SentimentTrendChartProps {
  trendData: TrendPoint[];
}

export default function SentimentTrendChart({ trendData }: SentimentTrendChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 260 });
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Measure container for real fluidity response
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: width || 500,
          height: 240 // Lock visual height elegantly
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  if (!trendData || trendData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
        No trend lines found.
      </div>
    );
  }

  const padding = { top: 30, right: 30, bottom: 40, left: 45 };
  const chartWidth = dimensions.width - padding.left - padding.right;
  const chartHeight = dimensions.height - padding.top - padding.bottom;

  // Get data extremes
  const scores = trendData.map((p) => p.sentimentScore);
  const maxScore = 100;
  const minScore = 0;
  
  // X scale mapping (index based spacing)
  const getX = (index: number) => {
    if (trendData.length <= 1) return padding.left + chartWidth / 2;
    return padding.left + (index / (trendData.length - 1)) * chartWidth;
  };

  // Y scale mapping (0 to 100)
  const getY = (score: number) => {
    const ratio = score / 100; // score range is 0 to 100%
    return padding.top + chartHeight - ratio * chartHeight;
  };

  // Construct SVG Path points
  const points = trendData.map((point, index) => ({
    x: getX(index),
    y: getY(point.sentimentScore),
    point
  }));

  // Build the line path command (d attribute)
  let linePath = "";
  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y} ` + 
      points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ");
  }

  // Build area path command (for bottom gradient fill)
  let areaPath = "";
  if (points.length > 0) {
    areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;
  }

  // Draw helpful horizontal baseline markers
  const baseLines = [
    { value: 100, label: "Ideal (100%)", stroke: "stroke-slate-200/45", textFill: "fill-emerald-600 font-bold" },
    { value: 75, label: "High Positive", stroke: "stroke-slate-200/50", textFill: "fill-emerald-500" },
    { value: 50, label: "Neutral Threshold", stroke: "stroke-slate-200/80 stroke-dashed", textFill: "fill-slate-400" },
    { value: 25, label: "Needs Help", stroke: "stroke-slate-200/50", textFill: "fill-rose-500" },
  ];

  return (
    <div className="rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Sentiment Trend Chronology</h3>
          <p className="text-xs text-slate-500">
            Evolution of the customer sentiment index (0-100%) over chronological timeline stages.
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
          <TrendingUp className="h-4 w-4" />
          <span>Timeline Plot</span>
        </div>
      </div>

      {/* Responsive Canvas Frame */}
      <div ref={containerRef} className="relative w-full overflow-hidden select-none">
        <svg width={dimensions.width} height={dimensions.height} className="overflow-visible">
          <defs>
            {/* Glow shader */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feComposite in="SourceGraphic" in2="glow" operator="over" />
            </filter>
            
            {/* Area gradient under curve */}
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.00" />
            </linearGradient>

            {/* Glowing line gradient */}
            <linearGradient id="lineColor" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="50%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>

          {/* 1. Horizontal Baselines and Label Texts */}
          {baseLines.map((line, index) => {
            const hY = getY(line.value);
            return (
              <g key={index} className="opacity-90">
                <line
                  x1={padding.left}
                  y1={hY}
                  x2={dimensions.width - padding.right}
                  y2={hY}
                  className={line.stroke}
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 8}
                  y={hY + 3.5}
                  textAnchor="end"
                  className={`font-mono text-[9px] ${line.textFill}`}
                >
                  {line.value}%
                </text>
                <text
                  x={dimensions.width - padding.right}
                  y={hY - 4}
                  textAnchor="end"
                  className="fill-slate-300 text-[8px] tracking-wide uppercase font-semibold"
                >
                  {line.label}
                </text>
              </g>
            );
          })}

          {/* 2. Shaded area gradient */}
          {areaPath && (
            <motion.path
              d={areaPath}
              fill="url(#chartGradient)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            />
          )}

          {/* 3. Outer line stroke path */}
          {linePath && (
            <motion.path
              d={linePath}
              fill="none"
              stroke="url(#lineColor)"
              strokeWidth="2.5"
              strokeLinecap="round"
              filter="url(#glow)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          )}

          {/* 4. Vertical tracker hover line */}
          {hoveredPointIndex !== null && (
            <line
              x1={points[hoveredPointIndex].x}
              y1={padding.top}
              x2={points[hoveredPointIndex].x}
              y2={padding.top + chartHeight}
              className="stroke-indigo-400 stroke-dashed"
              strokeWidth="1"
            />
          )}

          {/* 5. Glowing Interactive Circles for coordinates */}
          {points.map((pt, index) => {
            const isHovered = hoveredPointIndex === index;
            const isPositive = pt.point.sentimentScore >= 60;
            const dotColor = isPositive ? "fill-emerald-500" : "fill-rose-500";
            
            return (
              <g key={index}>
                {/* Larger transparent hover capture circle helper */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="20"
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPointIndex(index)}
                  onMouseLeave={() => setHoveredPointIndex(null)}
                />

                {/* Outer animated halo node */}
                {isHovered && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="8"
                    className="fill-indigo-400/30 animate-ping pointer-events-none"
                  />
                )}

                {/* Static visual circle node */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 4.5}
                  className={`stroke-white ${isHovered ? "fill-indigo-600 shadow-sm" : "fill-indigo-500"} transition-all duration-150 pointer-events-none`}
                  strokeWidth="1.5"
                />
              </g>
            );
          })}

          {/* 6. X Axis Chronological Labels */}
          {points.map((pt, index) => {
            // Drop alternate x-axis text label on tight mobile views to eliminate overlap
            const isAlt = index % 2 === 1;
            const mobileDropClass = isAlt ? "hidden md:block" : "";

            return (
              <text
                key={index}
                x={pt.x}
                y={padding.top + chartHeight + 16}
                textAnchor="middle"
                className={`fill-slate-400 font-medium text-[9px] tracking-tight ${mobileDropClass}`}
              >
                {pt.point.date}
              </text>
            );
          })}
        </svg>

        {/* 7. Floating details tooltip overlay */}
        {hoveredPointIndex !== null && (
          <div
            style={{
              left: `${points[hoveredPointIndex].x + 12}px`,
              top: `${points[hoveredPointIndex].y - 30}px`,
              transform: "translateY(-50%)"
            }}
            className="pointer-events-none absolute z-30 w-44 rounded-xl border border-slate-100 bg-slate-900/95 p-3 text-[10px] text-white shadow-xl backdrop-blur-xs transition-all duration-75"
          >
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5 font-bold text-slate-200">
              <span>{trendData[hoveredPointIndex].date}</span>
              <span className="font-mono bg-white/10 px-1.5 py-0.2 rounded text-[8px] text-slate-100 uppercase">
                Stage {hoveredPointIndex + 1}
              </span>
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Avg Sentiment:</span>
                <span className={`font-bold ${trendData[hoveredPointIndex].sentimentScore >= 60 ? "text-emerald-400" : "text-rose-400"}`}>
                  {trendData[hoveredPointIndex].sentimentScore}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Feedback Volume:</span>
                <span className="font-bold text-white">
                  {trendData[hoveredPointIndex].volume} parsed
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-slate-50 p-3 border border-slate-100/50">
        <Info className="h-4 w-4 text-indigo-500 shrink-0" />
        <span className="text-[11px] leading-relaxed text-slate-500">
          <strong>Trend Reading:</strong> Points above <span className="text-emerald-600 font-semibold">50%</span> demonstrate generally positive feedback cycles. Steady or declining slopes guide you directly to systemic operation hiccups described in the actionable cards below.
        </span>
      </div>
    </div>
  );
}

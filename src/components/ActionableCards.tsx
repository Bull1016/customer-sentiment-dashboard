import { ActionableArea } from "../types";
import { AlertTriangle, Lightbulb, CheckSquare, ShieldCheck, HelpCircle } from "lucide-react";
import { motion } from "motion/react";

interface ActionableCardsProps {
  areas: ActionableArea[];
}

export default function ActionableCards({ areas }: ActionableCardsProps) {
  if (!areas || areas.length === 0) {
    return null;
  }

  // Helper to color code severity
  const getSeverityBadge = (severity: string) => {
    const s = severity.toLowerCase();
    if (s === "high") {
      return {
        bg: "bg-rose-50 text-rose-700 border-rose-200",
        indicator: "bg-rose-500",
        label: "Critical Priority",
        border: "border-rose-100",
        glow: "shadow-xs group-hover:shadow-rose-100/50"
      };
    }
    if (s === "medium") {
      return {
        bg: "bg-amber-50 text-amber-700 border-amber-200",
        indicator: "bg-amber-500",
        label: "Important Priority",
        border: "border-amber-100",
        glow: "shadow-xs group-hover:shadow-amber-100/50"
      };
    }
    return {
      bg: "bg-blue-50 text-blue-700 border-blue-200",
      indicator: "bg-blue-500",
      label: "Growth Area",
      border: "border-blue-100",
      glow: "shadow-xs group-hover:shadow-blue-100/50"
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CheckSquare className="h-5 w-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-slate-900">Top 3 Actionable Business Directives</h3>
      </div>
      <p className="text-xs text-slate-500">
        AI-extracted operational bottlenecks mapped directly into concrete improvement action points.
      </p>

      <div className="grid gap-6 md:grid-cols-3">
        {areas.slice(0, 3).map((area, index) => {
          const badge = getSeverityBadge(area.severity);
          return (
            <motion.div
              key={index}
              id={`actionable-card-${index}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="group flex flex-col justify-between rounded-3xl border-2 border-slate-200 bg-white p-5 transition-all duration-300 hover:border-slate-900 hover:shadow-md"
            >
              {/* Header */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase ${badge.bg}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${badge.indicator}`} />
                    {badge.label}
                  </span>
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs font-mono">
                    {index + 1}
                  </div>
                </div>

                <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {area.title}
                </h4>

                <p className="mt-3 text-xs leading-relaxed text-slate-600">
                  {area.description}
                </p>
              </div>

              {/* Proposed recommendation drawer */}
              <div className="mt-5 rounded-xl bg-slate-50 p-4 border border-slate-100/60">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span>AI Recommendation</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-600">
                  {area.recommendation}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

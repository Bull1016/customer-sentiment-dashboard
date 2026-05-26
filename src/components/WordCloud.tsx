import React, { useState } from "react";
import { WordCloudItem } from "../types";
import { ThumbsUp, ThumbsDown, FilterX } from "lucide-react";
import { motion } from "motion/react";

interface WordCloudProps {
  items: WordCloudItem[];
  selectedWord: string | null;
  onSelectWord: (word: string | null) => void;
}

export default function WordCloud({ items, selectedWord, onSelectWord }: WordCloudProps) {
  const [filterType, setFilterType] = useState<"all" | "praise" | "complaint">("all");

  if (!items || items.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
        No tags analyzed.
      </div>
    );
  }

  // Filter items by type
  const filteredItems = items.filter((item) => {
    if (filterType === "all") return true;
    return item.type === filterType;
  });

  // Calculate scaling factors
  const counts = items.map((i) => i.count);
  const maxCount = Math.max(...counts, 1);
  const minCount = Math.min(...counts, 0);
  const countRange = Math.max(maxCount - minCount, 1);

  // Helper to determine tailwind text scale
  const getScaleStyle = (count: number) => {
    const ratio = (count - minCount) / countRange;
    if (ratio > 0.8) return { fontClass: "text-lg md:text-xl font-bold py-2 py-2.5 px-4 md:px-5", scale: 1.1 };
    if (ratio > 0.5) return { fontClass: "text-base md:text-lg font-semibold py-1.5 md:py-2 px-3 md:px-4", scale: 1.05 };
    if (ratio > 0.25) return { fontClass: "text-sm md:text-base font-medium py-1 px-2.5 md:px-3.5", scale: 1.0 };
    return { fontClass: "text-xs md:text-sm font-normal py-0.5 md:py-1 px-2 md:px-2.5", scale: 0.95 };
  };

  return (
    <div className="rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-sm flex flex-col">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Keyword Themes Cloud</h3>
          <p className="text-xs text-slate-500">
            Sized by impact frequency. Click a phrase to filter related patient/customer reviews.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 self-start rounded-xl bg-slate-100 p-1 text-xs">
          <button
            onClick={() => setFilterType("all")}
            className={`cursor-pointer rounded-lg px-3 py-1.5 font-medium transition-all ${
              filterType === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            All Themes ({items.length})
          </button>
          <button
            onClick={() => setFilterType("praise")}
            className={`cursor-pointer flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-medium transition-all ${
              filterType === "praise" ? "bg-emerald-500 text-white shadow-sm" : "text-emerald-600 hover:bg-emerald-50"
            }`}
          >
            <ThumbsUp className="h-3 w-3" /> Praises
          </button>
          <button
            onClick={() => setFilterType("complaint")}
            className={`cursor-pointer flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-medium transition-all ${
              filterType === "complaint" ? "bg-rose-500 text-white shadow-sm" : "text-rose-600 hover:bg-rose-50"
            }`}
          >
            <ThumbsDown className="h-3 w-3" /> Complaints
          </button>
        </div>
      </div>

      {selectedWord && (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-indigo-50 px-4 py-2.5 text-xs text-indigo-700">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Selected Filter:</span>
            <span className="rounded-md bg-indigo-100 px-2 py-0.5 font-mono text-indigo-800">"{selectedWord}"</span>
          </div>
          <button
            onClick={() => onSelectWord(null)}
            className="cursor-pointer flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-900"
          >
            <FilterX className="h-3.5 w-3.5" /> Clear Filter
          </button>
        </div>
      )}

      {/* Cloud Canvas Layout */}
      <div className="relative flex min-h-[220px] flex-wrap items-center justify-center gap-3 rounded-xl border border-slate-50 bg-slate-50/50 p-6">
        <div className="absolute top-3 right-3 flex gap-4 text-[10px] font-medium text-slate-400">
          <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3 text-emerald-500" /> Praise</span>
          <span className="flex items-center gap-1"><ThumbsDown className="h-3 w-3 text-rose-500" /> Complaint</span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-sm text-slate-400">No themes match this category segment.</div>
        ) : (
          filteredItems.map((item, index) => {
            const isSelected = selectedWord === item.text;
            const styleInfo = getScaleStyle(item.count);
            const isPraise = item.type === "praise";

            return (
              <motion.button
                key={item.text}
                type="button"
                id={`word-cloud-tag-${index}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: styleInfo.scale + 0.05 }}
                transition={{ duration: 0.2 }}
                onClick={() => onSelectWord(isSelected ? null : item.text)}
                style={{
                  textShadow: isSelected ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
                }}
                className={`group relative cursor-pointer rounded-full border text-left transition-all duration-200 outline-hidden ${styleInfo.fontClass} ${
                  isSelected
                    ? isPraise
                      ? "bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-300 shadow-md"
                      : "bg-rose-600 text-white border-rose-700 ring-2 ring-rose-300 shadow-md"
                    : isPraise
                    ? "bg-emerald-50/80 text-emerald-800 border-emerald-100 hover:bg-emerald-100/90 hover:border-emerald-200 hover:shadow-xs"
                    : "bg-rose-50/80 text-rose-800 border-rose-100 hover:bg-rose-100/90 hover:border-rose-200 hover:shadow-xs"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>{item.text}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 font-mono text-[9px] font-bold ${
                      isSelected
                        ? "bg-white/30 text-white"
                        : isPraise
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {item.count}
                  </span>
                </div>

                {/* Popover statistics tooltip on hover */}
                <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max -translate-x-1/2 scale-0 rounded-lg bg-slate-900 px-3 py-1.5 text-[10px] leading-relaxed text-white shadow-lg transition-transform duration-100 group-hover:scale-100">
                  <span className="block font-bold">"{item.text}"</span>
                  <span className="block text-slate-300">
                    Mentions: <span className="font-semibold text-white">{item.count}</span>
                  </span>
                  <span className="block text-slate-300">
                    Avg Sentiment:{" "}
                    <span className={`font-semibold ${item.sentimentScore >= 60 ? "text-emerald-300" : "text-rose-300"}`}>
                      {item.sentimentScore}%
                    </span>
                  </span>
                </span>
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}

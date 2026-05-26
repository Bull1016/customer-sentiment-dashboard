import React, { useState } from "react";
import { ParsedReview } from "../types";
import { Search, ThumbsUp, ThumbsDown, AlertCircle, Calendar, ArrowUpDown } from "lucide-react";

interface ReviewListProps {
  reviews: ParsedReview[];
  selectedWord: string | null;
  onClearWordFilter: () => void;
}

export default function ReviewList({ reviews, selectedWord, onClearWordFilter }: ReviewListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState<"all" | "positive" | "negative" | "neutral">("all");
  const [sortBy, setSortBy] = useState<"high-score" | "low-score" | "default">("default");

  const handleClearAll = () => {
    setSearchTerm("");
    setSentimentFilter("all");
    setSortBy("default");
    onClearWordFilter();
  };

  // 1. Filter by term, keyword, and sentiment label
  const filteredReviews = reviews.filter((review) => {
    const textMatches = review.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        review.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const sentimentMatches = sentimentFilter === "all" || review.sentiment === sentimentFilter;
    const wordMatches = !selectedWord || review.text.toLowerCase().includes(selectedWord.toLowerCase());

    return textMatches && sentimentMatches && wordMatches;
  });

  // 2. Sort results
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    if (sortBy === "high-score") return b.score - a.score;
    if (sortBy === "low-score") return a.score - b.score;
    return 0; // Natural chronological order
  });

  // Helper styles for sentiment tag
  const getSentimentTag = (sentiment: string) => {
    const s = sentiment.toLowerCase();
    if (s === "positive") {
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    }
    if (s === "negative") {
      return "bg-rose-50 text-rose-700 border-rose-100";
    }
    return "bg-slate-50 text-slate-600 border-slate-100";
  };

  return (
    <div className="rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Patient/Customer Review Log</h3>
          <p className="text-xs text-slate-500">
            Browse, search and segment analyzed texts to verify exact phrasing and scores.
          </p>
        </div>

        {/* Clear filters banner helper */}
        {(searchTerm || sentimentFilter !== "all" || selectedWord || sortBy !== "default") && (
          <button
            onClick={handleClearAll}
            className="cursor-pointer text-xs font-bold text-indigo-600 hover:text-indigo-900 hover:underline self-start md:self-auto"
          >
            Reset All Filters & Search
          </button>
        )}
      </div>

      {/* Grid Controls Panel */}
      <div className="mb-6 grid gap-4 sm:grid-cols-12">
        {/* Search Input */}
        <div className="relative sm:col-span-4">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search keywords or summaries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-4 pl-9 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden"
          />
        </div>

        {/* Sentiment Segment */}
        <div className="flex gap-1 flex-wrap sm:col-span-5">
          <button
            onClick={() => setSentimentFilter("all")}
            className={`cursor-pointer rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
              sentimentFilter === "all"
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            All ({reviews.length})
          </button>
          <button
            onClick={() => setSentimentFilter("positive")}
            className={`cursor-pointer rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
              sentimentFilter === "positive"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                : "bg-white text-emerald-600 border-slate-200 hover:bg-emerald-50"
            }`}
          >
            Positive ({reviews.filter((r) => r.sentiment === "positive").length})
          </button>
          <button
            onClick={() => setSentimentFilter("negative")}
            className={`cursor-pointer rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
              sentimentFilter === "negative"
                ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                : "bg-white text-rose-600 border-slate-200 hover:bg-rose-50"
            }`}
          >
            Negative ({reviews.filter((r) => r.sentiment === "negative").length})
          </button>
          <button
            onClick={() => setSentimentFilter("neutral")}
            className={`cursor-pointer rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
              sentimentFilter === "neutral"
                ? "bg-slate-500 text-white border-slate-505 shadow-xs"
                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
            }`}
          >
            Neutral ({reviews.filter((r) => r.sentiment === "neutral").length})
          </button>
        </div>

        {/* Sorting controls */}
        <div className="relative sm:col-span-3">
          <div className="pointer-events-none absolute top-1/2 left-3 flex -translate-y-1/2 items-center text-slate-400">
            <ArrowUpDown className="h-3.5 w-3.5" />
          </div>
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white py-2.5 pr-4 pl-9 text-xs text-slate-700 focus:border-indigo-500 focus:outline-hidden"
          >
            <option value="default">Default Order</option>
            <option value="high-score">Sentiment: High to Low</option>
            <option value="low-score">Sentiment: Low to High</option>
          </select>
        </div>
      </div>

      {/* Selected word filter pill helper */}
      {selectedWord && (
        <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs text-indigo-700">
          <span>Filtering reviews containing word:</span>
          <span className="font-bold">"{selectedWord}"</span>
          <button
            onClick={onClearWordFilter}
            className="cursor-pointer ml-1 font-bold text-indigo-600 hover:text-indigo-900 underline"
          >
            Clear
          </button>
        </div>
      )}

      {/* Reviews Table / Lists */}
      <div className="space-y-4">
        {sortedReviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-12 text-center">
            <AlertCircle className="mb-2 h-8 w-8 text-slate-300" />
            <h4 className="text-sm font-semibold text-slate-900">No matching reviews found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Try readjusting your keyword filters, search keywords, or selecting another category of reviews.
            </p>
          </div>
        ) : (
          <div className="max-h-[500px] overflow-y-auto pr-1 space-y-3.5">
            {sortedReviews.map((review, i) => {
              const sentimentStyle = getSentimentTag(review.sentiment);
              return (
                <div
                  key={i}
                  className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all duration-200 hover:border-slate-200 hover:bg-slate-50"
                >
                  <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    {/* Sentiment Label & Score Badge */}
                    <div className="flex items-center gap-2.5">
                      <span className={`inline-flex items-center border rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${sentimentStyle}`}>
                        {review.sentiment}
                      </span>
                      <span className="font-mono text-xs font-semibold text-slate-500">
                        Score: <span className="text-slate-900 font-bold">{review.score}%</span>
                      </span>
                    </div>

                    {/* Date stamp */}
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                      <Calendar className="h-3 w-3" />
                      <span>{review.date}</span>
                    </div>
                  </div>

                  {/* Original feedback excerpt */}
                  <div className="text-xs leading-relaxed text-slate-800 font-sans italic">
                    "{review.text}"
                  </div>

                  {/* Summary line */}
                  {review.summary && (
                    <div className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-white p-2.5 border border-slate-100">
                      <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 font-mono text-[9px] font-extrabold text-indigo-600 uppercase">
                        AI Core
                      </span>
                      <p className="text-xs font-medium text-slate-600">
                        {review.summary}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

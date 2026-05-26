import React, { useState, useMemo } from "react";
import { DashboardReport, PresetDataset } from "./types";
import { PRESET_DATASETS } from "./data";
import WordCloud from "./components/WordCloud";
import ActionableCards from "./components/ActionableCards";
import ReviewList from "./components/ReviewList";
import SentimentTrendChart from "./components/SentimentTrendChart";
import { 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  ArrowRight,
  TrendingUp, 
  ThumbsUp, 
  ThumbsDown, 
  AlertCircle,
  BarChart3,
  RefreshCcw,
  Smile,
  Frown,
  Meh,
  Cpu,
  Coins
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type AIProvider = "gemini" | "openrouter";

interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  isFree: boolean;
}

const AI_MODELS: AIModel[] = [
  { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash", provider: "gemini", isFree: true },
  { id: "google/gemini-2.0-flash-001", name: "Gemini 2.0 Flash (OpenRouter)", provider: "openrouter", isFree: true },
  { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B (Free)", provider: "openrouter", isFree: true },
  { id: "mistralai/mistral-7b-instruct:free", name: "Mistral 7B (Free)", provider: "openrouter", isFree: true },
  { id: "openai/gpt-4o", name: "GPT-4o (Paid)", provider: "openrouter", isFree: false },
  { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet (Paid)", provider: "openrouter", isFree: false },
  { id: "deepseek/deepseek-chat", name: "DeepSeek V3 (Paid)", provider: "openrouter", isFree: false },
];

export default function App() {
  const [reviewsText, setReviewsText] = useState("");
  const [activePreset, setActivePreset] = useState<PresetDataset | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<DashboardReport | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [isInputCollapsed, setIsInputCollapsed] = useState(false);

  // AI Selection State
  const [isFreeOnly, setIsFreeOnly] = useState(true);
  const [selectedModelId, setSelectedModelId] = useState(AI_MODELS[0].id);

  const filteredModels = useMemo(() => {
    return isFreeOnly ? AI_MODELS.filter(m => m.isFree) : AI_MODELS;
  }, [isFreeOnly]);

  const selectedModel = useMemo(() => {
    return AI_MODELS.find(m => m.id === selectedModelId) || AI_MODELS[0];
  }, [selectedModelId]);

  // Load a preset dataset into textarea
  const selectPreset = (preset: PresetDataset) => {
    setActivePreset(preset);
    setReviewsText(preset.sampleText);
    setError(null);
  };

  // Perform AI analysis on server-side
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewsText.trim()) return;

    setIsLoading(true);
    setError(null);
    setSelectedWord(null);

    try {
      const response = await fetch("/api/analyze-sentiment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reviewsText,
          provider: selectedModel.provider,
          model: selectedModel.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || "Failed to analyze customer reviews. Please check API Key configurations.");
      }

      const data: DashboardReport = await response.json();
      setReport(data);
      setIsInputCollapsed(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while contacting the sentiment analysis service.");
    } finally {
      setIsLoading(false);
    }
  };

  // Simple, ultra-polished custom inline markdown renderer
  const renderMarkdown = (text: string) => {
    if (!text) return null;
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      
      if (trimmed.startsWith("###")) {
        return (
          <h4 key={idx} className="font-display mt-4 mb-2 text-sm font-bold text-slate-900">
            {trimmed.replace(/^###\s*/, "")}
          </h4>
        );
      }
      if (trimmed.startsWith("##")) {
        return (
          <h3 key={idx} className="font-display mt-5 mb-2 text-base font-extrabold text-indigo-950">
            {trimmed.replace(/^##\s*/, "")}
          </h3>
        );
      }
      if (trimmed.startsWith("*") || trimmed.startsWith("-")) {
        return (
          <li key={idx} className="ml-5 list-disc text-xs text-slate-600 mb-1.5 leading-relaxed">
            {trimmed.replace(/^[\*\-]\s*/, "")}
          </li>
        );
      }
      if (trimmed.length === 0) {
        return <div key={idx} className="h-2" />;
      }

      // Support basic bold parsing **text**
      const parts = trimmed.split(/\*\*([^*]+)\*\*/g);
      if (parts.length > 1) {
        return (
          <p key={idx} className="text-xs text-slate-600 leading-relaxed mb-2">
            {parts.map((part, i) => (
              i % 2 === 1 ? <strong key={i} className="font-bold text-slate-900">{part}</strong> : part
            ))}
          </p>
        );
      }

      return (
        <p key={idx} className="text-xs text-slate-600 leading-relaxed mb-1.5">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased pb-12">
      {/* Top Professional Bento Header */}
      <header className="mx-auto max-w-7xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4 pt-8 pb-4 sm:px-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5 flex-wrap">
            Sentiment Pulse <span className="text-indigo-600 font-bold bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-xl text-xs uppercase tracking-wider">v2.5</span>
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">
            Multi-Model Customer Review Analysis (Hybrid AI Engine)
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-4 py-2 bg-white border-2 border-slate-200 rounded-xl flex items-center gap-2 shadow-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Live Analysis</span>
          </div>
          {report && (
            <button
              onClick={() => {
                setIsInputCollapsed(!isInputCollapsed);
              }}
              className="cursor-pointer flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-850 transition-colors shadow-xs"
            >
              <span>{isInputCollapsed ? "Show Feed Inputs" : "Collapse Inputs"}</span>
              {isInputCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-8">
        {/* Collapsible Input Form & Presets */}
        <AnimatePresence initial={false}>
          {!isInputCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="grid gap-6 md:grid-cols-12 rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-sm">
                
                {/* Left: Preset Selector */}
                <div className="md:col-span-5 flex flex-col justify-between border-b border-slate-100 pb-5 md:border-b-0 md:border-r md:pb-0 md:pr-6">
                  <div>
                    <h2 className="font-display text-sm font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="h-4.5 w-4.5 text-indigo-500" />
                      Step 1: Feed Review Texts
                    </h2>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                      Paste a bulk paragraph of raw feedback reviews or choose one of our highly detailed pre-configured industry presets.
                    </p>

                    <div className="mt-5 space-y-3">
                      <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        Interactive Datasets Presets
                      </span>
                      {PRESET_DATASETS.map((preset) => {
                        const isSelected = activePreset?.name === preset.name;
                        return (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => selectPreset(preset)}
                            className={`cursor-pointer w-full rounded-2xl border-2 p-3.5 text-left transition-all ${
                              isSelected
                                ? "bg-indigo-50/70 border-indigo-300 shadow-xs"
                                : "bg-white border-slate-200 hover:bg-slate-50/50 hover:border-slate-350"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-bold ${isSelected ? "text-indigo-700" : "text-slate-800"}`}>
                                {preset.name}
                              </span>
                              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[8px] font-semibold text-slate-500 uppercase tracking-wide">
                                {preset.category}
                              </span>
                            </div>
                            <p className="mt-1 text-[10px] text-slate-400 line-clamp-2">
                              {preset.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-50">
                    <p className="text-[10px] text-slate-400">
                      *Note: All analyses are run securely using Google AI Studio or OpenRouter API Keys.
                    </p>
                  </div>
                </div>

                {/* Right: Text Area input & AI Config */}
                <div className="md:col-span-7 flex flex-col justify-between">
                  <form onSubmit={handleAnalyze} className="h-full flex flex-col justify-between space-y-4">
                    <div className="space-y-4">
                      {/* AI Model Selection UI */}
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                              <Cpu className="h-3.5 w-3.5 text-indigo-500" />
                              Step 2: Select AI Intelligence
                            </label>

                            <div className="flex items-center gap-2">
                              <select
                                value={selectedModelId}
                                onChange={(e) => setSelectedModelId(e.target.value)}
                                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-hidden focus:border-indigo-500 min-w-[200px]"
                              >
                                {filteredModels.map(model => (
                                  <option key={model.id} value={model.id}>
                                    {model.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="flex flex-col items-end">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                              Model Type
                            </label>
                            <div className="flex p-1 bg-slate-200 rounded-xl">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsFreeOnly(true);
                                  if (!AI_MODELS.find(m => m.id === selectedModelId)?.isFree) {
                                    setSelectedModelId(AI_MODELS[0].id);
                                  }
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                  isFreeOnly
                                    ? "bg-white text-indigo-600 shadow-xs"
                                    : "text-slate-500 hover:text-slate-700"
                                }`}
                              >
                                <Smile className="h-3 w-3" />
                                Free
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsFreeOnly(false)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                  !isFreeOnly
                                    ? "bg-white text-indigo-600 shadow-xs"
                                    : "text-slate-500 hover:text-slate-700"
                                }`}
                              >
                                <Coins className="h-3 w-3" />
                                All Models
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold text-slate-700">
                            Raw reviews content:
                          </label>
                          {reviewsText.trim() && (
                            <button
                              type="button"
                              onClick={() => {
                                setReviewsText("");
                                setActivePreset(null);
                              }}
                              className="text-[10px] font-semibold text-rose-500 hover:underline"
                            >
                              Clear Clipboard
                            </button>
                          )}
                        </div>
                        <textarea
                          value={reviewsText}
                          onChange={(e) => {
                            setReviewsText(e.target.value);
                            setActivePreset(null);
                          }}
                          placeholder="Paste random, unfiltered customer feedback messages here..."
                          rows={6}
                          className="w-full rounded-xl border border-slate-200 p-4 text-xs text-slate-800 placeholder-slate-400 shadow-inner focus:border-indigo-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
                      <div className="text-[10px] text-slate-400">
                        Word count: <span className="font-semibold text-slate-600">{reviewsText.split(/\s+/).filter(Boolean).length} words</span>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading || !reviewsText.trim()}
                        className={`cursor-pointer flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-bold text-white shadow-md transition-all ${
                          isLoading || !reviewsText.trim()
                            ? "bg-slate-300 shadow-none cursor-not-allowed"
                            : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
                        }`}
                      >
                        {isLoading ? (
                          <>
                            <RefreshCcw className="h-4 w-4 animate-spin" />
                            <span>AI Analyzing Dataset...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            <span>Generate {selectedModel.name} Report</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Diagnostic Key Error Banner */}
        {error && (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5 text-rose-800 shadow-xs">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-rose-900">Analysis Request Failed</h4>
                <p className="mt-1.5 text-xs text-rose-700 leading-relaxed">
                  {error}
                </p>
                <div className="mt-3.5 flex gap-5 text-xs font-bold text-rose-900">
                  <button 
                    onClick={() => {
                      setError(null);
                    }}
                    className="hover:underline cursor-pointer"
                  >
                    Dismiss Error
                  </button>
                  <span className="text-rose-200">|</span>
                  <span>Check your <strong>GEMINI_API_KEY</strong> or <strong>OPENROUTER_API_KEY</strong> in the environment.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Core Loading splash screen */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="relative mb-6">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
              <Sparkles className="absolute top-1/2 left-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-indigo-600" />
            </div>
            <h3 className="font-display text-base font-bold text-slate-900">Extracting Sentiment Vector</h3>
            <p className="mt-1 text-xs text-slate-400 max-w-sm leading-relaxed">
              {selectedModel.name} is reading, parsing, and classifying your data. Hang tight!
            </p>
          </div>
        )}

        {/* The Beautiful Visual Dashboard Report outputs */}
        {report && !isLoading && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Collapse banner notifier */}
            {isInputCollapsed && (
              <div 
                onClick={() => setIsInputCollapsed(false)}
                className="cursor-pointer flex items-center justify-between rounded-xl bg-slate-900 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                  Showing real-time AI report. Click to reopen inputs and switch models.
                </span>
                <span className="text-indigo-400 hover:underline hover:text-indigo-300 font-semibold flex items-center gap-1">
                  Change Input Dataset or Model <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            )}

            {/* Row 1: Bento Grid metrics cards */}
            <div className="grid gap-6 grid-cols-1 md:grid-cols-4">
              
              {/* Average Sentiment score gauge */}
              <div className="relative bg-indigo-600 border-2 border-indigo-700 rounded-3xl p-6 shadow-xl text-white overflow-hidden flex flex-col justify-between min-h-[220px]">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-50 rounded-full opacity-20"></div>
                
                <div className="relative z-10">
                  <p className="text-sm font-bold uppercase tracking-widest opacity-80 mb-2">Overall Score</p>
                  <div className="text-7xl font-black tracking-tighter flex items-baseline">
                    {report.overallStats.averageSentiment}
                    <span className="text-2xl opacity-60 ml-1">%</span>
                  </div>
                </div>

                <div className="relative z-10 mt-4">
                  <div className="px-3 py-1 bg-white/20 rounded-full inline-block font-bold text-xs mb-3">
                    Analyzed by {selectedModel.name}
                  </div>
                  <p className="text-xs font-medium opacity-80 leading-relaxed">
                    {report.overallStats.averageSentiment >= 60 ? (
                      "Most patients and customers report high satisfaction with general service speed and attentiveness."
                    ) : report.overallStats.averageSentiment >= 40 ? (
                      "Users indicate moderate experience levels with several key friction points lingering in feedback data."
                    ) : (
                      "Systemic issues identified. Actionable steps below are critical for immediate experience recovery."
                    )}
                  </p>
                </div>
              </div>

              {/* Positive segment ratio */}
              <div className="rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between min-h-[220px]">
                <div>
                  <span className="font-mono text-[9px] font-bold tracking-wider text-emerald-500 uppercase">
                    Positive Reviews (Ratio)
                  </span>
                  <div className="mt-2 text-5xl font-extrabold text-emerald-700">
                    {report.overallStats.positivePercent}%
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
                  <ThumbsUp className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Showing strong praises and user satisfaction.</span>
                </div>
              </div>

              {/* Negative segment ratio */}
              <div className="rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between min-h-[220px]">
                <div>
                  <span className="font-mono text-[9px] font-bold tracking-wider text-rose-500 uppercase">
                    Negative Complaints
                  </span>
                  <div className="mt-2 text-5xl font-extrabold text-rose-700">
                    {report.overallStats.negativePercent}%
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
                  <ThumbsDown className="h-4 w-4 text-rose-500 shrink-0" />
                  <span>Bottlenecks causing user friction.</span>
                </div>
              </div>

              {/* Neutral / Mixed category */}
              <div className="rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between min-h-[220px]">
                <div>
                  <span className="font-mono text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                    Analyzed Feed volume
                  </span>
                  <div className="mt-2 text-5xl font-extrabold text-slate-900">
                    {report.overallStats.totalReviewsParsed}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
                  <BarChart3 className="h-4 w-4 text-indigo-500 shrink-0" />
                  <span>Neutral points ratio: {report.overallStats.neutralPercent}%</span>
                </div>
              </div>

            </div>

            {/* Row 2: Chronological Trend Line Chart & Word tags cloud Split layout */}
            <div className="grid gap-6 md:grid-cols-12">
              <div className="md:col-span-7">
                <SentimentTrendChart trendData={report.sentimentTrend} />
              </div>
              <div className="md:col-span-5">
                <WordCloud 
                  items={report.wordCloud}
                  selectedWord={selectedWord}
                  onSelectWord={setSelectedWord}
                />
              </div>
            </div>

            {/* Row 3: Markdown AI written Executive Bullet Summary & Actionable improvement Cards split */}
            <div className="grid gap-6 md:grid-cols-12">
              
              {/* Executive summary block */}
              <div className="md:col-span-5 rounded-3xl border-2 border-slate-900 bg-white p-8 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-black text-slate-900">AI Executive Summary</h2>
                  </div>
                  
                  {/* Styled markdown output container */}
                  <div className="space-y-1 text-slate-600 prose prose-slate">
                    {renderMarkdown(report.executiveSummary)}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-[10px] text-slate-400 leading-relaxed font-sans">
                  <span>Generative report compiled using {selectedModel.name}.</span>
                </div>
              </div>

              {/* Action directives listing */}
              <div className="md:col-span-7">
                <ActionableCards areas={report.topActionableAreas} />
              </div>

            </div>

            {/* Row 4: Filterable parsed reviews data tables */}
            <div className="pt-2">
              <ReviewList 
                reviews={report.parsedReviews} 
                selectedWord={selectedWord}
                onClearWordFilter={() => setSelectedWord(null)}
              />
            </div>

          </div>
        )}
      </main>

      <footer className="mt-20 border-t border-slate-200 bg-white py-12 text-center text-xs text-slate-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p>© 2026 Customer Sentiment Analytics Dashboard. Powered by Hybrid AI Engine.</p>
          <p className="mt-1.5 text-slate-300">
            Crafted with high contrast modern design guidelines in React and Tailwind CSS.
          </p>
        </div>
      </footer>
    </div>
  );
}

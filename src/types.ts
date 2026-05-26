export interface OverallStats {
  averageSentiment: number; // 0 to 100
  totalReviewsParsed: number;
  positivePercent: number;
  negativePercent: number;
  neutralPercent: number;
}

export interface ActionableArea {
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
  recommendation: string;
}

export interface TrendPoint {
  date: string;
  sentimentScore: number;
  volume: number;
}

export interface WordCloudItem {
  text: string;
  type: "praise" | "complaint";
  count: number;
  sentimentScore: number;
}

export interface ParsedReview {
  text: string;
  date: string;
  sentiment: "positive" | "neutral" | "negative";
  score: number;
  summary: string;
}

export interface DashboardReport {
  overallStats: OverallStats;
  executiveSummary: string;
  topActionableAreas: ActionableArea[];
  sentimentTrend: TrendPoint[];
  wordCloud: WordCloudItem[];
  parsedReviews: ParsedReview[];
}

export interface PresetDataset {
  name: string;
  category: string;
  description: string;
  sampleText: string;
}

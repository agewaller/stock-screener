// Type definitions for JSRM (Japan Sovereignty Risk Monitor)

export type RiskCategory =
  | "taiwan_strait"
  | "senkaku_east_china_sea"
  | "china_russia_military"
  | "north_korea"
  | "us_japan_operational_integration"
  | "legal_political_activation"
  | "market_supply_chain"
  | "cyber_information_warfare";

export const ALL_CATEGORIES: RiskCategory[] = [
  "taiwan_strait",
  "senkaku_east_china_sea",
  "china_russia_military",
  "north_korea",
  "us_japan_operational_integration",
  "legal_political_activation",
  "market_supply_chain",
  "cyber_information_warfare",
];

export type RiskLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface RiskEvent {
  id: string;
  date: string; // YYYY-MM-DD
  category: RiskCategory;
  title: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
  // 0..5
  severity: number;
  // 0..1
  confidence: number;
  status: "raw" | "reviewed" | "rejected";
  tags?: string[];
  collectedAt: string; // ISO
}

export interface CategoryScore {
  category: RiskCategory;
  score: number;
  level: RiskLevel;
  topEvents: RiskEvent[];
}

export interface DailyScore {
  date: string; // YYYY-MM-DD
  overallScore: number;
  level: RiskLevel;
  categories: CategoryScore[];
  trend1d: number;
  trend7d: number;
  trend30d: number;
  topDrivers: RiskEvent[];
  generatedAt: string; // ISO
}

export interface DailyScoresFile {
  // Newest last by default; loadData returns sorted ascending by date.
  scores: DailyScore[];
}

export interface RawEventsFile {
  events: RiskEvent[];
}

export interface SourceInfo {
  id: string;
  name: string;
  url: string;
  type:
    | "official_jp"
    | "official_us"
    | "official_tw"
    | "official_other"
    | "media"
    | "academic"
    | "dataset";
  description: string;
}

export interface SourcesFile {
  sources: SourceInfo[];
}

export interface CategoryWeights {
  // weights sum should equal 1
  taiwan_strait: number;
  senkaku_east_china_sea: number;
  china_russia_military: number;
  north_korea: number;
  us_japan_operational_integration: number;
  legal_political_activation: number;
  market_supply_chain: number;
  cyber_information_warfare: number;
}

export interface SubscriberRow {
  id: string;
  email: string;
  status: "pending" | "active" | "unsubscribed" | "bounced";
  confirm_token_hash: string | null;
  unsubscribe_token_hash: string;
  alert_min_level: number;
  alert_min_score_delta_1d: number;
  alert_min_score_delta_7d: number;
  categories: RiskCategory[];
  locale: string;
  created_at: string;
  confirmed_at: string | null;
  unsubscribed_at: string | null;
  last_alert_sent_at: string | null;
  metadata: Record<string, unknown>;
}

export type AlertType =
  | "level_threshold"
  | "daily_spike"
  | "weekly_spike"
  | "manual_critical";

export interface AlertDeliveryRow {
  id: string;
  subscriber_id: string;
  risk_date: string;
  alert_type: AlertType;
  overall_score: number;
  level: number;
  subject: string;
  sent_at: string;
  resend_message_id: string | null;
  status: "sent" | "failed" | "skipped";
  error_message: string | null;
  payload: Record<string, unknown>;
}

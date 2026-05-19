import type { CategoryWeights, RiskCategory, RiskLevel } from "./types";

export const DEFAULT_WEIGHTS: CategoryWeights = {
  taiwan_strait: 0.25,
  senkaku_east_china_sea: 0.15,
  china_russia_military: 0.1,
  north_korea: 0.1,
  us_japan_operational_integration: 0.15,
  legal_political_activation: 0.1,
  market_supply_chain: 0.075,
  cyber_information_warfare: 0.075,
};

export const CATEGORY_LABELS_JA: Record<RiskCategory, string> = {
  taiwan_strait: "台湾海峡",
  senkaku_east_china_sea: "尖閣・東シナ海",
  china_russia_military: "中露軍事連携",
  north_korea: "北朝鮮",
  us_japan_operational_integration: "日米運用一体化",
  legal_political_activation: "国内法政治起動",
  market_supply_chain: "市場・供給網",
  cyber_information_warfare: "サイバー・情報戦",
};

export const LEVEL_LABELS_JA: Record<RiskLevel, string> = {
  0: "平時",
  1: "グレーゾーン",
  2: "危機接近",
  3: "準有事",
  4: "参戦直前",
  5: "参戦・戦域化",
};

export const LEVEL_COLORS: Record<RiskLevel, string> = {
  0: "#3b82f6",
  1: "#22c55e",
  2: "#eab308",
  3: "#f97316",
  4: "#ef4444",
  5: "#a21caf",
};

// Mapping of overall score (0..5) -> Level
export function scoreToLevel(score: number): RiskLevel {
  if (score < 0.5) return 0;
  if (score < 1.25) return 1;
  if (score < 2.25) return 2;
  if (score < 3.25) return 3;
  if (score < 4.25) return 4;
  return 5;
}

export const DISCLAIMER_JA =
  "本サイトおよびメール通知は、公開情報に基づくリスク観測であり、戦争発生を予言・断定するものではありません。数値は政策判断・投資判断・避難判断の唯一の根拠にしないでください。重要局面では政府発表、一次情報、専門家判断を確認してください。";

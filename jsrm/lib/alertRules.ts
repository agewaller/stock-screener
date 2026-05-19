import type {
  AlertDeliveryRow,
  AlertType,
  DailyScore,
  RiskCategory,
  SubscriberRow,
} from "./types";

export interface ShouldSendAlertResult {
  send: boolean;
  alertType?: AlertType;
  reason: string;
}

function envFloat(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = parseFloat(v);
  return isFinite(n) ? n : fallback;
}

function envInt(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = parseInt(v, 10);
  return isFinite(n) ? n : fallback;
}

function withinCooldown(
  lastSentAt: string | null | undefined,
  cooldownHours: number,
): boolean {
  if (!lastSentAt) return false;
  const last = new Date(lastSentAt).getTime();
  if (!isFinite(last)) return false;
  return Date.now() - last < cooldownHours * 60 * 60 * 1000;
}

function dailyCapReached(
  recent: AlertDeliveryRow[],
  riskDate: string,
  latestLevel: number,
): boolean {
  // Up to 2 sent deliveries per day. A higher level can override the cap.
  const today = recent.filter(
    (r) => r.risk_date === riskDate && r.status === "sent",
  );
  if (today.length < 2) return false;
  const maxLevelToday = today.reduce((m, r) => Math.max(m, r.level), -1);
  return latestLevel <= maxLevelToday;
}

function alreadySentSameType(
  recent: AlertDeliveryRow[],
  riskDate: string,
  type: AlertType,
): boolean {
  return recent.some(
    (r) =>
      r.risk_date === riskDate && r.alert_type === type && r.status === "sent",
  );
}

export interface ShouldSendAlertParams {
  latest: DailyScore;
  previous: DailyScore | null;
  subscriber: SubscriberRow;
  recentDeliveries: AlertDeliveryRow[];
}

export function shouldSendAlert({
  latest,
  previous,
  subscriber,
  recentDeliveries,
}: ShouldSendAlertParams): ShouldSendAlertResult {
  const cooldownHours = envInt("ALERT_COOLDOWN_HOURS", 12);

  if (subscriber.status !== "active") {
    return { send: false, reason: `subscriber status is ${subscriber.status}` };
  }

  if (dailyCapReached(recentDeliveries, latest.date, latest.level)) {
    return { send: false, reason: "daily cap reached for this subscriber" };
  }

  const inCooldown = withinCooldown(subscriber.last_alert_sent_at, cooldownHours);
  const levelRose = previous ? latest.level > previous.level : false;

  const subscriberCategories = new Set<RiskCategory>(
    subscriber.categories as RiskCategory[],
  );
  const driverInCategories = latest.topDrivers.some((e) =>
    subscriberCategories.has(e.category as RiskCategory),
  );
  // Level >= 4 always notifies regardless of category preferences.
  const categoryOk = latest.level >= 4 || driverInCategories;

  // D. Manual critical (highest priority; tag-driven, ignores category filter)
  const hasCritical = latest.topDrivers.some(
    (e) => e.status === "reviewed" && (e.tags ?? []).includes("critical"),
  );
  if (hasCritical) {
    if (alreadySentSameType(recentDeliveries, latest.date, "manual_critical")) {
      return { send: false, reason: "manual_critical already sent today" };
    }
    if (inCooldown && !levelRose) {
      return { send: false, reason: "in cooldown" };
    }
    return {
      send: true,
      alertType: "manual_critical",
      reason: "manual critical event flagged",
    };
  }

  // A. Level threshold
  if (
    latest.level >= subscriber.alert_min_level &&
    previous &&
    latest.level > previous.level &&
    categoryOk
  ) {
    const lastSentLevel = recentDeliveries
      .filter(
        (r) =>
          r.risk_date === latest.date &&
          r.alert_type === "level_threshold" &&
          r.status === "sent",
      )
      .reduce((m, r) => Math.max(m, r.level), -1);
    if (lastSentLevel >= latest.level) {
      return {
        send: false,
        reason: "level_threshold already sent at this level",
      };
    }
    if (inCooldown && !levelRose) {
      return { send: false, reason: "in cooldown" };
    }
    return {
      send: true,
      alertType: "level_threshold",
      reason: `level rose ${previous.level} -> ${latest.level} (>= min ${subscriber.alert_min_level})`,
    };
  }

  // B. Daily spike
  if (
    latest.trend1d >= subscriber.alert_min_score_delta_1d &&
    latest.level >= 1 &&
    categoryOk
  ) {
    if (alreadySentSameType(recentDeliveries, latest.date, "daily_spike")) {
      return { send: false, reason: "daily_spike already sent today" };
    }
    if (inCooldown && !levelRose) {
      return { send: false, reason: "in cooldown" };
    }
    return {
      send: true,
      alertType: "daily_spike",
      reason: `1d delta ${latest.trend1d.toFixed(2)} >= ${subscriber.alert_min_score_delta_1d}`,
    };
  }

  // C. Weekly spike
  if (
    latest.trend7d >= subscriber.alert_min_score_delta_7d &&
    latest.level >= 1 &&
    categoryOk
  ) {
    if (alreadySentSameType(recentDeliveries, latest.date, "weekly_spike")) {
      return { send: false, reason: "weekly_spike already sent today" };
    }
    if (inCooldown && !levelRose) {
      return { send: false, reason: "in cooldown" };
    }
    return {
      send: true,
      alertType: "weekly_spike",
      reason: `7d delta ${latest.trend7d.toFixed(2)} >= ${subscriber.alert_min_score_delta_7d}`,
    };
  }

  return { send: false, reason: "no rule triggered" };
}

export function defaultAlertEnv() {
  return {
    minLevel: envInt("ALERT_MIN_LEVEL", 2),
    min1d: envFloat("ALERT_MIN_SCORE_DELTA_1D", 0.35),
    min7d: envFloat("ALERT_MIN_SCORE_DELTA_7D", 0.6),
    cooldownHours: envInt("ALERT_COOLDOWN_HOURS", 12),
  };
}

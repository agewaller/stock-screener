import { DISCLAIMER_JA } from "@/lib/constants";

export default function AlertBanner() {
  return (
    <div className="rounded-md border border-riskBorder bg-riskPanel/60 p-3 text-xs text-riskMuted leading-relaxed">
      {DISCLAIMER_JA}
    </div>
  );
}

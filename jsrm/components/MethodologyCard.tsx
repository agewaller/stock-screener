import { ReactNode } from "react";

export default function MethodologyCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-riskBorder bg-riskPanel p-4">
      <h3 className="font-semibold mb-2">{title}</h3>
      <div className="text-sm text-riskText/90 leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

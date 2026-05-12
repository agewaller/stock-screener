export default function EmailStatusMessage({
  variant,
  children,
}: {
  variant: "success" | "info" | "error";
  children: React.ReactNode;
}) {
  const styles: Record<string, string> = {
    success: "border-green-700 bg-green-900/30 text-green-200",
    info: "border-blue-700 bg-blue-900/30 text-blue-200",
    error: "border-red-700 bg-red-900/30 text-red-200",
  };
  return (
    <div className={`rounded-md border p-3 text-sm ${styles[variant]}`} role="status">
      {children}
    </div>
  );
}

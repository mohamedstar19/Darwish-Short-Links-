import { forwardRef } from "react";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string }
>(function Input({ label, hint, className = "", ...props }, ref) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-semibold">{label}</span>}
      <input
        ref={ref}
        className={`w-full rounded-lg border border-border bg-card px-3.5 py-2.5 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 ${className}`}
        {...props}
      />
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
});

const variants = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-dark",
  gold: "bg-gold text-primary-dark hover:bg-gold-light",
  outline: "border border-border hover:bg-muted",
  ghost: "hover:bg-muted",
  danger: "bg-danger text-white hover:opacity-90 dark:text-primary-dark",
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  className = "",
  children,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: "sm" | "md";
  loading?: boolean;
}) {
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-5 py-2.5" };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}

export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6 ${className}`}>
      {children}
    </div>
  );
}

export function Alert({ type = "error", children }: { type?: "error" | "success"; children: React.ReactNode }) {
  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={`break-words rounded-lg px-4 py-3 text-sm font-semibold ${
        type === "error" ? "bg-danger/10 text-danger" : "bg-success/10 text-success"
      }`}
    >
      {children}
    </div>
  );
}

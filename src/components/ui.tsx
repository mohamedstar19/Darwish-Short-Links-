import { forwardRef, useId } from "react";

export const fieldClass =
  "w-full min-h-11 rounded-lg border border-input bg-card px-3.5 py-2.5 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25 aria-[invalid=true]:border-danger";

/** Text field with a visible label, persistent hint, and an error tied to it via aria-describedby */
export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string | null }
>(function Input({ label, hint, error, className = "", id, ...props }, ref) {
  const auto = useId();
  const inputId = id ?? auto;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold">
        {label}
        {props.required && (
          <span className="text-danger" aria-hidden>
            {" "}
            *
          </span>
        )}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={[errorId, hintId].filter(Boolean).join(" ") || undefined}
        className={`${fieldClass} ${className}`}
        {...props}
      />
      <FieldError id={errorId} error={error} />
      {hint && (
        <p id={hintId} className="mt-1 text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
});

export function FieldError({ id, error }: { id?: string; error?: string | null }) {
  if (!error) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm font-semibold text-danger">
      {error}
    </p>
  );
}

const variants = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-dark active:bg-primary-dark",
  gold: "bg-gold text-primary-dark hover:bg-gold-light active:bg-gold-light",
  outline: "border border-input hover:bg-muted active:bg-muted",
  ghost: "hover:bg-muted active:bg-muted",
  danger: "bg-danger text-white hover:opacity-90 active:opacity-80 dark:text-primary-dark",
};

// 44px tall on touch screens; buttons in dense rows shrink to 36px from the sm breakpoint
const sizes = { sm: "min-h-11 px-3 text-sm sm:min-h-9", md: "min-h-11 px-5" };

export function buttonClass(variant: keyof typeof variants = "primary", size: "sm" | "md" = "md") {
  return `inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-bold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${sizes[size]} ${variants[variant]}`;
}

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
  return (
    <button
      className={`${buttonClass(variant, size)} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
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

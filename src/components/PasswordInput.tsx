"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import { fieldClass } from "@/components/ui";

/** Password field with a show/hide toggle; paste and password managers keep working */
export default function PasswordInput({
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const t = useTranslations("auth");
  const id = useId();
  const [visible, setVisible] = useState(false);
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          dir="ltr"
          aria-describedby={hintId}
          className={`${fieldClass} pe-12`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? t("hidePassword") : t("showPassword")}
          aria-pressed={visible}
          className="absolute inset-y-0 end-0 grid w-11 cursor-pointer place-items-center rounded-e-lg text-muted-foreground hover:text-foreground"
        >
          {visible ? <EyeOff size={20} aria-hidden /> : <Eye size={20} aria-hidden />}
        </button>
      </div>
      {hint && (
        <p id={hintId} className="mt-1 text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}

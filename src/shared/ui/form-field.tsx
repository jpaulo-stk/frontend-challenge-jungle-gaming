import { cn } from "cn";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { useId, useState, type ComponentProps, type ReactNode } from "react";

import { InlineError } from "@/shared/ui/inline-error";
import { fieldControlClassName } from "@/shared/ui/input";

type FieldShellProps = {
  label: string;
  /** Visually hidden label (placeholder-led layouts such as the login dialog). */
  hideLabel?: boolean | undefined;
  required?: boolean | undefined;
  error?: string | undefined;
  hint?: string | undefined;
  className?: string | undefined;
  children: (control: {
    id: string;
    describedBy: string | undefined;
    invalid: boolean;
  }) => ReactNode;
};

/** Label, required marker, hint and error, wired to the control through ids. */
export function FieldShell({
  label,
  hideLabel,
  required,
  error,
  hint,
  className,
  children,
}: FieldShellProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [hint && !error ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col", className)}>
      <label htmlFor={id} className={cn("mb-2 text-[15px] text-text", hideLabel && "sr-only")}>
        {label}
        {required && (
          <>
            <span aria-hidden="true" className="ml-0.5 text-xl leading-none text-danger">
              *
            </span>
            <span className="sr-only"> (obrigatório)</span>
          </>
        )}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-text-dim">
          {hint}
        </p>
      )}
      <InlineError id={errorId} message={error} />
    </div>
  );
}

type ShellProps = Pick<FieldShellProps, "label" | "hideLabel" | "required" | "error" | "hint"> & {
  /** Class of the field wrapper (label + control + error). */
  fieldClassName?: string | undefined;
};

type TextFieldProps = Omit<ComponentProps<"input">, "id"> &
  ShellProps & {
    /** Control rendered inside the input box, at its right edge. */
    endAdornment?: ReactNode;
  };

export function TextField({
  label,
  hideLabel,
  required,
  error,
  hint,
  fieldClassName,
  endAdornment,
  className,
  ...input
}: TextFieldProps) {
  return (
    <FieldShell
      label={label}
      hideLabel={hideLabel}
      required={required}
      error={error}
      hint={hint}
      className={fieldClassName}
    >
      {({ id, describedBy, invalid }) => (
        <div className="relative">
          <input
            id={id}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            aria-required={required ? true : undefined}
            className={cn(fieldControlClassName, endAdornment ? "pr-12" : null, className)}
            {...input}
          />
          {endAdornment}
        </div>
      )}
    </FieldShell>
  );
}

/** Password input with the show/hide toggle (eye icon) of the layout. */
export function PasswordField(props: Omit<TextFieldProps, "type" | "endAdornment">) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      endAdornment={
        <button
          type="button"
          aria-pressed={visible}
          onClick={() => {
            setVisible((current) => !current);
          }}
          className="absolute top-1/2 right-2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-text-dim hover:text-primary-hi [&_svg]:size-5"
        >
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          <span className="sr-only">{visible ? "Ocultar senha" : "Mostrar senha"}</span>
        </button>
      }
    />
  );
}

type SelectFieldProps = Omit<ComponentProps<"select">, "id"> &
  ShellProps & {
    options: readonly { value: string; label: string }[];
    placeholder?: string;
  };

/** Native select styled as the layout's dropdown: keyboard and screen-reader friendly. */
export function SelectField({
  label,
  hideLabel,
  required,
  error,
  hint,
  fieldClassName,
  options,
  placeholder,
  className,
  ...select
}: SelectFieldProps) {
  return (
    <FieldShell
      label={label}
      hideLabel={hideLabel}
      required={required}
      error={error}
      hint={hint}
      className={fieldClassName}
    >
      {({ id, describedBy, invalid }) => (
        <div className="relative">
          <select
            id={id}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            aria-required={required ? true : undefined}
            className={cn(fieldControlClassName, "appearance-none pr-10", className)}
            {...select}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-text-muted"
          />
        </div>
      )}
    </FieldShell>
  );
}

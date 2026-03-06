"use client";

type AuthInputProps = {
  name: string;
  type: string;
  placeholder: string;
  required?: boolean;
  autoComplete?: string;
  defaultValue?: string;
};

export function AuthInput({
  name,
  type,
  placeholder,
  required = false,
  autoComplete,
  defaultValue,
}: AuthInputProps) {
  return (
    <input
      name={name}
      type={type}
      required={required}
      placeholder={placeholder}
      autoComplete={autoComplete}
      defaultValue={defaultValue}
      className="w-full rounded-md border border-sepia-border bg-parchment px-3 py-2"
    />
  );
}


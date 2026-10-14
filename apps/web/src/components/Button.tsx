import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'border-transparent bg-sky-700 text-white hover:bg-sky-800',
  secondary: 'border-slate-300 bg-white text-slate-900 hover:bg-slate-100',
  ghost: 'border-transparent bg-transparent text-sky-700 hover:bg-sky-50',
  danger: 'border-red-300 bg-white text-red-800 hover:bg-red-100',
};

export interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'title'
> {
  title: string;
  variant?: ButtonVariant;
}

export function Button({
  title,
  type = 'button',
  variant = 'secondary',
  className = '',
  ...buttonProps
}: ButtonProps) {
  return (
    <button
      {...buttonProps}
      type={type}
      className={`inline-flex items-center justify-center rounded border px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-600 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {title}
    </button>
  );
}

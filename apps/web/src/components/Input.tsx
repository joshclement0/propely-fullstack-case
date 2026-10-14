import { useId, type InputHTMLAttributes } from 'react';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'title'> {
  title: string;
  containerClassName?: string;
}

export function Input({
  title,
  id,
  className = '',
  containerClassName = '',
  ...inputProps
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <label
      htmlFor={inputId}
      className={`block text-sm font-medium text-slate-700 ${containerClassName}`}
    >
      {title}
      <input
        {...inputProps}
        id={inputId}
        className={`mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 font-normal text-slate-900 shadow-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 ${className}`}
      />
    </label>
  );
}

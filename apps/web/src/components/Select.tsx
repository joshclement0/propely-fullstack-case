import { useId, type SelectHTMLAttributes } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'title'> {
  title: string;
  options: readonly SelectOption[];
  containerClassName?: string;
}

export function Select({
  title,
  options,
  id,
  className = '',
  containerClassName = '',
  ...selectProps
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <label
      htmlFor={selectId}
      className={`block text-sm font-medium text-slate-700 ${containerClassName}`}
    >
      {title}
      <select
        {...selectProps}
        id={selectId}
        className={`mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 font-normal text-slate-900 shadow-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 ${className}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

import type { HTMLAttributes, ReactNode } from 'react';

type HeadingLevel = 1 | 2 | 3;
type TextElement = 'p' | 'span';
type TextSize = 'xs' | 'sm' | 'base';
type TextTone = 'default' | 'muted' | 'danger';
type TextWeight = 'normal' | 'medium' | 'semibold';

const HEADING_CLASSES: Record<HeadingLevel, string> = {
  1: 'text-xl font-semibold text-slate-900',
  2: 'text-lg font-semibold text-slate-900',
  3: 'text-base font-semibold text-slate-900',
};

const TEXT_SIZE_CLASSES: Record<TextSize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
};

const TEXT_TONE_CLASSES: Record<TextTone, string> = {
  default: 'text-slate-900',
  muted: 'text-slate-500',
  danger: 'text-red-800',
};

const TEXT_WEIGHT_CLASSES: Record<TextWeight, string> = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
};

interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
  level?: HeadingLevel;
}

export function Heading({ children, level = 2, className = '', ...headingProps }: HeadingProps) {
  const Tag = level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3';

  return (
    <Tag {...headingProps} className={`${HEADING_CLASSES[level]} ${className}`}>
      {children}
    </Tag>
  );
}

interface TextProps extends HTMLAttributes<HTMLParagraphElement | HTMLSpanElement> {
  children: ReactNode;
  as?: TextElement;
  size?: TextSize;
  tone?: TextTone;
  weight?: TextWeight;
}

export function Text({
  children,
  as = 'p',
  size = 'base',
  tone = 'default',
  weight = 'normal',
  className = '',
  ...textProps
}: TextProps) {
  const Tag = as;

  return (
    <Tag
      {...textProps}
      className={`${TEXT_SIZE_CLASSES[size]} ${TEXT_TONE_CLASSES[tone]} ${TEXT_WEIGHT_CLASSES[weight]} ${className}`}
    >
      {children}
    </Tag>
  );
}

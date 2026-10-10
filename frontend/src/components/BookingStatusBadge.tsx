import React from 'react';
import { t, type Lang } from '../i18n/strings';
import clsx from 'clsx';

const STATUS_STYLES: Record<string, string> = {
  requested: 'bg-blue-50 text-info border-blue-200',
  matched: 'bg-purple-50 text-purple-700 border-purple-200',
  accepted: 'bg-cooperative-50 text-cooperative border-cooperative-200',
  in_progress: 'bg-saffron-50 text-saffron border-saffron-200',
  completed: 'bg-green-50 text-success border-green-200',
  cancelled: 'bg-gray-50 text-gray-500 border-gray-200',
  declined: 'bg-red-50 text-error border-red-200',
};

const STATUS_DOTS: Record<string, string> = {
  requested: 'bg-info',
  matched: 'bg-purple-500',
  accepted: 'bg-cooperative',
  in_progress: 'bg-saffron animate-pulse',
  completed: 'bg-success',
  cancelled: 'bg-gray-400',
  declined: 'bg-error',
};

const STATUS_LABELS: Record<string, { en: string; ta: string }> = {
  requested: { en: 'Requested', ta: 'கோரப்பட்டது' },
  matched: { en: 'Matched', ta: 'பொருத்தப்பட்டது' },
  accepted: { en: 'Accepted', ta: 'ஏற்றுக்கொள்ளப்பட்டது' },
  in_progress: { en: 'In Progress', ta: 'நடைபெறுகிறது' },
  completed: { en: 'Completed', ta: 'முடிந்தது' },
  cancelled: { en: 'Cancelled', ta: 'ரத்து' },
  declined: { en: 'Declined', ta: 'மறுக்கப்பட்டது' },
};

interface Props {
  status: string;
  lang?: Lang;
  showDot?: boolean;
}

export default function BookingStatusBadge({ status, lang = 'en', showDot = true }: Props) {
  const label = STATUS_LABELS[status]?.[lang] ?? status;
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border',
      STATUS_STYLES[status] || 'bg-gray-50 text-gray-600 border-gray-200'
    )}>
      {showDot && <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', STATUS_DOTS[status] || 'bg-gray-400')} />}
      {label}
    </span>
  );
}

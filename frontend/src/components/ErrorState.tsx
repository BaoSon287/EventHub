import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'Please try again in a moment.',
  actionLabel,
  onAction,
}) => (
  <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-16 text-center">
    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
      <ShieldAlert className="h-7 w-7" />
    </div>
    <h2 className="text-lg font-black text-slate-900">{title}</h2>
    <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500">{message}</p>
    {actionLabel && onAction && (
      <Button type="button" className="mt-6" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </div>
);

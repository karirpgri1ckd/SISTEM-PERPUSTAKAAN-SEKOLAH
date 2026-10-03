import React from 'react';

interface BadgeProps {
  status: string;
  variant?: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate' | 'indigo';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ status, variant, size = 'md' }) => {
  let color = 'bg-slate-100 text-slate-700 border-slate-200';

  const s = status.toLowerCase();
  if (variant) {
    if (variant === 'blue') color = 'bg-blue-50 text-blue-700 border-blue-200';
    if (variant === 'emerald') color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (variant === 'amber') color = 'bg-amber-50 text-amber-700 border-amber-200';
    if (variant === 'rose') color = 'bg-rose-50 text-rose-700 border-rose-200';
    if (variant === 'indigo') color = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  } else {
    // Auto-detect based on text
    if (s.includes('aktif') || s.includes('tersedia') || s.includes('dikembalikan') || s.includes('baik') || s === 'admin') {
      color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (s.includes('dipinjam') || s.includes('petugas')) {
      color = 'bg-blue-50 text-blue-700 border-blue-200';
    } else if (s.includes('terlambat') || s.includes('rusak berat') || s.includes('hilang') || s.includes('tidak aktif')) {
      color = 'bg-rose-50 text-rose-700 border-rose-200';
    } else if (s.includes('perbaikan') || s.includes('rusak ringan') || s.includes('sebagian')) {
      color = 'bg-amber-50 text-amber-700 border-amber-200';
    }
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center font-medium rounded-full border shadow-2xs ${sizeClasses} ${color}`}>
      {status}
    </span>
  );
};

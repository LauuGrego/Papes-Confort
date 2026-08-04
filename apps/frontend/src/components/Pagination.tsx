'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemLabel?: string;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemLabel = 'Items',
  className = '',
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show page 1
      pages.push(1);

      if (currentPage > 4) {
        pages.push('...');
      }

      const start = Math.max(2, currentPage - 2);
      const end = Math.min(totalPages - 1, currentPage + 2);

      let adjustedStart = start;
      let adjustedEnd = end;

      if (currentPage <= 4) {
        adjustedEnd = 5;
      } else if (currentPage >= totalPages - 3) {
        adjustedStart = totalPages - 4;
      }

      for (let i = adjustedStart; i <= adjustedEnd; i++) {
        if (i > 1 && i < totalPages) {
          pages.push(i);
        }
      }

      if (currentPage < totalPages - 3) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();
  const isMetadataLayout = totalItems !== undefined;

  const controls = (
    <div className="flex items-center gap-1.5 md:gap-2">
      {/* Previous button */}
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-bold uppercase rounded-xl border border-slate-100 disabled:opacity-40 disabled:hover:bg-transparent hover:bg-slate-50 transition-colors"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Anterior</span>
      </button>

      {/* Pages */}
      {pageNumbers.map((pNum, idx) => {
        if (typeof pNum === 'string') {
          return (
            <span
              key={`ellipsis-${idx}`}
              className="h-9 w-8 md:w-9 flex items-center justify-center text-xs font-bold text-slate-400 select-none"
            >
              {pNum}
            </span>
          );
        }

        return (
          <button
            key={pNum}
            type="button"
            onClick={() => onPageChange(pNum)}
            className={`h-9 w-8 md:w-9 rounded-xl text-xs font-bold transition-all ${
              currentPage === pNum
                ? 'bg-brand-red text-white shadow-md'
                : 'border border-slate-100 hover:bg-slate-50 text-slate-600'
            }`}
          >
            {pNum}
          </button>
        );
      })}

      {/* Next button */}
      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-bold uppercase rounded-xl border border-slate-100 disabled:opacity-40 disabled:hover:bg-transparent hover:bg-slate-50 transition-colors"
      >
        <span className="hidden sm:inline">Siguiente</span>
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  if (isMetadataLayout) {
    return (
      <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-50 p-6 ${className}`}>
        <span className="text-slate-400 text-xs text-center sm:text-left">
          Página {currentPage} de {totalPages} ({totalItems} {itemLabel})
        </span>
        {controls}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center pt-6 ${className}`}>
      {controls}
    </div>
  );
}

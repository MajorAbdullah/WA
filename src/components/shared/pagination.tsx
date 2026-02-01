"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageNumbers?: boolean;
  maxVisiblePages?: number;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showPageNumbers = true,
  maxVisiblePages = 5,
  className,
}: PaginationProps) {
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const getVisiblePages = () => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxVisiblePages / 2);
    let start = currentPage - half;
    let end = currentPage + half;

    if (start < 1) {
      start = 1;
      end = maxVisiblePages;
    }

    if (end > totalPages) {
      end = totalPages;
      start = totalPages - maxVisiblePages + 1;
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const visiblePages = getVisiblePages();

  if (totalPages <= 1) return null;

  return (
    <div className={cn("flex items-center justify-center gap-1", className)}>
      {/* First page */}
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => onPageChange(1)}
        disabled={!canGoPrevious}
      >
        <ChevronsLeft className="h-4 w-4" />
        <span className="sr-only">First page</span>
      </Button>

      {/* Previous page */}
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!canGoPrevious}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous page</span>
      </Button>

      {/* Page numbers */}
      {showPageNumbers && (
        <div className="flex items-center gap-1">
          {visiblePages[0] > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(1)}
              >
                1
              </Button>
              {visiblePages[0] > 2 && (
                <span className="px-2 text-muted-foreground">...</span>
              )}
            </>
          )}

          {visiblePages.map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline"}
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          ))}

          {visiblePages[visiblePages.length - 1] < totalPages && (
            <>
              {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                <span className="px-2 text-muted-foreground">...</span>
              )}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(totalPages)}
              >
                {totalPages}
              </Button>
            </>
          )}
        </div>
      )}

      {/* Next page */}
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!canGoNext}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next page</span>
      </Button>

      {/* Last page */}
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => onPageChange(totalPages)}
        disabled={!canGoNext}
      >
        <ChevronsRight className="h-4 w-4" />
        <span className="sr-only">Last page</span>
      </Button>
    </div>
  );
}

interface PaginationInfoProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  className?: string;
}

export function PaginationInfo({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  className,
}: PaginationInfoProps) {
  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      Showing <span className="font-medium">{start}</span> to{" "}
      <span className="font-medium">{end}</span> of{" "}
      <span className="font-medium">{totalItems}</span> results
    </p>
  );
}

interface PaginationWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function PaginationWrapper({ children, className }: PaginationWrapperProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-between gap-4 sm:flex-row",
        className
      )}
    >
      {children}
    </div>
  );
}

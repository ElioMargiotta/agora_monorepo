import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function PaginationBar({ page, setPage, totalPages, pageSize, totalItems }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <div className="text-xs text-muted-foreground">
        {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalItems)} of {totalItems}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

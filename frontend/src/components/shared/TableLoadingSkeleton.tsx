import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface TableLoadingSkeletonProps {
  columns: number;
  rows?: number;
  headers?: string[];
}

/** Same shape as the table it replaces, so the page does not jump when data arrives. */
export function TableLoadingSkeleton({ columns, rows = 6, headers }: TableLoadingSkeletonProps) {
  return (
    <Table aria-busy="true">
      {headers && headers.length > 0 && (
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {headers.map((h, i) => (
              <TableHead key={h} className={i === 0 ? "pl-5" : undefined}>
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
      )}
      <TableBody>
        {Array.from({ length: rows }).map((_, r) => (
          <TableRow key={r} className="hover:bg-transparent">
            {Array.from({ length: columns }).map((__, c) => (
              <TableCell key={c} className={c === 0 ? "pl-5" : undefined}>
                <div className="skeleton h-4 w-full max-w-[8rem]" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function PlaceholderTable({
  columns,
  rows = 6,
}: {
  columns: string[];
  rows?: number;
}) {
  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            {columns.map((c) => (
              <TableHead key={c}>{c}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i}>
              {columns.map((c, j) => (
                <TableCell key={c}>
                  {j === columns.length - 1 ? (
                    <Badge variant="secondary">Placeholder</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {c} #{i + 1}
                    </span>
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

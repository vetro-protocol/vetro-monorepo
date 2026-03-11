import { useWindowSize } from "@hemilabs/react-hooks/useWindowSize";
import {
  type ColumnDef,
  type Table as TanStackTable,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { type ReactNode, useMemo } from "react";
import Skeleton from "react-loading-skeleton";
import { screenBreakpoints } from "styles/breakpoints";

import { Column } from "./column";
import { ColumnHeader } from "./columnHeader";

const getColumnOrder = function <T>({
  columns,
  priorityColumnIds = [],
  width,
}: {
  columns: ColumnDef<T>[];
  priorityColumnIds?: string[];
  width: number;
}) {
  if (width >= screenBreakpoints.md || priorityColumnIds.length === 0) {
    return undefined;
  }
  return [
    ...priorityColumnIds,
    ...columns
      .filter((c) => c.id)
      .map((c) => c.id!)
      .filter((id) => !priorityColumnIds.includes(id)),
  ];
};

type Props<TData> = {
  columns: ColumnDef<TData>[];
  data: TData[];
  getRowId?: (row: TData) => string;
  loading?: boolean;
  maxBodyHeight?: string;
  placeholder?: ReactNode;
  priorityColumnIdsOnSmall?: string[];
  skeletonRowCount?: number;
};

type TableHeaderProps<TData> = {
  getColumnClassName: (columnId: string, meta?: string) => string;
  table: TanStackTable<TData>;
};

const TableHeader = <TData,>({
  getColumnClassName,
  table,
}: TableHeaderProps<TData>) => (
  <div className="border-b border-gray-200 bg-gray-100">
    <table className="w-full border-separate border-spacing-0 whitespace-nowrap">
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr className="flex w-full items-center px-16" key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <ColumnHeader
                className={getColumnClassName(
                  header.column.id,
                  header.column.columnDef.meta?.className,
                )}
                key={header.id}
                style={{ width: header.column.columnDef.meta?.width }}
              >
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext(),
                )}
              </ColumnHeader>
            ))}
          </tr>
        ))}
      </thead>
    </table>
  </div>
);

type TableBodyProps<TData> = {
  getColumnClassName: (columnId: string, meta?: string) => string;
  maxBodyHeight?: string;
  table: TanStackTable<TData>;
};

const TableBody = <TData,>({
  getColumnClassName,
  maxBodyHeight,
  table,
}: TableBodyProps<TData>) => (
  <div
    className={`border-b border-gray-200 ${maxBodyHeight ? "overflow-y-auto" : ""}`}
    style={{
      maxHeight: maxBodyHeight,
      ...(maxBodyHeight && {
        scrollbarColor: "#d4d4d4 transparent",
        scrollbarWidth: "thin" as const,
      }),
    }}
  >
    <table className="w-full border-separate border-spacing-0 whitespace-nowrap">
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr
            className="flex w-full items-center border-b border-gray-200 px-16"
            key={row.id}
          >
            {row.getVisibleCells().map((cell) => (
              <Column
                className={getColumnClassName(
                  cell.column.id,
                  cell.column.columnDef.meta?.className,
                )}
                key={cell.id}
                style={{ width: cell.column.columnDef.meta?.width }}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </Column>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export function Table<TData>({
  columns,
  data,
  getRowId,
  loading = false,
  maxBodyHeight,
  placeholder,
  priorityColumnIdsOnSmall,
  skeletonRowCount = 4,
}: Props<TData>) {
  const { width } = useWindowSize();

  const showSkeleton = data.length === 0 && loading;

  const columnsWithSkeleton = useMemo(
    () =>
      columns.map((col) =>
        showSkeleton
          ? {
              ...col,
              cell: () => (
                <div className="w-16">
                  <Skeleton height={16} />
                </div>
              ),
            }
          : col,
      ),
    [columns, showSkeleton],
  );

  const skeletonData = useMemo(
    () => new Array(skeletonRowCount).fill(null) as TData[],
    [skeletonRowCount],
  );

  const columnOrder = getColumnOrder({
    columns: columnsWithSkeleton,
    priorityColumnIds: priorityColumnIdsOnSmall,
    width,
  });

  const table = useReactTable({
    columns: columnsWithSkeleton,
    data: data.length > 0 ? data : showSkeleton ? skeletonData : [],
    getCoreRowModel: getCoreRowModel(),
    getRowId: showSkeleton ? undefined : getRowId,
    state: { columnOrder },
  });

  const isMobileReordered = columnOrder !== undefined;
  const prioritySet = useMemo(
    () => new Set(priorityColumnIdsOnSmall ?? []),
    [priorityColumnIdsOnSmall],
  );

  function getColumnClassName(columnId: string, meta?: string) {
    if (isMobileReordered && prioritySet.has(columnId)) {
      return "justify-start";
    }
    return meta ?? "justify-start";
  }

  const showPlaceholder = data.length === 0 && !loading && placeholder;

  return (
    <div
      className="w-full max-w-[100vw] overflow-x-auto"
      style={{
        scrollbarColor: "#d4d4d4 transparent",
        scrollbarWidth: "thin",
      }}
    >
      <div className="w-full min-w-max">
        <TableHeader getColumnClassName={getColumnClassName} table={table} />
        {!showPlaceholder && (
          <TableBody
            getColumnClassName={getColumnClassName}
            maxBodyHeight={maxBodyHeight}
            table={table}
          />
        )}
      </div>
      {showPlaceholder && placeholder}
    </div>
  );
}

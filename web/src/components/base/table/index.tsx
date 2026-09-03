import { useWindowSize } from "@hemilabs/react-hooks/useWindowSize";
import {
  type ColumnDef,
  type ReactTable,
  type RowData,
  columnOrderingFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { type MouseEvent, Fragment, type ReactNode, useMemo } from "react";
import Skeleton from "react-loading-skeleton";
import { screenBreakpoints } from "styles/breakpoints";

import { Column } from "./column";
import { ColumnHeader } from "./columnHeader";

type ColumnMeta = {
  className?: string;
  width?: string;
};

const features = tableFeatures({
  columnMeta: {} as ColumnMeta,
  columnOrderingFeature,
});

type TableFeatureSet = typeof features;

type TableInstance<TData extends RowData> = ReactTable<TableFeatureSet, TData>;

export type TableColumnDef<TData extends RowData> = ColumnDef<
  TableFeatureSet,
  TData
>;

const getColumnOrder = function <T extends RowData>({
  columns,
  priorityColumnIds = [],
  width,
}: {
  columns: TableColumnDef<T>[];
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

type Props<TData extends RowData> = {
  columns: TableColumnDef<TData>[];
  data: TData[];
  getRowId?: (row: TData) => string;
  loading?: boolean;
  maxBodyHeight?: string;
  onRowClick?: (row: TData) => void;
  placeholder?: ReactNode;
  priorityColumnIdsOnSmall?: string[];
  renderAfterRow?: (row: TData) => ReactNode;
  skeletonRowCount?: number;
};

type TableHeaderProps<TData extends RowData> = {
  getColumnClassName: (columnId: string, meta?: string) => string;
  table: TableInstance<TData>;
};

const TableHeader = <TData extends RowData>({
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
                <table.FlexRender header={header} />
              </ColumnHeader>
            ))}
          </tr>
        ))}
      </thead>
    </table>
  </div>
);

type TableBodyProps<TData extends RowData> = {
  getColumnClassName: (columnId: string, meta?: string) => string;
  maxBodyHeight?: string;
  onRowClick?: (row: TData) => void;
  renderAfterRow?: (row: TData) => ReactNode;
  table: TableInstance<TData>;
};

const TableBody = <TData extends RowData>({
  getColumnClassName,
  maxBodyHeight,
  onRowClick,
  renderAfterRow,
  table,
}: TableBodyProps<TData>) => (
  <div
    className={maxBodyHeight ? "overflow-y-auto" : undefined}
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
          <Fragment key={row.id}>
            <tr
              className={`flex w-full items-center border-b border-gray-200 bg-white px-16 ${onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}`}
              onClick={
                onRowClick
                  ? function (e: MouseEvent<HTMLTableRowElement>) {
                      if (
                        (e.target as HTMLElement).closest(
                          "a, button, input, select, textarea, [role='button']",
                        )
                      ) {
                        return;
                      }
                      onRowClick(row.original);
                    }
                  : undefined
              }
              role={onRowClick ? "link" : undefined}
            >
              {row.getAllCells().map((cell) => (
                <Column
                  className={getColumnClassName(
                    cell.column.id,
                    cell.column.columnDef.meta?.className,
                  )}
                  key={cell.id}
                  style={{ width: cell.column.columnDef.meta?.width }}
                >
                  <table.FlexRender cell={cell} />
                </Column>
              ))}
            </tr>
            {renderAfterRow?.(row.original)}
          </Fragment>
        ))}
      </tbody>
    </table>
  </div>
);

export function Table<TData extends RowData>({
  columns,
  data,
  getRowId,
  loading = false,
  maxBodyHeight,
  onRowClick,
  placeholder,
  priorityColumnIdsOnSmall,
  renderAfterRow,
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

  const table = useTable({
    columns: columnsWithSkeleton,
    data: data.length > 0 ? data : showSkeleton ? skeletonData : [],
    features,
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
            onRowClick={onRowClick}
            renderAfterRow={renderAfterRow}
            table={table}
          />
        )}
      </div>
      {showPlaceholder && placeholder}
    </div>
  );
}

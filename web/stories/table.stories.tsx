import type { Meta, StoryObj } from "@storybook/react";
import { type ColumnDef } from "@tanstack/react-table";

import { Badge } from "../src/components/base/badge";
import { Button } from "../src/components/base/button";
import { StatusBadge } from "../src/components/base/statusBadge";
import { Table } from "../src/components/base/table";
import { Header } from "../src/components/base/table/header";

type ExampleRow = {
  actions: string;
  amount: string;
  date: string;
  id: number;
  status: "cooldown" | "ready" | "withdrawn";
  txCount: number;
};

const statusLabels = {
  cooldown: "Cooldown in progress",
  ready: "Ready to withdraw",
  withdrawn: "Withdrawn",
} as const;

const columns: ColumnDef<ExampleRow>[] = [
  {
    cell: ({ row }) => (
      <span className="text-xsm font-normal text-gray-500">
        {row.original.date}
      </span>
    ),
    header: () => <Header text="Date created" />,
    id: "date",
    meta: { width: "136px" },
  },
  {
    cell: ({ row }) => (
      <span className="text-xsm font-medium text-gray-900">
        {row.original.amount}
      </span>
    ),
    header: () => <Header text="Amount" />,
    id: "amount",
    meta: { width: "136px" },
  },
  {
    cell: ({ row }) => (
      <StatusBadge variant={row.original.status}>
        {statusLabels[row.original.status]}
      </StatusBadge>
    ),
    header: () => <Header text="Status" />,
    id: "status",
    meta: { width: "190px" },
  },
  {
    cell: ({ row }) => <Badge>{row.original.txCount} TXs</Badge>,
    header: () => <Header align="center" text="TXs" />,
    id: "txs",
    meta: { width: "112px" },
  },
  {
    cell: ({ row }) =>
      row.original.status === "ready" ? (
        <Button size="xSmall" variant="primary">
          Withdraw
        </Button>
      ) : null,
    header: () => <Header text="Actions" />,
    id: "actions",
    meta: { className: "justify-end", width: "150px" },
  },
];

const sampleData: ExampleRow[] = [
  {
    actions: "",
    amount: "1,000.00 vUSD",
    date: "02/19/26",
    id: 1,
    status: "cooldown",
    txCount: 1,
  },
  {
    actions: "",
    amount: "500.00 vUSD",
    date: "02/15/26",
    id: 2,
    status: "ready",
    txCount: 1,
  },
  {
    actions: "",
    amount: "2,500.00 vUSD",
    date: "02/10/26",
    id: 3,
    status: "withdrawn",
    txCount: 2,
  },
  {
    actions: "",
    amount: "750.00 vUSD",
    date: "02/08/26",
    id: 4,
    status: "ready",
    txCount: 1,
  },
];

const meta: Meta<typeof Table> = {
  component: Table,
  title: "Components/Table",
};

export default meta;
type Story = StoryObj<typeof Table>;

export const Default: Story = {
  render: () => <Table columns={columns} data={sampleData} />,
};

export const WithPriorityColumns: Story = {
  render: () => (
    <Table
      columns={columns}
      data={sampleData}
      priorityColumnIdsOnSmall={["actions"]}
    />
  ),
};

export const Loading: Story = {
  render: () => <Table columns={columns} data={[]} loading />,
};

export const Empty: Story = {
  render: () => (
    <Table
      columns={columns}
      data={[]}
      placeholder={
        <div className="flex items-center justify-center py-12 text-sm text-gray-500">
          No data available
        </div>
      }
    />
  ),
};

export const WithRenderAfterRow: Story = {
  render: () => (
    <Table
      columns={columns}
      data={sampleData}
      renderAfterRow={(row) =>
        row.status === "ready" ? (
          <tr className="flex w-full bg-rose-100 px-4 py-3">
            <td className="text-caption text-rose-500">
              Warning: This row has a &quot;ready&quot; status banner rendered
              below it.
            </td>
          </tr>
        ) : null
      }
    />
  ),
};

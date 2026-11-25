import { SectionHeader } from "components/base/sectionHeader";
import { Table } from "components/base/table";
import { useTranslation } from "react-i18next";

import { getColumns } from ".";

// Stable reference
const emptyArray: never[] = [];

export function ExitTicketsSkeleton() {
  const { t } = useTranslation();
  const columns = getColumns({
    isWithdrawingAll: false,
    onDeleteSuccess() {},
    onWithdrawingChange() {},
    t,
  });

  return (
    <div>
      <SectionHeader title={t("pages.earn.exit-tickets.title")} />
      <Table
        columns={columns}
        data={emptyArray}
        loading
        maxBodyHeight="280px"
        priorityColumnIdsOnSmall={["actions"]}
      />
    </div>
  );
}

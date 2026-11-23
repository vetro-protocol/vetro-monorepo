import type { Token } from "@vetro-protocol/core";
import { ToggleButton } from "components/base/toggleButton";
import { FormSectionItem } from "components/feesContainer";
import { InfoIcon } from "components/icons/infoIcon";
import { Tooltip } from "components/tooltip";
import { useTranslation } from "react-i18next";
import type { TokenWithGateway } from "types";

type Props = {
  active: boolean;
  available: boolean;
  onToggle: VoidFunction;
  peggedToken: TokenWithGateway;
  shareToken: Token | undefined;
};

export const StakeSection = function ({
  active,
  available,
  onToggle,
  peggedToken,
  shareToken,
}: Props) {
  const { t } = useTranslation();
  const label = t("pages.swap.form.stake-after-swap");

  if (!available) {
    return null;
  }

  return (
    <FormSectionItem>
      <div className="text-xsm flex max-w-md cursor-default items-center gap-x-1 py-3">
        <span className="font-semibold text-gray-900">{label}</span>
        {shareToken && (
          <Tooltip
            content={
              <span className="block max-w-64">
                {t("pages.swap.form.stake-after-swap-tooltip", {
                  peggedSymbol: peggedToken.symbol,
                  shareSymbol: shareToken.symbol,
                })}
              </span>
            }
            label={t("common.more-info-about", { topic: label })}
          >
            <InfoIcon />
          </Tooltip>
        )}
        <div className="ml-auto">
          <ToggleButton active={active} label={label} onClick={onToggle} />
        </div>
      </div>
    </FormSectionItem>
  );
};

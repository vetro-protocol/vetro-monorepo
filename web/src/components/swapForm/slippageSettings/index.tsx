import { useOnClickOutside } from "@hemilabs/react-hooks/useOnClickOutside";
import { ButtonIcon } from "components/base/button";
import { ToggleButton } from "components/base/toggleButton";
import { ExclamationTriangleIcon } from "components/icons/exclamationTriangleIcon";
import { GearIcon } from "components/icons/gearIcon";
import { type KeyboardEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { DEFAULT_SLIPPAGE, isHighSlippage, MAX_SLIPPAGE } from "utils/slippage";

import { HighSlippageModal } from "./highSlippageModal";

type Props = {
  onChange: (slippage: number) => void;
  slippage: number;
};

function sanitizeSlippage(raw: string) {
  if (raw === "") {
    return "";
  }
  if (!/^\d+$/.test(raw)) {
    return null;
  }
  return Number(raw) > MAX_SLIPPAGE ? null : raw;
}

type TriggerProps = {
  onClick: VoidFunction;
  slippage: number;
};

function SlippageTrigger({ onClick, slippage }: TriggerProps) {
  const { t } = useTranslation();
  const high = isHighSlippage(slippage);
  return (
    <div className="flex items-center gap-1.5">
      {slippage !== DEFAULT_SLIPPAGE ? (
        <span
          className={`text-xsm font-medium ${high ? "text-rose-600" : "text-gray-500"}`}
        >
          {high
            ? t("pages.swap.slippage.high-value", { value: slippage })
            : t("pages.swap.slippage.value", { value: slippage })}
        </span>
      ) : null}
      <ButtonIcon
        aria-label={t("pages.swap.slippage.title")}
        onClick={onClick}
        type="button"
        variant={high ? "danger" : "tertiary"}
      >
        <GearIcon />
      </ButtonIcon>
    </div>
  );
}

type PanelProps = {
  draft: string;
  isAuto: boolean;
  isHigh: boolean;
  onInputChange: (raw: string) => void;
  onInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onToggleAuto: VoidFunction;
};

function SlippagePanel({
  draft,
  isAuto,
  isHigh,
  onInputChange,
  onInputKeyDown,
  onToggleAuto,
}: PanelProps) {
  const { t } = useTranslation();
  return (
    <div className="absolute top-full right-0 z-20 mt-1 w-72 rounded-lg bg-white px-4 py-1 shadow-xl">
      <p className="text-b-medium py-2 text-gray-500">
        {t("pages.swap.slippage.title")}
      </p>
      <div className="text-b-medium flex items-center justify-between gap-2 py-1">
        <span className="text-gray-900">
          {t("pages.swap.slippage.max-slippage")}
        </span>
        <div className="flex items-center gap-2">
          <span className={isAuto ? "text-gray-900" : "text-gray-400"}>
            {t("pages.swap.slippage.auto")}
          </span>
          <ToggleButton active={isAuto} onClick={onToggleAuto} />
          <span className="h-4 w-px bg-gray-200" />
          <div
            className={`text-caption flex items-center rounded-full px-3 py-1 shadow-sm ${
              isHigh ? "text-rose-600" : "text-gray-900"
            }`}
          >
            <input
              className="w-7 bg-transparent text-right outline-none"
              inputMode="numeric"
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="0"
              value={isAuto ? "" : draft}
            />
            <span>%</span>
          </div>
        </div>
      </div>
      {isHigh ? (
        <div className="flex items-center gap-1 py-2 text-rose-600">
          <div className="*:size-4">
            <ExclamationTriangleIcon />
          </div>
          <span className="text-xsm font-medium">
            {t("pages.swap.slippage.high-slippage")}
          </span>
        </div>
      ) : null}
    </div>
  );
}

export function SlippageSettings({ onChange, slippage }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuto, setIsAuto] = useState(slippage === DEFAULT_SLIPPAGE);
  const [draft, setDraft] = useState(
    slippage === DEFAULT_SLIPPAGE ? "" : String(slippage),
  );
  const [pendingHigh, setPendingHigh] = useState<number | null>(null);

  const draftValue = isAuto || draft === "" ? DEFAULT_SLIPPAGE : Number(draft);

  function open() {
    setIsAuto(slippage === DEFAULT_SLIPPAGE);
    setDraft(slippage === DEFAULT_SLIPPAGE ? "" : String(slippage));
    setIsOpen(true);
  }

  function commitAndClose() {
    setIsOpen(false);
    if (draftValue === slippage) {
      return;
    }
    if (isHighSlippage(draftValue)) {
      setPendingHigh(draftValue);
      return;
    }
    onChange(draftValue);
  }

  function handleInputChange(raw: string) {
    const next = sanitizeSlippage(raw);
    if (next === null) {
      return;
    }
    setIsAuto(false);
    setDraft(next);
  }

  function handleToggleAuto() {
    setIsAuto(function (previous) {
      if (!previous) {
        setDraft("");
      }
      return !previous;
    });
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitAndClose();
    }
  }

  const ref = useOnClickOutside<HTMLDivElement>(function () {
    if (isOpen) {
      commitAndClose();
    }
  });

  return (
    <div className="relative" ref={ref}>
      <SlippageTrigger
        onClick={() => (isOpen ? commitAndClose() : open())}
        slippage={slippage}
      />
      {isOpen ? (
        <SlippagePanel
          draft={draft}
          isAuto={isAuto}
          isHigh={isHighSlippage(draftValue)}
          onInputChange={handleInputChange}
          onInputKeyDown={handleInputKeyDown}
          onToggleAuto={handleToggleAuto}
        />
      ) : null}
      {pendingHigh !== null ? (
        <HighSlippageModal
          onClose={() => setPendingHigh(null)}
          onConfirm={function () {
            onChange(pendingHigh);
            setPendingHigh(null);
          }}
        />
      ) : null}
    </div>
  );
}

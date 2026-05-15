import { useWindowSize } from "@hemilabs/react-hooks/useWindowSize";
import { ChevronIcon } from "components/base/chevronIcon";
import { Modal } from "components/base/modal";
import { SearchInput } from "components/base/searchInput";
import { TokenChainLogo } from "components/bridgeForm/tokenChainLogo";
import { CloseIcon } from "components/icons/closeIcon";
import { TokenLogo } from "components/tokenLogo";
import { useVisualViewportSize } from "hooks/useVisualViewportSize";
import { getChainById } from "networks";
import {
  type ComponentProps,
  type KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { screenBreakpoints } from "styles/breakpoints";
import type { Token } from "types";

import { EmptyState } from "./emptyState";
import { TokenRow } from "./tokenRow";

type LogoSize = ComponentProps<typeof TokenLogo>["size"];

type Props<T extends Token = Token> = {
  onChange: (token: T) => void;
  showChainLogo?: boolean;
  tokens: T[];
  triggerLabel: string;
  value: T;
};

const tokenKey = (token: Token) => `${token.address}-${token.chainId}`;

const matchesQuery = (token: Token, lowerQuery: string) =>
  token.symbol.toLowerCase().includes(lowerQuery) ||
  token.name.toLowerCase().includes(lowerQuery);

const Logo = <T extends Token>({
  showChainLogo,
  size,
  token,
}: {
  showChainLogo: boolean;
  size?: LogoSize;
  token: T;
}) =>
  showChainLogo ? (
    <TokenChainLogo size={size} token={token} />
  ) : (
    <TokenLogo logoURI={token.logoURI} size={size} symbol={token.symbol} />
  );

type ModalContentProps<T extends Token> = {
  onClose: () => void;
  onSelect: (token: T) => void;
  showChainLogo: boolean;
  titleId: string;
  tokens: T[];
};

function ModalContent<T extends Token>({
  onClose,
  onSelect,
  showChainLogo,
  titleId,
  tokens,
}: ModalContentProps<T>) {
  const { t } = useTranslation();
  const { width } = useWindowSize();
  const { height: viewportHeight } = useVisualViewportSize();
  const [query, setQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);

  const isDesktop = width >= screenBreakpoints.md;
  const lowerQuery = query.trim().toLowerCase();
  const hasQuery = lowerQuery.length > 0;
  const visibleTokens = hasQuery
    ? tokens.filter((token) => matchesQuery(token, lowerQuery))
    : tokens;
  const pinnedTokens = !hasQuery && tokens.length > 3 ? tokens.slice(0, 3) : [];
  const showEmpty = hasQuery && visibleTokens.length === 0;

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && visibleTokens.length === 1) {
      onSelect(visibleTokens[0]);
    }
  }

  const useDynamicHeight = !isDesktop && viewportHeight > 0;

  return (
    <div
      className="flex h-[90vh] flex-col p-6 md:h-144 md:w-[400px]"
      style={useDynamicHeight ? { height: viewportHeight } : undefined}
    >
      <div className="flex items-center justify-between pb-4">
        <h4 className="max-md:text-h3 text-gray-900" id={titleId}>
          {t("common.select-token")}
        </h4>
        <button
          aria-label={t("common.close")}
          className="cursor-pointer text-gray-500 transition-colors hover:text-gray-700"
          onClick={onClose}
          type="button"
        >
          <CloseIcon />
        </button>
      </div>
      <SearchInput
        ariaLabel={t("common.search")}
        autoFocus={isDesktop}
        onChange={setQuery}
        onKeyDown={handleSearchKeyDown}
        placeholder={t("common.search-token-placeholder")}
        value={query}
      />
      {pinnedTokens.length > 0 && (
        <>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {pinnedTokens.map((token) => (
              <button
                className="flex cursor-pointer flex-col items-center gap-1 rounded-lg bg-white px-2 py-4 shadow-sm transition-colors hover:bg-gray-50"
                key={tokenKey(token)}
                onClick={() => onSelect(token)}
                type="button"
              >
                <Logo
                  showChainLogo={showChainLogo}
                  size="medium"
                  token={token}
                />
                <span className="text-b-medium text-neutral-950">
                  {token.symbol}
                </span>
              </button>
            ))}
          </div>
          <div className="relative -mx-4 mt-4 border-t border-gray-200 md:-mx-6">
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-x-0 top-full h-3 bg-linear-to-b from-black/5 to-transparent transition-opacity ${
                isScrolled ? "opacity-100" : "opacity-0"
              }`}
            />
          </div>
        </>
      )}
      <div
        className="scrollbar-thin mt-4 -mr-4 -mb-6 flex flex-1 flex-col overflow-y-auto pt-px pr-4 pl-px md:-mr-6 md:pr-6"
        onScroll={(event) => setIsScrolled(event.currentTarget.scrollTop > 0)}
      >
        {showEmpty ? (
          <EmptyState />
        ) : (
          visibleTokens.map((token) => (
            <TokenRow
              key={tokenKey(token)}
              onClick={() => onSelect(token)}
              secondary={
                showChainLogo
                  ? `${token.name} · ${getChainById(token.chainId).name}`
                  : token.name
              }
              showChainLogo={showChainLogo}
              token={token}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function TokenSelectorModal<T extends Token = Token>({
  onChange,
  showChainLogo = false,
  tokens,
  triggerLabel,
  value,
}: Props<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);
  const titleId = useId();
  const hasMultiple = tokens.length > 1;

  useEffect(
    function restoreFocusOnClose() {
      if (wasOpenRef.current && !isOpen) {
        triggerRef.current?.focus();
      }
      wasOpenRef.current = isOpen;
    },
    [isOpen],
  );

  return (
    <>
      <button
        aria-haspopup="dialog"
        aria-label={triggerLabel}
        className={`flex items-center gap-1.5 rounded-full bg-white py-1.5 pr-2 pl-1.5 shadow-sm ${
          hasMultiple
            ? "cursor-pointer text-gray-500 hover:bg-gray-50 hover:text-neutral-900"
            : ""
        }`}
        onClick={() => hasMultiple && setIsOpen(true)}
        ref={triggerRef}
        type="button"
      >
        <Logo showChainLogo={showChainLogo} token={value} />
        <span className="text-sm font-semibold text-gray-900">
          {value.symbol}
        </span>
        {hasMultiple && (
          <div className="flex items-center">
            <ChevronIcon direction={isOpen ? "up" : "down"} />
          </div>
        )}
      </button>

      {isOpen && (
        <Modal ariaLabelledBy={titleId} onClose={() => setIsOpen(false)}>
          {({ close }) => (
            <ModalContent
              onClose={close}
              onSelect={function (token) {
                onChange(token);
                close();
              }}
              showChainLogo={showChainLogo}
              titleId={titleId}
              tokens={tokens}
            />
          )}
        </Modal>
      )}
    </>
  );
}

import { formatUnits } from "viem";

import { useEthPrice } from "./useEthPrice";
import { useMainnet } from "./useMainnet";

type Props = {
  fees: bigint | undefined;
  isError: boolean;
};

function formatFeeInUsd(feeInUsd: number) {
  if (feeInUsd > 0 && feeInUsd < 0.01) {
    return "<$0.01";
  }
  return `$${feeInUsd.toFixed(2)}`;
}

function calculateFee(fees: bigint, ethPrice: number, decimals: number) {
  const gasInEth = parseFloat(formatUnits(fees, decimals));
  const feeInUsd = gasInEth * ethPrice;

  if (!Number.isFinite(gasInEth) || !Number.isFinite(feeInUsd)) {
    return undefined;
  }

  return formatFeeInUsd(feeInUsd);
}

export function useNetworkFee({ fees, isError: isGasError }: Props) {
  const {
    data: ethPrice,
    isError: isPriceError,
    isLoading: isPriceLoading,
  } = useEthPrice();
  const { nativeCurrency } = useMainnet();

  const isError = isGasError || isPriceError;
  const canCalculate =
    fees !== undefined && ethPrice !== undefined && Number.isFinite(ethPrice);

  if (canCalculate) {
    const formattedFee = calculateFee(fees, ethPrice, nativeCurrency.decimals);
    if (formattedFee !== undefined) {
      return { data: formattedFee, isError: false, isLoading: false };
    }
    return { data: undefined, isError: true, isLoading: false };
  }

  if (isError) {
    return { data: undefined, isError: true, isLoading: false };
  }

  return {
    data: undefined,
    isError: false,
    isLoading: isPriceLoading || fees === undefined,
  };
}

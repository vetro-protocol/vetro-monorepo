import { formatUnits } from "viem";

import { useEthPrice } from "./useEthPrice";
import { useMainnet } from "./useMainnet";

type Props = {
  fees: bigint | undefined;
  isError: boolean;
};

export function useNetworkFee({ fees, isError: isGasError }: Props) {
  const {
    data: ethPrice,
    isError: isPriceError,
    isLoading: isPriceLoading,
  } = useEthPrice();
  const { nativeCurrency } = useMainnet();

  const isError = isGasError || isPriceError;

  if (fees !== undefined && ethPrice !== undefined) {
    const gasInEth = parseFloat(formatUnits(fees, nativeCurrency.decimals));
    const feeInUsd = gasInEth * ethPrice;

    const formattedFee =
      feeInUsd > 0 && feeInUsd < 0.01 ? "<$0.01" : `$${feeInUsd.toFixed(2)}`;

    return { data: formattedFee, isError: false, isLoading: false };
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

import { useQuery } from "@tanstack/react-query";
import { veVetroConfigOptions } from "hooks/useVeVetroConfig";

export const useVeVetroRequireTermsSignature = () =>
  useQuery({
    ...veVetroConfigOptions(),
    select: ({ requireTermsSignature }) => requireTermsSignature,
  });

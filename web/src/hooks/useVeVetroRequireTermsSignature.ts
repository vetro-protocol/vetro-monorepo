import { useQuery } from "@tanstack/react-query";
import { useHemiClient } from "hooks/useHemiClient";
import { veVetroConfigOptions } from "hooks/useVeVetroConfig";

export function useVeVetroRequireTermsSignature() {
  const client = useHemiClient();
  return useQuery({
    ...veVetroConfigOptions(client),
    select: ({ requireTermsSignature }) => requireTermsSignature,
  });
}

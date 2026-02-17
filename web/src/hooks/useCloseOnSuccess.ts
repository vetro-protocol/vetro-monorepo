import { useEffect } from "react";

export const useCloseOnSuccess = function ({
  onClose,
  success,
}: {
  onClose: VoidFunction;
  success: boolean;
}) {
  useEffect(
    function closeDrawerOnSuccess() {
      if (!success) {
        return undefined;
      }
      const timeoutId = setTimeout(onClose, 3000);
      return () => clearTimeout(timeoutId);
    },
    [onClose, success],
  );
};

interface Window {
  umami?: {
    track: {
      (
        payload: (props: Record<string, unknown>) => Record<string, unknown>,
      ): void;
      (eventName: string, eventData?: Record<string, unknown>): void;
    };
  };
}

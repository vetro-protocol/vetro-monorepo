export const GlobeIllustration = ({ className }: { className?: string }) => (
  <div className={`relative ${className ?? ""}`}>
    <img alt="" src="/pageBackground.svg" />
    <img
      alt=""
      className="absolute right-0 bottom-0 left-0"
      src="/squareDotsBackground.svg"
    />
  </div>
);

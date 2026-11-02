const path =
  "M14 1.75C20.7655 1.75 26.25 7.23451 26.25 14C26.25 20.7655 20.7655 26.25 14 26.25C7.23451 26.25 1.75 20.7655 1.75 14C1.75 7.23451 7.23451 1.75 14 1.75ZM20 7.5a1 1 0 0 1 1 1v1.573a1 1 0 0 1-.31.724L16 15.222v2.928a1 1 0 0 1-.553.894l-2 1A1 1 0 0 1 12 19.15V15.222L7.31 10.797A1 1 0 0 1 7 10.073V8.5a1 1 0 0 1 1-1h12Z";

export const FunnelCircleIcon = () => (
  <svg
    aria-hidden="true"
    fill="none"
    height="28"
    viewBox="0 0 28 28"
    width="28"
    xmlns="http://www.w3.org/2000/svg"
  >
    <mask fill="white" id="funnel-circle-icon-mask">
      <path d={path} fillRule="evenodd" />
    </mask>
    <path d={path} fill="#EAF4FF" fillRule="evenodd" />
    <path
      d={path}
      mask="url(#funnel-circle-icon-mask)"
      stroke="#416BFF"
      strokeWidth="2"
    />
  </svg>
);

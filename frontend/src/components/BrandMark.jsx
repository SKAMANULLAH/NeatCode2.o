function BrandMark({ size = 32, className = "" }) {
  const height = size;
  const width = Math.round((size * 86) / 52);

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 86 52"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <rect width="86" height="52" rx="12" className="fill-primary" />
      <g className="stroke-primary-content" strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M12 16L5 26L12 36"
          fill="none"
          strokeWidth="2.6"
        />
        <path
          d="M18 13h7.4L30 26.2V13h7.2v26h-7.4L25.4 25.8V39H18V13z"
          className="fill-primary-content"
          stroke="none"
        />
        <path
          d="M64 16.4A11.4 12.8 0 1 0 64 35.6"
          fill="none"
          strokeWidth="2.7"
        />
        <path
          d="M76 16L83 26L76 36"
          fill="none"
          strokeWidth="2.6"
        />
      </g>
    </svg>
  );
}

export default BrandMark;

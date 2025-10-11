import * as React from "react";

const ArrowLeftSvgComponent = (
  props: React.SVGProps<SVGSVGElement> & {
    pathProps?: React.SVGProps<SVGPathElement>;
  },
) => {
  const { pathProps, ...svgProps } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={28}
      height={28}
      fill="none"
      {...svgProps}
    >
      <path
        fill="currentColor"
        d="m16 19-5-5 5-5 1.167 1.167L13.333 14l3.834 3.833L16 19Z"
        {...pathProps}
      />
    </svg>
  );
};
export default ArrowLeftSvgComponent;

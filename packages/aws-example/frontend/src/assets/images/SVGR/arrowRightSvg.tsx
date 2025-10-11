import * as React from "react";

const ArrowRightSvgComponent = (
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
        d="m12 9 5 5-5 5-1.167-1.167L14.667 14l-3.834-3.833L12 9Z"
        {...pathProps}
      />
    </svg>
  );
};
export default ArrowRightSvgComponent;

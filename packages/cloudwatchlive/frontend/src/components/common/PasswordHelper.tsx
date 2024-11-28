import React from "react";
import TinyTickSvgComponent from "@/components/icons/TinyTickSvgComponent";
import { ValidatePWResult } from "shared/functions/cwlAuthValidatePassword";

interface PasswordHelperProps {
  validateResult: ValidatePWResult;
}

const PasswordHelper: React.FC<PasswordHelperProps> = ({ validateResult }) => {
  return (
    <div className="mt-2">
      <span className="text-neutral-800 font-semibold text-body02 mb-2">
        A password must:
      </span>
      {validateResult.map((validation) => (
        <div
          key={validation.message}
          className="flex items-center flex-row text-body03 text-neutral-600 font-regular mt-1"
        >
          <TinyTickSvgComponent
            className="mt-[4.5px] mr-2"
            fill={validation.satisfied ? "#00B754" : "#BFBFBF"}
          />
          {validation.message}
        </div>
      ))}
    </div>
  );
};

export default PasswordHelper;

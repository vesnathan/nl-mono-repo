import { LoginController } from "@/hooks/useLoginController";
import React from "react";
import { CWLButton } from "../common/CWLButton";
import { CWLTextField } from "../common/CWLTextField";

type Props = {
  loginController: LoginController;
};

export const TOTPForm: React.FC<Props> = ({ loginController }) => {
  const { errorMessage, TOTPCode, setTOTPCode, confirmSignInMutation } =
    loginController;
  return (
    <div className="p-5">
      <div className="my-5">
        <div className="text-neutral-700 text-body2 font-regular text-left">
          Please enter the code from your authentication Application
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <CWLTextField
          label="TOTP Code"
          testId="TOTP-code-input"
          value={TOTPCode}
          onClear={() => setTOTPCode("")}
          onChange={(e) => setTOTPCode(e.target.value)}
          placeholder="Enter the code from your Authenticator app"
        />

        <div className="text-error-500 text-body2">{errorMessage}</div>

        <CWLButton
          buttonText="Submit"
          additionalClassName="w-[140px] m-auto h-[40px]"
          isDisabled={confirmSignInMutation.isPending}
          onClick={() => {
            confirmSignInMutation.mutate({
              challengeResponse: TOTPCode,
              challengeType: "TOTP",
            });
          }}
        />
      </div>
    </div>
  );
};

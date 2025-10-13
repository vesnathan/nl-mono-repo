import { LoginController } from "@/hooks/useLoginController";
import { useEnterKeySubmit } from "@/hooks/useEnterKeySubmit";
import React from "react";
import { ANAButton } from "@/components/common/ANAButton";
import { ANATextField } from "@/components/common/ANATextField";

type Props = {
  loginController: LoginController;
};

export const TOTPForm: React.FC<Props> = ({ loginController }) => {
  const { errorMessage, TOTPCode, setTOTPCode, confirmSignInMutation } =
    loginController;

  const handleSubmit = () => {
    confirmSignInMutation.mutate({
      challengeResponse: TOTPCode,
      challengeType: "TOTP",
    });
  };

  useEnterKeySubmit({
    onSubmit: handleSubmit,
    isDisabled: confirmSignInMutation.isPending,
  });

  return (
    <div className="p-5">
      <div className="my-5">
        <div className="text-neutral-700 text-body2 font-regular text-left">
          Please enter the code from your authentication Application
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <ANATextField
          label="TOTP Code"
          testId="TOTP-code-input"
          value={TOTPCode}
          onClear={() => setTOTPCode("")}
          onChange={(e) => setTOTPCode(e.target.value)}
          placeholder="Enter the code from your Authenticator app"
        />

        <div className="text-error-500 text-body2">{errorMessage}</div>

        <ANAButton
          buttonText="Submit"
          additionalClassName="w-[140px] m-auto h-[40px]"
          isDisabled={confirmSignInMutation.isPending}
          onClick={handleSubmit}
        />
      </div>
    </div>
  );
};

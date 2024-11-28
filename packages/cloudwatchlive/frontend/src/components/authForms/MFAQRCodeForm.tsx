/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { CWLButton } from "@/components/common/CWLButton";
import { CWLTextField } from "@/components/common/CWLTextField";
import environment, { IS_PRODUCTION } from "@/config/masterConfig";

export type VerifyArgs = {
  FriendlyDeviceName: string;
  UserCode: string;
};

type Props = {
  associateToken: string;
  email: string;
  handleLogout: () => void;
  onVerify: (args: VerifyArgs) => void;
  isLoading: boolean;
};
const generateQR = async (text: string, email: string) => {
  try {
    return await QRCode.toDataURL(
      `otpauth://totp/Financial%20Training%20Australia${
        IS_PRODUCTION ? "" : `%20${environment}`
      }:${email}?secret=${text}&issuer=Personal%20Financial%20Health`,
    );
  } catch (error) {
    console.error("Error generating QR code", error);
  }
  return null;
};

export const MFAQRCodeForm: React.FC<Props> = ({
  associateToken,
  onVerify,
  email,
  handleLogout,
  isLoading,
}) => {
  const [qrCode, setQRCode] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  useEffect(() => {
    const generateQRCode = async () => {
      const code = await generateQR(associateToken, email);
      setQRCode(code);
    };

    generateQRCode();
  }, [associateToken, email]);

  return (
    <form
      data-testid="MFAQRCodeForm"
      className="px-6 pb-6"
      onSubmit={(e) => {
        e.preventDefault();
        onVerify({
          FriendlyDeviceName: deviceName || "",
          UserCode: totpCode || "",
        });
      }}
    >
      <div className="my-5">
        <div className="text-neutral-700 text-body2 font-regular text-left">
          <p>
            For enhanced security and to protect your information, we are
            implementing Multi-Factor Authentication (MFA).
          </p>
          <p className="mt-2">
            Please scan the below QR code with your Authenticator App (we
            recommend Google Authenticator or Microsoft Authenticator) to
            generate a verification code.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 items-center">
        {qrCode && <img src={qrCode} width="150" alt="QR Code" />}
        <CWLTextField
          value={totpCode || ""}
          testId="TOTP-code-input"
          placeholder="Enter the verification code"
          onChange={(e) => {
            setTotpCode(e.target.value);
          }}
        />
        <CWLTextField
          value={deviceName || ""}
          testId="device-name-input"
          placeholder="Enter your device name"
          onChange={(e) => {
            setDeviceName(e.target.value);
          }}
        />
        <CWLButton
          buttonText="Submit"
          additionalClassName="w-[140px] h-[40px]"
          isDisabled={!totpCode || isLoading}
        />
        <CWLButton
          buttonText="Sign out"
          color="secondary"
          additionalClassName="w-[140px] m-auto h-[40px]"
          onClick={() => {
            handleLogout();
          }}
        />
      </div>
    </form>
  );
};

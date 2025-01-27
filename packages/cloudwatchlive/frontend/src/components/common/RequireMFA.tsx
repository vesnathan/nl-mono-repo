"use client";

import React, { useState } from "react";
import { fetchAuthSession, fetchMFAPreference } from "aws-amplify/auth";
import {
  MFAQRCodeForm,
  VerifyArgs,
} from "@/components/authForms/MFAQRCodeForm";
import RegistrationLayout from "@/components/layout/RegistrationLayout";
import { useUserStore } from "@/stores/userStore";
import {
  adminSetUserMFAPreferenceMutationVariables,
  associateSoftwareTokenMutationVariables,
} from "@/graphql/gqlTypes";
import {
  adminSetUserMFAPreferenceMutationFn,
  associateSoftwareTokenMutationFn,
  verifySoftwareTokenMutationFn,
} from "@/graphql/mutations/userMutations";
import { useGraphqlMutation } from "@/hooks/useGraphQlMutation";
import { useEffectOnce } from "@/hooks/useEffectOnce";
import { Progress } from "@nextui-org/react";
import { useLogoutFn } from "@/hooks/useLogoutFn";

type Props = {
  children: React.ReactNode;
};

const RequireMFA = ({ children }: Props) => {
  const logout = useLogoutFn();
  const [isMFAEnabled, setIsMFAEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [associateToken, setAssociateToken] = useState<string>("");
  const { userId } = useUserStore(({ user }) => user);
  const userEmail = useUserStore(({ user }) => user.userEmail);

  const adminSetUserMFAPreferenceMutation = useGraphqlMutation({
    onSuccess: () => {
      setIsMFAEnabled(true);
    },
    invalidateKeys: [],
    mutationFn: async (
      variables: adminSetUserMFAPreferenceMutationVariables,
    ) => {
      return adminSetUserMFAPreferenceMutationFn({ variables });
    },
  });

  const associateSoftwareTokenMutation = useGraphqlMutation({
    onSuccess: ({ data }) => {
      setAssociateToken(data.associateSoftwareToken.secretCode);
      setLoading(false);
    },
    onError(error) {
      console.error(error);
    },
    invalidateKeys: [],
    mutationFn: async (variables: associateSoftwareTokenMutationVariables) => {
      return associateSoftwareTokenMutationFn({ variables });
    },
  });

  const myAssociateSoftwareTokenFn = async () => {
    const session = await fetchAuthSession();
    const accessToken = session.tokens?.accessToken;
    associateSoftwareTokenMutation.mutate({
      accessToken: accessToken?.toString() || "",
    });
  };

  const verifySoftwareTokenMutation = useGraphqlMutation({
    onSuccess: () => {
      adminSetUserMFAPreferenceMutation.mutate({
        input: {
          userId,
          userEmail,
        },
      });
    },
    invalidateKeys: [],
    mutationFn: async (input: VerifyArgs) => {
      const session = await fetchAuthSession();
      const accessToken = session.tokens?.accessToken;
      return verifySoftwareTokenMutationFn({
        variables: {
          input: {
            AccessToken: accessToken?.toString() || "",
            FriendlyDeviceName: input.FriendlyDeviceName,
            UserCode: input.UserCode,
          },
        },
      });
    },
  });

  useEffectOnce(() => {
    const checkMFA = async () => {
      const mfaPreference = await fetchMFAPreference();
      setIsMFAEnabled(mfaPreference.enabled?.includes("TOTP") || false);
      if (!isMFAEnabled) {
        await myAssociateSoftwareTokenFn();
      } else {
        setLoading(false);
      }
    };

    checkMFA();
  });

  if (loading) {
    return (
      <Progress size="sm" isIndeterminate aria-label="Loading user data" />
    );
  }

  if (!isMFAEnabled) {
    return (
      <RegistrationLayout>
        <MFAQRCodeForm
          associateToken={associateToken}
          onVerify={(input) => verifySoftwareTokenMutation.mutate(input)}
          isLoading={
            verifySoftwareTokenMutation.isPending ||
            verifySoftwareTokenMutation.isSuccess
          }
          email={userEmail}
          handleLogout={logout}
        />
      </RegistrationLayout>
    );
  }

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{children}</>;
};

export default RequireMFA;

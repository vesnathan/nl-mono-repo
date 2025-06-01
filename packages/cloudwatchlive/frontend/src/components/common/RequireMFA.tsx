"use client";

import React from "react";

type Props = {
  children: React.ReactNode;
};

const RequireMFA = ({ children }: Props) => {
  // TODO: Re-implement MFA functionality when needed
  // For now, just render children to avoid build errors from missing mutations
  
  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{children}</>;
};

export default RequireMFA;

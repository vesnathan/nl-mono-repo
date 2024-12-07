"use client";

import { MainLayout } from "@/components/layout/MainLayout/MainLayout";

import React, { PropsWithChildren } from "react";

const CWLMainLayout: React.FC<PropsWithChildren> = ({
  children,
  ...sharedLayoutProps
}) => {
  return <MainLayout {...sharedLayoutProps}>{children}</MainLayout>;
};

export default CWLMainLayout;

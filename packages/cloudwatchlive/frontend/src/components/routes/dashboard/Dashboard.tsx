"use client";

import React from "react";
import { useUserStore } from "@/stores/userStore";
import { ClientType } from "../../../types/gqlTypes";

export const Dashboard = () => {
  const { user } = useUserStore();
  const isSuperAdmin = user.clientType.includes(ClientType.SuperAdmin);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p>Welcome, {user.userFirstName}!</p>
    </div>
  );
};

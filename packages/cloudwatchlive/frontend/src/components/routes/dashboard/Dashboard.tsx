"use client";

import React from "react";
import { useUserStore } from "@/stores/userStore";
// ClientType import removed as Dashboard doesn't use it

export const Dashboard = () => {
  const { user } = useUserStore();
  // isSuperAdmin removed — not used by Dashboard UI currently

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p>Welcome, {user.userFirstName}!</p>
    </div>
  );
};

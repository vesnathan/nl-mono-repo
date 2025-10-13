export type AWSEUser = {
  id: string;
  email?: string | null;
  clientType?: string | null;
  createdAt?: string | null;
};

export const AWSEUserSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    email: { type: ["string", "null"] },
    clientType: { type: ["string", "null"] },
    createdAt: { type: ["string", "null"] },
  },
  required: ["id"],
} as const;

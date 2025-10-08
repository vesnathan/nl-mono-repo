import { z } from "zod";

export function addRequiredValidation(
  ctx: z.RefinementCtx,
  val: unknown,
  path: string | (string | number)[],
  message: string,
) {
  if (val === null || val === undefined || val === "" || Number.isNaN(val)) {
    ctx.addIssue({
      path: typeof path === "string" ? [path] : path,
      code: z.ZodIssueCode.custom,
      message,
    });
  }
}

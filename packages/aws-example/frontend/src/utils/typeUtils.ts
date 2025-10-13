/**
 * When access array item, it could be out of bound
 * e.g:
 *  x = [1,2,3,4]
 *  y = x[4] // undefined
 * However, typescript cannot catch this and infer y as number instead of number | undefined.
 * Use this function to cast the type of y to number | undefined
 */
export function maybe<T>(value: T): T | undefined {
  return value;
}

/**
 * A typescript trick to make sure all possible value of switch-case are handled
 * https://dev.to/babak/exhaustive-type-checking-with-typescript-4l3f
 */
export const exhaustiveCheck = (value: never, valueName: string) => {
  // eslint-disable-next-line no-console
  console.error(`Unhandled ${valueName} case: ${String.apply(value)}`);
};

// helper for Object.keys to return keyof value instead of string[]
export function keysOf<T extends string>(
  value: Partial<Record<T, unknown>>,
): T[] {
  return Object.keys(value) as T[];
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function isEnum<TEnumKey extends string, TEnumVal extends string>(
  enumValues: { [K in TEnumKey]: TEnumVal },
  val: unknown,
): val is TEnumVal {
  return Object.values(enumValues).includes(val);
}

import { StackType } from "../types";

/**
 * Map internal StackType to a short appName used in CloudFormation export names.
 * Keep mappings explicit so future clones can add entries.
 */
export function getAppNameForStackType(stackType: StackType): string {
  switch (stackType) {
    case StackType.AwsExample:
      return "awse";
    case StackType.CWL:
      return "cwl";
    case StackType.WAF:
      return "waf";
    case StackType.TheStoryHub:
      return "tsh";
    default:
      return "shared";
  }
}

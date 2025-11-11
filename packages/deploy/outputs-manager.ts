import { writeFile, readFile, mkdir } from "fs/promises";
import { join } from "path";
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";
import { logger } from "./utils/logger";
import { StackType, getStackName } from "./types";

export interface StackOutput {
  OutputKey: string;
  OutputValue: string;
  Description?: string;
  ExportName?: string;
}

export interface StageDeploymentOutputs {
  lastUpdated: string;
  stacks: Partial<
    Record<
      StackType,
      {
        region: string;
        stackName: string;
        outputs: StackOutput[];
      }
    >
  >;
}

export interface DeploymentOutputs {
  stages: Record<string, StageDeploymentOutputs>;
}

export class OutputsManager {
  private outputsFilePath: string;

  constructor() {
    this.outputsFilePath = join(__dirname, "deployment-outputs.json");
  }

  async saveStackOutputs(
    stackType: StackType,
    stage: string,
    region: string,
  ): Promise<void> {
    try {
      const stackName = getStackName(stackType, stage);

      // Use the correct region for each stack type
      const stackRegion = stackType === StackType.WAF ? "us-east-1" : region;
      const cfClient = new CloudFormationClient({ region: stackRegion });

      logger.debug(
        `Fetching outputs for ${stackType} stack: ${stackName} in region ${stackRegion}`,
      );

      const command = new DescribeStacksCommand({ StackName: stackName });
      const response = await cfClient.send(command);

      const stack = response.Stacks?.[0];
      if (!stack?.Outputs) {
        logger.warning(`No outputs found for stack ${stackName}`);
        return;
      }

      const outputs: StackOutput[] = stack.Outputs.map((output) => ({
        OutputKey: output.OutputKey || "",
        OutputValue: output.OutputValue || "",
        Description: output.Description,
        ExportName: output.ExportName,
      }));

      // Load existing outputs (handles nested stages structure)
      let deploymentOutputs: DeploymentOutputs;
      try {
        const existingContent = await readFile(this.outputsFilePath, "utf8");
        const parsed = JSON.parse(existingContent);

        // Handle migration from old format
        if ("stage" in parsed && "stacks" in parsed && !("stages" in parsed)) {
          // Old format: { stage, lastUpdated, stacks }
          deploymentOutputs = {
            stages: {
              [parsed.stage]: {
                lastUpdated: parsed.lastUpdated,
                stacks: parsed.stacks,
              },
            },
          };
        } else {
          deploymentOutputs = parsed;
        }
      } catch {
        deploymentOutputs = {
          stages: {},
        };
      }

      // Initialize stage if it doesn't exist
      if (!deploymentOutputs.stages[stage]) {
        deploymentOutputs.stages[stage] = {
          lastUpdated: new Date().toISOString(),
          stacks: {},
        };
      }

      // Update the specific stack outputs for this stage
      deploymentOutputs.stages[stage].stacks[stackType] = {
        region: stackRegion,
        stackName,
        outputs,
      };
      deploymentOutputs.stages[stage].lastUpdated = new Date().toISOString();

      // Ensure directory exists
      await mkdir(join(__dirname), { recursive: true });

      // Save updated outputs
      await writeFile(
        this.outputsFilePath,
        JSON.stringify(deploymentOutputs, null, 2),
      );

      logger.debug(
        `Saved outputs for ${stackType} stack to ${this.outputsFilePath}`,
      );
      logger.debug(`Found ${outputs.length} outputs for ${stackType} stack`);
    } catch (error: unknown) {
      logger.error(
        `Failed to save outputs for ${stackType} stack: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async removeStackOutputs(stackType: StackType, stage: string): Promise<void> {
    try {
      let deploymentOutputs: DeploymentOutputs;
      try {
        const existingContent = await readFile(this.outputsFilePath, "utf8");
        deploymentOutputs = JSON.parse(existingContent);
      } catch {
        // File doesn't exist, nothing to remove
        logger.warning(
          `Outputs file not found at ${this.outputsFilePath}. Nothing to remove.`,
        );
        return;
      }

      if (deploymentOutputs.stages?.[stage]?.stacks[stackType]) {
        delete deploymentOutputs.stages[stage].stacks[stackType];
        deploymentOutputs.stages[stage].lastUpdated = new Date().toISOString();

        await writeFile(
          this.outputsFilePath,
          JSON.stringify(deploymentOutputs, null, 2),
        );
        logger.success(
          `Removed outputs for ${stackType} stack from ${this.outputsFilePath}`,
        );
      } else {
        logger.info(
          `No outputs found for ${stackType} in stage ${stage} to remove.`,
        );
      }
    } catch (error: unknown) {
      logger.error(
        `Failed to remove outputs for ${stackType} stack: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async getStackOutputs(
    stackType: StackType,
    stage: string,
  ): Promise<StackOutput[] | null> {
    try {
      const content = await readFile(this.outputsFilePath, "utf8");
      const deploymentOutputs: DeploymentOutputs = JSON.parse(content);

      if (!deploymentOutputs.stages?.[stage]) {
        logger.warning(`No outputs found for stage ${stage}`);
        return null;
      }

      return deploymentOutputs.stages[stage].stacks[stackType]?.outputs || null;
    } catch (error: unknown) {
      logger.warning(
        `Could not read outputs for ${stackType}: ${(error as Error).message}`,
      );
      return null;
    }
  }

  async getOutputValue(
    stackType: StackType,
    stage: string,
    outputKey: string,
  ): Promise<string | null> {
    const outputs = await this.getStackOutputs(stackType, stage);
    if (!outputs) return null;

    const output = outputs.find((o) => o.OutputKey === outputKey);
    return output?.OutputValue || null;
  }

  /**
   * Search stored outputs for any output whose ExportName or OutputKey matches
   * one of the provided candidate names. Returns the OutputValue of the first
   * match or null if none found.
   */
  async findOutputValueByCandidates(
    stage: string,
    candidateNames: string[],
  ): Promise<string | null> {
    try {
      const content = await readFile(this.outputsFilePath, "utf8");
      const deploymentOutputs: DeploymentOutputs = JSON.parse(content);

      if (!deploymentOutputs.stages?.[stage]) {
        logger.warning(`No outputs found for stage ${stage}`);
        return null;
      }

      const stacks = deploymentOutputs.stages[stage].stacks || {};

      for (const stackKey of Object.keys(stacks) as StackType[]) {
        const stackOutputs = stacks[stackKey]?.outputs || [];
        for (const out of stackOutputs) {
          const exportName = out.ExportName || "";
          const outputKey = out.OutputKey || "";
          if (
            candidateNames.includes(exportName) ||
            candidateNames.includes(outputKey)
          ) {
            return out.OutputValue || null;
          }
        }
      }

      return null;
    } catch (error: unknown) {
      logger.warning(
        `Could not read deployment outputs for candidate search: ${(error as Error).message}`,
      );
      return null;
    }
  }

  async getAllOutputs(stage: string): Promise<StageDeploymentOutputs | null> {
    try {
      const content = await readFile(this.outputsFilePath, "utf8");
      const deploymentOutputs: DeploymentOutputs = JSON.parse(content);

      if (!deploymentOutputs.stages?.[stage]) {
        logger.warning(`No outputs found for stage ${stage}`);
        return null;
      }

      return deploymentOutputs.stages[stage];
    } catch (error: unknown) {
      logger.warning(
        `Could not read deployment outputs: ${(error as Error).message}`,
      );
      return null;
    }
  }

  async validateStackExists(
    stackType: StackType,
    stage: string,
  ): Promise<boolean> {
    try {
      const stackName = getStackName(stackType, stage);
      const stackRegion =
        stackType === StackType.WAF ? "us-east-1" : "ap-southeast-2";
      const cfClient = new CloudFormationClient({ region: stackRegion });

      const command = new DescribeStacksCommand({ StackName: stackName });
      const response = await cfClient.send(command);

      const stack = response.Stacks?.[0];
      const status = stack?.StackStatus;

      // Consider stack as existing and healthy if in these states
      const healthyStates = [
        "CREATE_COMPLETE",
        "UPDATE_COMPLETE",
        "UPDATE_ROLLBACK_COMPLETE",
      ];

      return healthyStates.includes(status || "");
    } catch (error: unknown) {
      // Type guard for error name and message (assuming error is an object with name and message properties)
      if (
        typeof error === "object" &&
        error !== null &&
        "name" in error &&
        "message" in error &&
        (error as { name: string }).name === "ValidationError" &&
        (error as { message: string }).message.includes("does not exist")
      ) {
        return false;
      }
      logger.warning(
        `Error checking stack ${stackType}: ${(error as Error).message}`,
      );
      return false;
    }
  }

  async clearOutputs(stage: string): Promise<void> {
    try {
      const content = await readFile(this.outputsFilePath, "utf8");
      const deploymentOutputs: DeploymentOutputs = JSON.parse(content);

      // Remove only the specified stage
      if (deploymentOutputs.stages?.[stage]) {
        delete deploymentOutputs.stages[stage];
        await writeFile(
          this.outputsFilePath,
          JSON.stringify(deploymentOutputs, null, 2),
        );
        logger.info(`Cleared deployment outputs for stage ${stage}`);
      } else {
        logger.warning(`No outputs found for stage ${stage} to clear`);
      }
    } catch {
      // File doesn't exist, create empty structure
      const emptyOutputs: DeploymentOutputs = {
        stages: {},
      };
      await writeFile(
        this.outputsFilePath,
        JSON.stringify(emptyOutputs, null, 2),
      );
      logger.info(`Initialized empty deployment outputs file`);
    }
  }
}

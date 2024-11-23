import { spawn } from "child_process";

export const execCommandAsPromise = (
  command: string,
  options: {
    captureStdOut?: boolean;
  } = {},
) => {
  const { captureStdOut } = options;
  return new Promise<string>((resolve, reject) => {
    let stdOut: string = "";
    const childProcess = spawn(command, {
      shell: true,
      stdio: ["inherit", captureStdOut ? "pipe" : "inherit", "inherit"],
    });

    if (captureStdOut) {
      childProcess.stdout?.on("data", (data) => {
        const dataString: string = data.toString();
        stdOut += dataString;
      });
    }
    childProcess.on("error", reject);

    childProcess.on("close", (code) => {
      if (code === 0) {
        resolve(stdOut);
      } else {
        reject(Error(`Child process exited with code ${code}`));
      }
    });
  });
};

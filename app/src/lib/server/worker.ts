import { promisify } from "util";
import { exec } from "child_process";

const execAsync = promisify(exec);

export async function runJob(jobName: string, id: string, config: string) {
    const tags = JSON.stringify({ "dagster/partition": id });
    const command = `dagster job launch -w workspace.yaml -j ${jobName} --config-json '${config}' --tags '${tags}'`;
    const options = { cwd: "/workspace/worker" };

    try {
        console.info(`Running command: ${command}`);
        await execAsync(command, options);
    }
    catch (error) {
        console.error(error);
    }
}

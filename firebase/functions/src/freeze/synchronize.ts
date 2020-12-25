import { Octokit } from "@octokit/rest";
import { getPullRequests } from "../github/helpers/api";
import { Persistence } from "./persistence";

export async function synchronizeCheckRuns(
  octokit: Octokit,
  persistence: Persistence
) {
  const hooks = await persistence.getHooks();

  return hooks.map(async ({ checkData, hookRef }) => {
    const check = await octokit.checks.get(checkData);
    const pullRequests = await getPullRequests(check.data, {
      octokit,
      checkData,
    });
    const [checkAttributes, shouldKeepHook] = persistence.getCheckStatus(
      pullRequests
    );

    await octokit.checks.update({
      ...checkData,
      ...checkAttributes,
    });

    return persistence.onSyncCheck(checkData, hookRef, shouldKeepHook);
  });
}
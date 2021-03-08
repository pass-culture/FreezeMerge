import { Octokit } from "@octokit/rest";
import { logger } from "firebase-functions";
import { getPullRequests } from "../github/helpers/api";
import { askHookToBeSynchronized } from "./hooksPubSub";
import { Persistence } from "./persistence";

export async function synchronizeCheckRuns(persistence: Persistence) {
  const hooks = await persistence.getHooks();
  logger.info(`Start synchronization of ${hooks.length} hooks`);

  await Promise.all(
    hooks.map(({ hookRef }) =>
      askHookToBeSynchronized({
        controllerId: persistence.ref.id,
        hookId: hookRef.id,
      })
    )
  );
}

export async function synchronizeCheckRun(
  octokit: Octokit,
  persistence: Persistence,
  hookId: string
) {
  logger.info(`Start synchronization of hookId=${hookId}`);
  const { checkData, hookRef } = await persistence.getHook(hookId);

  const check = await octokit.checks.get(checkData);
  const pullRequests = await getPullRequests(check.data, {
    octokit,
    checkData,
  });

  await persistence.synchronizeCheck({
    pullRequests,

    hookRef,

    saveAndBuildHook: async (checkAttributes) => {
      await octokit.checks.update({
        ...checkData,
        ...checkAttributes,
      });

      return checkData;
    },
  });

  logger.info(`End synchronization of hookId=${hookId}`);
  return;
}

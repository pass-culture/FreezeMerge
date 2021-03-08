import { Octokit } from "@octokit/rest";
import { logger } from "firebase-functions";
import { getPullRequests } from "../github/helpers/api";
import { Persistence } from "./persistence";
import { PubSub } from "@google-cloud/pubsub";

const pubSubClient = new PubSub();

export async function synchronizeCheckRuns(
  octokit: Octokit,
  persistence: Persistence
) {
  const hooks = await persistence.getHooks();
  logger.info(`Start synchronization of ${hooks.length} hooks`);

  const topic = pubSubClient.topic("hooks_to_synchronize");
  await Promise.all(
    hooks.map(({ hookRef }) =>
      topic.publish(
        Buffer.from(
          JSON.stringify({
            controllerId: persistence.ref.id,
            hookId: hookRef.id,
          })
        )
      )
    )
  );

  return Promise.all(
    hooks.map(async ({ checkData, hookRef }) => {
      const check = await octokit.checks.get(checkData);
      const pullRequests = await getPullRequests(check.data, {
        octokit,
        checkData,
      });

      return persistence.synchronizeCheck({
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
    })
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

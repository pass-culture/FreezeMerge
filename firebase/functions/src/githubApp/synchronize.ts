import { Octokit } from "@octokit/rest";
import GithubApi from "./helpers/GithubApi";
import { Controller } from "../controllersFirestore/models";
import { logger } from "firebase-functions";

export async function synchronizeCheckRun(
  octokit: Octokit,
  controller: Controller,
  hookId: string
) {
  logger.info(`Start synchronization of hookId=${hookId}`);
  const githubApi = GithubApi(octokit);
  const { checkData, hookRef } = await controller.getHook(hookId);

  const check = await octokit.checks.get(checkData);
  const pullRequests = await githubApi.listChecksPullRequests(
    check.data,
    checkData
  );

  await controller.synchronizeCheck({
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

import { Octokit } from "@octokit/rest";
import { Controller } from "../controllersFirestore/models";
import { logger } from "firebase-functions";

type PullRequest = {
  pull_number: number;
  owner: string;
  repo: string;
};

const buildId = ({ pull_number, owner, repo }: PullRequest) =>
  `/${owner}/${repo}/pulls/${pull_number}`;

export default async function (
  pr: PullRequest,
  octokit: Octokit,
  controller: Controller
) {
  const id = buildId(pr);
  logger.info(`Start synchronization of pullRequest=${id}`);

  const record = await controller.getRecord(id);
  const pullRequest = await octokit.pulls.get(pr);

  const sha = pullRequest.data.head.sha;

  if (pullRequest.data.state !== "open") {
    if (record) {
      // await octokit.checks.update({
      //   owner: pr.owner,
      //   repo: pr.repo,
      //   check_run_id: record.data.checkId,
      //   ...checkRunStatus.notSynced(),
      // });
      await record.ref.delete();
    }
    return;
  }

  // const checkAttributes = buildCheckStatus(controller, pullRequest);

  if (!record) {
    // const check = await octokit.checks.create({
    //   owner: pr.owner,
    //   repo: pr.repo,
    //   head_sha: sha,
    //   name: CHECKS_NAME,
    //   ...checkAttributes,
    // });
    return controller.setRecord(id, {
      sha,
      // checkId: check.data.id,
    });
  } else {
    if (sha !== record.data.sha) {
      // await octokit.checks.update({
      //   owner: pr.owner,
      //   repo: pr.repo,
      //   check_run_id: record.data.checkId,
      //   ...checkRunStatus.notSynced(),
      // });

      // const check = await octokit.checks.create({
      //   owner: pr.owner,
      //   repo: pr.repo,
      //   head_sha: sha,
      //   name: CHECKS_NAME,
      //   ...checkAttributes,
      // });
      return controller.setRecord(id, {
        sha,
        // checkId: check.data.id,
      });
    } else {
      // await octokit.checks.update({
      //   owner: pr.owner,
      //   repo: pr.repo,
      //   check_run_id: record.data.checkId,
      //   ...checkAttributes,
      // });
    }
  }

  logger.info(`End synchronization of pullRequest=${id}`);
  return;
}

import { Probot } from "probot";
import { getCheckForCommit, getPullRequests } from "./helpers/api";
import { getControllerFromProbot } from "./config";

export default (app: Probot) => {
  app.on(["check_suite.requested"], async function (context) {
    const startTime = new Date();

    const controller = getControllerFromProbot(context);

    const checkSuite = context.payload.check_suite;
    const pullRequests = await getPullRequests(checkSuite, context);

    return controller.synchronizeCheck({
      pullRequests,

      saveAndBuildHook: async (checkAttributes) => {
        const checkRun = await context.octokit.checks.create(
          context.repo({
            name: "Freeze Merge",
            head_branch: checkSuite.head_branch,
            head_sha: checkSuite.head_sha,
            status: "completed",
            started_at: startTime.toISOString(),
            ...checkAttributes,
          })
        );

        const hook = context.repo({
          check_run_id: checkRun.data.id,
          link: checkRun.data.url,
        });
        return hook;
      },
    });
  });

  app.on(
    [
      "pull_request.closed",
      "pull_request.opened",
      "pull_request.reopened",
      "pull_request.edited",
      "pull_request.synchronize",
    ],
    async function (context) {
      const controller = await getControllerFromProbot(context);

      const pullRequest = context.payload.pull_request;
      const checkRun = await getCheckForCommit(context, pullRequest.head.sha);
      if (!checkRun) {
        console.log("No check on this PR for now");
        return;
      }

      const checkData = context.repo({
        check_run_id: checkRun.id,
        link: checkRun.url,
      });

      return controller.synchronizeCheck({
        pullRequests: [pullRequest],

        saveAndBuildHook: async (checkAttributes) => {
          await context.octokit.checks.update({
            ...checkData,
            ...checkAttributes,
          });

          return checkData;
        },
      });
    }
  );
};

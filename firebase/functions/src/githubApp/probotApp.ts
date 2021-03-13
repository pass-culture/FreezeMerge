import { Probot } from "probot";
import GithubApi from "./helpers/GithubApi";
import { Controller } from "../controllersFirestore/models";

export default (app: Probot) => {
  app.on(["check_suite.requested"], async function (context) {
    const githubApi = GithubApi(context.octokit);
    const controller = await new Controller(
      context.payload.installation?.id.toString() || ""
    );

    const pullRequests = await githubApi.listChecksPullRequests(
      context.payload.check_suite,
      context.repo()
    );

    return controller.synchronizeCheck({
      pullRequests,

      saveAndBuildHook: async (checkAttributes) => {
        const checkRun = await context.octokit.checks.create(
          context.repo({
            name: "Freeze Merge",
            head_branch: context.payload.check_suite.head_branch,
            head_sha: context.payload.check_suite.head_sha,
            status: "completed",
            started_at: new Date().toISOString(),
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
      const githubApi = GithubApi(context.octokit);
      const controller = await new Controller(
        context.payload.installation?.id.toString() || ""
      );

      const checkRun = await githubApi.listCommitsChecks(
        context.repo({
          ref: context.payload.pull_request.head.sha,
        })
      );
      if (!checkRun) {
        console.log("No check on this PR for now");
        return;
      }

      const checkData = context.repo({
        check_run_id: checkRun.id,
        link: checkRun.url,
      });

      if (context.payload.pull_request.state === "open") {
        return controller.synchronizeCheck({
          pullRequests: [context.payload.pull_request],

          saveAndBuildHook: async (checkAttributes) => {
            await context.octokit.checks.update({
              ...checkData,
              ...checkAttributes,
            });

            return checkData;
          },
        });
      } else {
        return controller.synchronizeCheck({
          pullRequests: [],

          saveAndBuildHook: async (checkAttributes) => {
            await context.octokit.checks.update({
              ...checkData,
              ...checkAttributes,
            });

            return checkData;
          },
        });
      }
    }
  );
};

import { logger } from "firebase-functions";
import { Octokit } from "@octokit/rest";

export default (octokit: Octokit) => ({
  listChecksPullRequests: async function (
    check: {
      head_sha: string;
      pull_requests: { number: number; head: { sha: string } }[];
    },
    repo: { owner: string; repo: string }
  ) {
    const pullRequests = check.pull_requests.filter(
      ({ head }) => head.sha === check.head_sha
    );

    const results = await Promise.all(
      pullRequests.map((pr) =>
        octokit.pulls.get({ ...repo, pull_number: pr.number })
      )
    );

    return results.map(({ data }) => data);
  },

  listCommitsChecks: async function (commit: {
    owner: string;
    repo: string;
    ref: string;
  }) {
    const checkRunsRequest = await octokit.checks.listForRef(commit);
    const checkRuns = checkRunsRequest.data.check_runs.filter(
      ({ app }) => app.owner.login === commit.owner
    );

    if (checkRuns.length === 0) {
      return;
    }
    if (checkRuns.length > 1) {
      logger.warn(
        "Case not implemented: shouldn't have more than one check on a commit"
      );
    }

    return checkRuns[0];
  },
});

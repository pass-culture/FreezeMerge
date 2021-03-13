import * as functions from "firebase-functions";
import { Controller } from "../controllersFirestore/models";
import { ProbotOctokit } from "probot";
import { createAppAuth } from "@octokit/auth-app";

const config = functions.config();

export const probotOptions = {
  appId: config.github.app_id,
  secret: config.github.webhook_secret,
  privateKey: Buffer.from(config.github.private_key, "base64").toString(
    "ascii"
  ),
};

const newOctokit = (installationId: number) =>
  new ProbotOctokit({
    authStrategy: createAppAuth,
    auth: {
      ...probotOptions,
      installationId,
    },
  });

export function getOctokitFromController(controller: Controller) {
  const installationId = parseInt(controller.ref.id);
  return newOctokit(installationId);
}

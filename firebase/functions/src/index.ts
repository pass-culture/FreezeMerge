import * as functions from "firebase-functions";

import { probotApp } from "./github/checkRuns";
import { getOctokitFromController } from "./github/config";
import { serverlessProbot as probotWebhook } from "./github/helpers/webhook";
import { Controller } from "./freeze/persistence";
import {
  synchronizeCheckRuns,
  synchronizeCheckRun,
} from "./freeze/synchronize";
import { slackWebhook } from "./slack/helpers/webhook";
import { CONTROLLERS } from "./freeze/config";
import { onHookToSynchronize } from "./freeze/hooksPubSub";

export const github_webhook = probotWebhook(probotApp);

export const onSynchronisationChange = functions.firestore
  .document(`${CONTROLLERS}/{controllerId}`)
  .onWrite(async (change, context) => {
    const controller = new Controller(change.after);

    return synchronizeCheckRuns(controller);
  });

export const onSynchronizeHook = onHookToSynchronize(
  ({ controllerId, hookId }) => {
    const controller = new Controller(controllerId);
    const octokit = getOctokitFromController(controller);

    return synchronizeCheckRun(octokit, controller, hookId);
  }
);

export const freeze = slackWebhook(async (id) => {
  const controller = new Controller(id);
  await controller.freeze();

  return {
    response_type: "in_channel",
    text: "[FREEZE] Tous les repositories ont été freeze",
  };
});

export const unfreeze = slackWebhook(async (id) => {
  const controller = new Controller(id);
  await controller.unfreeze();

  return {
    response_type: "in_channel",
    text: "[UNFREEZE] Tous les repositories ont été unfreeze",
  };
});

export const whitelist_ticket = slackWebhook(async (id, tag) => {
  const controller = new Controller(id);
  await controller.whitelistTicket(tag);

  return {
    response_type: "in_channel",
    text: `[WHITELIST] Le ticket ${tag} a été whitelisté`,
  };
});

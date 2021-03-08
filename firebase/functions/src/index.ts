import * as functions from "firebase-functions";

import { probotApp } from "./github/checkRuns";
import { getOctokitFromPersistence } from "./github/config";
import { serverlessProbot as probotWebhook } from "./github/helpers/webhook";
import { Persistence } from "./freeze/persistence";
import {
  synchronizeCheckRuns,
  synchronizeCheckRun,
} from "./freeze/synchronize";
import { slackWebhook } from "./slack/helpers/webhook";
import { PERSISTENCES } from "./freeze/config";

const HOOKS_TO_SYNCHRONIZE_TOPIC = "hooks_to_synchronize";

export const github_webhook = probotWebhook(probotApp);

export const onSynchronisationChange = functions.firestore
  .document(`${PERSISTENCES}/{persistenceId}`)
  .onWrite(async (change, context) => {
    const persistence = new Persistence(change.after);
    const octokit = getOctokitFromPersistence(persistence);

    return synchronizeCheckRuns(octokit, persistence);
  });

export const synchronizeHook = functions.pubsub
  .topic(HOOKS_TO_SYNCHRONIZE_TOPIC)
  .onPublish((message) => {
    const { controllerId, hookId } = message.json;
    const persistence = new Persistence(controllerId);
    const octokit = getOctokitFromPersistence(persistence);

    return synchronizeCheckRun(octokit, persistence, hookId);
  });

export const freeze = slackWebhook(async (id) => {
  const persistence = new Persistence(id);
  await persistence.freeze();

  return {
    response_type: "in_channel",
    text: "[FREEZE] Tous les repositories ont été freeze",
  };
});

export const unfreeze = slackWebhook(async (id) => {
  const persistence = new Persistence(id);
  await persistence.unfreeze();

  return {
    response_type: "in_channel",
    text: "[UNFREEZE] Tous les repositories ont été unfreeze",
  };
});

export const whitelist_ticket = slackWebhook(async (id, tag) => {
  const persistence = new Persistence(id);
  await persistence.whitelistTicket(tag);

  return {
    response_type: "in_channel",
    text: `[WHITELIST] Le ticket ${tag} a été whitelisté`,
  };
});

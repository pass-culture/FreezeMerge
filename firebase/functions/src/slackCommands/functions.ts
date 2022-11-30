import { Controller } from "../controllersFirestore/models";
import { slackWebhook } from "./helpers/webhook";

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

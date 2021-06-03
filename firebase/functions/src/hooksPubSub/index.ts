import { PubSub } from "@google-cloud/pubsub";
import { getOctokitFromController } from "../githubApp/config";
import { Controller } from "../controllersFirestore/models";
import { synchronizeCheckRun } from "../githubApp/synchronize";

export const TOPIC_NAME = "hooks_to_synchronize";

type HooksPubSubMessage = {
  controllerId: string;
  hookId: string;
};

const pubSubClient = new PubSub();
const topic = pubSubClient.topic("hooks_to_synchronize");

export const onReceiveMessage = ({
  controllerId,
  hookId,
}: HooksPubSubMessage) => {
  const controller = new Controller(controllerId);
  const octokit = getOctokitFromController(controller);

  return synchronizeCheckRun(octokit, controller, hookId);
};

export const synchronizeHookAsync = (message: HooksPubSubMessage) =>
  topic.publish(Buffer.from(JSON.stringify(message)));

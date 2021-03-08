import * as functions from "firebase-functions";
import { PubSub } from "@google-cloud/pubsub";

const TOPIC_NAME = "hooks_to_synchronize";

type HooksPubSubMessage = {
  controllerId: string;
  hookId: string;
};

const pubSubClient = new PubSub();
const topic = pubSubClient.topic("hooks_to_synchronize");

export const askHookToBeSynchronized = (message: HooksPubSubMessage) =>
  topic.publish(Buffer.from(JSON.stringify(message)));

export const onHookToSynchronize = (
  action: (message: HooksPubSubMessage) => Promise<void>
) =>
  functions.pubsub.topic(TOPIC_NAME).onPublish((message) => {
    const { controllerId, hookId } = message.json;

    return action({ controllerId, hookId });
  });

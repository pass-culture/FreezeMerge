import * as functions from "firebase-functions";
import { TOPIC_NAME, onReceiveMessage } from ".";

export const onSynchronizeHook = functions.pubsub
  .topic(TOPIC_NAME)
  .onPublish((message) => {
    const { controllerId, hookId } = message.json;

    return onReceiveMessage({ controllerId, hookId });
  });

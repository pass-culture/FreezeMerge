import { Controller } from "./models";
import { CONTROLLERS } from "./config";
import { synchronizeHookAsync } from "../hooksPubSub";
import { logger, firestore } from "firebase-functions";

export const onControllerChange = firestore
  .document(`${CONTROLLERS}/{controllerId}`)
  .onWrite(async (change, context) => {
    const controller = new Controller(change.after);

    const hooks = await controller.getHooks();

    logger.info(`Start synchronization of ${hooks.length} hooks`);

    return Promise.all(
      hooks.map(({ hookRef }) =>
        synchronizeHookAsync({
          controllerId: controller.ref.id,
          hookId: hookRef.id,
        })
      )
    );
  });

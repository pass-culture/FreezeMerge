import { Server, Probot } from "probot";
import { probotOptions } from "../config";
import * as functions from "firebase-functions";
import { getLog } from "probot/lib/helpers/get-log";

export const serverlessProbot = (fn: (app: Probot) => void) => {
  const log = getLog({ logLevelInString: true });

  const server = new Server({
    Probot: Probot.defaults({ ...probotOptions, log }),
  });

  server
    .load(fn)
    .catch((error) => console.error(`Error loading probot app ${error}`));

  return functions.https.onRequest(server.expressApp);
};

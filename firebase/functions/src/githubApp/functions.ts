import probotApp from "./probotApp";
import { serverlessProbot as probotWebhook } from "./helpers/webhook";

export const github_webhook = probotWebhook(probotApp);

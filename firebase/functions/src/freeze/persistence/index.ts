import { logger } from "firebase-functions";
import { DocumentSnapshot } from "firebase-functions/lib/providers/firestore";
import { db, HOOKS, CONTROLLERS } from "../config";
import { checkRunStatus, CheckAttributes } from "../checkStatus";
import { extractTags } from "./smartTagExtract";
import admin from "firebase-admin";

interface ControllerData {
  freezed: boolean;
  whitelistedPullRequestUrls: string[];
  whitelistedTickets: string[];
}
type HookData = {
  owner: string;
  repo: string;
  check_run_id: number;
  link: string;
};

export class Controller {
  ref: FirebaseFirestore.DocumentReference;
  _data?: ControllerData;

  constructor(controller: string | DocumentSnapshot) {
    if (typeof controller === "string") {
      this.ref = db.collection(CONTROLLERS).doc(controller);
    } else {
      this.ref = controller.ref;
      this._data = this.extractData(controller);
    }
  }

  async data() {
    if (this._data) return this._data;

    const doc = await this.ref.get();
    return (this._data = this.extractData(doc));
  }

  private extractData(doc: DocumentSnapshot) {
    const data = doc.data();
    if (!data) throw new Error("No installation found ");

    return data as {
      freezed: boolean;
      whitelistedPullRequestUrls: string[];
      whitelistedTickets: string[];
    };
  }

  async getHooks() {
    const checks = await this.ref.collection(HOOKS).get();

    return checks.docs.map((doc) => {
      const checkData = doc.data() as HookData;

      return {
        checkData,
        hookRef: doc.ref,
      };
    });
  }

  async getHook(hookId: string) {
    const doc = await this.ref.collection(HOOKS).doc(hookId).get();
    const checkData = doc.data() as HookData;

    return {
      checkData,
      hookRef: doc.ref,
    };
  }

  freeze() {
    return this.ref.update({ freezed: true });
  }
  unfreeze() {
    return this.ref.update({
      freezed: false,
      whitelistedPullRequestUrls: [],
      whitelistedTickets: [],
    });
  }
  whitelistTicket(tag: string) {
    return this.ref.update({
      whitelistedTickets: admin.firestore.FieldValue.arrayUnion(tag),
    });
  }

  async synchronizeCheck({
    pullRequests,
    saveAndBuildHook,
    hookRef,
  }: {
    pullRequests: {
      title: string;
      url: string;
      number: number;
      head: { sha: string };
      state: string;
    }[];
    saveAndBuildHook: (status: CheckAttributes) => Promise<HookData>;
    hookRef?: FirebaseFirestore.DocumentReference;
  }) {
    const openPullRequests = pullRequests.filter(
      ({ state }) => state === "open"
    );

    if (!openPullRequests.length) {
      const hook = await saveAndBuildHook(checkRunStatus.notSynced());
      if (hookRef) {
        logger.info("Deleting hook", hook);
        return hookRef && hookRef.delete();
      } else {
        logger.info("No hook to delete", hook);
        return;
      }
    } else {
      const {
        freezed,
        whitelistedPullRequestUrls,
        whitelistedTickets,
      } = await this.data();

      let status;

      if (!freezed) status = checkRunStatus.success();

      const whitelistedPullRequest = openPullRequests.find((pr) =>
        whitelistedPullRequestUrls.includes(pr.url)
      );
      if (whitelistedPullRequest)
        status = checkRunStatus.whtelistedPullRequest(
          whitelistedPullRequest.number
        );

      const whitelistedTag = openPullRequests
        .reduce<string[]>((tags, pr) => [...tags, ...extractTags(pr.title)], [])
        .find((tag) => whitelistedTickets.includes(tag));
      if (whitelistedTag)
        status = checkRunStatus.whitelistedTicket(whitelistedTag);

      if (!status) status = checkRunStatus.freezed();

      const hook = await saveAndBuildHook(status);

      if (hookRef) {
        logger.info("Updating hook", hook);
        return hookRef.update(hook);
      } else {
        logger.info("Creating hook", hook);
        return this.ref.collection(HOOKS).add(hook);
      }
    }
  }
}

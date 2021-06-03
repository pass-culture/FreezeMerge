import admin from "firebase-admin";

export const CONTROLLERS = "controllers";
export const HOOKS = "hooks";
export const PULL_REQUESTS = "pullRequests";

admin.initializeApp();
export const db = admin.firestore();

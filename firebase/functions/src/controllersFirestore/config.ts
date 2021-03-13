import admin from "firebase-admin";

export const CONTROLLERS = "controllers";
export const HOOKS = "hooks";

admin.initializeApp();
export const db = admin.firestore();

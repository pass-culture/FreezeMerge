# [Developper] Modify FreezeMerge App

## Setup the repo

Git clone

Npm install

Setup your [firebase tools](https://firebase.google.com/docs/functions/get-started?authuser=0#set-up-node.js-and-the-firebase-cli).

`firebase login`

## Deploy

# [Owner] Create a github FreezeMerge App

First : setup the repo ⬆

## Create a github app

### Create in app in your organization

Follow these steps https://docs.github.com/en/developers/apps/creating-a-github-app

Step 12) Use a temp URL, you will have to fill it later

Step 14) You need to give :

- "Checks" => "Read and Write"
- "Pull requests" => "Read-Only"

Step 15) Suscribe to "Pull requests" events

You will get the APP_ID

### Get the webhook secret

Generate the webhook secret on the webhook section, following the section.

Save it, it's your WEBHOOK_SECRET.

### Get the private key

In your apps settings, find the `Private keys` section and generate one.

Download that key, open in a text editor and copy whole content.

Convert it to base64 : in any node environnement, execute this `Buffer.from(YOUR_KEY, "ascii").toString("base64")` replacing YOUR_KEY with your multiline key.

Save it this is your PRIVATE_KEY.

## Create a firebase project

Create a [firebase project](https://firebase.google.com/docs/functions/get-started?authuser=0#create-a-firebase-project).
Keep your PROJECT_ID for next step.

Correct file `firebase/.firebaserc`: value on path `projects.default` should be your PROJECT_ID

(in /firebase) `firebase functions:config:set github.app_id="GITHUB_APP_ID" github.webhook_secret="GITHUB_WEBHOOK_SECRET" github.private_key="GITHUB_PRIVATE_KEY"`

(in /firebase) `firebase deploy`

## Link the github app to the firebase project

In the `Functions` section of your firebase project, get the url of your `github_webhook` function.

Replace the temp url you put as webhook url in your github settings.

# Install an app on a github repo (= consummer)

In the settings of the application, you can choose a repo on which install the app.

Get the installation id on the installation page (url) and use it on your controller (see below).

# Commend an app from slack (= controller)

Create a public channel #freeze_merge

Get the 3 urls from the different firebase functions.

Get slack commands that pings those url following this modification : {FUNCTION_URL}/{INSTALLATION_ID}

# Google sign-in setup on existing GitHub Pages

Sovereign Lab stays on GitHub Pages; Firebase adds Google identity and **manual**
personal cloud backup. Google Sign-In does not grant access to Gmail messages.

1. Create a project at https://console.firebase.google.com.
2. Register a Web application, copy its public Firebase web app configuration.
3. Authentication > Sign-in method: enable Google, choose a support email.
4. Authentication > Settings > Authorized domains: add `kriven-lang.github.io`.
5. Firestore Database: choose region and start with locked production rules.
6. Paste the repository's `firestore.rules` into Firestore > Rules and publish.
7. Edit `firebase-config.js` on GitHub to assign the web app's `apiKey`,
   `authDomain`, `projectId` and `appId`. These are public identifiers.
   NEVER upload private keys, service accounts or OAuth client secrets.
8. After GitHub Pages deploys, visit `#account`, sign in, and deliberately
   choose Save personal profile or Load cloud profile.

**Migration:** Before enabling sign-in, export a JSON backup of your v0.1 data.
After sign-in, import the backup to the new per-account local workspace.

Cloud backup includes personal capability evidence, aspirations and development
goals, but excludes private flourishing reflections and workplace reviews.
Browser localStorage is not encrypted. This is not an enterprise HR backend
or end-to-end encryption. Firebase project admins can access their infrastructure.

Official docs:
https://firebase.google.com/docs/auth/web/google-signin
https://firebase.google.com/docs/firestore/security/get-started

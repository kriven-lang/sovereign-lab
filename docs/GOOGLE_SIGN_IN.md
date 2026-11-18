# Google Sign-In and personal Google Drive storage

The app remains on GitHub Pages. Firebase Authentication identifies the user.
The Personal workspace uses the user's private Google Drive **appDataFolder**
rather than centrally storing their personal assessments in Cloud Firestore.
Only the `https://www.googleapis.com/auth/drive.appdata` OAuth scope is requested
when users choose a cloud save or restore. No Gmail inbox or full Google Drive access.

## Product owner: one-time setup

1. Create a project at https://console.firebase.google.com.
2. Register a Web App, enable Google as an authentication provider, and configure
   the Authentication authorized domain `kriven-lang.github.io`.
3. Enable Google Drive API for the associated Google Cloud project.
4. Configure the project's Google OAuth consent screen and testing users or
   production publication, including the `drive.appdata` permission if required.
5. Set public Web app values in `firebase-config.js`: `apiKey`, `authDomain`,
   `projectId`, `appId`. NEVER paste OAuth client secrets, API private keys,
   service account JSON, or database admin credentials into GitHub.
6. Open the GitHub Pages website, choose Personal sign-in, and select **Save to
   my Drive** from Account & sync. Google requests narrowly scoped Drive app-data consent
   before saving. The next visit can restore the profile after consent again.

## Data separation and limitations

- The personal profile, current assessment draft, completed assessment history,
  targets, aspiration history and practice selections are saved to Drive by
  explicit user action. Each completed assessment retains its evidence and the
  profile and targets as they were when it was saved.
- Flourishing reflections and local role review observations stay local.
- Drive access tokens are held only in browser memory. After a reload the
  authorization popup may be required again.
- The user retains control of their Drive account and can revoke app access
  using their Google Account settings.
- The local browser storage is not encrypted. This setup is not end-to-end encryption.
- Firebase authentication identifies the account but is not a substitute for
  explicit organization membership and backend review access controls.
- There is no automatic migration of previous anonymous local data. Export
  a JSON backup before activating Google login, then import after signing in.

Google source documentation:
https://developers.google.com/workspace/drive/api/guides/appdata
https://firebase.google.com/docs/auth/web/google-signin

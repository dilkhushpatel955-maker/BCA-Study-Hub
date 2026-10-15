# BCA Study Hub — setup guide

This is a beginner-friendly BCA Semester I study website starter using HTML, CSS, JavaScript and Firebase Authentication, Firestore and Storage.

## Included
- Student sign up, login, sign out and password reset
- Semester I syllabus cards based on the syllabus images you shared
- Search and filter for uploaded notes/materials
- Admin-only upload form for PDFs/documents or external links
- Admin-only delete control
- Firestore and Storage security rules

## 1. Create / configure Firebase
1. Open https://console.firebase.google.com/ and create a project.
2. In **Authentication → Sign-in method**, enable **Email/Password**.
3. In **Project settings → General → Your apps**, create a **Web app** and copy its Firebase config into `firebase-config.js`.
4. Open **Firestore Database** and create a database.
5. Open **Storage** and enable Firebase Storage.
6. In Firebase Authentication settings, add the domain you will host the site on under **Authorized domains** if it is not already listed.

## 2. Set up the first admin safely
1. Run the website locally and create your own account through **Create account**.
2. In Firebase Console → Authentication → Users, copy your account's **UID**.
3. In Firestore → `users` collection, open the document whose document ID is exactly your UID (the signup flow creates it).
4. Add a string field: `role` = `admin`.
5. Do not give admin role to friends unless you want them to manage uploads too. Never put admin credentials in front-end code.

The site reads this role from Firestore. The supplied rules prevent users from changing their own role.

## 3. Add security rules
- Firestore → Rules: paste the contents of `firestore.rules` and publish.
- Storage → Rules: paste the contents of `storage.rules` and publish.
- These rules are important: do not leave databases in test mode when sharing your site.

## 4. Run the site
Because JavaScript modules are used, open the folder using a local web server (not by double-clicking `index.html`). For example, install VS Code's **Live Server** extension and click **Go Live**. Then sign up/login.

## 5. Publish the website
You can deploy using Firebase Hosting:
1. Install Node.js on your computer.
2. Install Firebase CLI: `npm install -g firebase-tools`
3. In this project folder run `firebase login`
4. In `.firebaserc`, replace `YOUR_FIREBASE_PROJECT_ID` with your actual Firebase Project ID (Firebase Console → Project settings → General → Project ID). Alternatively, run `firebase use --add` to select your project.
5. The included `firebase.json` already sets the Hosting public directory to `.` and connects the Firestore and Storage rules. If you already initialized a different Firebase setup, back up your existing config before replacing it.
6. Deploy the rules and site with `firebase deploy --only hosting,firestore:rules,storage`.

If you choose a different public directory, copy the website files into it first. Do not publish `README.md` or rules as public pages unless you intend to.

## Syllabus subjects currently included
- BCA-101 Communicative English
- BCA-102 Basic Mathematics
- BCA-103 Information Technology and Application
- BCA-104 Principles of Management & Organization
- BCA-105 Python Programming (Elective 1)
- BCA-106 Problem Solving and Programming Concepts (Elective 2)
- BCA-107 Lab (BCA-103)
- BCA-108 Lab (BCA-105)
- BCA-109 Lab (BCA-106)

The syllabus topics are summarized from the photos supplied in this chat. Please compare them with your official syllabus and edit the subject descriptions if your college has a revised version.

## Important
- This starter is not yet connected to your Firebase project. You must add your own config and publish the rules.
- Test with a student account and the admin account before sharing.
- Do not upload private documents or other people's personal data without permission.


## Quick deployment commands
Run these commands from the extracted project folder in a terminal:

```bash
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only hosting,firestore:rules,storage
```

When `firebase use --add` asks for a project, select the Firebase project where you enabled Authentication, Firestore and Storage. The included `.firebaserc` is only a placeholder until you select/replace the project ID.

**Storage rule note:** these rules use Firestore data to verify the admin role. Firebase may require the Storage service agent to have permission to access Firestore rules data. If Firebase reports a cross-service permission error, follow the Firebase Console error guidance and grant only the required service-agent permission.

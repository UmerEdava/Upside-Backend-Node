// import admin from "firebase-admin";
// import serviceAccount from "./upside-firebase-admin.json";
// admin.initializeApp({
//   credential: admin.credential.cert({
//     clientEmail: serviceAccount.client_email,
//     privateKey: serviceAccount.private_key,
//     projectId: serviceAccount.project_id,
//   }),
// });

// export const sendFCMNotification = ({
//   token,
//   data,
// }: {
//   token: string;
//   data: any;
// }) => {
//   const message = {
//     notification: {
//       title: "Incoming Call",
//       body: "You have an incoming call from John Doe",
//     },
//     token: token,
//     data: data,
//   };

//   admin
//     .messaging()
//     .send(message)
//     .then((response: any) => {
//       console.log("Notification sent:", response);
//     })
//     .catch((error: any) => {
//       console.error("Error sending notification:", error);
//     });
// };

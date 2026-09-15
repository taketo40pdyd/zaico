// Firebase Cloud Messaging のバックグラウンド通知受信用Service Worker。
// アプリを閉じている/非表示のときに届いたプッシュ通知の表示を担当する。
// (フォアグラウンド時の通知表示は index.html 内の messaging.onMessage() が担当)
//
// ここの firebaseConfig は index.html の window.__kpFirebaseConfig と同じ値にしてください。
// Firebaseのウェブ向けconfigは公開情報のため、そのままリポジトリに含めて問題ありません。

importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAXuIXAtXBOQd0npSJwyzQmqgX3CL-fIeo",
  authDomain: "zaico-4d8b3.firebaseapp.com",
  projectId: "zaico-4d8b3",
  storageBucket: "zaico-4d8b3.firebasestorage.app",
  messagingSenderId: "936272523565",
  appId: "1:936272523565:web:63a370036e0c6e6b4d23a4"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || "在庫管理システム";
  const options = {
    body: payload.notification && payload.notification.body,
    icon: "./icon-192.png",
    badge: "./icon-192.png",
    data: payload.data || {}
  };
  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientsArr) => {
      for (const client of clientsArr) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("./");
    })
  );
});

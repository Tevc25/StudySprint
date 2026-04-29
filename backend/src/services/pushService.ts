import { db } from '../config/firebase';
import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const COL = 'subscription';

export const saveSubscription = async (userId: string, subscription: object) => {
  await db.collection(COL).add({ userId, subscription });
};

export const deleteSubscription = async (endpoint: String) => {
  const snap = await db.collection(COL).where('subscription.endpoint', '==', endpoint).get();
  snap.forEach((doc) => {
    doc.ref.delete();
  });
};

export const sendPushToUser = async (userId: string, payload: object) => {
  const snap = await db.collection(COL).where('userId', '==', userId).get();
  const promises = snap.docs.map((doc) => {
    const { subscription } = doc.data();
    return webpush.sendNotification(subscription, JSON.stringify(payload));
  });
  await Promise.all(promises);
};


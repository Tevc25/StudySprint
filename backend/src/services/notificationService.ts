import { db } from '../config/firebase';
import { Notification } from '../models';

const COL = 'notifications';

export const getAllNotifications = async (): Promise<Notification[]> => {
  const snap = await db.collection(COL).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
};

export const getNotificationById = async (id: string): Promise<Notification | null> => {
  const doc = await db.collection(COL).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Notification;
};

export const createNotification = async (data: Omit<Notification, 'id'>): Promise<Notification> => {
  const payload = { ...data, createdAt: data.createdAt ?? new Date().toISOString() };
  const ref = await db.collection(COL).add(payload);
  return { id: ref.id, ...payload };
};

export const deleteNotification = async (id: string): Promise<boolean> => {
  const doc = await db.collection(COL).doc(id).get();
  if (!doc.exists) return false;
  await db.collection(COL).doc(id).delete();
  return true;
};

export const getNotificationsByUser = async (userId: string): Promise<Notification[]> => {
  const snap = await db.collection(COL).where('userId', '==', userId).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
};

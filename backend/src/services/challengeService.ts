import { db } from '../config/firebase';
import { Challenge } from '../models';
import admin from 'firebase-admin';

const COL = 'challenges';

export const getAllChallenges = async (): Promise<Challenge[]> => {
  const snap = await db.collection(COL).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Challenge));
};

export const getChallengeById = async (id: string): Promise<Challenge | null> => {
  const doc = await db.collection(COL).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Challenge;
};

export const createChallenge = async (data: Omit<Challenge, 'id'>): Promise<Challenge> => {
  const payload = { ...data, isActive: false, participants: data.participants ?? [] };
  const ref = await db.collection(COL).add(payload);
  return { id: ref.id, ...payload };
};

export const updateChallenge = async (id: string, data: Partial<Challenge>): Promise<Challenge | null> => {
  const ref = db.collection(COL).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return null;
  await ref.update(data as { [key: string]: unknown });
  return { id, ...doc.data(), ...data } as Challenge;
};

export const deleteChallenge = async (id: string): Promise<boolean> => {
  const doc = await db.collection(COL).doc(id).get();
  if (!doc.exists) return false;
  await db.collection(COL).doc(id).delete();
  return true;
};

export const startChallenge = async (id: string): Promise<Challenge | null> => {
  const ref = db.collection(COL).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return null;
  const startedAt = new Date().toISOString();
  await ref.update({ isActive: true, startedAt });
  return { id, ...doc.data(), isActive: true } as Challenge;
};

export const participateInChallenge = async (id: string, userId: string): Promise<Challenge | null> => {
  const ref = db.collection(COL).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return null;
  await ref.update({
    participants: admin.firestore.FieldValue.arrayUnion(userId),
  });
  const updated = await ref.get();
  return { id, ...updated.data() } as Challenge;
};

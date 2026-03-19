import { db } from '../config/firebase';
import { Goal } from '../models';

const COL = 'goals';

export const getAllGoals = async (): Promise<Goal[]> => {
  const snap = await db.collection(COL).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Goal));
};

export const getGoalById = async (id: string): Promise<Goal | null> => {
  const doc = await db.collection(COL).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Goal;
};

export const createGoal = async (data: Omit<Goal, 'id'>): Promise<Goal> => {
  const ref = await db.collection(COL).add(data);
  return { id: ref.id, ...data };
};

export const updateGoal = async (id: string, data: Partial<Goal>): Promise<Goal | null> => {
  const ref = db.collection(COL).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return null;
  await ref.update(data as { [key: string]: unknown });
  return { id, ...doc.data(), ...data } as Goal;
};

export const deleteGoal = async (id: string): Promise<boolean> => {
  const doc = await db.collection(COL).doc(id).get();
  if (!doc.exists) return false;
  await db.collection(COL).doc(id).delete();
  return true;
};

export const getGoalsByUser = async (userId: string): Promise<Goal[]> => {
  const snap = await db.collection(COL).where('userId', '==', userId).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Goal));
};

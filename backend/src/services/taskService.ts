import { db } from '../config/firebase';
import { Task } from '../models';

const COL = 'tasks';

export const getAllTasks = async (): Promise<Task[]> => {
  const snap = await db.collection(COL).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Task));
};

export const getTaskById = async (id: string): Promise<Task | null> => {
  const doc = await db.collection(COL).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Task;
};

export const createTask = async (data: Omit<Task, 'id'>): Promise<Task> => {
  const ref = await db.collection(COL).add(data);
  return { id: ref.id, ...data };
};

export const updateTask = async (id: string, data: Partial<Task>): Promise<Task | null> => {
  const ref = db.collection(COL).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return null;
  await ref.update(data as { [key: string]: unknown });
  return { id, ...doc.data(), ...data } as Task;
};

export const deleteTask = async (id: string): Promise<boolean> => {
  const doc = await db.collection(COL).doc(id).get();
  if (!doc.exists) return false;
  await db.collection(COL).doc(id).delete();
  return true;
};

export const getTasksByGoal = async (goalId: string): Promise<Task[]> => {
  const snap = await db.collection(COL).where('goalId', '==', goalId).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Task));
};

export const getTasksByUser = async (userId: string): Promise<Task[]> => {
  const snap = await db.collection(COL).where('userId', '==', userId).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Task));
};

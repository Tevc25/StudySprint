import { db } from '../config/firebase';
import { User } from '../models';

const COL = 'users';

export const getAllUsers = async (): Promise<User[]> => {
  const snap = await db.collection(COL).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
};

export const getUserById = async (id: string): Promise<User | null> => {
  const doc = await db.collection(COL).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as User;
};

export const createUser = async (data: Omit<User, 'id'>): Promise<User> => {
  const ref = await db.collection(COL).add(data);
  return { id: ref.id, ...data };
};

export const updateUser = async (id: string, data: Partial<User>): Promise<User | null> => {
  const ref = db.collection(COL).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return null;
  await ref.update(data as { [key: string]: unknown });
  return { id, ...doc.data(), ...data } as User;
};

export const deleteUser = async (id: string): Promise<boolean> => {
  const doc = await db.collection(COL).doc(id).get();
  if (!doc.exists) return false;
  await db.collection(COL).doc(id).delete();
  return true;
};

export const loginUser = async (email: string, password: string): Promise<User | null> => {
  const snap = await db.collection(COL)
    .where('email', '==', email)
    .where('password', '==', password)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() } as User;
};

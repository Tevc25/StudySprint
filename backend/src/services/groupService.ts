import { db } from '../config/firebase';
import { Group } from '../models';
import admin from 'firebase-admin';

const COL = 'groups';

export const getAllGroups = async (): Promise<Group[]> => {
  const snap = await db.collection(COL).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Group));
};

export const getGroupById = async (id: string): Promise<Group | null> => {
  const doc = await db.collection(COL).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Group;
};

export const createGroup = async (data: Omit<Group, 'id'>): Promise<Group> => {
  const payload = { ...data, members: data.members ?? [] };
  const ref = await db.collection(COL).add(payload);
  return { id: ref.id, ...payload };
};

export const updateGroup = async (id: string, data: Partial<Group>): Promise<Group | null> => {
  const ref = db.collection(COL).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return null;
  await ref.update(data as { [key: string]: unknown });
  return { id, ...doc.data(), ...data } as Group;
};

export const deleteGroup = async (id: string): Promise<boolean> => {
  const doc = await db.collection(COL).doc(id).get();
  if (!doc.exists) return false;
  await db.collection(COL).doc(id).delete();
  return true;
};

export const joinGroup = async (groupId: string, userId: string): Promise<Group | null> => {
  const ref = db.collection(COL).doc(groupId);
  const doc = await ref.get();
  if (!doc.exists) return null;
  await ref.update({
    members: admin.firestore.FieldValue.arrayUnion(userId),
  });
  const updated = await ref.get();
  return { id: groupId, ...updated.data() } as Group;
};

export const addMembers = async (groupId: string, userIds: string[]): Promise<Group | null> => {
  const ref = db.collection(COL).doc(groupId);
  const doc = await ref.get();
  if (!doc.exists) return null;
  await ref.update({
    members: admin.firestore.FieldValue.arrayUnion(...userIds),
  });
  const updated = await ref.get();
  return { id: groupId, ...updated.data() } as Group;
};

export const getMembers = async (groupId: string): Promise<string[] | null> => {
  const doc = await db.collection(COL).doc(groupId).get();
  if (!doc.exists) return null;
  return (doc.data() as Group).members ?? [];
};

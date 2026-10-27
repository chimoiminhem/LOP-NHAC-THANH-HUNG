/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  doc,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDocs,
  getDocFromServer,
  writeBatch,
  Unsubscribe,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { auth } from './authService';
import firebaseConfig from '../../firebase-applet-config.json';
import { Branch, ChatMessage, MemberPresence, Student, Teacher } from '../types/music';

// Initialize Firestore with specific database ID (CRITICAL: Required by Firebase skill)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const SHARED_STUDIO_ID = 'harmony-studio-main';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

export function detectDeviceType(): 'PC' | 'Điện thoại' | 'iPad' | 'Web' {
  if (typeof window === 'undefined' || !navigator) return 'Web';
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua))) {
    return 'iPad';
  }
  if (/Mobi|Android|iPhone/i.test(ua)) {
    return 'Điện thoại';
  }
  return 'PC';
}

// Test Connection on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is currently running in offline/cache mode.');
      return false;
    }
    return true;
  }
}

// =========================================================================
// REAL-TIME SUBSCRIBERS (Shared Studio Workspace - Cross-Device Sync 2-5 users)
// =========================================================================

/**
 * Lắng nghe thay đổi danh sách Học viên thời gian thực trên Shared Studio
 */
export function subscribeToSharedStudents(
  onUpdate: (students: Student[]) => void,
  onError?: (error: unknown) => void,
  studioId: string = SHARED_STUDIO_ID
): Unsubscribe {
  const path = `studios/${studioId}/students`;
  const studentsCol = collection(db, 'studios', studioId, 'students');

  return onSnapshot(
    studentsCol,
    (snapshot) => {
      const studentList: Student[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as Student;
        studentList.push({ ...data, id: d.id });
      });
      onUpdate(studentList);
    },
    (error) => {
      if (onError) onError(error);
      console.warn('Students listener warning:', error);
    }
  );
}

/**
 * Lắng nghe thay đổi danh sách Giáo viên thời gian thực trên Shared Studio
 */
export function subscribeToSharedTeachers(
  onUpdate: (teachers: Teacher[]) => void,
  onError?: (error: unknown) => void,
  studioId: string = SHARED_STUDIO_ID
): Unsubscribe {
  const path = `studios/${studioId}/teachers`;
  const teachersCol = collection(db, 'studios', studioId, 'teachers');

  return onSnapshot(
    teachersCol,
    (snapshot) => {
      const teacherList: Teacher[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as Teacher;
        teacherList.push({ ...data, id: d.id });
      });
      onUpdate(teacherList);
    },
    (error) => {
      if (onError) onError(error);
      console.warn('Teachers listener warning:', error);
    }
  );
}

/**
 * Lắng nghe thay đổi danh sách Cơ sở thời gian thực trên Shared Studio
 */
export function subscribeToSharedBranches(
  onUpdate: (branches: Branch[]) => void,
  onError?: (error: unknown) => void,
  studioId: string = SHARED_STUDIO_ID
): Unsubscribe {
  const path = `studios/${studioId}/branches`;
  const branchesCol = collection(db, 'studios', studioId, 'branches');

  return onSnapshot(
    branchesCol,
    (snapshot) => {
      const branchList: Branch[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as Branch;
        branchList.push({ ...data, id: d.id });
      });
      onUpdate(branchList);
    },
    (error) => {
      if (onError) onError(error);
      console.warn('Branches listener warning:', error);
    }
  );
}

/**
 * Lắng nghe Cài đặt Studio (URL Google Sheets) thời gian thực
 */
export function subscribeToSharedSettings(
  onUpdate: (settings: { spreadsheetUrl?: string }) => void,
  onError?: (error: unknown) => void,
  studioId: string = SHARED_STUDIO_ID
): Unsubscribe {
  const path = `studios/${studioId}/settings/studio`;
  const settingsDocRef = doc(db, 'studios', studioId, 'settings', 'studio');

  return onSnapshot(
    settingsDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as { spreadsheetUrl?: string });
      }
    },
    (error) => {
      if (onError) onError(error);
      console.warn('Settings listener warning:', error);
    }
  );
}

/**
 * Lắng nghe Lịch sử Chat / Ghi chú trao đổi nội bộ thời gian thực giữa 2-5 giáo viên
 */
export function subscribeToStudioMessages(
  onUpdate: (messages: ChatMessage[]) => void,
  onError?: (error: unknown) => void,
  studioId: string = SHARED_STUDIO_ID
): Unsubscribe {
  const messagesCol = collection(db, 'studios', studioId, 'messages');
  const q = query(messagesCol, orderBy('createdAt', 'asc'), limit(100));

  return onSnapshot(
    q,
    (snapshot) => {
      const msgList: ChatMessage[] = [];
      snapshot.forEach((d) => {
        msgList.push({ ...d.data(), id: d.id } as ChatMessage);
      });
      onUpdate(msgList);
    },
    (error) => {
      if (onError) onError(error);
      console.warn('Messages listener warning:', error);
    }
  );
}

/**
 * Lắng nghe danh sách Thành viên đang online trong nhóm Studio (2-5 thiết bị)
 */
export function subscribeToStudioMembers(
  onUpdate: (members: MemberPresence[]) => void,
  onError?: (error: unknown) => void,
  studioId: string = SHARED_STUDIO_ID
): Unsubscribe {
  const membersCol = collection(db, 'studios', studioId, 'members');

  return onSnapshot(
    membersCol,
    (snapshot) => {
      const memberList: MemberPresence[] = [];
      snapshot.forEach((d) => {
        memberList.push(d.data() as MemberPresence);
      });
      onUpdate(memberList);
    },
    (error) => {
      if (onError) onError(error);
      console.warn('Members listener warning:', error);
    }
  );
}

// ==========================================
// MUTATION WRITERS (Shared Studio Workspace)
// ==========================================

export async function saveStudentToStudio(
  student: Student,
  studioId: string = SHARED_STUDIO_ID
): Promise<void> {
  const path = `studios/${studioId}/students/${student.id}`;
  try {
    const studentDocRef = doc(db, 'studios', studioId, 'students', student.id);
    const payload = sanitizeForFirestore({
      ...student,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(studentDocRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteStudentFromStudio(
  studentId: string,
  studioId: string = SHARED_STUDIO_ID
): Promise<void> {
  const path = `studios/${studioId}/students/${studentId}`;
  try {
    const studentDocRef = doc(db, 'studios', studioId, 'students', studentId);
    await deleteDoc(studentDocRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveTeacherToStudio(
  teacher: Teacher,
  studioId: string = SHARED_STUDIO_ID
): Promise<void> {
  const path = `studios/${studioId}/teachers/${teacher.id}`;
  try {
    const teacherDocRef = doc(db, 'studios', studioId, 'teachers', teacher.id);
    const payload = sanitizeForFirestore({
      ...teacher,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(teacherDocRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteTeacherFromStudio(
  teacherId: string,
  studioId: string = SHARED_STUDIO_ID
): Promise<void> {
  const path = `studios/${studioId}/teachers/${teacherId}`;
  try {
    const teacherDocRef = doc(db, 'studios', studioId, 'teachers', teacherId);
    await deleteDoc(teacherDocRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveBranchToStudio(
  branch: Branch,
  studioId: string = SHARED_STUDIO_ID
): Promise<void> {
  const path = `studios/${studioId}/branches/${branch.id}`;
  try {
    const branchDocRef = doc(db, 'studios', studioId, 'branches', branch.id);
    const payload = sanitizeForFirestore({
      ...branch,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(branchDocRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteBranchFromStudio(
  branchId: string,
  studioId: string = SHARED_STUDIO_ID
): Promise<void> {
  const path = `studios/${studioId}/branches/${branchId}`;
  try {
    const branchDocRef = doc(db, 'studios', studioId, 'branches', branchId);
    await deleteDoc(branchDocRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveSettingsToStudio(
  settings: { spreadsheetUrl?: string; studioName?: string },
  studioId: string = SHARED_STUDIO_ID
): Promise<void> {
  const path = `studios/${studioId}/settings/studio`;
  try {
    const settingsDocRef = doc(db, 'studios', studioId, 'settings', 'studio');
    await setDoc(
      settingsDocRef,
      sanitizeForFirestore({ ...settings, updatedAt: new Date().toISOString() }),
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Gửi tin nhắn chat / bàn giao học viên thời gian thực
 */
export async function sendChatMessageToStudio(
  msg: Omit<ChatMessage, 'id' | 'createdAt'>,
  studioId: string = SHARED_STUDIO_ID
): Promise<void> {
  const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const path = `studios/${studioId}/messages/${id}`;
  try {
    const msgDocRef = doc(db, 'studios', studioId, 'messages', id);
    const payload: ChatMessage = sanitizeForFirestore({
      ...msg,
      id,
      createdAt: new Date().toISOString(),
      deviceType: detectDeviceType(),
    });
    await setDoc(msgDocRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Cập nhật sự hiện diện trực tuyến của thành viên (PC / Điện thoại / iPad)
 */
export async function updateStudioMemberPresence(
  member: MemberPresence,
  studioId: string = SHARED_STUDIO_ID
): Promise<void> {
  const path = `studios/${studioId}/members/${member.userId}`;
  try {
    const memberDocRef = doc(db, 'studios', studioId, 'members', member.userId);
    await setDoc(
      memberDocRef,
      sanitizeForFirestore({
        ...member,
        device: detectDeviceType(),
        lastSeen: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (error) {
    console.warn('Member presence update notice:', error);
  }
}

/**
 * Nạp dữ liệu ban đầu cho Shared Studio nếu chưa có
 */
export async function seedInitialStudioDataIfEmpty(
  initialStudents: Student[],
  initialTeachers: Teacher[],
  initialBranches: Branch[],
  studioId: string = SHARED_STUDIO_ID
): Promise<boolean> {
  const studentsPath = `studios/${studioId}/students`;
  try {
    const studentsCol = collection(db, 'studios', studioId, 'students');
    const existingSnap = await getDocs(studentsCol);

    if (!existingSnap.empty) {
      return false;
    }

    const batch = writeBatch(db);

    // Nạp học viên ban đầu
    initialStudents.forEach((student) => {
      const studentDocRef = doc(db, 'studios', studioId, 'students', student.id);
      batch.set(
        studentDocRef,
        sanitizeForFirestore({ ...student, updatedAt: new Date().toISOString() })
      );
    });

    // Nạp giáo viên ban đầu
    initialTeachers.forEach((teacher) => {
      const teacherDocRef = doc(db, 'studios', studioId, 'teachers', teacher.id);
      batch.set(
        teacherDocRef,
        sanitizeForFirestore({ ...teacher, updatedAt: new Date().toISOString() })
      );
    });

    // Nạp cơ sở ban đầu
    initialBranches.forEach((branch) => {
      const branchDocRef = doc(db, 'studios', studioId, 'branches', branch.id);
      batch.set(
        branchDocRef,
        sanitizeForFirestore({ ...branch, updatedAt: new Date().toISOString() })
      );
    });

    // Cài đặt mặc định
    const settingsDocRef = doc(db, 'studios', studioId, 'settings', 'studio');
    batch.set(
      settingsDocRef,
      sanitizeForFirestore({
        studioName: 'Harmony Music Studio',
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );

    // Tin nhắn chào mừng ban đầu
    const welcomeMsgRef = doc(db, 'studios', studioId, 'messages', 'welcome-msg');
    batch.set(welcomeMsgRef, {
      id: 'welcome-msg',
      senderName: 'Hệ thống Studio',
      senderRole: 'Hệ thống',
      text: 'Chào mừng quý thầy cô đến với Hệ thống Quản lý Studio chung! Mọi thay đổi điểm danh và danh sách học viên sẽ được đồng bộ thời gian thực giữa 2-5 thiết bị (PC, Điện thoại, iPad).',
      createdAt: new Date().toISOString(),
      deviceType: 'Web',
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error during seedInitialStudioDataIfEmpty:', error);
    return false;
  }
}

// ==========================================
// BACKWARD-COMPATIBILITY ALIASES FOR APP.TSX
// ==========================================
export const subscribeToUserStudents = (
  _userId: string,
  onUpdate: (students: Student[]) => void,
  onError?: (error: unknown) => void
) => subscribeToSharedStudents(onUpdate, onError);

export const subscribeToUserTeachers = (
  _userId: string,
  onUpdate: (teachers: Teacher[]) => void,
  onError?: (error: unknown) => void
) => subscribeToSharedTeachers(onUpdate, onError);

export const subscribeToUserBranches = (
  _userId: string,
  onUpdate: (branches: Branch[]) => void,
  onError?: (error: unknown) => void
) => subscribeToSharedBranches(onUpdate, onError);

export const subscribeToUserSettings = (
  _userId: string,
  onUpdate: (settings: { spreadsheetUrl?: string }) => void,
  onError?: (error: unknown) => void
) => subscribeToSharedSettings(onUpdate, onError);

export const saveStudentToFirestore = (_userId: string, student: Student) =>
  saveStudentToStudio(student);

export const deleteStudentFromFirestore = (_userId: string, studentId: string) =>
  deleteStudentFromStudio(studentId);

export const saveTeacherToFirestore = (_userId: string, teacher: Teacher) =>
  saveTeacherToStudio(teacher);

export const deleteTeacherFromFirestore = (_userId: string, teacherId: string) =>
  deleteTeacherFromStudio(teacherId);

export const saveBranchToFirestore = (_userId: string, branch: Branch) =>
  saveBranchToStudio(branch);

export const deleteBranchFromFirestore = (_userId: string, branchId: string) =>
  deleteBranchFromStudio(branchId);

export const saveSettingsToFirestore = (
  _userId: string,
  settings: { spreadsheetUrl?: string }
) => saveSettingsToStudio(settings);

export const seedInitialUserStudioDataIfEmpty = (
  _userId: string,
  initialStudents: Student[],
  initialTeachers: Teacher[],
  initialBranches: Branch[]
) => seedInitialStudioDataIfEmpty(initialStudents, initialTeachers, initialBranches);

/**
 * Error Audio Storage Service
 * Handles uploading audio clips for review items to Firebase Storage
 * Used when mark_for_review captures student error audio
 */

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../config/firebase';

export interface AudioUploadResult {
  downloadUrl: string;
  storagePath: string;
}

/**
 * Upload error audio WAV to Firebase Storage
 * Non-blocking: returns promise but caller doesn't need to await
 *
 * @param audioBlob - WAV Blob from audio extraction
 * @param reviewItemId - The review item ID to associate with
 * @param userId - User ID for path organization
 * @returns Promise with download URL and storage path
 */
export const uploadErrorAudio = async (
  audioBlob: Blob,
  reviewItemId: string,
  userId: string
): Promise<AudioUploadResult> => {
  if (!storage) {
    throw new Error('Firebase Storage is not configured');
  }

  // Path: errors/{userId}/{reviewItemId}.wav
  const storagePath = `errors/${userId}/${reviewItemId}.wav`;
  const storageRef = ref(storage, storagePath);

  // Upload with metadata
  await uploadBytes(storageRef, audioBlob, {
    contentType: 'audio/wav',
    customMetadata: {
      reviewItemId,
      userId,
      capturedAt: new Date().toISOString(),
    },
  });

  // Get permanent download URL
  const downloadUrl = await getDownloadURL(storageRef);

  console.log('[ErrorAudio] Uploaded:', storagePath, '(', (audioBlob.size / 1024).toFixed(1), 'KB)');

  return { downloadUrl, storagePath };
};

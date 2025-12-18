/**
 * Error Audio Storage Service
 * Handles uploading audio clips for review items to Firebase Storage
 * Used when mark_for_review captures student error audio
 * Also handles TTS correction audio caching
 */

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

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

/**
 * Upload TTS correction audio to Firebase Storage and update the review item
 * This caches the TTS audio so we don't need to call the API again
 *
 * @param audioBase64 - Base64-encoded MP3 audio from TTS API
 * @param reviewItemId - The review item ID to associate with
 * @param userId - User ID for path organization
 * @returns Promise with download URL
 */
export const uploadCorrectionAudio = async (
  audioBase64: string,
  reviewItemId: string,
  userId: string
): Promise<string> => {
  if (!storage || !db) {
    throw new Error('Firebase is not configured');
  }

  // Convert base64 to Blob
  const binaryString = atob(audioBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });

  // Path: corrections/{userId}/{reviewItemId}.mp3
  const storagePath = `corrections/${userId}/${reviewItemId}.mp3`;
  const storageRef = ref(storage, storagePath);

  // Upload with metadata
  await uploadBytes(storageRef, audioBlob, {
    contentType: 'audio/mpeg',
    customMetadata: {
      reviewItemId,
      userId,
      generatedAt: new Date().toISOString(),
      type: 'tts-correction',
    },
  });

  // Get permanent download URL
  const downloadUrl = await getDownloadURL(storageRef);

  // Update the review item with the correction audio URL
  const reviewItemRef = doc(db, `users/${userId}/reviewItems/${reviewItemId}`);
  await updateDoc(reviewItemRef, {
    correctionAudioUrl: downloadUrl,
  });

  console.log('[CorrectionAudio] Uploaded and cached:', storagePath, '(', (audioBlob.size / 1024).toFixed(1), 'KB)');

  return downloadUrl;
};

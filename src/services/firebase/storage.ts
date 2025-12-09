/**
 * Firebase Storage Service
 * Handles image uploads for lesson creation with permanent URLs
 */

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../../config/firebase';

export interface UploadResult {
  downloadUrl: string;
  storagePath: string;
}

/**
 * Upload lesson image to Firebase Storage
 * @param file - File object from input
 * @param teacherId - Teacher's UID for organizing storage
 * @returns Permanent download URL and storage path
 */
export const uploadLessonImage = async (
  file: File,
  teacherId: string
): Promise<UploadResult> => {
  if (!storage) {
    throw new Error('Firebase Storage is not configured. Please set up Storage in Firebase Console.');
  }

  // Create a unique path: lessons/{teacherId}/{timestamp}_{filename}
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `lessons/${teacherId}/${timestamp}_${sanitizedName}`;

  const storageRef = ref(storage, storagePath);

  // Upload the file with metadata
  await uploadBytes(storageRef, file, {
    contentType: file.type,
    customMetadata: {
      uploadedBy: teacherId,
      originalName: file.name,
    },
  });

  // Get the permanent download URL
  const downloadUrl = await getDownloadURL(storageRef);

  return { downloadUrl, storagePath };
};

/**
 * Delete image from Firebase Storage
 * @param storagePath - The storage path to delete
 */
export const deleteLessonImage = async (storagePath: string): Promise<void> => {
  if (!storage) {
    console.warn('Firebase Storage not configured, skipping delete');
    return;
  }

  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (error: unknown) {
    // Ignore if file doesn't exist
    if (error && typeof error === 'object' && 'code' in error && error.code === 'storage/object-not-found') {
      console.log('Image already deleted or not found');
      return;
    }
    throw error;
  }
};

/**
 * Validate that a file is an acceptable image
 * @param file - File to validate
 * @returns true if valid, throws error if not
 */
export const validateImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
  }

  if (file.size > maxSize) {
    throw new Error('File too large. Maximum size is 5MB.');
  }

  return true;
};

/**
 * Create a local preview URL for an image file
 * (Used before upload for preview purposes)
 * @param file - File to create preview for
 * @returns Object URL for preview
 */
export const createImagePreview = (file: File): string => {
  return URL.createObjectURL(file);
};

/**
 * Revoke a preview URL to free memory
 * @param previewUrl - The object URL to revoke
 */
export const revokeImagePreview = (previewUrl: string): void => {
  if (previewUrl.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl);
  }
};

/**
 * Upload profile photo to Firebase Storage
 * @param file - File object from input
 * @param userId - User's UID
 * @returns Permanent download URL
 */
export const uploadProfilePhoto = async (
  file: File,
  userId: string
): Promise<string> => {
  if (!storage) {
    throw new Error('Firebase Storage is not configured.');
  }

  // Validate the file
  validateImageFile(file);

  // Create a unique path: profile-photos/{userId}/{timestamp}.{ext}
  const timestamp = Date.now();
  const extension = file.name.split('.').pop() || 'jpg';
  const storagePath = `profile-photos/${userId}/${timestamp}.${extension}`;

  const storageRef = ref(storage, storagePath);

  // Upload the file with metadata
  await uploadBytes(storageRef, file, {
    contentType: file.type,
    customMetadata: {
      uploadedBy: userId,
    },
  });

  // Get the permanent download URL
  const downloadUrl = await getDownloadURL(storageRef);

  return downloadUrl;
};

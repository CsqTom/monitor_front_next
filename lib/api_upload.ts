// lib/api_upload.ts

import { apiRequest, request } from './api_client';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/image_data`;

export interface InitUploadResponse {
  upload_id: string;
  chunk_size: number;
}

export interface UploadCompleteParams {
  upload_id: string;
  file_name: string;
}

export interface FileUploadStatusData {
  id: number;
  upload_id: string;
  file_name: string;
  save_path: string;
  upload_time: string;
  size_gb: number;
  is_deleted: boolean;
  status_code: number; // 202, 203, 204, 210, 500
  other_info: string; // JSON string
}

export interface FileUploadStatusResponse {
  code: number;
  msg: string;
  data: FileUploadStatusData;
}

/**
 * Initializes the file upload process.
 * @returns Promise<InitUploadResponse>
 */
export const initUpload = async (): Promise<InitUploadResponse> => {
  const response = await fetch(`${API_BASE_URL}/init`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.msg || 'Failed to initialize upload');
  }
  const data = await response.json();
  return data.data;
};

/**
 * Uploads a file chunk.
 * @param uploadId - The ID of the upload.
 * @param chunkIndex - The index of the current chunk.
 * @param chunk - The file chunk to upload.
 * @param fileName - The name of the original file.
 * @param totalChunks - The total number of chunks.
 * @returns Promise<void>
 */
export const uploadChunk = async (
  uploadId: string,
  chunkIndex: number,
  chunk: Blob,
  fileName: string,
  totalChunks: number
): Promise<void> => {
  const formData = new FormData();
  formData.append('upload_id', uploadId);
  formData.append('chunk_num', chunkIndex.toString());
  formData.append('chunk', chunk, `${fileName}-chunk-${chunkIndex}`);
  formData.append('file_name', fileName);
  formData.append('total_chunks', totalChunks.toString());

  const response = await fetch(`${API_BASE_URL}/chunk`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.msg || `Failed to upload chunk ${chunkIndex}`);
  }
  // Assuming the backend returns a success message or status
  // const result = await response.json(); 
  // console.log('Chunk upload result:', result);
};

/**
 * Completes the file upload process.
 * @param params - UploadCompleteParams
 * @returns Promise<void>
 */
export const completeUpload = async (params: UploadCompleteParams): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.msg || 'Failed to complete upload');
  }
  // Assuming the backend returns a success message or status
  // const result = await response.json();
  // console.log('Complete upload result:', result);
};

/**
 * Gets the status of a file upload.
 * @param uploadId - The ID of the upload.
 * @returns Promise<FileUploadStatusResponse>
 */
export const getFileUploadStatus = async (uploadId: string): Promise<FileUploadStatusResponse> => {
  const response = await fetch(`${API_BASE_URL}/upload_id?upload_id=${uploadId}`); // Corrected endpoint
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.msg || 'Failed to get file upload status');
  }
  const data = await response.json();
  return data;
};
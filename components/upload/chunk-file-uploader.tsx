// components/custom/chunk-file-uploader.tsx
import React, { useState, useCallback, useId } from 'react'; // Added useId
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
    initUpload,
    uploadChunk,
    completeUpload,
    InitUploadResponse,
    getFileUploadStatus,
    FileUploadStatusData
} from '@/lib/api_upload';
import { UploadCloud, File as FileIcon, CheckCircle2, Loader2 } from 'lucide-react';

interface ChunkFileUploaderProps {
    onUploadSuccess: (fileName: string, uploadId: string, sql_id: number) => void;
    // You can add more specific props if needed, e.g., accepted file types
}

const ChunkFileUploader: React.FC<ChunkFileUploaderProps> = ({ onUploadSuccess }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [uploadId, setUploadId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isCompleted, setIsCompleted] = useState<boolean>(false);
    const [fileProcessingStatus, setFileProcessingStatus] = useState<string | null>(null);
    const [lastUploadCode, setLastUploadCode] = useState<number>(0);
    const { toast } = useToast();
    const uniqueId = useId(); // Generate a unique ID

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
            setUploadProgress(0);
            setIsUploading(false);
            setUploadId(null);
            setError(null);
            setIsCompleted(false);
            setFileProcessingStatus(null);
        }
    };

    const handleUpload = useCallback(async () => {
        if (!selectedFile) {
            setError('Please select a file first.');
            return;
        }

        setIsUploading(true);
        setError(null);
        setUploadProgress(0);
        setIsCompleted(false);

        let currentUploadId = '';
        let chunkSize = 0;

        try {
            // 1. Init Upload
            toast({title: 'Initializing upload...', description: `File: ${selectedFile.name}`});
            const initData: InitUploadResponse = await initUpload();
            currentUploadId = initData.upload_id;
            chunkSize = initData.chunk_size;
            setUploadId(currentUploadId);
            toast({title: 'Upload initialized.', description: `Upload ID: ${currentUploadId}`});

            // 2. Chunk Upload
            const totalChunks = Math.ceil(selectedFile.size / chunkSize);
            for (let i = 0; i < totalChunks; i++) {
                const start = i * chunkSize;
                const end = Math.min(start + chunkSize, selectedFile.size);
                const chunk = selectedFile.slice(start, end);

                await uploadChunk(currentUploadId, i, chunk, selectedFile.name, totalChunks);
                let progress = Math.round(((i + 1) / totalChunks) * 100);
                if (progress >= 95 ) {
                    progress = 95;  // 后面还有一些流程要处理，故这里先设为95  
                }
                setUploadProgress(progress);
                toast({
                    title: `Uploading chunk ${i + 1}/${totalChunks}`,
                    description: `Progress: ${progress}%`
                });
            }

            // 3. Complete Upload
            await completeUpload({upload_id: currentUploadId, file_name: selectedFile.name});
            toast({
                title: 'Upload Complete!',
                description: `${selectedFile.name} has been successfully uploaded. Processing started...`,
                variant: 'default',
            });
            // onUploadSuccess(selectedFile.name, currentUploadId);

            // 4. Poll for file processing status
            await pollFileStatus(selectedFile.name, currentUploadId);

        } catch (err: any) {
            console.error('Upload failed:', err);
            setError(err.message || 'An unknown error occurred during upload.');
            toast({
                title: 'Upload Failed',
                description: err.message || 'An unknown error occurred.',
                variant: 'destructive'
            });
        } finally {
            setIsUploading(false);
        }
    }, [selectedFile, onUploadSuccess, toast]);

    const getStatusMessage = (statusCode: number): string => {
        switch (statusCode) {
            case 202:
                return 'File format processing...';
            case 203:
                return 'Transferring to GeoServer...';
            case 204:
                return 'Transfer to GeoServer successful.';
            case 210:
                return 'File processing complete!';
            case 500:
                return 'File processing failed.';
            default:
                return `Processing (status: ${statusCode})...`;
        }
    };

    const pollFileStatus = useCallback(async (file_name: string, fileUploadId: string) => {
        setFileProcessingStatus('Checking status...');
        try {
            const intervalId = setInterval(async () => {
                try {
                    const statusResponse = await getFileUploadStatus(fileUploadId);
                    const statusCode = statusResponse.data.status_code;
                    const sql_id = statusResponse.data.id;

                    if (lastUploadCode !== statusCode) {
                        setLastUploadCode(statusCode);

                        const message = getStatusMessage(statusCode);
                        setFileProcessingStatus(message);
                        toast({title: 'File Processing Update', description: `${file_name} (${message}}`});
                    }

                    if (statusCode >= 203 || statusCode === 500) {
                        clearInterval(intervalId);
                        if (statusCode >= 203) {
                            // progress bar should be full at this point
                            setUploadProgress(100);
                            setIsCompleted(true);
                            // console.log('File processing complete!', file_name, fileUploadId, sql_id);
                            onUploadSuccess(file_name, fileUploadId, sql_id);
                            toast({title: 'Success', description: 'File processed and ready.', variant: 'default'});
                        } else {
                            toast({
                                title: 'Error',
                                description: 'File processing failed on server.',
                                variant: 'destructive'
                            });
                        }
                    }
                } catch (pollError: any) {
                    console.error('Error polling status:', pollError);
                    setFileProcessingStatus(`Error polling: ${pollError.message}`);
                    // Optionally stop polling on repeated errors, or handle specific errors
                    // clearInterval(intervalId);
                    // toast({ title: 'Polling Error', description: 'Could not retrieve file status.', variant: 'destructive' });
                }
            }, 5000); // Poll every 5 seconds

            // Cleanup interval on component unmount or if uploadId changes
            return () => clearInterval(intervalId);
        } catch (initialError: any) {
            console.error('Failed to start polling:', initialError);
            setFileProcessingStatus(`Failed to start status check: ${initialError.message}`);
            toast({
                title: 'Status Check Error',
                description: 'Could not initiate file status checking.',
                variant: 'destructive'
            });
        }
    }, [toast]);

    return (
        <div className="p-4 border rounded-lg shadow-sm bg-card text-card-foreground w-full max-w-md mx-auto">
            <div className="flex flex-col items-center space-y-4">
                <label htmlFor={uniqueId} className="cursor-pointer w-full"> {/* Use uniqueId for htmlFor 解决多个组件同时渲染时，互相影响的问题*/}
                    <div
                        className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg hover:border-primary/70 transition-colors ${isUploading ? 'border-muted' : 'border-primary/50'}`}>
                        {isCompleted ? (
                            <CheckCircle2 className="w-16 h-16 text-green-500 mb-2"/>
                        ) : selectedFile ? (
                            <FileIcon className="w-16 h-16 text-primary mb-2"/>
                        ) : (
                            <UploadCloud className="w-16 h-16 text-muted-foreground mb-2"/>
                        )}
                        <span className="text-sm font-medium">
              {isCompleted ? `Uploaded: ${selectedFile?.name}` : selectedFile ? selectedFile.name : 'Click to select a file'}
            </span>
                        <span className="text-xs text-muted-foreground">
              {isCompleted ? `Uploaded: ${selectedFile?.name}` : selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'Supports all file types'}
            </span>
                        {fileProcessingStatus && !isCompleted && (
                            <div className="mt-2 flex items-center text-sm text-muted-foreground">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                {fileProcessingStatus}
                            </div>
                        )}
                    </div>
                </label>
                <Input
                    id={uniqueId} // Use uniqueId for id
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isUploading || isCompleted}
                />

                {selectedFile && !isCompleted && (
                    <Button
                        onClick={handleUpload}
                        disabled={isUploading || !selectedFile}
                        className="w-full"
                    >
                        {isUploading ? `Uploading... ${uploadProgress}%` : 'Upload File'}
                    </Button>
                )}

                {(isUploading || (uploadProgress > 0 && uploadProgress < 100)) && (
                    <Progress value={uploadProgress} className="w-full h-2"/>
                )}

                {error && (
                    <p className="text-sm text-destructive mt-2 text-center">{error}</p>
                )}
            </div>
        </div>
    );
};

export default ChunkFileUploader;
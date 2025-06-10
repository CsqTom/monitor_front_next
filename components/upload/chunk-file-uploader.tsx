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
import { UploadCloud, File as FileIcon, CheckCircle2, Loader2, List } from 'lucide-react'; // Changed ListFiles to List
import ExistingFileDialog, { ApiFileRecord } from './existing-file-dialog'; // Import the new dialog
import { getGeoTIFFCRSCode } from './check-epsg-func';

interface ChunkFileUploaderProps {
    suffix: string; // Added suffix
    onUploadSuccess: (fileName: string, uploadId: string, sql_id: number) => void;
    // You can add more specific props if needed, e.g., accepted file types
}

const ChunkFileUploader: React.FC<ChunkFileUploaderProps> = ({suffix = '.tif', onUploadSuccess }) => {
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
    const [isExistingFileDialogOpen, setIsExistingFileDialogOpen] = useState(false);
    const [canOperate, setCanOperate] = useState<boolean>(true); // 控制是否可以进行操作
    const [epsgCheckPassed, setEpsgCheckPassed] = useState<boolean>(false); // EPSG检查是否通过
    const [epsgInfo, setEpsgInfo] = useState<string>(''); // EPSG信息
    const [isCheckingEpsg, setIsCheckingEpsg] = useState<boolean>(false); // EPSG检查中状态
    let lastToastTime = new Date().getTime();

    const resetState = () => {
        setSelectedFile(null);
        setUploadProgress(0);
        setIsCompleted(false);
        setError(null);
        setIsUploading(false);
        setUploadId('');
        setFileProcessingStatus('');
        setCanOperate(true); // 重置时启用操作
        setEpsgCheckPassed(false); // 重置EPSG检查状态
        setEpsgInfo(''); // 重置EPSG信息
        setIsCheckingEpsg(false); // 重置EPSG检查中状态
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
            setUploadProgress(0);
            setIsUploading(false);
            setUploadId(null);
            setError(null);
            setIsCompleted(false);
            setFileProcessingStatus(null);
            setCanOperate(true); // 重置操作状态
            setEpsgCheckPassed(false); // 重置EPSG检查状态
            setEpsgInfo(''); // 重置EPSG信息
            setIsCheckingEpsg(false); // 重置EPSG检查中状态
            
            // 只对tif/tiff文件进行EPSG检查
            const file = event.target.files[0];
            if (isTiffFile(file)) {
                checkFileEpsg(file);
            } else {
                // 非tif/tiff文件直接通过EPSG检查
                setEpsgCheckPassed(true);
                setEpsgInfo('非TIFF文件，跳过坐标系统检查');
            }
        }
    };

    const handleUpload = useCallback(async () => {
        if (!selectedFile) {
            setError('Please select a file first.');
            return;
        }
        
        // 只对tif/tiff文件检查EPSG
        if (isTiffFile(selectedFile) && !epsgCheckPassed) {
            setError('EPSG coordinate system check must pass before uploading.');
            toast({
                title: 'Upload Blocked',
                description: 'TIFF file must have valid EPSG coordinate system to upload.',
                variant: 'destructive'
            });
            return;
        }

        setIsUploading(true);
        setError(null);
        setUploadProgress(0);
        setIsCompleted(false);
        setCanOperate(false); // 开始上传时禁用操作

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
                if (progress < 90) {
                    // 进行时间间隔检查，防止频繁触发toast
                    const curTime = new Date().getTime();
                    
                    if (curTime - lastToastTime < 3000) {
                        continue;
                    }
                }
                lastToastTime = new Date().getTime();

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

            // 4. Poll for file processing status
            await pollFileStatus(selectedFile.name, currentUploadId);

        } catch (err: any) {
            console.error('Upload failed:', err);
            setError(err.message || 'An unknown error occurred during upload.');
            setCanOperate(true); // 上传失败时重新启用操作
            toast({
                title: 'Upload Failed',
                description: err.message || 'An unknown error occurred.',
                variant: 'destructive'
            });
        } finally {
            setIsUploading(false);
            setFileProcessingStatus(null);
        }
    }, [selectedFile, onUploadSuccess, toast, epsgCheckPassed]);

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
                            setIsCompleted(true);  // 后端处理完成，前端上传完成, 这时才能允许新的操作
                            setCanOperate(true); // 上传完成后重新启用操作
                            
                            onUploadSuccess(file_name, fileUploadId, sql_id);
                            toast({title: 'Success', description: 'File processed and ready.', variant: 'default'});
                        } else {
                            setCanOperate(true); // 上传出错后重新启用操作
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
    }, [toast, onUploadSuccess, lastUploadCode]); // Added onUploadSuccess and lastUploadCode to dependencies as they are used inside

    // EPSG检查函数
    const checkFileEpsg = useCallback(async (file: File) => {
        if (!file) return;
        
        setIsCheckingEpsg(true);
        setEpsgCheckPassed(false);
        setEpsgInfo('');
        
        try {
            const epsgCode = await getGeoTIFFCRSCode(file);
            
            if (epsgCode && epsgCode !== 'empty') {
                setEpsgCheckPassed(true);
                setEpsgInfo(epsgCode);
                toast({
                    title: '坐标系统检查通过',
                    description: `检测到坐标系统: ${epsgCode}`,
                    variant: 'default'
                });
            } else {
                setEpsgCheckPassed(false);
                setEpsgInfo('');
                toast({
                    title: '坐标系统检查失败',
                    description: '未检测到有效的EPSG坐标系统信息',
                    variant: 'destructive'
                });
            }
        } catch (error: any) {
            console.error('EPSG检查失败:', error);
            setEpsgCheckPassed(false);
            setEpsgInfo('');
            toast({
                title: '坐标系统检查错误',
                description: error.message || '检查过程中发生错误',
                variant: 'destructive'
            });
        } finally {
            setIsCheckingEpsg(false);
        }
    }, [toast]);

    // 检查是否为TIFF文件
    const isTiffFile = (file: File | null): boolean => {
        if (!file) return false;
        const fileName = file.name.toLowerCase();
        return fileName.endsWith('.tif') || fileName.endsWith('.tiff');
    };

    const handleSelectExistingFile = (file: ApiFileRecord) => {
        // Simulate a successful upload for an existing file
        setSelectedFile(new File([], file.file_name)); // Create a dummy file for display purposes
        setUploadId(file.upload_id);
        setIsCompleted(true);
        setUploadProgress(100);
        setFileProcessingStatus('Selected from existing files.');
        setError(null);
        setIsUploading(false);
        setCanOperate(true); // 选择现有文件后启用操作
        setEpsgCheckPassed(true); // 假设现有文件已经通过EPSG检查
        const dummyFile = new File([], file.file_name);
        if (isTiffFile(dummyFile)) {
            setEpsgInfo('EPSG:4326'); // 设置默认EPSG信息
        } else {
            setEpsgInfo('非TIFF文件，跳过坐标系统检查');
        }
        onUploadSuccess(file.file_name, file.upload_id, file.id);
        toast({
            title: 'File Selected',
            description: `${file.file_name} selected from existing files.`,
            variant: 'default',
        });
        setIsExistingFileDialogOpen(false);
    };

    return (
        <div className="p-4 border rounded-lg shadow-sm bg-card text-card-foreground w-full max-w-md mx-auto">
            <div className="flex flex-col items-center space-y-4">
                <label htmlFor={canOperate ? uniqueId : undefined} className={`w-full ${canOperate ? 'cursor-pointer' : 'cursor-not-allowed'}`}> {/* Use uniqueId for htmlFor 解决多个组件同时渲染时，互相影响的问题*/}
                    <div
                        className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors ${!canOperate ? 'border-muted bg-muted/20' : isUploading ? 'border-muted' : 'border-primary/50 hover:border-primary/70'}`}>
                        {isCompleted ? (
                            <CheckCircle2 className="w-16 h-16 text-green-500 mb-2"/>
                        ) : selectedFile ? (
                            <FileIcon className="w-16 h-16 text-primary mb-2"/>
                        ) : (
                            <UploadCloud className="w-16 h-16 text-muted-foreground mb-2"/>
                        )}
                        <span className="text-sm font-medium">
                        {isCompleted ? `上传成功: ${selectedFile?.name}` : selectedFile ? selectedFile.name : `选择本地文件(*${suffix})`}
                        </span>
                        {/* 文件信息和EPSG检查信息显示 */}
                         {selectedFile && !isCompleted && (
                             <div className="w-full mt-3 space-y-2">
                                 <div className="flex items-center justify-center text-xs">
                                     <span className="text-muted-foreground mr-2">
                                         {`${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`}
                                     </span>
                                     {isTiffFile(selectedFile) ? (
                                         isCheckingEpsg ? (
                                             <div className="flex items-center text-muted-foreground">
                                                 <Loader2 className="mr-1 h-3 w-3 animate-spin"/>
                                                 <span>检查坐标系统...</span>
                                             </div>
                                         ) : epsgCheckPassed ? (
                                             <div className="flex items-center text-green-600">
                                                 <CheckCircle2 className="mr-1 h-3 w-3"/>
                                                 <span>{epsgInfo || 'EPSG检查通过'}</span>
                                             </div>
                                         ) : (
                                             <div className="flex items-center text-red-600">
                                                 <span className="mr-1">❌</span>
                                                 <span>无效坐标系统</span>
                                             </div>
                                         )
                                     ) : (
                                         <div className="flex items-center text-blue-600">
                                             <CheckCircle2 className="mr-1 h-3 w-3"/>
                                             <span>非TIFF文件</span>
                                         </div>
                                     )}
                                 </div>
                                 {isTiffFile(selectedFile) && !epsgCheckPassed && !isCheckingEpsg && (
                                     <p className="text-xs text-muted-foreground text-center">
                                         TIFF文件必须包含有效的EPSG坐标系统信息才能上传
                                     </p>
                                 )}
                             </div>
                         )}
                        
                        {isCompleted && (
                            <span className="text-xs text-muted-foreground mt-2">
                                点击: 重新上传
                            </span>
                        )}

                        {fileProcessingStatus && !isCompleted && (
                            <div className="mt-2 flex items-center text-sm text-muted-foreground">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                {fileProcessingStatus}
                            </div>
                        )}

                        {selectedFile && !isCompleted && (
                            <Button
                                onClick={handleUpload}
                                disabled={!canOperate || isUploading || !selectedFile || !epsgCheckPassed}
                                className="w-full mt-2"
                            >
                                {isUploading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {`Uploading... ${uploadProgress}%`}</>
                                ) : (
                                    <><UploadCloud className="mr-2 h-4 w-4" />开始上传</>
                                )}
                            </Button>
                        )}

                        {(isUploading || (uploadProgress > 0 && uploadProgress < 100 && selectedFile)) && (
                            <Progress value={uploadProgress} className="w-full h-2 mt-2"/>
                        )}

                    </div>
                </label>
                <Input
                    id={uniqueId} // Use uniqueId for id
                    type="file"
                    accept={suffix}
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={!canOperate}
                />

                <div className="w-full space-y-2">
                    <Button variant="outline" onClick={() => setIsExistingFileDialogOpen(true)} className="w-full" disabled={!canOperate}>
                        <List className="mr-2 h-4 w-4" /> 从列表中选择
                    </Button>
                </div>

                

                {error && (
                    <p className="text-sm text-destructive mt-2 text-center">{error}</p>
                )}

            </div>
            <ExistingFileDialog 
                open={isExistingFileDialogOpen} 
                onOpenChange={setIsExistingFileDialogOpen} 
                onFileSelect={handleSelectExistingFile} 
            />
        </div>
    );
};

export default ChunkFileUploader;
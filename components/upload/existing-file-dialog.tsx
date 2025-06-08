// components/upload/existing-file-dialog.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

export interface ApiFileRecord {
    id: number;
    upload_id: string;
    file_name: string;
    save_path: string;
    upload_time: string;
    size_gb: number;
    is_deleted: boolean;
    status_code: number;
    other_info: string;
}

interface ApiFileListData {
    records: ApiFileRecord[];
    current: number;
    size: number;
    total: number;
    pages: number;
}

interface ApiFileListResponse {
    code: number;
    msg: string;
    data: ApiFileListData;
}

interface ExistingFileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onFileSelect: (file: ApiFileRecord) => void;
}

const ExistingFileDialog: React.FC<ExistingFileDialogProps> = ({ open, onOpenChange, onFileSelect }) => {
    const [dialogSize, setDialogSize] = useState({ width: 'auto', height: 'auto' });
    const [files, setFiles] = useState<ApiFileRecord[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [selectedFileId, setSelectedFileId] = useState<string | undefined>(undefined);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const PAGE_SIZE = 15; // Or make this configurable

    const fetchFiles = useCallback(async (page: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/image_data/page?page=${page}&page_size=${PAGE_SIZE}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result: ApiFileListResponse = await response.json();
            if (result.code === 200) {
                setFiles(result.data.records); // Update files only on success
                setCurrentPage(result.data.current);
                setTotalPages(result.data.pages);
                setError(null); // Clear any previous error
            } else {
                throw new Error(result.msg || 'Failed to fetch files.');
            }
        } catch (err: any) {
            setError(err.message);
            toast({ title: 'Error Fetching Files', description: err.message, variant: 'destructive' });
            // Do not clear files here to prevent flicker if old data is still relevant
        }
        setIsLoading(false);
    }, [toast]);

    useEffect(() => {
        const updateSize = () => {
            const newWidth = window.innerWidth * 0.7; // eg: 4/5 of window width
            const newHeight = window.innerHeight * 0.7; // eg: 4/5 of window height
            setDialogSize({ width: `${newWidth}px`, height: `${newHeight}px` });
        };

        if (open) {
            fetchFiles(1); // Fetch first page when dialog opens
            setSelectedFileId(undefined); // Reset selection
            updateSize(); // Set initial size
            window.addEventListener('resize', updateSize); // Update size on window resize
        } else {
            window.removeEventListener('resize', updateSize);
        }

        return () => window.removeEventListener('resize', updateSize);
    }, [open, fetchFiles]);

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            fetchFiles(currentPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            fetchFiles(currentPage - 1);
        }
    };

    const handleConfirm = () => {
        if (selectedFileId) {
            const selectedFile = files.find(file => file.id.toString() === selectedFileId);
            if (selectedFile) {
                onFileSelect(selectedFile);
                onOpenChange(false); // Close dialog
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent style={{ width: dialogSize.width, height: dialogSize.height, maxWidth: dialogSize.width }} className="flex flex-col">
                <DialogHeader>
                    <DialogTitle className='text-sm'>请选择图像</DialogTitle>
                    <DialogDescription>
                        从列表中选择已上传的图像.
                    </DialogDescription>
                </DialogHeader>
                {/* Conditional rendering for loading and error states, but keep table visible if files exist */}
                {isLoading && files.length === 0 && (
                    <div className="flex justify-center items-center flex-grow">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
                {error && files.length === 0 && (
                    <p className="text-destructive text-center flex-grow flex items-center justify-center">Error: {error}</p>
                )}
                {!isLoading && !error && files.length === 0 && (
                     <p className="text-center text-muted-foreground py-4 flex-grow flex items-center justify-center">No files found.</p>
                )}
                {(files.length > 0) && (
                    <RadioGroup value={selectedFileId} onValueChange={setSelectedFileId} className="overflow-y-auto flex-grow text-sm">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px] table-head-light">选 择</TableHead>
                                    <TableHead className='table-head-light'>文 件 名</TableHead>
                                    <TableHead className='table-head-light'>上 传 时 间</TableHead>
                                    <TableHead className='table-head-light'>文件大小</TableHead>
                                    <TableHead className='table-head-light'>经 度</TableHead> 
                                    <TableHead className='table-head-light'>纬 度</TableHead>
                                    <TableHead className='table-head-light'>地 理 位 置</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {files.map((file) => (
                                    <TableRow key={file.id} onClick={() => setSelectedFileId(file.id.toString())} className="cursor-pointer hover:bg-muted/50">
                                        <TableCell className='text-center'>
                                            <RadioGroupItem value={file.id.toString()} id={`file-${file.id}`} />
                                        </TableCell>
                                        <TableCell className="font-medium text-center">{file.file_name}</TableCell>
                                        <TableCell className='table-cell-center'>{new Date(file.upload_time).toLocaleString()}</TableCell>
                                        <TableCell className='table-cell-center'>{file.size_gb.toFixed(2)} GB</TableCell>
                                        {(() => {
                                            let otherInfoData = { longitude: 'N/A', latitude: 'N/A', address: 'N/A' };
                                            if (file.other_info) {
                                                try {
                                                    // Replace single quotes with double quotes for valid JSON
                                                    const validJsonString = file.other_info.replace(/'/g, '"');
                                                    const parsedInfo = JSON.parse(validJsonString);
                                                    otherInfoData.longitude = parsedInfo.longitude !== undefined && parsedInfo.longitude !== null ? parsedInfo.longitude.toString() : 'N/A';
                                                    otherInfoData.latitude = parsedInfo.latitude !== undefined && parsedInfo.latitude !== null ? parsedInfo.latitude.toString() : 'N/A';
                                                    otherInfoData.address = parsedInfo.address || 'N/A';
                                                } catch (e) {
                                                    console.error('Failed to parse other_info:', e, 'for file:', file.file_name, 'with value:', file.other_info);
                                                    // Keep default 'N/A' values if parsing fails
                                                }
                                            }
                                            return (
                                                <>
                                                    <TableCell className='text-center'>{otherInfoData.longitude}</TableCell>
                                                    <TableCell className='text-center'>{otherInfoData.latitude}</TableCell>
                                                    <TableCell className='text-center'>{otherInfoData.address}</TableCell>
                                                </>
                                            );
                                        })()}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </RadioGroup>
                )}
                <DialogFooter className="sm:justify-between pt-4">
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handlePreviousPage}
                            disabled={currentPage <= 1 || isLoading}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleNextPage}
                            disabled={currentPage >= totalPages || isLoading}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className='flex space-x-2'>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="button" onClick={handleConfirm} disabled={!selectedFileId || isLoading}>
                            确 认
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ExistingFileDialog;
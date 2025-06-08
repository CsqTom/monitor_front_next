// components/custom/image-upload.tsx
import React, {useState, useCallback, useEffect} from 'react';
import ChunkFileUploader from '@/components/upload/chunk-file-uploader'; // Updated import
import { Label } from "@/components/ui/label";

export interface IDict {
    key: string;
    value: string;
}

interface ImageUploadProps {
    all_len: number;
    data_para_key: string;
    onUploadComplete: (is_success: boolean, msg: string, data: IDict) => void;
}

const ImageUploadComponent: React.FC<ImageUploadProps> = ({all_len, data_para_key, onUploadComplete}) => {
    const [uploadedFiles, setUploadedFiles] = useState<number>(0);
    const [isUploadFinished, setIsUploadFinished] = useState<boolean>(false);
    const [keyValue, setKeyValue] = useState<string>('');

    const handleSingleUploadSuccess = (fileName: string, uploadId: string, sql_id: number) => {
        setKeyValue(prev => prev ? `${prev},${sql_id}` : `${sql_id}`);
        console.log('handleSingleUploadSuccess', fileName, uploadId, keyValue);

        setUploadedFiles((prev) => prev + 1);
    };

    useEffect(() => {
        if (uploadedFiles === all_len) {
            if (!isUploadFinished) {
                setIsUploadFinished(true);
                onUploadComplete(true, 'All images processed!', {
                    key: data_para_key,
                    value: keyValue
                });
            }
        }
    }, [uploadedFiles, all_len, onUploadComplete, keyValue, data_para_key,]);

    // Determine grid layout based on all_len
    // Show 1 column by default, 2 columns on medium screens if more than 1 item, 
    // and 3 columns on large screens if more than 2 items.
    let gridLayoutClasses = "grid-cols-1";
    if (all_len === 2) {
        gridLayoutClasses = "grid-cols-1 md:grid-cols-2";
    } else if (all_len >= 3) {
        gridLayoutClasses = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
    }
    // For the success message, determine column span
    let successMessageSpanClasses = "";
    if (all_len === 2) {
        successMessageSpanClasses = "md:col-span-2";
    } else if (all_len >= 3) {
        successMessageSpanClasses = "md:col-span-2 lg:col-span-3"; // Span all columns
    }


    return (
        <div className={`grid ${gridLayoutClasses} gap-6 py-3`}>
            {Array.from({length: all_len}).map((_, idx) => (
                <div key={idx}> {/* Added rounded-lg, shadow-sm, flex for better item layout */}
                    {/* <Label className="text-base font-medium">Image {idx + 1}</Label> Adjusted Label */}
                    {/* <p className="text-xs text-muted-foreground">Part {idx + 1} of {all_len}</p>  */}
                    <Label className='font-medium text-base py-2'>
                        {all_len === 2 ? (
                            idx === 0 ? "前时相数据" : "后时相数据"
                        ) : `Part ${idx + 1} of ${all_len}`}
                    </Label>
                    <ChunkFileUploader
                        suffix=".tif"
                        onUploadSuccess={(fileName, uploadId, sql_id) => handleSingleUploadSuccess(fileName, uploadId, sql_id)}/>
                </div>
            ))}
            {uploadedFiles === all_len && (
                <div className={`mt-2 p-2 bg-green-100 dark:bg-green-800 border border-green-300 rounded-md text-center ${successMessageSpanClasses}`}> {/* Adjusted colors and added span */}
                    <p className="text-green-800 dark:text-green-200">所有文件已完成上传！</p> {/* Adjusted colors and message */}
                </div>
            )}
        </div>
    );
};

export default ImageUploadComponent;
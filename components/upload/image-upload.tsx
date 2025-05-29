// components/custom/image-upload.tsx
import React, {useState, useCallback, useEffect} from 'react';
import ChunkFileUploader from '@/components/upload/chunk-file-uploader'; // Updated import

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
            setIsUploadFinished(true);
            onUploadComplete(true, 'All images processed!', {
                key: data_para_key,
                value: keyValue
            });
        }
    }, [uploadedFiles, all_len, onUploadComplete, keyValue, data_para_key,]);

    return (
        <div className="space-y-6 p-4">
            <h2 className="text-xl font-semibold text-center">Upload Images</h2>
            {Array.from({length: all_len}).map((_, idx) => (
                <div key={idx} className="container py-4 border-b last:border-b-0">
                    <p className="text-sm text-muted-foreground mb-2">Image {idx + 1} of {all_len}</p>
                    <ChunkFileUploader
                        onUploadSuccess={(fileName, uploadId, sql_id) => handleSingleUploadSuccess(fileName, uploadId, sql_id)}/>
                </div>
            ))}
            {uploadedFiles === all_len && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md text-center">
                    <p className="text-green-700 font-medium">All {all_len} images have been processed!</p>
                </div>
            )}
        </div>
    );
};

export default ImageUploadComponent;
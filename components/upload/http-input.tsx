// Placeholder for HttpInputComponent.tsx
// This component will handle HTTP address input.
import React from 'react';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';

interface HttpInputProps {
    all_len: number;
    onUrlSubmit: (url: string) => void;
    // Add other necessary props here
}

const HttpInputComponent: React.FC<HttpInputProps> = ({all_len, onUrlSubmit}) => {
    const [url, setUrl] = React.useState('');

    const handleSubmit = () => {
        onUrlSubmit(url);
    };

    const changeUrl = (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log(e.target.value);
    };

    return (
        <div>
            {Array.from({length: all_len}).map((_, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                    <Label> ad </Label>
                    <Input value={url} onChange={changeUrl} onSubmit={handleSubmit}/>
                </div>
            ))}

            {Array.from({length: all_len}).map((_, idx) => (
                <div key={idx}>
                    <input type="file"/>
                    <progress value={0} max={100}/>
                </div>
            ))}

        </div>
    );
};

export default HttpInputComponent;
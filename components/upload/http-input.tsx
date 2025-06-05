// HttpInputComponent.tsx
// This component will handle HTTP address input.
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface HttpInputProps {
    need_check: boolean;
    all_len: number;
    format: string;
    onUrlSubmit: (url: string, isValid?: boolean) => void;
    // Add other necessary props here
}

const HttpInputComponent: React.FC<HttpInputProps> = ({need_check, all_len, format, onUrlSubmit}) => {
    const [url, setUrl] = useState('');
    const [isChecking, setIsChecking] = useState(false);
    const [isValid, setIsValid] = useState<boolean | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const { toast } = useToast();
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // 自动提交函数
    const handleSubmit = () => {
        onUrlSubmit(url, isValid);
    };

    // 检查URL格式是否符合要求
    const checkUrlFormat = (url: string) => {
        if (url.startsWith(format)) {
            return true;
        }
        return false;
    };

    const checkHttpUrl = async (url: string) => {
        setIsChecking(true);
        setIsValid(null);
        setErrorMessage('');
        
        try {
            // 尝试使用no-cors模式发送请求
            // 注意：no-cors模式下无法读取响应状态，但可以检测连接是否成功
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    mode: 'no-cors', // 使用no-cors模式绕过CORS限制
                    cache: 'no-store',
                    signal: AbortSignal.timeout(5000)
                });
                
                // 在no-cors模式下，即使请求成功，response.type也会是'opaque'，无法读取状态
                // 但如果能走到这一步而不抛出异常，通常意味着连接是成功的
                setIsValid(true);
                toast({
                    title: '验证成功',
                    description: '该地址可以访问'
                });
                
                // 如果有响应体，立即取消请求
                if (response.body) {
                    response.body.cancel();
                }
                
                // 验证成功后自动提交
                handleSubmit();
                return true;
            } catch (error) {
                // 如果使用no-cors模式仍然失败，尝试使用默认模式（可能会受到CORS限制）
                try {
                    const directResponse = await fetch(url, {
                        method: 'GET',
                        cache: 'no-store',
                        signal: AbortSignal.timeout(5000)
                    });
                    
                    if (directResponse.ok) {
                        // 立即取消请求
                        if (directResponse.body) {
                            directResponse.body.cancel();
                        }
                        
                        setIsValid(true);
                        toast({
                            title: '验证成功',
                            description: '该地址可以访问'
                        });
                        
                        // 验证成功后自动提交
                        handleSubmit();
                        return true;
                    } else {
                        throw new Error(`HTTP错误: ${directResponse.status}`);
                    }
                } catch (directError) {
                    // 两种方式都失败，抛出原始错误
                    throw error;
                }
            }
        } catch (error) {
            setIsValid(false);
            const errorMsg = error instanceof Error ? error.message : '未知错误';
            setErrorMessage(`检测失败: ${errorMsg}`);
            toast({
                title: '验证失败',
                description: `检测失败: ${errorMsg}`,
                variant: 'destructive'
            });
            return false;
        } finally {
            setIsChecking(false);
        }
    };

    const checkStreamUrl = (url: string) => {
        // 浏览器无法直接检测 RTMP/RTSP 流，只能验证格式
        const rtmpRegex = /^rtmp:\/\/([^\s/]+)(\/\S*)?$/;
        const rtspRegex = /^rtsp:\/\/([^\s/]+)(\/\S*)?$/;
        
        if (rtmpRegex.test(url) || rtspRegex.test(url)) {
            setIsValid(true);
            toast({
                title: '格式验证通过',
                description: '流媒体地址格式正确，但无法验证连接性'
            });
            
            // 验证成功后自动提交
            handleSubmit();
            return true;
        } else {
            setIsValid(false);
            setErrorMessage('流媒体地址格式不正确');
            toast({
                title: '验证失败',
                description: '流媒体地址格式不正确',
                variant: 'destructive'
            });
            return false;
        }
    };

    // 自动验证函数
    const autoCheckUrl = async () => {
        if (!url) {
            return;
        }
        
        if (url.startsWith('http://') || url.startsWith('https://')) {
            await checkHttpUrl(url);
        } else if (url.startsWith('rtmp://') || url.startsWith('rtsp://')) {
            checkStreamUrl(url);
        } else {
            setIsValid(false);
            setErrorMessage(`不支持的协议，请使用 ${format}`);
            toast({
                title: '验证失败',
                description: `不支持的协议，请使用 ${format}`,
                variant: 'destructive'
            });
        }
    };

    const changeUrl = (e: React.ChangeEvent<HTMLInputElement>) => {
        const net_addr = e.target.value;
        setUrl(net_addr);
        
        // 重置状态
        setIsChecking(false);
        setIsValid(null);
        setErrorMessage('');
        
        // 清除之前的定时器
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }
        
        // 如果不需要验证，且格式正确，直接提交
        if (!need_check) {
            if (checkUrlFormat(net_addr)) {
                // 设置一个短暂的延迟，让用户有机会完成输入
                debounceTimerRef.current = setTimeout(() => {
                    setIsValid(true);
                    handleSubmit();
                }, 500);
            } else {
                setIsChecking(false);
                setIsValid(false);
                setErrorMessage('请输入正确的网络地址');
            }
            return;
        }
        
        // 如果需要验证，设置防抖定时器，停止输入2秒后自动验证
        if (net_addr && checkUrlFormat(net_addr)) {
            debounceTimerRef.current = setTimeout(() => {
                autoCheckUrl();
            }, 2000); // 2秒后自动验证
        }
    };

    // 组件卸载时清除定时器
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    return (
        <div>
            {Array.from({length: all_len}).map((_, idx) => (
                <div key={idx} className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <Label className="w-30">网络地址</Label>
                        <div className="flex-1">
                            <Input 
                                value={url} 
                                onChange={changeUrl} 
                                placeholder={`请输入${format}地址`}
                                className={`w-full ${isValid === true ? 'border-green-500' : isValid === false ? 'border-red-500' : ''}`}
                                disabled={isChecking}
                            />
                        </div>
                    </div>
                    
                    {isChecking && (
                        <div className="flex items-center space-x-2 text-sm text-blue-600">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>验证中...</span>
                        </div>
                    )}
                    
                    {!isChecking && isValid !== null && (
                        <div className={`flex items-center space-x-2 text-sm ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                            {isValid ? (
                                <>
                                    <CheckCircle className="h-4 w-4" />
                                    <span>地址有效</span>
                                </>
                            ) : (
                                <>
                                    <XCircle className="h-4 w-4" />
                                    <span>{errorMessage || '地址无效'}</span>
                                </>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default HttpInputComponent;
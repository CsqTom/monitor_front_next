'use client';

import {useState, useEffect, useCallback} from 'react';
import {Button} from '@/components/ui/button';
import {
    Sheet, SheetClose,
    SheetContent, SheetDescription, SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import {Input} from '@/components/ui/input';
import {Label} from "@/components/ui/label";
import {apiRequest, request} from '@/lib/api_client';
import {useToast} from '@/hooks/use-toast';
import {Card, CardContent} from "@/components/ui/card";
import ImageUploadComponent from '@/components/upload/image-upload';
import {IDict} from "@/components/upload/image-upload";
import HttpInputComponent from '@/components/upload/http-input';
import {AlgorithmSelector, AlgorithmSelectionResult} from '@/components/task/algorithm-selector';

// 定义接口
interface ProjectData {
    id: number;
    name: string;
    logo_path: string;
    is_delete: boolean;
    longitude: number;
    latitude: number;
    altitude: number;
}

interface UserData {
    all_len: number;
    data_format: string;
    data_para_key: string;
}

interface ApiConfigs {
    id: number;
    name: string;
    app_addr: string;
    model_type: number;
    class_code_key: string;
    user_data: UserData[];
}

interface ApiResponse<T> {
    code: number;
    msg: string;
    data: {
        code: number;
        msg: string;
        data: T;
    }
}

interface JustApiResponse {
    code: number;
    msg: string;
}

interface NewSheetProps {
    isNewSheetOpen: boolean;
    setIsNewSheetOpen: (isOpen: boolean) => void;
    onCreate: () => void;
}



export function NewTaskSheet({isNewSheetOpen, setIsNewSheetOpen, onCreate}: NewSheetProps) {
    const [taskName, setTaskName] = useState('');
    const [algorithmSelection, setAlgorithmSelection] = useState<AlgorithmSelectionResult>({
        algorithmType: null,
        algorithmCategory: null,
        algorithmApi: null
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userDataConfigs, setUserDataConfigs] = useState<UserData[]>([]);

    const [httpUrls, setHttpUrls] = useState<Record<string, string>>({});
    const [imageInfo, setImageInfo] = useState<Record<string, string>>({});
    const {toast} = useToast();

    // 获取API配置
    const fetchApiConfig = useCallback(async (configId: string) => {
        if (!configId) return;
        
        try {
            const response = await apiRequest<ApiConfigs>({
                url: '/ai_config/api_config',
                method: 'GET',
                params: {config_id: configId},
            });
            if (response) {
                const api_config: ApiConfigs = response;
                setUserDataConfigs(api_config.user_data || []);
                // Reset states when API config changes
                setHttpUrls({});
                setImageInfo({});
            }
        } catch (error) {
            console.error('Error fetching project configs:', error);
            toast({
                title: '获取配置失败',
                description: '无法连接到服务器或发生未知错误。',
                variant: 'destructive',
            });
        }
    }, [toast]); // 添加toast作为依赖项

    // 处理算法选择变化
    const handleAlgorithmSelectionChange = useCallback((selection: AlgorithmSelectionResult) => {
        setAlgorithmSelection(prevSelection => {
            // 当API选择变化时，获取对应的用户数据配置
            if (selection.algorithmApi?.id && 
                selection.algorithmApi.id.toString() !== prevSelection.algorithmApi?.id.toString()) {
                fetchApiConfig(selection.algorithmApi.id.toString());
            }
            return selection;
        });
    }, [fetchApiConfig]);  // 添加fetchApiConfig作为依赖项
    
    // 当Sheet打开且有API选择时，获取API配置
    useEffect(() => {
        if (isNewSheetOpen && algorithmSelection.algorithmApi?.id) {
            fetchApiConfig(algorithmSelection.algorithmApi.id.toString());
        }
    }, [isNewSheetOpen, algorithmSelection.algorithmApi?.id, fetchApiConfig]);

    const handleUploadComplete = (is_success: boolean, msg: string, data: IDict) => {
        console.log("handleUploadComplete", is_success, msg, data);
        if (is_success && data && data.key && data.value) {
            // 将上传的文件信息存储到imageInfo中
            // data 的格式为 {key: 'file_path', value: '44,45'}
            // 我们需要将 file_path 作为 imageInfo 的键，并将 44,45 作为值
            // 但考虑到 userData.data_para_key 才是真正的键，这里假设 data.key 总是 'file_path'
            // 并且 ImageUploadComponent 应该传递 data_para_key
            // 为了兼容，我们暂时先用一个固定的键，或者如果 ImageUploadComponent 能把 data_para_key 传过来就更好了
            // 假设 ImageUploadComponent 的 data 结构是 { data_para_key: 'actual_key', file_path: 'value'}
            // 根据用户描述，data是 {key: 'file_path', value: '44,45'}
            // 这意味着 ImageUploadComponent 并没有传递 data_para_key
            // 我们需要找到 ImageUploadComponent 实例，看它是在哪个 userDataConfig 下渲染的
            // 暂时先假设 ImageUploadComponent 总是对应第一个需要上传图片的 userDataConfig
            const imageUserData = userDataConfigs.find(ud => ud.data_format === 'tif');
            if (imageUserData) {
                 setImageInfo(prev => ({
                    ...prev,
                    [imageUserData.data_para_key]: data.value
                }));
            } else {
                // 如果没有找到对应的 userDataConfig，这会是个问题
                // 暂时先用 data.key 作为键，但这可能不符合预期
                setImageInfo(prev => ({
                    ...prev,
                    [data.key]: data.value
                }));
            }
            console.log("imageInfo", imageInfo);
        }
    };

    const handleUrlSubmit = (dataParaKey: string, url: string) => {
        setHttpUrls(prev => ({...prev, [dataParaKey]: url}));
    };

    const handleCreate = async () => {
        // 验证所有必填项
        if (!taskName.trim()) {
            toast({
                title: '验证失败',
                description: '请输入任务名称',
                variant: 'destructive',
            });
            return;
        }

        if (!algorithmSelection.algorithmType) {
            toast({
                title: '验证失败',
                description: '请选择算法类型',
                variant: 'destructive',
            });
            return;
        }

        if (!algorithmSelection.algorithmApi) {
            toast({
                title: '验证失败',
                description: '请选择算法API',
                variant: 'destructive',
            });
            return;
        }

        // 验证所有必需的数据输入
        for (const userData of userDataConfigs) {
            if (userData.data_format === 'tif') {
                if (!imageInfo[userData.data_para_key]) {
                    toast({
                        title: '验证失败',
                        description: `请上传${userData.data_para_key}参数的图片文件`,
                        variant: 'destructive',
                    });
                    return;
                }
            } else if (userData.data_format === 'http') {
                if (!httpUrls[userData.data_para_key]) {
                    toast({
                        title: '验证失败',
                        description: `请输入${userData.data_para_key}参数的HTTP地址`,
                        variant: 'destructive',
                    });
                    return;
                }
            }
        }

        if (!localStorage.getItem('project_id')) {
            toast({
                title: '验证失败',
                description: '当前无默认项目',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);

        try {
            // 获取选中API配置的class_code_key和算法类别的class_code
            const classCodeKey = algorithmSelection.algorithmApi?.classCodeKey || 'model_sign';
            const classCodeValue = algorithmSelection.algorithmCategory?.classCode || 'building_change';
            
            // 构建请求参数
            const requestData = {
                project_id: localStorage.getItem('project_id') || 1,
                ai_config_id: algorithmSelection.algorithmApi?.id || 0,
                task_name: taskName,
                image_info: imageInfo, // 直接使用 imageInfo，它应该是 { data_para_key: "file_ids" } 的形式
                class_codes: {
                    [classCodeKey]: classCodeValue
                }
            };

            console.log('创建任务请求参数:', requestData);

            const response = await apiRequest<ProjectData>({
                url: '/task/add_ai_task',
                method: 'POST',
                data: requestData,
            });

            if (response) {
                toast({
                    title: '创建成功',
                    description: '任务已成功创建',
                });
                
                // 重置表单
                setTaskName('');
                setAlgorithmSelection({
                    algorithmType: null,
                    algorithmCategory: null,
                    algorithmApi: null
                });
                setImageInfo({});
                setHttpUrls({});
                
                // 关闭弹窗并刷新列表
                setIsNewSheetOpen(false);
                onCreate();
            }
        } catch (error) {
            console.error('创建任务失败:', error);
            toast({
                title: '创建失败',
                description: '无法连接到服务器或发生未知错误',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Sheet open={isNewSheetOpen} onOpenChange={setIsNewSheetOpen}>
            <SheetContent className="sm:max-w-2xl w-full overflow-y-auto p-3">
                <SheetHeader>
                    <SheetTitle>新建数据分析任务</SheetTitle>
                    <SheetDescription>
                        填写以下信息以创建一个新任务。
                    </SheetDescription>
                </SheetHeader>

                <div className="px-4 pb-4">
                    <Label htmlFor="taskName">
                        * 任务名称
                    </Label>
                    <Input id="taskName" placeholder="请输入任务名称" className="mt-2" value={taskName}
                           onChange={(e) => setTaskName(e.target.value)}/>
                    <div className="py-3"/>

                    <Label>任务配置</Label>
                    <div className="mt-2">
                        <AlgorithmSelector onSelectionChange={handleAlgorithmSelectionChange} />                        
                    </div>
                    <div className="pt-3"/>
                    <Card>
                        <CardContent>
                            {/* Dynamically render upload/input components based on userDataConfigs */}
                            {userDataConfigs.map((userData) => (
                                <div key={userData.data_para_key} className="mb-4">
                                    <Label className="text-sm text-muted-foreground">
                                        参数 {userData.data_para_key} (格式: {userData.data_format},
                                        数量: {userData.all_len})
                                    </Label>
                                    {userData.data_format === 'tif' && (
                                        <ImageUploadComponent
                                            all_len={userData.all_len}
                                            data_para_key={userData.data_para_key}
                                            onUploadComplete={(is_success, msg, data) => handleUploadComplete(is_success, msg, data)}
                                        />
                                    )}
                                    {userData.data_format === 'http' && (
                                        <HttpInputComponent
                                            all_len={userData.all_len}
                                            onUrlSubmit={(url) => handleUrlSubmit(userData.data_para_key, url)}
                                        />
                                    )}
                                    {/* TODO: Add more conditions for other formats or all_len values if necessary */}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <SheetFooter>
                    <SheetClose asChild>
                        <Button type="button" variant="outline">取消</Button>
                    </SheetClose>
                    <Button type="submit" onClick={handleCreate} disabled={isSubmitting}>
                        {isSubmitting ? '创建中...' : '创建任务'}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
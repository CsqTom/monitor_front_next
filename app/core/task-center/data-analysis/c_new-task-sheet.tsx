'use client';

import {useState, useEffect} from 'react';
import {Button} from '@/components/ui/button';
import {
    Sheet, SheetClose,
    SheetContent, SheetDescription, SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import {Input} from '@/components/ui/input';
import {Switch} from "@/components/ui/switch";
import {Label} from "@/components/ui/label";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group"
import {RefreshCw} from 'lucide-react';
import {request} from '@/lib/api_user';
import {useToast} from '@/hooks/use-toast';
import {Card, CardContent} from "@/components/ui/card";
import ImageUploadComponent from '@/components/upload/image-upload';
import {IDict} from "@/components/upload/image-upload";
import HttpInputComponent from '@/components/upload/http-input';

// 定义接口
interface ClassCode {
    id: number;
    name: string;
    class_code: string;
    position: number;
}

interface ApiConfig {
    id: number;
    name: string;
    app_addr: string;
    model_type: number;
    is_delete: boolean;
    class_code_key: string;
}

interface ProjectAlgorithmConfig {
    id: number;
    name: string;
    class_codes?: ClassCode[];
    api_configs: ApiConfig[];
}

interface ProjectData {
    id: number;
    name: string;
    logo_path: string;
    is_delete: boolean;
    longitude: number;
    latitude: number;
    altitude: number;
    configs: ProjectAlgorithmConfig[];
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

interface NewSheetProps {
    isNewSheetOpen: boolean;
    setIsNewSheetOpen: (isOpen: boolean) => void;
    onCreate: () => void;
}

// 新增：定义选择状态类型
interface AlgorithmSelection {
    category?: string;
    apiConfig?: string;
}

export function NewTaskSheet({isNewSheetOpen, setIsNewSheetOpen, onCreate}: NewSheetProps) {
    const [taskName, setTaskName] = useState('');
    const [projectConfigs, setProjectConfigs] = useState<ProjectAlgorithmConfig[]>([]);
    const [selectedAlgorithmType, setSelectedAlgorithmType] = useState<string>('');
    const [selectedAlgorithmCategory, setSelectedAlgorithmCategory] = useState<string>('');
    const [selectedApiConfig, setSelectedApiConfig] = useState<string>('');
    const [availableCategories, setAvailableCategories] = useState<ClassCode[]>([]);
    const [availableApiConfigs, setAvailableApiConfigs] = useState<ApiConfig[]>([]);

    // 新增：存储每个算法类型的选择状态
    const [algorithmSelections, setAlgorithmSelections] = useState<Record<string, AlgorithmSelection>>({});

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userDataConfigs, setUserDataConfigs] = useState<UserData[]>([]);

    const [httpUrls, setHttpUrls] = useState<Record<string, string>>({});
    const {toast} = useToast();

    useEffect(() => {
        if (isNewSheetOpen) {
            const fetchProjectConfigs = async () => {
                try {
                    const response = await request<ApiResponse<ProjectData>>({
                        url: '/project/all_configs',
                        method: 'GET',
                        params: {project_id: 1},
                    });
                    if (response.data.code === 200 && response.data.data) {
                        const configs = response.data.data.configs;
                        setProjectConfigs(configs);
                        if (configs.length > 0) {
                            // 选择第一个算法类型
                            const initialType = configs[0].name;
                            setSelectedAlgorithmType(initialType);
                        }
                    } else {
                        toast({
                            title: '获取配置失败',
                            description: response.msg,
                            variant: 'destructive',
                        });
                    }
                } catch (error) {
                    console.error('Error fetching project configs:', error);
                    toast({
                        title: '获取配置失败',
                        description: '无法连接到服务器或发生未知错误。',
                        variant: 'destructive',
                    });
                }
            };
            fetchProjectConfigs();
        }
    }, [isNewSheetOpen, toast]);

    // 新增：处理算法类型切换
    const handleAlgorithmTypeChange = (type: string) => {
        // 保存当前类型的选择状态
        setAlgorithmSelections(prev => ({
            ...prev,
            [selectedAlgorithmType]: {
                category: selectedAlgorithmCategory,
                apiConfig: selectedApiConfig
            }
        }));

        // 切换到新类型
        setSelectedAlgorithmType(type);

        // 恢复新类型之前的选择（如果存在）
        const previousSelection = algorithmSelections[type];
        if (previousSelection) {
            if (previousSelection.category) {
                setSelectedAlgorithmCategory(previousSelection.category);
            } else {
                setSelectedAlgorithmType(availableCategories[0].class_code);
            }
            if (previousSelection.apiConfig) {
                setSelectedApiConfig(previousSelection.apiConfig);
            } else {
                setSelectedApiConfig(availableApiConfigs[0].id.toString());
            }
        } else {
            setSelectedAlgorithmCategory('');
            setSelectedApiConfig('');
        }
    };

    useEffect(() => {
        if (selectedAlgorithmType) {
            const currentTypeConfig = projectConfigs.find(config => config.name === selectedAlgorithmType);
            if (currentTypeConfig) {
                // 处理类别
                let categories: ClassCode[] = [];
                if (currentTypeConfig.class_codes && currentTypeConfig.class_codes.length > 0) {
                    categories = currentTypeConfig.class_codes;
                }
                setAvailableCategories(categories);

                // 如果没有设置过类别，则使用默认值
                if (!selectedAlgorithmCategory && categories.length > 0) {
                    setSelectedAlgorithmCategory(categories[0].class_code);
                }

                // 处理API配置
                const apiConfigs = currentTypeConfig.api_configs || [];
                setAvailableApiConfigs(apiConfigs);

                // 如果没有设置过API配置，则使用默认值
                if (!selectedApiConfig && apiConfigs.length > 0) {
                    setSelectedApiConfig(apiConfigs[0].id.toString());
                }
            } else {
                setAvailableCategories([]);
                setSelectedAlgorithmCategory('');
                setAvailableApiConfigs([]);
                setSelectedApiConfig('');
            }
        } else {
            setAvailableCategories([]);
            setSelectedAlgorithmCategory('');
            setAvailableApiConfigs([]);
            setSelectedApiConfig('');
        }
    }, [selectedAlgorithmType, projectConfigs, selectedAlgorithmCategory, selectedApiConfig]);

    useEffect(() => {
        if (isNewSheetOpen && selectedApiConfig) {
            console.log("selectedApiConfig", selectedApiConfig);
            const fetchApiConfig = async () => {
                try {
                    const response = await request<ApiResponse<ApiConfigs>>({
                        url: '/ai_config/api_config',
                        method: 'GET',
                        params: {config_id: selectedApiConfig},
                    });
                    if (response.data.code === 200 && response.data.data) {
                        console.log("apiConfig", response.data.data);
                        const api_config: ApiConfigs = response.data.data;
                        setUserDataConfigs(api_config.user_data || []);
                        // Reset states when API config changes
                        setHttpUrls({});

                    } else {
                        toast({
                            title: '获取配置失败',
                            description: response.msg,
                            variant: 'destructive',
                        });
                    }
                } catch (error) {
                    console.error('Error fetching project configs:', error);
                    toast({
                        title: '获取配置失败',
                        description: '无法连接到服务器或发生未知错误。',
                        variant: 'destructive',
                    });
                }
            };
            fetchApiConfig().then();
        }
    }, [selectedApiConfig, toast]);  // Added toast to dependency array

    const handleUploadComplete = (is_success: boolean, msg: string, data: IDict) => {
        console.log("handleUploadComplete", is_success, msg, data);
    };

    const handleUrlSubmit = (dataParaKey: string, url: string) => {
        setHttpUrls(prev => ({...prev, [dataParaKey]: url}));
    };

    const handleCreate = async () => {
        // ... 原有逻辑保持不变 ...
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

                    <Label>
                        任务配置
                    </Label>
                    <Card className="mt-2">
                        <CardContent className="pt-6 space-y-4">
                            <div>
                                <Label>算法类型</Label>
                                <RadioGroup
                                    value={selectedAlgorithmType}
                                    onValueChange={handleAlgorithmTypeChange}  // 修改为使用新的处理函数
                                    className="flex space-x-4 mt-1"
                                >
                                    {projectConfigs.map((config) => (
                                        <div key={config.id} className="flex items-center space-x-2">
                                            <RadioGroupItem value={config.name} id={`type-${config.id}`}/>
                                            <Label htmlFor={`type-${config.id}`}>{config.name}</Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>

                            {selectedAlgorithmType && availableCategories.length > 0 && (
                                <div className="pt-4">
                                    <Label>算法类别</Label>
                                    <RadioGroup
                                        value={selectedAlgorithmCategory}
                                        onValueChange={setSelectedAlgorithmCategory}
                                        className="flex space-x-4 mt-1"
                                    >
                                        {availableCategories.map((category) => (
                                            <div key={category.id} className="flex items-center space-x-2">
                                                <RadioGroupItem value={category.class_code}
                                                                id={`category-${category.id}`}/>
                                                <Label htmlFor={`category-${category.id}`}>{category.name}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>
                            )}

                            {selectedAlgorithmType && availableApiConfigs.length > 0 && (
                                <div className="pt-4">
                                    <Label>算法API</Label>
                                    <RadioGroup
                                        value={selectedApiConfig}
                                        onValueChange={setSelectedApiConfig}
                                        className="flex space-x-4 mt-1"
                                    >
                                        {availableApiConfigs.map((apiConf) => (
                                            <div key={apiConf.id} className="flex items-center space-x-2">
                                                <RadioGroupItem value={apiConf.id.toString()} id={`api-${apiConf.id}`}/>
                                                <Label htmlFor={`api-${apiConf.id}`}>{apiConf.name}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>
                            )}

                            {/* Dynamically render upload/input components based on userDataConfigs */}
                            {userDataConfigs.map((userData) => (
                                <div key={userData.data_para_key} className="mt-4 pt-4 border-t">
                                    <Label className="text-sm font-medium">
                                        参数: {userData.data_para_key} (格式: {userData.data_format},
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
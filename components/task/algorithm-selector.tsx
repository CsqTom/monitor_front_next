import { useState, useEffect, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { apiRequest, request } from '@/lib/api_client';
import { useToast } from '@/hooks/use-toast';

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

interface ApiResponse<T> {
    code: number;
    msg: string;
    data: {
        code: number;
        msg: string;
        data: T;
    }
}

// 选择结果接口
export interface AlgorithmSelectionResult {
    algorithmType: {
        id: number;
        name: string;
        configId: number; // config.id
    } | null;
    algorithmCategory: {
        id: string; // 多选时为最后选中的id，单选时为选中的id
        name: string; // 多选时格式"id1:name1,id2:name2"，单选时为选中的name
        classCode: string; // 多选时格式"class_code1,class_code2"，单选时为选中的class_code
    } | null;
    algorithmApi: {
        id: number;
        name: string;
        classCodeKey: string; // class_code_key
    } | null;
}

interface AlgorithmSelectorProps {
    onSelectionChange: (selection: AlgorithmSelectionResult) => void;
    initialSelection?: {
        algorithmType?: string;
        algorithmCategory?: string;
        algorithmApi?: string;
    };
}

// 新增：定义选择状态类型
interface AlgorithmSelection {
    category?: string;
    apiConfig?: string;
}

export function AlgorithmSelector({ onSelectionChange, initialSelection }: AlgorithmSelectorProps) {
    const [projectConfigs, setProjectConfigs] = useState<ProjectAlgorithmConfig[]>([]);
    const [selectedAlgorithmType, setSelectedAlgorithmType] = useState<string>(initialSelection?.algorithmType || '');
    const [selectedAlgorithmCategory, setSelectedAlgorithmCategory] = useState<string>(initialSelection?.algorithmCategory || '');
    const [selectedAlgorithmCategories, setSelectedAlgorithmCategories] = useState<string[]>([]); // 多选类别
    const [selectedApiConfig, setSelectedApiConfig] = useState<string>(initialSelection?.algorithmApi || '');
    const [availableCategories, setAvailableCategories] = useState<ClassCode[]>([]);
    const [availableApiConfigs, setAvailableApiConfigs] = useState<ApiConfig[]>([]);
    
    // 存储每个算法类型的选择状态
    const [algorithmSelections, setAlgorithmSelections] = useState<Record<string, AlgorithmSelection>>({});
    
    const { toast } = useToast();

    // 获取项目配置
    useEffect(() => {
        const fetchProjectConfigs = async () => {
            try {
                const response = await apiRequest<ProjectData>({
                    url: '/project/all_configs',
                    method: 'GET',
                    params: { project_id: localStorage.getItem('project_id') },
                });
                if (response) {
                    const configs = response.configs;
                    setProjectConfigs(configs);
                    if (configs.length > 0 && !selectedAlgorithmType) {
                        // 选择第一个算法类型
                        const initialType = configs[0].name;
                        setSelectedAlgorithmType(initialType);
                    }
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
    }, [toast]); // 移除selectedAlgorithmType依赖项，避免循环更新

    // 判断是否支持多选
    const isMultiSelectEnabled = (algorithmType: string): boolean => {
        return algorithmType.includes('目标');
    };

    // 处理算法类型切换
    const handleAlgorithmTypeChange = (type: string) => {
        // 保存当前类型的选择状态
        if (selectedAlgorithmType) {
            setAlgorithmSelections(prev => ({
                ...prev,
                [selectedAlgorithmType]: {
                    category: selectedAlgorithmCategory,
                    apiConfig: selectedApiConfig
                }
            }));
        }

        // 切换到新类型
        setSelectedAlgorithmType(type);

        // 恢复新类型之前的选择（如果存在）
        const previousSelection = algorithmSelections[type];
        if (previousSelection) {
            if (previousSelection.category) {
                setSelectedAlgorithmCategory(previousSelection.category);
            } else {
                setSelectedAlgorithmCategory('');
            }
            if (previousSelection.apiConfig) {
                setSelectedApiConfig(previousSelection.apiConfig);
            } else {
                setSelectedApiConfig('');
            }
        } else {
            setSelectedAlgorithmCategory('');
            setSelectedApiConfig('');
        }
        
        // 清空多选状态
        setSelectedAlgorithmCategories([]);
    };

    // 处理多选类别变化
    const handleMultiCategoryChange = (categoryClassCode: string, checked: boolean) => {
        setSelectedAlgorithmCategories(prev => {
            if (checked) {
                return [...prev, categoryClassCode];
            } else {
                return prev.filter(code => code !== categoryClassCode);
            }
        });
    };

    // 更新可用的类别和API配置
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
                if (!selectedAlgorithmCategory && categories.length > 0 && !isMultiSelectEnabled(selectedAlgorithmType)) {
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

    // 使用useRef保存最新的选择结果，避免不必要的重渲染
    const selectionRef = useRef<{
        algorithmType: string;
        algorithmCategory: string;
        apiConfig: string;
        projectConfigs: ProjectAlgorithmConfig[];
        availableCategories: ClassCode[];
        availableApiConfigs: ApiConfig[];
    }>({
        algorithmType: selectedAlgorithmType,
        algorithmCategory: selectedAlgorithmCategory,
        apiConfig: selectedApiConfig,
        projectConfigs,
        availableCategories,
        availableApiConfigs
    });

    // 更新ref中的值
    useEffect(() => {
        selectionRef.current = {
            algorithmType: selectedAlgorithmType,
            algorithmCategory: selectedAlgorithmCategory,
            apiConfig: selectedApiConfig,
            projectConfigs,
            availableCategories,
            availableApiConfigs
        };
        
        // 当选择发生实质性变化时，通知父组件
        const getSelectionResult = (): AlgorithmSelectionResult => {
            const { algorithmType, algorithmCategory, apiConfig, projectConfigs, availableCategories, availableApiConfigs } = selectionRef.current;
            
            const algorithmTypeConfig = projectConfigs.find(config => config.name === algorithmType);
            const apiConfigObj = availableApiConfigs.find(config => config.id === parseInt(apiConfig));

            let categoryResult = null;
            
            if (isMultiSelectEnabled(algorithmType) && selectedAlgorithmCategories.length > 0) {
                // 多选模式
                const selectedCategoryObjs = availableCategories.filter(category => 
                    selectedAlgorithmCategories.includes(category.class_code)
                );
                
                if (selectedCategoryObjs.length > 0) {
                    const lastSelectedCategory = selectedCategoryObjs[selectedCategoryObjs.length - 1];
                    const nameFormat = selectedCategoryObjs.map(cat => `${cat.id}:${cat.name}`).join(',');
                    const classCodeFormat = selectedCategoryObjs.map(cat => cat.class_code).join(',');
                    
                    categoryResult = {
                        id: lastSelectedCategory.id.toString(),
                        name: nameFormat,
                        classCode: classCodeFormat
                    };
                }
            } else {
                // 单选模式
                const categoryObj = availableCategories.find(category => category.class_code === algorithmCategory);
                if (categoryObj) {
                    categoryResult = {
                        id: categoryObj.id.toString(),
                        name: categoryObj.name,
                        classCode: categoryObj.class_code
                    };
                }
            }

            return {
                algorithmType: algorithmTypeConfig ? {
                    id: algorithmTypeConfig.id,
                    name: algorithmTypeConfig.name,
                    configId: algorithmTypeConfig.id
                } : null,
                algorithmCategory: categoryResult,
                algorithmApi: apiConfigObj ? {
                    id: apiConfigObj.id,
                    name: apiConfigObj.name,
                    classCodeKey: apiConfigObj.class_code_key
                } : null
            };
        };

        // 只有当选择真正变化时才通知父组件
        if (selectedAlgorithmType || selectedAlgorithmCategory || selectedApiConfig || selectedAlgorithmCategories.length > 0) {
            onSelectionChange(getSelectionResult());
        }
    }, [selectedAlgorithmType, selectedAlgorithmCategory, selectedApiConfig, selectedAlgorithmCategories, projectConfigs, availableCategories, availableApiConfigs]);

    return (
        <Card>
            <CardContent className="space-y-3">
                <div>
                    <Label>算法类型</Label>
                    <RadioGroup
                        value={selectedAlgorithmType}
                        onValueChange={handleAlgorithmTypeChange}
                        className="flex space-x-4 mt-3"
                    >
                        {projectConfigs.map((config) => (
                            <div key={config.id} className="flex items-center space-x-2">
                                <RadioGroupItem value={config.name} id={`type-${config.id}`} />
                                <Label htmlFor={`type-${config.id}`}>{config.name}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>

                {selectedAlgorithmType && availableApiConfigs.length > 0 && (
                    <div className="pt-4">
                        <Label>算法API</Label>
                        <RadioGroup
                            value={selectedApiConfig}
                            onValueChange={setSelectedApiConfig}
                            className="flex space-x-4 mt-3"
                        >
                            {availableApiConfigs.map((apiConf) => (
                                <div key={apiConf.id} className="flex items-center space-x-2">
                                    <RadioGroupItem value={apiConf.id.toString()} id={`api-${apiConf.id}`} />
                                    <Label htmlFor={`api-${apiConf.id}`}>{apiConf.name}</Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>
                )}

                {selectedAlgorithmType && availableCategories.length > 0 && (
                    <div className="pt-4">
                        <Label>算法类别{isMultiSelectEnabled(selectedAlgorithmType) ? '（多选）' : ''}</Label>
                        {isMultiSelectEnabled(selectedAlgorithmType) ? (
                            // 多选模式
                            <div className="flex flex-wrap gap-4 mt-3">
                                {availableCategories.map((category) => (
                                    <div key={category.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`category-${category.id}`}
                                            checked={selectedAlgorithmCategories.includes(category.class_code)}
                                            onCheckedChange={(checked) => 
                                                handleMultiCategoryChange(category.class_code, checked as boolean)
                                            }
                                        />
                                        <Label htmlFor={`category-${category.id}`}>{category.name}</Label>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // 单选模式
                            <RadioGroup
                                value={selectedAlgorithmCategory}
                                onValueChange={setSelectedAlgorithmCategory}
                                className="flex space-x-4 mt-3"
                            >
                                {availableCategories.map((category) => (
                                    <div key={category.id} className="flex items-center space-x-2">
                                        <RadioGroupItem value={category.class_code} id={`category-${category.id}`} />
                                        <Label htmlFor={`category-${category.id}`}>{category.name}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        )}
                    </div>
                )}

            </CardContent>
        </Card>
    );
}
'use client'

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Save } from 'lucide-react';
import { projectApi, ModelTypeConfig, CreateProjectRequest } from '@/lib/api_project';

interface NewProjectSheetProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    onProjectCreate: () => void;
}

export function NewProjectSheet({ open, setOpen, onProjectCreate }: NewProjectSheetProps) {
    const [modelTypeConfigs, setModelTypeConfigs] = useState<ModelTypeConfig[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        logo_path: '',
        longitude: 0,
        latitude: 0,
        altitude: 0,
    });
    const [selectedApiConfigs, setSelectedApiConfigs] = useState<number[]>([]);
    const [selectedClassCodes, setSelectedClassCodes] = useState<number[]>([]);
    const { toast } = useToast();

    // 获取模型类型配置列表
    const fetchModelTypeConfigs = async () => {
        setLoading(true);
        try {
            const data = await projectApi.getModelTypeConfigs();
            
            if (data.code === 200 && data.data) {
                setModelTypeConfigs(data.data);
            } else {
                toast({ title: '错误', description: data.msg || '获取配置列表失败', variant: 'destructive' });
            }
        } catch (err) {
            toast({ title: '错误', description: (err as Error).message || '获取配置列表时发生错误', variant: 'destructive' });
        }
        setLoading(false);
    };

    // 创建项目
    const createProject = async () => {
        if (!formData.name.trim()) {
            toast({ title: '错误', description: '请输入项目名称', variant: 'destructive' });
            return;
        }
        
        setSaving(true);
        try {
            const createData: CreateProjectRequest = {
                name: formData.name,
                logo_path: formData.logo_path,
                longitude: formData.longitude,
                latitude: formData.latitude,
                altitude: formData.altitude,
                api_config_ids: selectedApiConfigs,
                class_code_config_ids: selectedClassCodes,
            };
            
            const data = await projectApi.createProject(createData);
            
            if (data.code === 200) {
                toast({ title: '成功', description: '项目创建成功' });
                onProjectCreate();
                handleClose();
            } else {
                toast({ title: '错误', description: data.msg || '创建项目失败', variant: 'destructive' });
            }
        } catch (err) {
            toast({ title: '错误', description: (err as Error).message || '创建项目时发生错误', variant: 'destructive' });
        }
        setSaving(false);
    };

    // 处理API配置选择
    const handleApiConfigChange = (apiConfigId: number, checked: boolean) => {
        if (checked) {
            setSelectedApiConfigs(prev => [...prev, apiConfigId]);
        } else {
            setSelectedApiConfigs(prev => prev.filter(id => id !== apiConfigId));
        }
    };

    // 处理类别代码选择
    const handleClassCodeChange = (classCodeId: number, checked: boolean) => {
        if (checked) {
            setSelectedClassCodes(prev => [...prev, classCodeId]);
        } else {
            setSelectedClassCodes(prev => prev.filter(id => id !== classCodeId));
        }
    };

    // 关闭弹窗并重置表单
    const handleClose = () => {
        setOpen(false);
        setFormData({
            name: '',
            logo_path: '',
            longitude: 0,
            latitude: 0,
            altitude: 0,
        });
        setSelectedApiConfigs([]);
        setSelectedClassCodes([]);
    };

    useEffect(() => {
        if (open) {
            fetchModelTypeConfigs();
        }
    }, [open]);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent className="w-[600px] sm:w-[800px] overflow-y-auto p-3">
                <SheetHeader>
                    <SheetTitle>新建项目</SheetTitle>
                    <SheetDescription>
                        创建新的项目并配置相关设置
                    </SheetDescription>
                </SheetHeader>

                {loading ? (
                    <div className="flex justify-center items-center h-32">
                        <RefreshCw className="animate-spin h-8 w-8 mr-2" /> 加载中...
                    </div>
                ) : (
                    <div className="grid gap-4 py-4">
                        {/* 基本信息 */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">基本信息</h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">项目名称 *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="请输入项目名称"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="logo_path">Logo路径</Label>
                                    <Input
                                        id="logo_path"
                                        value={formData.logo_path}
                                        onChange={(e) => setFormData(prev => ({ ...prev, logo_path: e.target.value }))}
                                        placeholder="请输入Logo路径"
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="longitude">经度</Label>
                                    <Input
                                        id="longitude"
                                        type="number"
                                        step="any"
                                        value={formData.longitude}
                                        onChange={(e) => setFormData(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                                        placeholder="0.0"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="latitude">纬度</Label>
                                    <Input
                                        id="latitude"
                                        type="number"
                                        step="any"
                                        value={formData.latitude}
                                        onChange={(e) => setFormData(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                                        placeholder="0.0"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="altitude">海拔</Label>
                                    <Input
                                        id="altitude"
                                        type="number"
                                        step="any"
                                        value={formData.altitude}
                                        onChange={(e) => setFormData(prev => ({ ...prev, altitude: parseFloat(e.target.value) || 0 }))}
                                        placeholder="0.0"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 配置选择 */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">配置选择</h3>
                            
                            {modelTypeConfigs.map((modelType) => (
                                <div key={modelType.id} className="border rounded-lg p-4 space-y-3">
                                    <h4 className="font-medium text-base">{modelType.name}</h4>
                                    
                                    {/* API配置 */}
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">API配置</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {modelType.api_configs.map((apiConfig) => (
                                                <div key={apiConfig.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`api-${apiConfig.id}`}
                                                        checked={selectedApiConfigs.includes(apiConfig.id)}
                                                        onCheckedChange={(checked) => handleApiConfigChange(apiConfig.id, checked as boolean)}
                                                    />
                                                    <Label htmlFor={`api-${apiConfig.id}`} className="text-sm">
                                                        {apiConfig.name}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* 类别代码 */}
                                    {modelType.class_codes && modelType.class_codes.length > 0 && (
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">类别代码</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {modelType.class_codes.map((classCode) => (
                                                    <div key={classCode.id} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`class-${classCode.id}`}
                                                            checked={selectedClassCodes.includes(classCode.id)}
                                                            onCheckedChange={(checked) => handleClassCodeChange(classCode.id, checked as boolean)}
                                                        />
                                                        <Label htmlFor={`class-${classCode.id}`} className="text-sm">
                                                            {classCode.name}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <SheetFooter>
                    <Button variant="outline" onClick={handleClose}>
                        取消
                    </Button>
                    <Button onClick={createProject} disabled={saving || loading}>
                        {saving ? (
                            <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        {saving ? '创建中...' : '创建'}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
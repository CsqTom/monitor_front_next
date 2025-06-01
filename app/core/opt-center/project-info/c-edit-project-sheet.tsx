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
import { ProjectRecord } from './page';
import { projectApi, ProjectDetail, ModelTypeConfig, UpdateProjectRequest } from '@/lib/api_project';

interface ProjectEditSheetProps {
    selectedProject: ProjectRecord | null;
    setSelectedProject: (project: ProjectRecord | null) => void;
    onProjectUpdate: () => void;
}

export function ProjectEditSheet({ selectedProject, setSelectedProject, onProjectUpdate }: ProjectEditSheetProps) {
    const [projectDetail, setProjectDetail] = useState<ProjectDetail | null>(null);
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

    // 获取项目详情
    const fetchProjectDetail = async (projectId: number) => {
        setLoading(true);
        try {
            const data = await projectApi.getProjectDetail(projectId);
            
            setProjectDetail(data);
            setFormData({
                name: data.name,
                logo_path: data.logo_path,
                longitude: data.longitude,
                latitude: data.latitude,
                altitude: data.altitude,
            });
            
            // 提取已选择的配置
            const apiConfigIds: number[] = [];
            const classCodeIds: number[] = [];
            
            data.configs.forEach(config => {
                config.api_configs.forEach(apiConfig => {
                    apiConfigIds.push(apiConfig.id);
                });
                if (config.class_codes) {
                    config.class_codes.forEach(classCode => {
                        classCodeIds.push(classCode.id);
                    });
                }
            });
            
            setSelectedApiConfigs(apiConfigIds);
            setSelectedClassCodes(classCodeIds);
        } catch (err) {
            toast({ title: '错误', description: (err as Error).message || '获取项目详情时发生错误', variant: 'destructive' });
        }
        setLoading(false);
    };

    // 获取模型类型配置列表
    const fetchModelTypeConfigs = async () => {
        try {
            const data = await projectApi.getModelTypeConfigs();
            setModelTypeConfigs(data);
        } catch (err) {
            toast({ title: '错误', description: (err as Error).message || '获取配置列表时发生错误', variant: 'destructive' });
        }
    };

    // 更新项目
    const updateProject = async () => {
        if (!selectedProject) return;
        
        setSaving(true);
        try {
            const updateData: UpdateProjectRequest = {
                project_id: selectedProject.id,
                name: formData.name,
                logo_path: formData.logo_path,
                longitude: formData.longitude,
                latitude: formData.latitude,
                altitude: formData.altitude,
                api_config_ids: selectedApiConfigs,
                class_code_config_ids: selectedClassCodes,
            };
            
            await projectApi.updateProject(updateData);
            toast({ title: '成功', description: '项目更新成功' });
            onProjectUpdate();
            setSelectedProject(null);
        } catch (err) {
            toast({ title: '错误', description: (err as Error).message || '更新项目时发生错误', variant: 'destructive' });
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

    useEffect(() => {
        if (selectedProject) {
            fetchProjectDetail(selectedProject.id);
            fetchModelTypeConfigs();
        }
    }, [selectedProject]);

    return (
        <Sheet open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
            <SheetContent className="w-[600px] sm:w-[800px] overflow-y-auto p-3">
                <SheetHeader>
                    <SheetTitle>编辑项目</SheetTitle>
                    <SheetDescription>
                        修改项目信息和配置
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
                                    <Label htmlFor="name">项目名称</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="logo_path">Logo路径</Label>
                                    <Input
                                        id="logo_path"
                                        value={formData.logo_path}
                                        onChange={(e) => setFormData(prev => ({ ...prev, logo_path: e.target.value }))}
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
                                    />
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                <SheetFooter>
                    <Button variant="outline" onClick={() => setSelectedProject(null)}>
                        取消
                    </Button>
                    <Button onClick={updateProject} disabled={saving || loading}>
                        {saving ? (
                            <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        {saving ? '保存中...' : '保存'}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
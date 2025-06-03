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
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Save } from 'lucide-react';
import { apiRequest } from '@/lib/api_client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// 飞行平台项目信息接口
interface DroneProject {
    id: number;
    user_token: string;
    project_name: string;
    project_uuid: string;
    save_url: string;
    video_url: string;
    mqtt_host: string;
    mqtt_port: number;
    mqtt_username: string;
    mqtt_password: string;
}

// 飞行平台项目列表项接口
interface DroneProjectListItem {
    name: string;
    introduction: string;
    uuid: string;
    org_uuid: string;
    created_at: number;
    updated_at: number;
    project_work_center_point: {
        latitude: number;
        longitude: number;
    };
}

// 飞行平台项目列表响应接口
interface DroneProjectListResponse {
    list: DroneProjectListItem[];
}

interface EditDroneProjectSheetProps {
    projectId: number | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

export function EditDroneProjectSheet({ projectId, isOpen, onClose, onSave }: EditDroneProjectSheetProps) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<Partial<DroneProject>>({
        user_token: '',
        project_name: '',
        project_uuid: '',
        save_url: '',
        video_url: '',
        mqtt_host: '',
        mqtt_port: 0,
        mqtt_username: '',
        mqtt_password: '',
    });
    const [projectList, setProjectList] = useState<DroneProjectListItem[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const { toast } = useToast();

    // 获取飞行平台项目信息
    const fetchDroneProject = async (id: number) => {
        setLoading(true);
        try {
            const data = await apiRequest<DroneProject>({
                url: `/drone/project?project_id=${id}`,
                method: 'GET',
            });
            
            setFormData({
                user_token: data.user_token || '',
                project_name: data.project_name || '',
                project_uuid: data.project_uuid || '',
                save_url: data.save_url || '',
                video_url: data.video_url || '',
                mqtt_host: data.mqtt_host || '',
                mqtt_port: data.mqtt_port || 0,
                mqtt_username: data.mqtt_username || '',
                mqtt_password: data.mqtt_password || '',
            });
            
            // 如果有用户令牌，获取项目列表
            if (data.user_token) {
                fetchDroneProjectList(data.user_token);
            }
        } catch (err) {
            // toast({ title: '错误', description: (err as Error).message || '获取飞行平台项目信息时发生错误', variant: 'destructive' });
        }
        setLoading(false);
    };

    // 获取飞行平台项目列表
    const fetchDroneProjectList = async (userToken: string) => {
        if (!userToken) return;
        
        setLoadingProjects(true);
        try {
            const response = await apiRequest<DroneProjectListResponse>({
                url: '/drone/projects',
                method: 'GET',
                params: { user_token: userToken },
            });
            
            setProjectList(response.list || []);
        } catch (err) {
            toast({ title: '飞行平台项目列表错误', description: (err as Error).message || '获取飞行平台项目列表时发生错误', variant: 'destructive' });
        }
        setLoadingProjects(false);
    };

    // 保存飞行平台项目信息
    const saveDroneProject = async () => {
        if (!projectId) return;
        if (!formData.user_token) {
            toast({ title: '提示', description: '用户令牌为必填项', variant: 'destructive' });
            return;
        }
        
        setSaving(true);
        try {
            const payload = {
                project_id: projectId,
                user_token: formData.user_token,
                drone_project_name: formData.project_name,
                drone_project_uuid: formData.project_uuid,
                save_url: formData.save_url,
                video_url: formData.video_url,
                mqtt_host: formData.mqtt_host,
                mqtt_port: formData.mqtt_port,
                mqtt_username: formData.mqtt_username,
                mqtt_password: formData.mqtt_password,
            };
            
            await apiRequest({
                url: '/drone/reset_project',
                method: 'POST',
                data: payload,
            });
            
            toast({ title: '成功', description: '飞行平台项目信息保存成功' });
            onSave();
            onClose();
        } catch (err) {
            toast({ title: '保存错误', description: (err as Error).message || '保存飞行平台项目信息时发生错误', variant: 'destructive' });
        }
        setSaving(false);
    };

    // 处理用户令牌变更
    const handleUserTokenChange = (value: string) => {
        setFormData(prev => ({ ...prev, user_token: value }));
        if (value) {
            fetchDroneProjectList(value);
        } else {
            setProjectList([]);
        }
    };

    // 处理项目选择
    const handleProjectSelect = (uuid: string) => {
        const selectedProject = projectList.find(p => p.uuid === uuid);
        if (selectedProject) {
            setFormData(prev => ({
                ...prev,
                project_name: selectedProject.name,
                project_uuid: selectedProject.uuid,
            }));
        }
    };

    useEffect(() => {
        if (isOpen && projectId) {
            fetchDroneProject(projectId);
        }
    }, [isOpen, projectId]);

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[600px] sm:w-[800px] overflow-y-auto p-3">
                <SheetHeader>
                    <SheetTitle>编辑飞行平台配置</SheetTitle>
                    <SheetDescription>
                        修改飞行平台项目信息和配置
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
                            
                            <div className="space-y-2">
                                <Label htmlFor="user_token">用户令牌</Label>
                                <Input
                                    id="user_token"
                                    value={formData.user_token}
                                    onChange={(e) => handleUserTokenChange(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="project_select">项目选择</Label>
                                <Select 
                                    disabled={!formData.user_token || projectList.length === 0}
                                    value={formData.project_uuid}
                                    onValueChange={handleProjectSelect}
                                >
                                    <SelectTrigger id="project_select" className="w-full">
                                        <SelectValue placeholder="选择项目" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {loadingProjects ? (
                                            <div className="flex items-center justify-center p-2">
                                                <RefreshCw className="animate-spin h-4 w-4 mr-2" /> 加载中...
                                            </div>
                                        ) : projectList.length > 0 ? (
                                            projectList.map((project) => (
                                                <SelectItem key={project.uuid} value={project.uuid}>
                                                    {project.name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <div className="p-2 text-center text-sm text-gray-500">
                                                {formData.user_token ? '没有可用的项目' : '请先输入用户令牌'}
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="project_name">项目名称</Label>
                                    <Input
                                        id="project_name"
                                        value={formData.project_name}
                                        disabled
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="project_uuid">项目UUID</Label>
                                    <Input
                                        id="project_uuid"
                                        value={formData.project_uuid}
                                        disabled
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="save_url">保存URL</Label>
                                    <Input
                                        id="save_url"
                                        value={formData.save_url}
                                        onChange={(e) => setFormData(prev => ({ ...prev, save_url: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="video_url">视频URL</Label>
                                    <Input
                                        id="video_url"
                                        value={formData.video_url}
                                        onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* MQTT配置 */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">MQTT配置</h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="mqtt_host">MQTT主机</Label>
                                    <Input
                                        id="mqtt_host"
                                        value={formData.mqtt_host}
                                        onChange={(e) => setFormData(prev => ({ ...prev, mqtt_host: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mqtt_port">MQTT端口</Label>
                                    <Input
                                        id="mqtt_port"
                                        type="number"
                                        value={formData.mqtt_port}
                                        onChange={(e) => setFormData(prev => ({ ...prev, mqtt_port: parseInt(e.target.value) || 0 }))}
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="mqtt_username">MQTT用户名</Label>
                                    <Input
                                        id="mqtt_username"
                                        value={formData.mqtt_username}
                                        onChange={(e) => setFormData(prev => ({ ...prev, mqtt_username: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mqtt_password">MQTT密码</Label>
                                    <Input
                                        id="mqtt_password"
                                        type="password"
                                        value={formData.mqtt_password}
                                        onChange={(e) => setFormData(prev => ({ ...prev, mqtt_password: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <SheetFooter>
                    <Button variant="outline" onClick={onClose}>
                        取消
                    </Button>
                    <Button onClick={saveDroneProject} disabled={saving || loading}>
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
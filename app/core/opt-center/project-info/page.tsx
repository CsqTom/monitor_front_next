// import { NoteSidebar } from "./note-sidebar"
'use client'

import {useEffect, useState} from 'react';
import {Button} from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {useToast} from '@/hooks/use-toast';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {PlusCircle, RefreshCw, MoveDiagonal2, Edit, Users, Plane} from 'lucide-react';
import {QPagination} from '@/components/ui/pagination';
import { ProjectEditSheet } from './c-edit-project-sheet';
import { EditDroneProjectSheet } from './c-edit-drone-project-sheet';
import { projectApi, SetDefaultProject } from '@/lib/api_project';
import { triggerProjectInfoUpdate } from '@/app/core/c-secondary-nav-bar';
import { PageTransition } from '@/components/ui/page-transition';
import { Card } from '@/components/ui/card';

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

interface Config {
    id: number;
    name: string;
    class_codes?: ClassCode[];
    api_configs: ApiConfig[];
}

export interface ProjectRecord {
    id: number;
    name: string;
    logo_path: string;
    is_delete: boolean;
    longitude: number;
    latitude: number;
    altitude: number;
    configs: Config[];
}

interface ProjectPageData {
    records: ProjectRecord[];
    current: number;
    size: number;
    total: number;
    pages: number;
}

interface ApiResponse<T> {
    code: number;
    msg: string;
    data: T;
}

export default function Page() {
    const [pageProjectData, setPageProjectData] = useState<ProjectPageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedProject, setSelectedProject] = useState<ProjectRecord | null>(null);
    const [selectedDroneProject, setSelectedDroneProject] = useState<number | null>(null);
    const {toast} = useToast();

    const fetchProjects = async (page = 1, pageSize = 10) => {
        setLoading(true);
        setError(null);
        try {
            const param = `?page=${page}&page_size=${pageSize}&user_id=${localStorage.getItem('user_id')}`
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/project_users/page${param}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data: ApiResponse<ProjectPageData> = await response.json();
            
            if (data.code === 200 && data.data) {
                setPageProjectData(data.data);
            } else {
                setError(data.msg || 'Failed to fetch projects');
                toast({title: '错误', description: data.msg || '获取项目列表失败', variant: 'destructive'});
            }
        } catch (err) {
            setError((err as Error).message || 'An error occurred while fetching projects');
            toast({
                title: '错误',
                description: (err as Error).message || '获取项目列表时发生错误',
                variant: 'destructive'
            });
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchProjects(pageProjectData?.current || 1);
    }, []);

    const handleRefresh = (page = pageProjectData?.current || 1) => {
        fetchProjects(page);
        // 触发导航栏项目信息更新
        triggerProjectInfoUpdate();
    };

    const handleEdit = (project: ProjectRecord) => {
        setSelectedProject(project);
    };

    const  handleDefaultProject = async (project: ProjectRecord) => {
        try {
            const user_id = localStorage.getItem('user_id');
            const data: SetDefaultProject = {
                id: user_id ? parseInt(user_id) : 1,
                project_id: project.id,
            };
            await projectApi.setDelaultProject(data);  // 需要await, 等待接口返回
            toast({title: '成功', description: '项目设置成功'});
            fetchProjects();
            // 触发导航栏项目信息更新
            triggerProjectInfoUpdate();
        } catch (err) {
            toast({title: '错误', description: (err as Error).message || '更改项目时发生错误', variant: 'destructive'});
        }
    };

    const renderConfigs = (configs: Config[]) => {
        return configs.map(config => config.name).join(', ');
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><RefreshCw
            className="animate-spin h-8 w-8 mr-2"/> Loading...</div>;
    }

    if (error) {
        return <div className="container mx-auto py-10 text-center text-red-500">Error: {error} <Button
            onClick={() => handleRefresh()} variant="outline" className="ml-2">Retry</Button></div>;
    }

    const isHttpUrl = (url: string) => {
        return url.startsWith('http://') || url.startsWith('https://');
    };

    const handleEditDroneProject = (projectId: number) => {
        setSelectedDroneProject(projectId);
    };

    return (
        <PageTransition animationType="scale" duration="default">
        <Card>
        <div className="container mx-auto py-3">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold">项目管理</h1>
                <div className="space-x-2">
                    <Button onClick={() => handleRefresh()} variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4"/> 刷新
                    </Button>
                </div>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-center font-bold bg-gray-100">ID</TableHead>
                        <TableHead className="text-center font-bold bg-gray-100">项目名称</TableHead>
                        <TableHead className="text-center font-bold bg-gray-100">Logo路径</TableHead>
                        <TableHead className="text-center font-bold bg-gray-100">经度</TableHead>
                        <TableHead className="text-center font-bold bg-gray-100">纬度</TableHead>
                        <TableHead className="text-center font-bold bg-gray-100">海拔</TableHead>
                        <TableHead className="text-center font-bold bg-gray-100">配置</TableHead>
                        <TableHead className="text-center font-bold bg-gray-100">状态</TableHead>
                        <TableHead className="text-center font-bold bg-gray-100">操作</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pageProjectData?.records.map((project) => (
                        <TableRow key={project.id}>
                            <TableCell className="text-center">{project.id}</TableCell>
                            <TableCell className="text-center">{project.name}</TableCell>
                            <TableCell className="text-center flex justify-center items-center">{project.logo_path && isHttpUrl(project.logo_path) ? 
                                <img src={project.logo_path} alt={project.name} width="30" height="30" /> : project.logo_path || 'N/A'}
                            </TableCell>
                            <TableCell className="text-center">{project.longitude}</TableCell>
                            <TableCell className="text-center">{project.latitude}</TableCell>
                            <TableCell className="text-center">{project.altitude}</TableCell>
                            <TableCell className="text-center">{renderConfigs(project.configs)}</TableCell>
                            <TableCell className="text-center">{project.is_delete ? '已删除' : '正常'}</TableCell>
                            <TableCell className="space-x-2 text-center">
                                <Button variant="outline" size="sm" onClick={() => handleEdit(project)}>
                                    <Edit className="mr-1 h-4 w-4"/> 编辑
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleEditDroneProject(project.id)}>
                                    <Plane className="mr-1 h-4 w-4"/> 飞行平台
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDefaultProject(project)}>
                                    <MoveDiagonal2 className="mr-1 h-4 w-4"/> 默认项目
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {pageProjectData && pageProjectData.total > 0 && (
                <QPagination
                    current={pageProjectData.current}
                    pages={pageProjectData.pages}
                    total={pageProjectData.total}
                    onPageChange={(page) => handleRefresh(page)}
                />
            )}

            {/* 项目编辑组件 */}
            <ProjectEditSheet
                selectedProject={selectedProject}
                setSelectedProject={setSelectedProject}
                onProjectUpdate={fetchProjects}
            />

            {/* 飞行平台信息编辑组件 */}
            <EditDroneProjectSheet
                projectId={selectedDroneProject}
                isOpen={selectedDroneProject !== null}
                onClose={() => setSelectedDroneProject(null)}
                onSave={fetchProjects}
            />

        </div>
        </Card>
        </PageTransition>
    );
}

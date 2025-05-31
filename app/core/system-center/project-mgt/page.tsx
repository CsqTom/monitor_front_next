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
import {ChevronLeft, ChevronRight, PlusCircle, RefreshCw, Trash2, Edit} from 'lucide-react';
import {QPagination} from '@/components/ui/pagination';
import { ProjectEditSheet } from './c_project-edit-sheet';

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

interface ProjectRecord {
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
    const [projectToDelete, setProjectToDelete] = useState<ProjectRecord | null>(null);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const {toast} = useToast();

    const fetchProjects = async (page = 1, pageSize = 10) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/project_users/page?page=${page}&page_size=${pageSize}&user_id=1`, {
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
    };

    const handleNew = () => {
        toast({title: '提示', description: '新建项目功能待开发'});
    };

    const handleEdit = (project: ProjectRecord) => {
        setSelectedProject(project);
    };

    const handleDeleteProject = (project: ProjectRecord) => {
        setProjectToDelete(project);
        setIsAlertOpen(true);
    };

    const confirmDelete = async () => {
        if (!projectToDelete) return;
        try {
            const response = await fetch(`http://localhost:61301/api/project/delete?project_id=${projectToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            const data: ApiResponse<null> = await response.json();
            
            if (data.code === 200) {
                toast({title: '成功', description: '项目删除成功'});
                fetchProjects();
            } else {
                toast({title: '错误', description: data.msg || '删除项目失败', variant: 'destructive'});
            }
        } catch (err) {
            toast({title: '错误', description: (err as Error).message || '删除项目时发生错误', variant: 'destructive'});
        }
        setIsAlertOpen(false);
        setProjectToDelete(null);
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

    return (
        <div className="container mx-auto py-3">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold">项目管理</h1>
                <div className="space-x-2">
                    <Button onClick={handleNew} variant="outline">
                        <PlusCircle className="mr-2 h-4 w-4"/> 新建项目
                    </Button>
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
                            <TableCell className="text-center">{project.logo_path || 'N/A'}</TableCell>
                            <TableCell className="text-center">{project.longitude}</TableCell>
                            <TableCell className="text-center">{project.latitude}</TableCell>
                            <TableCell className="text-center">{project.altitude}</TableCell>
                            <TableCell className="text-center">{renderConfigs(project.configs)}</TableCell>
                            <TableCell className="text-center">{project.is_delete ? '已删除' : '正常'}</TableCell>
                            <TableCell className="space-x-2 text-center">
                                <Button variant="outline" size="sm" onClick={() => handleEdit(project)}>
                                    <Edit className="mr-1 h-4 w-4"/> 编辑
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDeleteProject(project)}>
                                    <Trash2 className="mr-1 h-4 w-4"/> 删除
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

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                            您确定要删除项目 "{projectToDelete?.name}" 吗？此操作无法撤销。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete}>删除</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* 项目编辑组件 */}
            <ProjectEditSheet
                selectedProject={selectedProject}
                setSelectedProject={setSelectedProject}
                onProjectUpdate={fetchProjects}
            />
        </div>
    );
}

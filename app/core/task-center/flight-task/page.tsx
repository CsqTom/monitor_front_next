'use client';

import {Button} from "@/components/ui/button";
import {RefreshCw, Trash2} from "lucide-react";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {useToast} from '@/hooks/use-toast';
import {useEffect, useState} from "react";
import {ApiResponse, request} from "@/lib/api_client";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {CheckCircle2, XCircle, Loader2, Eye} from 'lucide-react';
import {Progress} from "@/components/ui/progress";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import {QPagination} from "@/components/ui/pagination";
import CTaskDetailChangeDetection from '../data-analysis/c-task-change-detection';
import { PageTransition } from "@/components/ui/page-transition";
import { Card } from "@/components/ui/card";

interface TaskData {
    id: number
    task_id: string
    task_type: number
    name: string
    percent: number
    status: number
    msg: string
    config_id: number
    params_json: string       // 可后续解析为具体对象
    result_json: string      // 可后续解析为具体对象
    create_time: string
    update_time: string
}

// 分页数据结构
interface PagTaskData {
    records: TaskData[]
    current: number
    size: number
    total: number
    pages: number
}

export default function Page() {

    const {toast} = useToast();
    const [pageTaskData, setPageTaskData] = useState<PagTaskData | null>(null);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [toDelete, setToDelete] = useState<TaskData | null>(null);
    const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<TaskData | null>(null);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

    // 从后端获取数据
    const handleRefresh = async (page: number, pageSize: number = 10, is_show_success: boolean = false) => {
        try {
            const response = await request<PagTaskData>({
                url: '/task/all_page', // Replace with actual delete endpoint
                method: 'GET',
                params: {
                  page, pageSize, 
                  task_type: "100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199", 
                  project_id: localStorage.getItem("project_id") || 0
                },
            });
            if (response.data.code === 200) {
                if (is_show_success) {
                    toast({title: '成功', description: '刷新成功'});
                }
                setPageTaskData(response.data.data);
            } else {
                toast({title: '错误', description: response.data.msg || '刷新失败', variant: 'destructive'});
            }
        } catch (e) {
            toast({title: '错误', description: (e as Error).message || '刷新失败', variant: 'destructive'});
        }
    }


    const handleRefreshPage = () => {
        handleRefresh(pageTaskData?.current || 1, 10, true).then(r => {
        });
    }

    const handleDeleteUser = (task: TaskData) => {
        setToDelete(task);
        setIsAlertOpen(true);
    };

    const confirmDelete = async () => {
        if (!toDelete) return;
        try {
            const response = await request<ApiResponse<null>>({
                url: '/task/delete_task_id', // Replace with actual delete endpoint
                method: 'GET',
                params: {task_id: toDelete.task_id}, // Adjust params as needed
            });
            if (response.data.code === 200) {
                toast({title: '成功', description: '任务删除成功'});
                handleRefreshPage(); // Refresh the list
            } else {
                toast({title: '错误', description: response.data.msg || '删除任务失败', variant: 'destructive'});
            }
        } catch (err) {
            toast({title: '错误', description: (err as Error).message || '删除任务时发生错误', variant: 'destructive'});
        }
        setIsAlertOpen(false);
        setToDelete(null);
    };

    const task_type_to_name = (task_type: number) => {
        if (task_type >= 100 && task_type <= 199) {
            return "飞行任务";
        }
        return "未知";
    }

    const handleViewDetail = (task: TaskData) => {
        setSelectedTaskForDetail(task);
        setIsDetailDialogOpen(true);
    };

    const handleCloseDetail = () => {
        setIsDetailDialogOpen(false);
        setSelectedTaskForDetail(null);
    };

    // 页数改变时触发
    useEffect(() => {
        handleRefresh(pageTaskData?.current || 1).then(r => {
        }); //(/ Fetch current page or default to 1
    }, []);

    // 定时更新处理中的任务状态
    useEffect(() => {
        const intervalId = setInterval(() => {
            pageTaskData?.records.forEach(async (task) => {
                if (task.status >= 201 && task.status <= 299) {
                    try {
                        const response = await request<ApiResponse<TaskData>>({
                            url: '/task/get',
                            method: 'GET',
                            params: {task_id: task.task_id},
                        });
                        if (response.data.code === 200 && response.data.data) {
                            const updatedTask = response.data.data;
                            setPageTaskData(prevData => {
                                if (!prevData) return null;
                                return {
                                    ...prevData,
                                    records: prevData.records.map(t =>
                                        t.id === updatedTask.id ? {...t, ...updatedTask} : t
                                    ),
                                };
                            });
                        }
                    } catch (error) {
                        console.error(`Failed to fetch status for task ${task.task_id}:`, error);
                    }
                }
            });
        }, 5000); // 每5秒查询一次

        return () => clearInterval(intervalId); // 组件卸载时清除定时器
    }, [pageTaskData]);

    // 写界面
    return (
        <PageTransition animationType="scale" duration="default">
        <Card>
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold">飞行任务</h1>
                <div className="space-x-2">
                    <Button onClick={handleRefreshPage} variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4"/> 刷新
                    </Button>
                </div>
            </div>

            {/*列表table*/}
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className='text-center font-bold bg-gray-100'>任务ID</TableHead>
                        <TableHead className='text-center font-bold bg-gray-100'>任务类型</TableHead>
                        <TableHead className='text-center font-bold bg-gray-100'>名称</TableHead>
                        <TableHead className='text-center font-bold bg-gray-100'>进度</TableHead>
                        <TableHead className='text-center font-bold bg-gray-100'>状态</TableHead>
                        <TableHead className='text-center font-bold bg-gray-100'>创建时间</TableHead>
                        <TableHead className='text-center font-bold bg-gray-100'>更新时间</TableHead>
                        <TableHead className='text-center font-bold bg-gray-100'>消息</TableHead>
                        <TableHead className='text-center font-bold bg-gray-100'>操作</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {pageTaskData?.records.map((task) => (
                        <TableRow key={task.id}> {/* 使用 task.id 作为 key prop */}
                            <TableCell className='text-center'>{task.task_id}</TableCell>
                            <TableCell className='text-center'>{task_type_to_name(task.task_type)}</TableCell>
                            <TableCell className='text-center'>{task.name ? task.name.trim() : "N/A"}</TableCell>
                            <TableCell className='text-center'>
                                {task.status >= 201 && task.status <= 299 ? (
                                    <div className="flex items-center justify-center">
                                        <Progress value={task.percent} className="w-[60%] mr-2"/>
                                        <span>{task.percent}%</span>
                                    </div>
                                ) : task.status === 200 ? (
                                    <div className="flex justify-center">
                                        <CheckCircle2 className="text-green-500"/>
                                    </div>
                                ) : (
                                    <div className="flex justify-center">
                                        <XCircle className="text-red-500"/>
                                    </div>
                                )}
                            </TableCell>
                            <TableCell className='text-center'>{task.status ? task.status : "未完成"}</TableCell>
                            <TableCell className='text-center'>{task.create_time}</TableCell>
                            <TableCell className='text-center'>{task.update_time}</TableCell>
                            <TableCell className='text-center'>
                                {task.msg && task.msg.trim() ? (
                                    task.msg.trim().length > 30 ? (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger className="truncate max-w-xs block text-center mx-auto">
                                                    {`${task.msg.trim().substring(0, 30)}...`}
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{task.msg.trim()}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ) : (
                                        <span className="text-center block">{task.msg.trim()}</span>
                                    )
                                ) : (
                                    "N/A"
                                )}
                            </TableCell>
                            <TableCell className="text-center space-x-1">
                                <Button variant="outline" size="sm" onClick={() => handleViewDetail(task)}>
                                    <Eye className="mr-1 h-4 w-4"/> 详情
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(task)}><Trash2
                                    className="mr-1 h-4 w-4"/> 删除</Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* 分页组件 */}
            {pageTaskData && pageTaskData.total > 0 && (
                <QPagination
                    current={pageTaskData.current}
                    pages={pageTaskData.pages}
                    total={pageTaskData.total}
                    onPageChange={(page) => handleRefresh(page)}
                />
            )}

            {/*删除对话框*/}
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                            确定要删除任务 "{toDelete?.name}" 吗？此操作无法撤销。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete}>删除</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* 详情对话框 */}
            {selectedTaskForDetail && isDetailDialogOpen && (
                <CTaskDetailChangeDetection
                    taskId={selectedTaskForDetail.task_id}
                    taskName={selectedTaskForDetail.name}
                    taskStatus={selectedTaskForDetail.status.toString()}
                    createdAt={selectedTaskForDetail.create_time}
                    updatedAt={selectedTaskForDetail.update_time}
                    isOpen={isDetailDialogOpen}
                    onClose={handleCloseDetail}
                />
            )}
        </div>
        </Card>
        </PageTransition>
    );
}

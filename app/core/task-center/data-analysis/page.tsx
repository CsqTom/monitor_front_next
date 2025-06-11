'use client'

import {Button} from "@/components/ui/button";
import {PlusCircle, RefreshCw, Trash2} from "lucide-react";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {useToast} from '@/hooks/use-toast';
import {useEffect, useState} from "react";
import {apiRequest, ApiResponse, request} from "@/lib/api_client";
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
import {NewTaskSheet} from "./c-new-task-sheet";
import CTaskDetailChangeDetection from "./c-task-change-detection";
import CTaskObjectVideoDialog from "./c-task-object-video-dialog";
import { PageTransition } from "@/components/ui/page-transition";
import { Card } from "@/components/ui/card";
import { TaskTypeEnum } from "../run-staus";

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
    const [isNewSheetOpen, setIsNewSheetOpen] = useState(false);
    const [isChangeDetailOpen, setIsChangeDetailOpen] = useState(false);
    const [isVideoDetailOpen, setIsVideoDetailOpen] = useState(false);
    const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<TaskData | null>(null);

    // 从后端获取数据
    const handleRefresh = async (page: number, pageSize: number = 10, is_show_success: boolean = false) => {
        try {
            const type_str =  Array.from({ length: 100 }, (_, i) => i).join(',');// 0,1,xxx,99
            const response = await apiRequest<PagTaskData>({
                url: '/task/all_page', // Replace with actual delete endpoint
                method: 'GET',
                params: {
                    page, pageSize, 
                    task_type: type_str,
                    project_id: localStorage.getItem("project_id") || 0
                },
            });
            if (response) {
                if (is_show_success) {
                    toast({title: '成功', description: '刷新成功'});
                }
                setPageTaskData(response);
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
        switch (task_type) {
            case 0:
                return "变化检测";
            case 1:
                return "目标检测-视频";
            case 20:
                return "视频对象检测";
            case 2:
                return "2";
            case 3:
                return "3";
            default:
                return "未知";
        }
    }

    const handleViewChangeDetectionDetail = (task: TaskData) => {
        setSelectedTaskForDetail(task);
        setIsChangeDetailOpen(true);
    };

    const handleViewTaskDetail = (task: TaskData) => {
        setSelectedTaskForDetail(task);
        if (task.task_type === 0) {
            setIsChangeDetailOpen(true);
        } else if (task.task_type === 20) {
            setIsVideoDetailOpen(true);
        }
    };

    const handleNew = () => {
        setIsNewSheetOpen(true);
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
                        const response = await apiRequest<TaskData>({
                            url: '/task/get',
                            method: 'GET',
                            params: {task_id: task.task_id},
                        });
                        if (response) {
                            const updatedTask = response;
                            setPageTaskData(prevData => {
                                if (!prevData) return null;
                                return {
                                    ...prevData,
                                    records: prevData.records.map(t =>
                                        t.id === updatedTask.id ? {...t, ...updatedTask} : t
                                    ),
                                };
                            });
                            
                            // 如果当前正在查看的任务被更新，同时更新selectedTaskForDetail
                            if (selectedTaskForDetail && selectedTaskForDetail.id === updatedTask.id) {
                                setSelectedTaskForDetail({...selectedTaskForDetail, ...updatedTask});
                            }
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
        <div className="px-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-l font-semibold">数据分析任务</h1>
                <div className="space-x-2">
                    <Button onClick={handleNew} variant="outline">
                        <PlusCircle className="mr-2 h-4 w-4"/> 新建任务
                    </Button>
                    <Button onClick={handleRefreshPage} variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4"/> 刷新
                    </Button>
                </div>
            </div>

            {/*列表table*/}
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className='table-head-light'>任务ID</TableHead>
                        <TableHead className='table-head-light'>任务类型</TableHead>
                        <TableHead className='table-head-light'>名称</TableHead>
                        <TableHead className='table-head-light'>进度</TableHead>
                        <TableHead className='table-head-light'>状态</TableHead>
                        <TableHead className='table-head-light'>创建时间</TableHead>
                        <TableHead className='table-head-light'>更新时间</TableHead>
                        <TableHead className='table-head-light'>消息</TableHead>
                        <TableHead className='table-head-light'>操作</TableHead>
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
                                    <div>
                                        {task.status >= 201 && task.status <= 299 ? '运行中' : "N/A"}
                                    </div>
                                )}
                            </TableCell>
                            <TableCell className="text-center space-x-1">
                                <Button variant="outline" size="sm" onClick={() => handleViewTaskDetail(task)}>
                                    <Eye className="mr-1 h-4 w-4"/> 查看
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

            {isNewSheetOpen && (
                <NewTaskSheet
                    isNewSheetOpen={isNewSheetOpen}
                    setIsNewSheetOpen={setIsNewSheetOpen}
                    onCreate={handleRefreshPage}
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

            {/*变化检测详情对话框*/}
            {selectedTaskForDetail && isChangeDetailOpen && selectedTaskForDetail?.task_type === 0 && (
                <CTaskDetailChangeDetection
                    taskId={selectedTaskForDetail.task_id}
                    taskName={selectedTaskForDetail.name}
                    taskStatus={selectedTaskForDetail.status.toString()} // 您可能希望将状态码映射为更易读的文本
                    createdAt={selectedTaskForDetail.create_time}
                    updatedAt={selectedTaskForDetail.update_time}
                    isOpen={isChangeDetailOpen}
                    onClose={() => {
                        setIsChangeDetailOpen(false);
                        setSelectedTaskForDetail(null);
                    }}
                />
            )}

            {/*视频对象检测详情对话框*/}
            {selectedTaskForDetail && isVideoDetailOpen && selectedTaskForDetail?.task_type === TaskTypeEnum.data_task_obj_video && (
                <CTaskObjectVideoDialog
                task={selectedTaskForDetail}
                isOpen={isVideoDetailOpen}
                onClose={() => {
                    setIsVideoDetailOpen(false);
                    setSelectedTaskForDetail(null);
                }}
            />
            )}
        </div>
        </Card>
        </PageTransition>
    );
}

'use client'

import {Button} from "@/components/ui/button";
import {PlusCircle, RefreshCw, Trash2} from "lucide-react";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {useToast} from '@/hooks/use-toast';
import {UserRecord} from "@/app/core/system-center/user-management/c_user-details-sheet";
import {useEffect, useState} from "react";
import {ApiResponse, request} from "@/lib/api_user";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {C_newUserSheet} from "@/app/core/system-center/user-management/c_new-user-sheet";
import {NewTaskSheet} from "@/app/core/task-center/data-analysis/c_new-task-sheet";

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

    // 从后端获取数据
    const handleRefresh = async (page: number, pageSize: number = 10, is_show_success: boolean = false) => {
        try {
            const response = await request<PagTaskData>({
                url: '/task/all_page', // Replace with actual delete endpoint
                method: 'GET',
                params: {page, pageSize, task_type: "0,1,2,3"},
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
        switch (task_type) {
            case 0:
                return "变化检测";
            case 1:
                return "目标检测-视频";
            case 2:
                return "2";
            case 3:
                return "3";
            default:
                return "未知";
        }
    }

    const setSelectedUser = (task: TaskData) => {
        console.log(task);
    }

    const handleNew = () => {
        setIsNewSheetOpen(true);
    };


    // 页数改变时触发
    useEffect(() => {
        handleRefresh(pageTaskData?.current || 1).then(r => {
        }); //(/ Fetch current page or default to 1
    }, []);

    // 写界面
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold">数据分析任务</h1>
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
                        <TableHead>任务ID</TableHead>
                        <TableHead>任务类型</TableHead>
                        <TableHead>名称</TableHead>
                        <TableHead>进度</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>创建时间</TableHead>
                        <TableHead>更新时间</TableHead>
                        <TableHead>消息</TableHead>
                        <TableHead>操作</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {pageTaskData?.records.map((task) => (
                        <TableRow key={task.id}> {/* 使用 task.id 作为 key prop */}
                            <TableCell>{task.task_id}</TableCell>
                            <TableCell>{task_type_to_name(task.task_type)}</TableCell>
                            <TableCell>{task.name ? task.name.trim() : "N/A"}</TableCell>
                            <TableCell>{task.percent? task.percent + "%" : "N/A"}</TableCell>
                            <TableCell>{task.status ? task.status : "未完成"}</TableCell>
                            <TableCell>{task.create_time}</TableCell>
                            <TableCell>{task.update_time}</TableCell>
                            <TableCell>{task.msg ? task.msg.trim() : "N/A"}</TableCell>
                            <TableCell className="space-x-2">
                                <Button variant="outline" size="sm" onClick={() => setSelectedUser(task)}>详情</Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(task)}><Trash2 className="mr-1 h-4 w-4"/> 删除</Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

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
                            确定要删除任务 “{toDelete?.name}” 吗？此操作无法撤销。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete}>删除</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}

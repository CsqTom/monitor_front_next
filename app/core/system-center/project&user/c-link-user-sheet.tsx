'use client';

import { useState, useEffect } from 'react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, ChevronLeft, Users, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { request, apiRequest } from '@/lib/api_client';
import { ProjectRecord } from './page';

interface UserInfo {
    id: number;
    username: string;
    email?: string;
    date_joined?: string;
    last_login?: string;
    is_active?: boolean;
}

interface ApiResponse<T> {
    code: number;
    msg: string;
    data: T;
}

interface LinkUserSheetProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    project: ProjectRecord | null;
    onUserLinkUpdate?: () => void;
}

export function LinkUserSheet({ open, setOpen, project, onUserLinkUpdate }: LinkUserSheetProps) {
    const [allUsers, setAllUsers] = useState<UserInfo[]>([]);
    const [linkedUsers, setLinkedUsers] = useState<UserInfo[]>([]);
    const [availableUsers, setAvailableUsers] = useState<UserInfo[]>([]);
    const [selectedAvailable, setSelectedAvailable] = useState<number[]>([]);
    const [selectedLinked, setSelectedLinked] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    // 获取所有用户列表
    const fetchAllUsers = async () => {
        try {
            const response = await apiRequest<UserInfo[]>({
                url: '/user/last_list?limit=100',
                method: 'GET',
            });
            
            if (response) {
                setAllUsers(response);
            }
        } catch (error) {
            toast({
                title: '错误',
                description: '获取用户列表时发生错误',
                variant: 'destructive'
            });
        }
    };

    // 获取项目关联的用户列表
    const fetchProjectUsers = async () => {
        if (!project) return;
        
        try {
            const response = await apiRequest<UserInfo[]>({
                url: `/user/project_users_list?project_id=${project.id}`,
                method: 'GET',
            });
            
            if (response) {
                setLinkedUsers(response);
            }
        } catch (error) {
            toast({
                title: '错误',
                description: '获取项目用户关联时发生错误',
                variant: 'destructive'
            });
        }
    };

    // 更新可用用户列表（排除已关联的用户）
    const updateAvailableUsers = () => {
        const linkedUserIds = linkedUsers.map(user => user.id);
        const available = allUsers.filter(user => !linkedUserIds.includes(user.id));
        setAvailableUsers(available);
    };

    // 初始化数据
    useEffect(() => {
        if (open && project) {
            fetchAllUsers();
            fetchProjectUsers();
        }
    }, [open, project]);

    // 更新可用用户列表
    useEffect(() => {
        updateAvailableUsers();
    }, [allUsers, linkedUsers]);

    // 从左移到右（添加用户关联）
    const moveToLinked = () => {
        const usersToMove = availableUsers.filter(user => selectedAvailable.includes(user.id));
        setLinkedUsers(prev => [...prev, ...usersToMove]);
        setSelectedAvailable([]);
    };

    // 从右移到左（移除用户关联）
    const moveToAvailable = () => {
        const usersToRemove = selectedLinked;
        setLinkedUsers(prev => prev.filter(user => !usersToRemove.includes(user.id)));
        setSelectedLinked([]);
    };

    // 确认保存用户关联
    const handleConfirm = async () => {
        if (!project) return;
        
        setLoading(true);
        try {
            const userIds = linkedUsers.map(user => user.id);
            const response = await request<null>({
                url: '/user/reset_project_user_list',
                method: 'POST',
                data: {
                    project_id: project.id,
                    user_ids: userIds
                }
            });
            
            if (response.data.code === 200) {
                toast({
                    title: '成功',
                    description: '用户关联更新成功'
                });
                setOpen(false);
                onUserLinkUpdate?.();
            } else {
                toast({
                    title: '错误',
                    description: response.data.msg || '更新用户关联失败',
                    variant: 'destructive'
                });
            }
        } catch (error) {
            toast({
                title: '错误',
                description: '更新用户关联时发生错误',
                variant: 'destructive'
            });
        }
        setLoading(false);
    };

    // 处理用户选择
    const handleAvailableSelect = (userId: number) => {
        setSelectedAvailable(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleLinkedSelect = (userId: number) => {
        setSelectedLinked(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    // 窗口大小调整
    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent className="sm:max-w-2xl w-full overflow-y-auto p-6">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        用户关联管理
                    </SheetTitle>
                    <SheetDescription>
                        管理项目 "{project?.name}" 的用户关联关系
                    </SheetDescription>
                </SheetHeader>

                <div className="py-6">
                    {/* 项目信息 */}
                    <Card className="mb-6">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">项目信息</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="font-medium">项目名称:</span> {project?.name}</div>
                                <div><span className="font-medium">项目ID:</span> {project?.id}</div>
                                <div><span className="font-medium">经纬度:</span> {project?.longitude}, {project?.latitude}</div>
                                <div><span className="font-medium">海拔:</span> {project?.altitude}m</div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 用户关联管理 */}
                    <div className="flex gap-4 h-96">
                        {/* 左侧：可用用户 */}
                        <Card className="flex-1">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    可用用户 ({availableUsers.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="h-80 overflow-y-auto border rounded-md">
                                    {availableUsers.map(user => (
                                        <div
                                            key={user.id}
                                            className={`p-2 border-b cursor-pointer hover:bg-gray-50 ${
                                                selectedAvailable.includes(user.id) ? 'bg-blue-50 border-blue-200' : ''
                                            }`}
                                            onClick={() => handleAvailableSelect(user.id)}
                                        >
                                            <div className="font-medium text-sm">{user.username}</div>
                                            {user.email && <div className="text-xs text-gray-500 truncate">{user.email}</div>}
                                        </div>
                                    ))}
                                    {availableUsers.length === 0 && (
                                        <div className="p-4 text-center text-gray-500">暂无可用用户</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* 中间：操作按钮 */}
                        <div className="flex flex-col justify-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={moveToLinked}
                                disabled={selectedAvailable.length === 0}
                                className="px-2"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={moveToAvailable}
                                disabled={selectedLinked.length === 0}
                                className="px-2"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* 右侧：已关联用户 */}
                        <Card className="flex-1">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    已关联用户 ({linkedUsers.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="h-80 overflow-y-auto border rounded-md">
                                    {linkedUsers.map(user => (
                                        <div
                                            key={user.id}
                                            className={`p-2 border-b cursor-pointer hover:bg-gray-50 ${
                                                selectedLinked.includes(user.id) ? 'bg-blue-50 border-blue-200' : ''
                                            }`}
                                            onClick={() => handleLinkedSelect(user.id)}
                                        >
                                            <div className="font-medium text-sm">{user.username}</div>
                                            {user.email && <div className="text-xs text-gray-500 truncate">{user.email}</div>}
                                        </div>
                                    ))}
                                    {linkedUsers.length === 0 && (
                                        <div className="p-4 text-center text-gray-500">暂无关联用户</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <SheetFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        取消
                    </Button>
                    <Button onClick={handleConfirm} disabled={loading}>
                        {loading ? '保存中...' : '确认'}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
'use client';

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
import {apiRequest, request} from '@/lib/api_client';
import {PlusCircle, RefreshCw, Trash2} from 'lucide-react';
import {UserDetailsSheet, UserRecord} from './c-edit-user-sheet'; // Placeholder for UserDetailsSheet
import {C_newUserSheet} from './c-new-user-sheet'; // Placeholder for NewUserSheet
import {QPagination} from '@/components/ui/pagination';
import { PageTransition } from '@/components/ui/page-transition';
import { Card } from '@/components/ui/card';

interface UserPageData {
    records: UserRecord[];
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
    const [pageUserData, setPageUserData] = useState<UserPageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
    const [isNewUserSheetOpen, setIsNewUserSheetOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<UserRecord | null>(null);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const {toast} = useToast();

    const fetchUsers = async (page = 1, pageSize = 10) => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiRequest<UserPageData>({
                url: '/user/user_role/page', // Corrected API endpoint
                method: 'GET',
                params: {page, page_size: pageSize},
            });
            if (response) {
                setPageUserData(response);
            }
        } catch (err) {
            setError((err as Error).message || 'An error occurred while fetching users');
            toast({
                title: '错误',
                description: (err as Error).message || '获取用户列表时发生错误',
                variant: 'destructive'
            });
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers(pageUserData?.current || 1); // Fetch current page or default to 1
    }, []);

    const handleRefresh = (page = pageUserData?.current || 1) => {
        fetchUsers(page);
    };

    const handleNew = () => {
        setIsNewUserSheetOpen(true);
    };

    const handleDeleteUser = (user: UserRecord) => {
        setUserToDelete(user);
        setIsAlertOpen(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        try {
            const response = await request<ApiResponse<null>>({
                url: '/user/delete', // Replace with actual delete endpoint
                method: 'DELETE',
                params: {user_id: userToDelete.id}, // Adjust params as needed
            });
            if (response.data.code === 200) {
                toast({title: '成功', description: '用户删除成功'});
                fetchUsers(); // Refresh the list
            } else {
                toast({title: '错误', description: response.data.msg || '删除用户失败', variant: 'destructive'});
            }
        } catch (err) {
            toast({title: '错误', description: (err as Error).message || '删除用户时发生错误', variant: 'destructive'});
        }
        setIsAlertOpen(false);
        setUserToDelete(null);
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
        <PageTransition animationType="scale" duration="default">
        <Card>
        <div className="container mx-auto py-3">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold">用户管理</h1>
                <div className="space-x-2">
                    <Button onClick={handleNew} variant="outline">
                        <PlusCircle className="mr-2 h-4 w-4"/> 新建用户
                    </Button>
                    <Button onClick={() => handleRefresh()} variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4"/> 刷新
                    </Button>
                </div>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="table-head-light">ID</TableHead>
                        <TableHead className="table-head-light">用户名</TableHead>
                        <TableHead className="table-head-light">邮箱</TableHead>
                        <TableHead className="table-head-light">角色</TableHead>
                        <TableHead className="table-head-light">状态</TableHead>
                        <TableHead className="table-head-light">创建时间</TableHead>
                        <TableHead className="table-head-light">更新时间</TableHead>
                        <TableHead className="table-head-light">操作</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pageUserData?.records.map((user) => (
                        <TableRow
                            key={user.id}>
                            <TableCell className="text-center">{user.id}</TableCell>
                            <TableCell className="text-center">{user.username}</TableCell>
                            <TableCell className="text-center">{user.email || 'N/A'}</TableCell>
                            <TableCell className="text-center">{user.role.name || 'N/A'}</TableCell>
                            <TableCell className="text-center">{user.is_active ? '启用' : '禁用'}</TableCell>
                            <TableCell className="text-center">{new Date(user.date_joined).toLocaleString()}</TableCell>
                            <TableCell className="text-center">{user.last_login ? new Date(user.last_login).toLocaleString() : 'N/A'}</TableCell>
                            <TableCell
                                className="space-x-2 text-center"><Button variant="outline" size="sm"
                                                              onClick={() => setSelectedUser(user)}>编辑</Button><Button
                                variant="destructive" size="sm" onClick={() => handleDeleteUser(user)}><Trash2
                                className="mr-1 h-4 w-4"/> 删除</Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {pageUserData && pageUserData.total > 0 && (
                <QPagination
                    current={pageUserData.current}
                    pages={pageUserData.pages}
                    total={pageUserData.total}
                    onPageChange={(page) => handleRefresh(page)}
                />
            )}

            {selectedUser && (
                <UserDetailsSheet
                    selectedUser={selectedUser}
                    setSelectedUser={setSelectedUser}
                    onUserUpdate={handleRefresh}
                />
            )}

            {isNewUserSheetOpen && (
                <C_newUserSheet
                    isNewUserSheetOpen={isNewUserSheetOpen}
                    setIsNewUserSheetOpen={setIsNewUserSheetOpen}
                    onUserCreate={handleRefresh}
                />
            )}

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                            确定要删除用户 "{userToDelete?.username}" 吗？此操作无法撤销。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete}>删除</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
        </Card>
        </PageTransition>
    );
}

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
    // AlertDialogTrigger, // Not using trigger, controlling programmatically
} from "@/components/ui/alert-dialog"
import {useToast} from '@/hooks/use-toast'; // For showing success/error messages
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
import {QPagination} from '@/components/ui/pagination';
import {RoleEditSheet, RoleRecord} from './c-edit-role-sheet';
import {NewRoleSheet} from './c-new-role-sheet';
import { PageTransition } from '@/components/ui/page-transition';
import { Card } from '@/components/ui/card';

// Interfaces are now primarily in RoleDetailsSheet.tsx, re-declare or import if needed broadly
// For page.tsx, we mainly need RolesPageData
interface RolesPageData {
    records: RoleRecord[];
    current: number;
    size: number;
    total: number;
    pages: number;
}

// Define ApiResponse for consistency if not already globally available
interface ApiResponse<T> {
    code: number;
    msg: string;
    data: T;
}

export default function Page() {
    const [rolesData, setRolesData] = useState<RolesPageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState<RoleRecord | null>(null);
    const [isNewRoleSheetOpen, setIsNewRoleSheetOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<RoleRecord | null>(null);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const {toast} = useToast();
    // Removed states related to new role name, default configs, new role configs, loading default configs, submitting states as they are moved to child components

    const fetchRoles = async (page = 1, pageSize = 10) => {
        setLoading(true);
        setError(null);
        try {
            // Ensure the request generic type matches the expected structure from API
            const response = await apiRequest<RolesPageData>({ // Adjusted to use ApiResponse
                url: '/user/roles_page',
                method: 'GET',
                params: {page, page_size: pageSize}, // Added page and page_size params
            });
            if (response) {
                setRolesData(response);
            }
        } catch (err) {
            setError((err as Error).message || 'An error occurred while fetching roles');
            toast({
                title: '错误',
                description: (err as Error).message || '获取角色列表时发生错误',
                variant: 'destructive'
            });
        }
        setLoading(false);
    };

    // Removed handlePermissionChange and handleSaveChanges as they are in RoleDetailsSheet

    useEffect(() => {
        fetchRoles(rolesData?.current || 1); // Fetch current page or default to 1
    }, []);

    const handleRefresh = (page = rolesData?.current || 1) => {
        fetchRoles(page);
    };

    // Removed fetchDefaultRoleConfigs, handleNew, handleNewRoleConfigChange, handleCreateRole as they are in NewRoleSheet
    const handleNew = () => {
        setIsNewRoleSheetOpen(true);
    };

    const handleDeleteRole = (role: RoleRecord) => {
        setRoleToDelete(role);
        setIsAlertOpen(true);
    };

    const confirmDelete = async () => {
        if (!roleToDelete) return;
        try {
            const response = await request<ApiResponse<null>>({
                url: '/user/user_role/delete',
                method: 'DELETE',
                params: {role_id: roleToDelete.id},
            });
            if (response.data.code === 200) {
                toast({title: '成功', description: '角色删除成功'});
                fetchRoles(); // Refresh the list
            } else {
                toast({title: '错误', description: response.data.msg || '删除角色失败', variant: 'destructive'});
            }
        } catch (err) {
            toast({title: '错误', description: (err as Error).message || '删除角色时发生错误', variant: 'destructive'});
        }
        setIsAlertOpen(false);
        setRoleToDelete(null);
    };


    if (loading) {
        return <div className="flex justify-center items-center h-screen"><RefreshCw
            className="animate-spin h-8 w-8 mr-2"/> Loading...</div>; // Improved loading state
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
                <h1 className="text-2xl font-semibold">角色管理</h1>
                <div className="space-x-2">
                    <Button onClick={handleNew} variant="outline">
                        <PlusCircle className="mr-2 h-4 w-4"/> 新建角色
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
                        <TableHead className="table-head-light">名称</TableHead>
                        <TableHead className="table-head-light">创建时间</TableHead>
                        <TableHead className="table-head-light">更新时间</TableHead>
                        <TableHead className="table-head-light">创建者ID</TableHead>
                        <TableHead className="table-head-light">操作</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rolesData?.records.map((role) => (
                        <TableRow key={role.id}>
                            <TableCell className="text-center">{role.id}</TableCell>
                            <TableCell className="text-center">{role.name}</TableCell>
                            <TableCell className="text-center">{new Date(role.created_at).toLocaleString()}</TableCell>
                            <TableCell className="text-center">{new Date(role.updated_at).toLocaleString()}</TableCell>
                            <TableCell className="text-center">{role.creator_id}</TableCell>
                            <TableCell className="space-x-2 text-center">
                                <Button variant="outline" size="sm"
                                        onClick={() => setSelectedRole(role)}>编辑</Button>
                                <Button variant="destructive"
                                        size="sm"
                                        onClick={() => handleDeleteRole(role)}><Trash2
                                    className="mr-1 h-4 w-4"/> 删除
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {rolesData && rolesData.total > 0 && (
                <QPagination
                    current={rolesData.current}
                    pages={rolesData.pages}
                    total={rolesData.total}
                    onPageChange={(page) => handleRefresh(page)}
                />
            )}

            {/* Role Details Sheet - Rendered conditionally based on selectedRole */}
            {selectedRole && (
                <RoleEditSheet
                    selectedRole={selectedRole}
                    setSelectedRole={setSelectedRole}
                    onRoleUpdate={handleRefresh} // Pass fetchRoles to refresh data after update
                />
            )}

            {/* New Role Sheet - Rendered conditionally based on isNewRoleSheetOpen */}
            {isNewRoleSheetOpen && (
                <NewRoleSheet
                    isNewRoleSheetOpen={isNewRoleSheetOpen}
                    setIsNewRoleSheetOpen={setIsNewRoleSheetOpen}
                    onRoleCreate={handleRefresh} // Pass fetchRoles to refresh data after creation
                />
            )}

            {/* Confirmation Dialog for Deletion */}
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                            您确定要删除角色 "{roleToDelete?.name}" 吗？此操作无法撤销。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setRoleToDelete(null)}>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete}>确认删除</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
        </Card>
        </PageTransition>
    );
}

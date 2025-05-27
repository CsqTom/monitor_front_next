'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/hooks/use-toast'; // For showing success/error messages
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
// Removed SheetTrigger as it's not needed here when programmatically controlling Sheet visibility
import { request } from '@/lib/api_user';
import { ChevronLeft, ChevronRight, PlusCircle, RefreshCw, Trash2 } from 'lucide-react';
// Removed Input, Switch, Label, useToast as they are now in child components

// Import the new components
import { RoleDetailsSheet, RoleConfig, RoleRecord } from '@/app/core/system-center/role-management/c_role-details-sheet';
import { NewRoleSheet } from '@/app/core/system-center/role-management/c_new-role-sheet';

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
  const { toast } = useToast();
  // Removed states related to new role name, default configs, new role configs, loading default configs, submitting states as they are moved to child components

  const fetchRoles = async (page = 1, pageSize = 10) => {
    setLoading(true);
    setError(null);
    try {
      // Ensure the request generic type matches the expected structure from API
      const response = await request<ApiResponse<RolesPageData>>({ // Adjusted to use ApiResponse
        url: '/user/roles_page',
        method: 'GET',
        params: { page, page_size: pageSize }, // Added page and page_size params
      });
      if (response.data.code === 200 && response.data.data) {
        setRolesData(response.data.data);
      } else {
        setError(response.data.msg || 'Failed to fetch roles');
        toast({ title: '错误', description: response.data.msg || '获取角色列表失败', variant: 'destructive' });
      }
    } catch (err) {
      setError((err as Error).message || 'An error occurred while fetching roles');
      toast({ title: '错误', description: (err as Error).message || '获取角色列表时发生错误', variant: 'destructive' });
    }
    setLoading(false);
  };

  // Removed handlePermissionChange and handleSaveChanges as they are in RoleDetailsSheet

  useEffect(() => {
    fetchRoles(rolesData?.current || 1); // Fetch current page or default to 1
  }, []);

  const handleRefresh = () => {
    fetchRoles(rolesData?.current || 1);
  };

  const handlePreviousPage = () => {
    if (rolesData && rolesData.current > 1) {
      fetchRoles(rolesData.current - 1);
    }
  };

  const handleNextPage = () => {
    if (rolesData && rolesData.current < rolesData.pages) {
      fetchRoles(rolesData.current + 1);
    }
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
        params: { role_id: roleToDelete.id },
      });
      if (response.data.code === 200) {
        toast({ title: '成功', description: '角色删除成功' });
        fetchRoles(); // Refresh the list
      } else {
        toast({ title: '错误', description: response.data.msg || '删除角色失败', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: '错误', description: (err as Error).message || '删除角色时发生错误', variant: 'destructive' });
    }
    setIsAlertOpen(false);
    setRoleToDelete(null);
  };


  if (loading) {
    return <div className="flex justify-center items-center h-screen"><RefreshCw className="animate-spin h-8 w-8 mr-2" /> Loading...</div>; // Improved loading state
  }

  if (error) {
    return <div className="container mx-auto py-10 text-center text-red-500">Error: {error} <Button onClick={handleRefresh} variant="outline" className="ml-2">Retry</Button></div>;
  }

  return (
    <div className="container mx-auto py-3">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">角色管理</h1>
        <div className="space-x-2">
          <Button onClick={handleNew} variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" /> 新建角色
          </Button>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" /> 刷新
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>名称</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead>更新时间</TableHead>
            <TableHead>创建者ID</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rolesData?.records.map((role) => (
            <TableRow key={role.id}>
              <TableCell>{role.id}</TableCell>
              <TableCell>{role.name}</TableCell>
              <TableCell>{new Date(role.created_at).toLocaleString()}</TableCell>
              <TableCell>{new Date(role.updated_at).toLocaleString()}</TableCell>
              <TableCell>{role.creator_id}</TableCell>
              <TableCell className="space-x-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedRole(role)}>详情</Button>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteRole(role)}>
                  <Trash2 className="mr-1 h-4 w-4" /> 删除
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {rolesData && rolesData.total > 0 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            第 {rolesData.current} 页 / 共 {rolesData.pages} 页 (总计 {rolesData.total} 条)
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={rolesData.current <= 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={rolesData.current >= rolesData.pages}
            >
              下一页
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Role Details Sheet - Rendered conditionally based on selectedRole */}
      {selectedRole && (
        <RoleDetailsSheet
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
          onRoleUpdate={fetchRoles} // Pass fetchRoles to refresh data after update
        />
      )}

      {/* New Role Sheet - Rendered conditionally based on isNewRoleSheetOpen */}
      {isNewRoleSheetOpen && (
        <NewRoleSheet
          isNewRoleSheetOpen={isNewRoleSheetOpen}
          setIsNewRoleSheetOpen={setIsNewRoleSheetOpen}
          onRoleCreate={fetchRoles} // Pass fetchRoles to refresh data after creation
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
  );
}

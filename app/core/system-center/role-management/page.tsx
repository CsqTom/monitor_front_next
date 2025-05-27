'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { PlusCircle, RefreshCw } from 'lucide-react';
// Removed Input, Switch, Label, useToast as they are now in child components

// Import the new components
import { RoleDetailsSheet, RoleConfig, RoleRecord } from '@/components/role-management/RoleDetailsSheet';
import { NewRoleSheet } from '@/components/role-management/NewRoleSheet';

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
  // Removed states related to new role name, default configs, new role configs, loading default configs, submitting states as they are moved to child components

  const fetchRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      // Ensure the request generic type matches the expected structure from API
      const response = await request<ApiResponse<RolesPageData>>({ // Adjusted to use ApiResponse
        url: '/user/roles_page',
        method: 'GET',
      });
      if (response.data.code === 200 && response.data.data) {
        setRolesData(response.data.data);
      } else {
        setError(response.data.msg || 'Failed to fetch roles');
      }
    } catch (err) {
      setError((err as Error).message || 'An error occurred while fetching roles');
    }
    setLoading(false);
  };

  // Removed handlePermissionChange and handleSaveChanges as they are in RoleDetailsSheet

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleRefresh = () => {
    fetchRoles();
  };

  // Removed fetchDefaultRoleConfigs, handleNew, handleNewRoleConfigChange, handleCreateRole as they are in NewRoleSheet
  const handleNew = () => {
    setIsNewRoleSheetOpen(true);
  };


  if (loading) {
    return <div className="flex justify-center items-center h-screen"><RefreshCw className="animate-spin h-8 w-8 mr-2" /> Loading...</div>; // Improved loading state
  }

  if (error) {
    return <div className="container mx-auto py-10 text-center text-red-500">Error: {error} <Button onClick={handleRefresh} variant="outline" className="ml-2">Retry</Button></div>;
  }

  return (
    <div className="container mx-auto py-10">
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
              <TableCell>
                <Button variant="outline" onClick={() => setSelectedRole(role)}>详情</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* TODO: Add pagination if necessary based on rolesData.total and rolesData.size */}

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
    </div>
  );
}

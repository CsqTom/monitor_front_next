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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from '@/components/ui/sheet';
import { request } from '@/lib/api_user'; // 假设 api_user.ts 在 lib 目录下
import { PlusCircle, RefreshCw } from 'lucide-react'; // Updated import
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast'; 

interface RoleConfig {
  id?: number; // id might not be present for new configs if we were to add them, though not requested
  role?: number; // role id, might be part of the parent RoleRecord
  name: string;
  key: string;
  value: boolean | string | number; // As per DefaultMenu
  type_str: string;
}

interface RoleRecord {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  creator_id: number;
  configs: RoleConfig[];
}

interface RolesPageData {
  records: RoleRecord[];
  current: number;
  size: number;
  total: number;
  pages: number;
}

export default function Page() {
  const [rolesData, setRolesData] = useState<RolesPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await request<RolesPageData>({
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

  const handlePermissionChange = (roleId: number, configKey: string, newValue: boolean) => {
    if (!selectedRole || selectedRole.id !== roleId) return;

    const updatedConfigs = selectedRole.configs.map(config =>
      config.key === configKey ? { ...config, value: newValue } : config
    );
    setSelectedRole({ ...selectedRole, configs: updatedConfigs });
  };

  const handleSaveChanges = async () => {
    if (!selectedRole) return;
    setIsSubmitting(true);
    setError(null);
    try {
      // Backend expects id, name, and configs according to GroupUpdate
      const payload = {
        id: selectedRole.id,
        name: selectedRole.name,
        configs: selectedRole.configs.map(c => ({ // Map to DefaultMenu structure
          id: c.id, // Assuming existing configs have an id from the backend
          key: c.key,
          value: c.value,
          name: c.name,
          type_str: c.type_str,
        })),
      };
      const response = await request<ApiResponse<unknown>>({
        url: '/system/group/update', // Corrected endpoint based on Python GroupUpdate
        method: 'POST',
        data: payload,
      });
      if (response.data.code === 200) {
        // Optionally, show a success toast
        console.log('Role updated successfully');
        toast({
          title: '角色更新成功',
          description: response.data.msg || '用户名或密码错误',
        });
        fetchRoles(); // Refresh the list to show updated data
        // Consider closing the sheet or giving feedback
      } else {
        setError(response.data.msg || 'Failed to update role');
        toast({
          title: '角色更新失败',
          description: response.data.msg || '角色更新失败',
          variant: 'destructive',
        });
      }
    } catch (err) {
      setError((err as Error).message || 'An error occurred while updating the role');
    }
    setIsSubmitting(false);
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleRefresh = () => {
    fetchRoles();
  };

  const handleNew = () => {
    // TODO: Implement new role functionality
    console.log('New role clicked');
  };

  if (loading) {
    return <div>Loading...</div>; // 可以替换为 Skeleton 组件
  }

  if (error) {
    return <div>Error: {error} <Button onClick={handleRefresh}>Retry</Button></div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Role Management</h1>
        <div className="space-x-2">
          <Button onClick={handleNew} variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" /> New Role
          </Button>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Updated At</TableHead>
            <TableHead>Creator ID</TableHead>
            <TableHead>Actions</TableHead>
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
                <Sheet onOpenChange={(open) => !open && setSelectedRole(null)}>
                  <SheetTrigger asChild>
                    <Button variant="outline" onClick={() => setSelectedRole(role)}>Details</Button>
                  </SheetTrigger>
                  <SheetContent className="sm:max-w-2xl w-full overflow-y-auto p-6">
                    <SheetHeader className="mb-4">
                      <SheetTitle className="text-2xl">Role Details: {selectedRole?.name}</SheetTitle>
                    </SheetHeader>
                    {selectedRole && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">Basic Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">ID:</span>
                              <span className="text-base text-gray-900 dark:text-gray-100">{selectedRole.id}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Name:</span>
                              <span className="text-base text-gray-900 dark:text-gray-100">{selectedRole.name}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Created At:</span>
                              <span className="text-base text-gray-900 dark:text-gray-100">{new Date(selectedRole.created_at).toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Updated At:</span>
                              <span className="text-base text-gray-900 dark:text-gray-100">{new Date(selectedRole.updated_at).toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Creator ID:</span>
                              <span className="text-base text-gray-900 dark:text-gray-100">{selectedRole.creator_id}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">Permissions</h3>
                          <div className="space-y-3">
                            {selectedRole.configs.map((config) => (
                              <div key={config.key} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow bg-white dark:bg-gray-800/50 dark:border-gray-700">
                                <div className="flex-grow pr-4">
                                  <p className="font-medium text-gray-800 dark:text-gray-200">{config.name}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Key: {config.key} | Type: {config.type_str}</p>
                                </div>
                                <div className="flex-shrink-0">
                                  {config.type_str === 'button' || config.type_str === 'menu' ? (
                                    <div className="flex items-center space-x-2">
                                      <Switch
                                        id={`${config.key}-${config.id}`}
                                        checked={typeof config.value === 'boolean' ? config.value : false}
                                        onCheckedChange={(checked) => handlePermissionChange(selectedRole.id, config.key, checked)}
                                        disabled={isSubmitting}
                                        aria-label={`Toggle ${config.name}`}
                                      />
                                      <Label htmlFor={`${config.key}-${config.id}`} className="text-sm w-16 text-right">
                                        {config.value ? 'Enabled' : 'Disabled'}
                                      </Label>
                                    </div>
                                  ) : (
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{String(config.value)}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                      <SheetClose asChild>
                        <Button variant="outline" disabled={isSubmitting} className="min-w-[100px]">Cancel</Button>
                      </SheetClose>
                      <Button onClick={handleSaveChanges} disabled={isSubmitting} className="min-w-[120px]">
                        {isSubmitting ? (
                          <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* TODO: Add pagination if necessary based on rolesData.total and rolesData.size */}
    </div>
  );
}

'use client';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetTrigger
} from '@/components/ui/sheet';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RefreshCw } from 'lucide-react';
import { request } from '@/lib/api_user';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

// Define interfaces here or import from a shared types file
export interface RoleConfig {
  id?: number;
  role?: number;
  name: string;
  key: string;
  value: boolean | string | number;
  type_str: string;
}

export interface RoleRecord {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  creator_id: number;
  configs: RoleConfig[];
}

interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

interface RoleEditSheetProps {
  selectedRole: RoleRecord | null;
  setSelectedRole: (role: RoleRecord | null) => void;
  onRoleUpdate: () => void; // Callback to refresh roles list
}

export function RoleEditSheet({ selectedRole, setSelectedRole, onRoleUpdate }: RoleEditSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentRoleDetails, setCurrentRoleDetails] = useState<RoleRecord | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedRole) {
      setCurrentRoleDetails(JSON.parse(JSON.stringify(selectedRole))); // Deep copy to avoid direct state mutation
    } else {
      setCurrentRoleDetails(null);
    }
  }, [selectedRole]);

  const handlePermissionChange = (configKey: string, newValue: boolean) => {
    if (!currentRoleDetails) return;

    const updatedConfigs = currentRoleDetails.configs.map(config =>
      config.key === configKey ? { ...config, value: newValue } : config
    );
    setCurrentRoleDetails({ ...currentRoleDetails, configs: updatedConfigs });
  };

  const handleSaveChanges = async () => {
    if (!currentRoleDetails) return;
    setIsSubmitting(true);
    try {
      const payload = {
        id: currentRoleDetails.id,
        name: currentRoleDetails.name,
        configs: currentRoleDetails.configs.map(c => ({
          id: c.id,
          key: c.key,
          value: c.value,
          name: c.name,
          type_str: c.type_str,
        })),
      };
      const response = await request<ApiResponse<unknown>>({
        url: '/system/group/update',
        method: 'POST',
        data: payload,
      });
      if (response.data.code === 200) {
        toast({
          title: '角色更新成功',
          description: response.data.msg || '角色信息已成功更新。',
        });
        onRoleUpdate(); // Refresh the list
        setSelectedRole(null); // Close sheet by clearing selected role
      } else {
        toast({
          title: '角色更新失败',
          description: response.data.msg || '更新角色信息时发生错误。',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: '操作失败',
        description: (err as Error).message || '发生未知错误。',
        variant: 'destructive',
      });
    }
    setIsSubmitting(false);
  };

  if (!selectedRole || !currentRoleDetails) return null; // Don't render if no role is selected

  return (
    <Sheet open={!!selectedRole} onOpenChange={(open) => !open && setSelectedRole(null)}>
      <SheetContent className="sm:max-w-2xl w-full overflow-y-auto p-6">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-2xl">角色详情: {currentRoleDetails.name}</SheetTitle>
        </SheetHeader>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">基本信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">ID:</span>
                <span className="text-base text-gray-900 dark:text-gray-100">{currentRoleDetails.id}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">名称:</span>
                <span className="text-base text-gray-900 dark:text-gray-100">{currentRoleDetails.name}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">创建时间:</span>
                <span className="text-base text-gray-900 dark:text-gray-100">{new Date(currentRoleDetails.created_at).toLocaleString()}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">更新时间:</span>
                <span className="text-base text-gray-900 dark:text-gray-100">{new Date(currentRoleDetails.updated_at).toLocaleString()}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">创建者ID:</span>
                <span className="text-base text-gray-900 dark:text-gray-100">{currentRoleDetails.creator_id}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">权限配置</h3>
            <div className="space-y-3">
              {currentRoleDetails.configs.map((config) => (
                <div key={config.key} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow bg-white dark:bg-gray-800/50 dark:border-gray-700">
                  <div className="flex-grow pr-4">
                    <p className="font-medium text-gray-800 dark:text-gray-200">{config.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Key: {config.key} | 类型: {config.type_str}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {config.type_str === 'button' || config.type_str === 'menu' ? (
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`detail-${config.key}-${config.id}`}
                          checked={typeof config.value === 'boolean' ? config.value : false}
                          onCheckedChange={(checked) => handlePermissionChange(config.key, checked)}
                          disabled={isSubmitting}
                          aria-label={`Toggle ${config.name}`}
                        />
                        <Label htmlFor={`detail-${config.key}-${config.id}`} className="text-sm w-16 text-right">
                          {config.value ? '启用' : '禁用'}
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
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <Button variant="outline" disabled={isSubmitting} className="min-w-[100px]" onClick={() => setSelectedRole(null)}>取消</Button>
          <Button onClick={handleSaveChanges} disabled={isSubmitting} className="min-w-[120px]">
            {isSubmitting ? (
              <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> 保存中...</>
            ) : (
              '保存更改'
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Need to import useState, useEffect from 'react'
// Need to ensure all components like Button, Sheet, Switch, Label, RefreshCw are correctly imported.
// The SheetTrigger is now part of the parent page.tsx, this component will be controlled by `open` prop derived from `selectedRole`.
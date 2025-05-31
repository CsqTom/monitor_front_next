'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RefreshCw } from 'lucide-react';
import { request } from '@/lib/api_client';
import { useToast } from '@/hooks/use-toast';

// Define interfaces here or import from a shared types file
export interface RoleConfig {
  id?: number;
  role?: number;
  name: string;
  key: string;
  value: boolean | string | number;
  type_str: string;
}

interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

interface NewRoleSheetProps {
  isNewRoleSheetOpen: boolean;
  setIsNewRoleSheetOpen: (isOpen: boolean) => void;
  onRoleCreate: () => void; // Callback to refresh roles list
}

export function NewRoleSheet({ isNewRoleSheetOpen, setIsNewRoleSheetOpen, onRoleCreate }: NewRoleSheetProps) {
  const [newRoleName, setNewRoleName] = useState('');
  const [defaultRoleConfigs, setDefaultRoleConfigs] = useState<RoleConfig[]>([]);
  const [newRoleConfigs, setNewRoleConfigs] = useState<RoleConfig[]>([]);
  const [isLoadingDefaultConfigs, setIsLoadingDefaultConfigs] = useState(false);
  const [isSubmittingNewRole, setIsSubmittingNewRole] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchDefaultRoleConfigs = async () => {
    setIsLoadingDefaultConfigs(true);
    setError(null);
    try {
      const response = await request<{
        code: number;
        msg: string;
        data: {
          code: number;
           msg: string;
           data: {
             user: any;
             role_id: number;
             role_name: string;
             configs: RoleConfig[];
           };
        }
      }>({ // Adjusted to match the expected structure from page.tsx
        url: `/user/role?user_id=${localStorage.getItem('user_id')}`,
        method: 'GET',
      });

      console.log(response.data.code);
      console.log(response.data.data);

      // Assuming the actual RoleConfig array is nested under response.data.data.data based on previous structure
      if (response.data.code === 200 && response.data.data) {
        const initializedConfigs = response.data.data.configs.map(config => ({ ...config, value: false }));
        setDefaultRoleConfigs(initializedConfigs);
        setNewRoleConfigs(initializedConfigs);
      } else {
        setError(response.data.msg || 'Failed to fetch default role configurations');
        toast({
          title: '加载失败',
          description: response.data.msg || '无法加载默认角色配置。',
          variant: 'destructive',
        });
      }
    } catch (err) {
      setError((err as Error).message || 'An error occurred while fetching default configurations');
      toast({
        title: '加载错误',
        description: (err as Error).message || '加载默认配置时发生错误。',
        variant: 'destructive',
      });
    }
    setIsLoadingDefaultConfigs(false);
  };

  useEffect(() => {
    if (isNewRoleSheetOpen) {
      setNewRoleName(''); // Reset name when sheet opens
      fetchDefaultRoleConfigs(); // Fetch fresh default configs
    }
  }, [isNewRoleSheetOpen]);

  const handleNewRoleConfigChange = (configKey: string, newValue: boolean) => {
    const updatedConfigs = newRoleConfigs.map(config =>
      config.key === configKey ? { ...config, value: newValue } : config
    );
    setNewRoleConfigs(updatedConfigs);
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      setError('角色名称不能为空。');
      toast({
        title: '验证错误',
        description: '角色名称不能为空。',
        variant: 'destructive',
      });
      return;
    }
    setIsSubmittingNewRole(true);
    setError(null);

    const configsToSubmit = newRoleConfigs
      // .filter(config => config.value === true) // 这里是一定选了true的，所有都提交吧，故屏掉
      .map(config => ({
        id: config.id, 
        key: config.key,
        value: config.value,
        name: config.name,
        type_str: config.type_str,
      }));

    try {
      const payload = {
        user_id: Number(localStorage.getItem('user_id')),
        name: newRoleName,
        configs: configsToSubmit,
      };

      const response = await request<ApiResponse<unknown>>({
        url: '/user/create_role_group',
        method: 'POST',
        data: payload,
      });

      if (response.data.code === 200) {
        toast({
          title: '创建成功',
          description: `角色 "${newRoleName}" 已成功创建。`,
        });
        onRoleCreate(); 
        setIsNewRoleSheetOpen(false); 
      } else {
        setError(response.data.msg || 'Failed to create new role');
        toast({
          title: '创建失败',
          description: response.data.msg || '创建新角色时发生错误。',
          variant: 'destructive',
        });
      }
    } catch (err) {
      setError((err as Error).message || 'An error occurred while creating the new role');
      toast({
        title: '操作失败',
        description: (err as Error).message || '发生未知错误。',
        variant: 'destructive',
      });
    }
    setIsSubmittingNewRole(false);
  };

  return (
    <Sheet open={isNewRoleSheetOpen} onOpenChange={setIsNewRoleSheetOpen}>
      <SheetContent className="sm:max-w-2xl w-full overflow-y-auto p-6">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-2xl">创建新角色</SheetTitle>
        </SheetHeader>
        {isLoadingDefaultConfigs ? (
          <div className="flex items-center justify-center h-40">
            <RefreshCw className="mr-2 h-6 w-6 animate-spin" /> 加载中...
          </div>
        ) : defaultRoleConfigs.length === 0 && error ? (
          <div className="text-red-500">
            加载默认配置失败: {error} 
            <Button onClick={fetchDefaultRoleConfigs} variant="outline" size="sm" className="ml-2">重试</Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <Label htmlFor="newRoleName" className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">角色名称</Label>
              <Input
                id="newRoleName"
                type="text"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="输入新角色名称"
                className="mt-1"
                disabled={isSubmittingNewRole}
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">权限配置</h3>
              <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                {newRoleConfigs.map((config) => (
                  <div key={config.key} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow bg-white dark:bg-gray-800/50 dark:border-gray-700">
                    <div className="flex-grow pr-4">
                      <p className="font-medium text-gray-800 dark:text-gray-200">{config.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Key: {config.key} | 类型: {config.type_str}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {config.type_str === 'button' || config.type_str === 'menu' ? (
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`new-${config.key}-${config.id}`}
                            checked={typeof config.value === 'boolean' ? config.value : false}
                            onCheckedChange={(checked) => handleNewRoleConfigChange(config.key, checked)}
                            disabled={isSubmittingNewRole}
                            aria-label={`Toggle ${config.name}`}
                          />
                          <Label htmlFor={`new-${config.key}-${config.id}`} className="text-sm w-16 text-right">
                            {config.value ? '启用' : '禁用'}
                          </Label>
                        </div>
                      ) : (
                        // For non-boolean types, display value or provide input if editable
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
          <Button variant="outline" disabled={isSubmittingNewRole || isLoadingDefaultConfigs} className="min-w-[100px]" onClick={() => setIsNewRoleSheetOpen(false)}>取消</Button>
          <Button onClick={handleCreateRole} disabled={isSubmittingNewRole || isLoadingDefaultConfigs || !newRoleName.trim() || defaultRoleConfigs.length === 0} className="min-w-[120px]">
            {isSubmittingNewRole ? (
              <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> 创建中...</>
            ) : (
              '创建角色'
            )}
          </Button>
        </div>
         {error && !isSubmittingNewRole && <p className="text-red-500 mt-4 text-sm">错误: {error}</p>} 
      </SheetContent>
    </Sheet>
  );
}
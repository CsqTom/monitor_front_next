'use client'

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ModelType, ApiConfig } from '../page';
import { CEditApiConfigSheet } from './c-edit-api-config-sheet';
import { CNewApiConfigSheet } from './c-new-api-config-sheet';

interface CApiConfigTableProps {
  modelType: ModelType;
  onUpdate: () => void;
}

export function CApiConfigTable({ modelType, onUpdate }: CApiConfigTableProps) {
  const { toast } = useToast();
  const [isNewSheetOpen, setIsNewSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [selectedApiConfig, setSelectedApiConfig] = useState<ApiConfig | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ApiConfig | null>(null);

  const handleEdit = (apiConfig: ApiConfig) => {
    setSelectedApiConfig(apiConfig);
    setIsEditSheetOpen(true);
  };

  const handleDelete = (apiConfig: ApiConfig) => {
    setDeleteTarget(apiConfig);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    
    try {
      // TODO: 实现删除算法接口的API调用
      toast({ title: '成功', description: '算法接口删除成功' });
      setIsDeleteDialogOpen(false);
      setDeleteTarget(null);
      onUpdate();
    } catch (error) {
      toast({ title: '失败', description: (error as Error).message || '删除算法接口失败', variant: 'destructive' });
      console.error('Error deleting api config:', error);
    }
  };

  const handleCreateSuccess = () => {
    setIsNewSheetOpen(false);
    onUpdate();
  };

  const handleEditSuccess = () => {
    setIsEditSheetOpen(false);
    setSelectedApiConfig(null);
    onUpdate();
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">算法接口管理</h3>
        <Button
          onClick={() => setIsNewSheetOpen(true)}
          className="flex items-center gap-2"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          新增接口
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="table-head-light">ID</TableHead>
              <TableHead className="table-head-light">名称</TableHead>
              <TableHead className="table-head-light">接口地址</TableHead>
              <TableHead className="table-head-light">类别代码键</TableHead>
              <TableHead className="table-head-light">状态</TableHead>
              <TableHead className="table-head-light">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {modelType.api_configs.map((apiConfig) => (
              <TableRow key={apiConfig.id}>
                <TableCell className="text-center">{apiConfig.id}</TableCell>
                <TableCell className="text-center">{apiConfig.name}</TableCell>
                <TableCell className="text-center">{apiConfig.app_addr}</TableCell>
                <TableCell className="text-center">{apiConfig.class_code_key}</TableCell>
                <TableCell className="text-center">
                  {apiConfig.is_delete ? '已删除' : '正常'}
                </TableCell>
                <TableCell className="text-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(apiConfig)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(apiConfig)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {modelType.api_configs.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            暂无算法接口数据
          </div>
        )}
      </div>

      <CNewApiConfigSheet
        isOpen={isNewSheetOpen}
        setIsOpen={setIsNewSheetOpen}
        modelTypeId={modelType.id}
        onSuccess={handleCreateSuccess}
      />
      
      {selectedApiConfig && (
        <CEditApiConfigSheet
          isOpen={isEditSheetOpen}
          setIsOpen={setIsEditSheetOpen}
          apiConfig={selectedApiConfig}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* 删除确认对话框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除算法接口 "{deleteTarget?.name}" 吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>确认删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
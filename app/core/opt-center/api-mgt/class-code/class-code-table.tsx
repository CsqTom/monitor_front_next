'use client'

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ModelType, ClassCode } from '../page';
import { CEditClassCodeSheet } from './c-edit-class-code-sheet';
import { CNewClassCodeSheet } from './c-new-class-code-sheet';

interface CClassCodeTableProps {
  modelType: ModelType;
  onUpdate: () => void;
}

export function CClassCodeTable({ modelType, onUpdate }: CClassCodeTableProps) {
  const [isNewSheetOpen, setIsNewSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [selectedClassCode, setSelectedClassCode] = useState<ClassCode | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ClassCode | null>(null);

  const handleEdit = (classCode: ClassCode) => {
    setSelectedClassCode(classCode);
    setIsEditSheetOpen(true);
  };

  const handleDelete = (classCode: ClassCode) => {
    setDeleteTarget(classCode);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    
    try {
      // TODO: 实现删除算法类别的API调用
      toast.success('算法类别删除成功');
      setIsDeleteDialogOpen(false);
      setDeleteTarget(null);
      onUpdate();
    } catch (error) {
      toast.error('删除算法类别失败');
      console.error('Error deleting class code:', error);
    }
  };

  const handleCreateSuccess = () => {
    setIsNewSheetOpen(false);
    onUpdate();
  };

  const handleEditSuccess = () => {
    setIsEditSheetOpen(false);
    setSelectedClassCode(null);
    onUpdate();
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">算法类别管理</h3>
        <Button
          onClick={() => setIsNewSheetOpen(true)}
          className="flex items-center gap-2"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          新增类别
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center font-bold bg-gray-100">ID</TableHead>
              <TableHead className="text-center font-bold bg-gray-100">名称</TableHead>
              <TableHead className="text-center font-bold bg-gray-100">类别代码</TableHead>
              <TableHead className="text-center font-bold bg-gray-100">位置</TableHead>
              <TableHead className="text-center font-bold bg-gray-100">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {modelType.class_codes.map((classCode) => (
              <TableRow key={classCode.id}>
                <TableCell className="text-center">{classCode.id}</TableCell>
                <TableCell className="text-center">{classCode.name}</TableCell>
                <TableCell className="text-center">{classCode.class_code}</TableCell>
                <TableCell className="text-center">{classCode.position}</TableCell>
                <TableCell className="text-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(classCode)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(classCode)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {modelType.class_codes.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            暂无算法类别数据
          </div>
        )}
      </div>

      {/* 新增算法类别Sheet */}
      <CNewClassCodeSheet
        isOpen={isNewSheetOpen}
        setIsOpen={setIsNewSheetOpen}
        modelTypeId={modelType.id}
        onSuccess={handleCreateSuccess}
      />
      
      {selectedClassCode && (
        <CEditClassCodeSheet
          isOpen={isEditSheetOpen}
          setIsOpen={setIsEditSheetOpen}
          classCode={selectedClassCode}
          modelTypeId={modelType.id}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* 编辑算法类别Sheet */}
      {selectedClassCode && (
        <CEditClassCodeSheet
          isOpen={isEditSheetOpen}
          setIsOpen={setIsEditSheetOpen}
          classCode={selectedClassCode}
          modelTypeId={modelType.id}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* 删除确认对话框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除算法类别 "{deleteTarget?.name}" 吗？此操作不可撤销。
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
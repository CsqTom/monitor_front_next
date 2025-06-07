'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Trash2, Save, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ModelType, ClassCode } from '../page';
import { apiRequest } from '@/lib/api_client';

interface EditableClassCode extends ClassCode {
  isNew?: boolean;
}

interface CClassCodeTableProps {
  modelType: ModelType;
  onUpdate: () => void;
}

export function CClassCodeTable({ modelType, onUpdate }: CClassCodeTableProps) {
  const { toast } = useToast();
  const [classCodes, setClassCodes] = useState<EditableClassCode[]>([]);
  const [originalClassCodes, setOriginalClassCodes] = useState<EditableClassCode[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EditableClassCode | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // 初始化数据
  useEffect(() => {
    const initialData = [...modelType.class_codes].sort((a, b) => a.position - b.position);
    setClassCodes(initialData);
    setOriginalClassCodes(JSON.parse(JSON.stringify(initialData)));
  }, [modelType.class_codes]);

  // 检测变更
  useEffect(() => {
    const hasChanged = JSON.stringify(classCodes) !== JSON.stringify(originalClassCodes);
    setHasChanges(hasChanged);
  }, [classCodes, originalClassCodes]);

  // 新增行
  const handleAddNew = () => {
    const newClassCode: EditableClassCode = {
      id: Date.now(), // 临时ID
      name: '',
      class_code: '',
      position: classCodes.length + 1,
      isNew: true
    };
    setClassCodes([...classCodes, newClassCode]);
  };

  // 删除行
  const handleDelete = (classCode: EditableClassCode) => {
    if (classCode.isNew) {
      // 直接删除新增的行
      setClassCodes(classCodes.filter(code => code.id !== classCode.id));
    } else {
      setDeleteTarget(classCode);
      setIsDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    
    try {
      // 删除算法类别的API调用
      await apiRequest({
        url: '/ai_config/delete_class_code',
        method: 'GET', 
        params:{class_code_id: deleteTarget.id}
      });

      // 从列表中移除并重新计算位置
      const filteredCodes = classCodes.filter(code => code.id !== deleteTarget.id);
      const updatedCodes = filteredCodes.map((code, index) => ({
        ...code,
        position: index + 1
      }));
      
      setClassCodes(updatedCodes);
      toast({ title: '成功', description: '算法类别删除成功' });
      setIsDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      toast({ title: '失败', description: (error as Error).message || '删除算法类别失败', variant: 'destructive' });
      console.error('Error deleting class code:', error);
    }
  };

  // 更新字段值
  const updateField = (id: number, field: keyof EditableClassCode, value: string | number) => {
    setClassCodes(classCodes.map(code => 
      code.id === id ? { ...code, [field]: value } : code
    ));
  };

  // 拖拽开始
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  // 拖拽结束
  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // 拖拽悬停
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // 拖拽放置
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newClassCodes = [...classCodes];
    const draggedItem = newClassCodes[draggedIndex];
    
    // 移除拖拽的项目
    newClassCodes.splice(draggedIndex, 1);
    // 插入到新位置
    newClassCodes.splice(dropIndex, 0, draggedItem);
    
    // 重新计算position
    const updatedClassCodes = newClassCodes.map((code, index) => ({
      ...code,
      position: index + 1
    }));
    
    setClassCodes(updatedClassCodes);
  };

  // 保存变更
  const handleSave = async () => {
    try {
      const configs = classCodes.map(code => ({
        name: code.name,
        class_code: code.class_code,
        position: code.position
      }));

      await apiRequest({
        url: '/ai_config/reset_class_codes',
        method: 'POST',
        data: {
          model_type_id: modelType.id,
          configs
        }
      });

      toast({ title: '成功', description: '算法类别保存成功' });
      onUpdate();
    } catch (error) {
      toast({ title: '失败', description: (error as Error).message || '保存算法类别失败', variant: 'destructive' });
      console.error('Error saving class codes:', error);
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">算法类别管理</h3>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex items-center gap-2"
            size="sm"
          >
            <Save className="h-4 w-4" />
            保存变更
          </Button>
          <Button
            onClick={handleAddNew}
            className="flex items-center gap-2"
            size="sm"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
            新增类别
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="table-head-light w-12"></TableHead>
              <TableHead className="table-head-light">位置</TableHead>
              <TableHead className="table-head-light">名称</TableHead>
              <TableHead className="table-head-light">类别代码</TableHead>
              <TableHead className="table-head-light">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classCodes.map((classCode, index) => (
              <TableRow 
                key={classCode.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className={`${draggedIndex === index ? 'opacity-50' : ''} ${classCode.isNew ? 'bg-blue-50' : ''} dark:bg-muted`}
              >
                <TableCell className="table-cell-center">
                  <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                </TableCell>
                <TableCell className="table-cell-center">{classCode.position}</TableCell>
                <TableCell className="table-cell-center">
                  <Input
                    value={classCode.name}
                    onChange={(e) => updateField(classCode.id, 'name', e.target.value)}
                    className="text-center bg-transparent focus:bg-white focus:border"
                    placeholder="请输入名称"
                  />
                </TableCell>
                <TableCell className="table-cell-center">
                  <Input
                    value={classCode.class_code}
                    onChange={(e) => updateField(classCode.id, 'class_code', e.target.value)}
                    className="text-center bg-transparent focus:bg-white focus:border"
                    placeholder="请输入类别代码"
                  />
                </TableCell>
                <TableCell className="table-cell-center">
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

        {classCodes.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            暂无算法类别数据
          </div>
        )}
      </div>

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
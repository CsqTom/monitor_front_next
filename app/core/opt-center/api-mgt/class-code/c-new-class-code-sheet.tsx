'use client'

import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/api_client';

interface CNewClassCodeSheetProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  modelTypeId: number;
  onSuccess: () => void;
}

export function CNewClassCodeSheet({ 
  isOpen, 
  setIsOpen, 
  modelTypeId, 
  onSuccess 
}: CNewClassCodeSheetProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    class_code: '',
    position: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({ title: '提示', description: '请输入算法类别名称', variant: 'destructive' });
      return;
    }
    
    if (!formData.class_code.trim()) {
      toast({ title: '提示', description: '请输入类别代码', variant: 'destructive' });
      return;
    }

    try {
      setIsSubmitting(true);
      // 新增算法类别的API调用
      await apiRequest({
        url: '/ai_config/create_class_code',
        method: 'POST',
        data: {
          ...formData,
          model_type_id: modelTypeId
        }
      });
      
      toast({ title: '成功', description: '算法类别创建成功' });
      setFormData({ name: '', class_code: '', position: 0 });
      onSuccess();
    } catch (error) {
      toast({ title: '失败', description: (error as Error).message || '创建算法类别失败', variant: 'destructive' });
      console.error('Error creating class code:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', class_code: '', position: 0 });
    setIsOpen(false);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="sm:max-w-[525px] p-3">
        <SheetHeader>
          <SheetTitle>新增算法类别</SheetTitle>
          <SheetDescription>
            为当前算法大类创建一个新的算法类别。
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">类别名称</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="请输入算法类别名称"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="class_code">类别代码</Label>
            <Input
              id="class_code"
              value={formData.class_code}
              onChange={(e) => handleInputChange('class_code', e.target.value)}
              placeholder="请输入类别代码"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="position">位置序号</Label>
            <Input
              id="position"
              type="number"
              value={formData.position}
              onChange={(e) => handleInputChange('position', parseInt(e.target.value) || 0)}
              placeholder="请输入位置序号"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <SheetFooter>
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.name.trim() || !formData.class_code.trim()}
          >
            {isSubmitting ? '创建中...' : '创建'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
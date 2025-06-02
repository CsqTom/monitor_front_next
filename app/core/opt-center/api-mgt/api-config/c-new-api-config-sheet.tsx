'use client'

import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface CNewApiConfigSheetProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  modelTypeId: number;
  onSuccess: () => void;
}

export function CNewApiConfigSheet({ 
  isOpen, 
  setIsOpen, 
  modelTypeId, 
  onSuccess 
}: CNewApiConfigSheetProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    app_addr: '',
    class_code_key: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({ title: '提示', description: '请输入算法接口名称', variant: 'destructive' });
      return;
    }
    
    if (!formData.app_addr.trim()) {
      toast({ title: '提示', description: '请输入接口地址', variant: 'destructive' });
      return;
    }
    
    if (!formData.class_code_key.trim()) {
      toast({ title: '提示', description: '请输入类别代码键', variant: 'destructive' });
      return;
    }

    try {
      setIsSubmitting(true);
      // TODO: 实现新增算法接口的API调用
      // await apiRequest({
      //   url: '/api/ai_config/api_config',
      //   method: 'POST',
      //   data: {
      //     ...formData,
      //     model_type: modelTypeId,
      //     is_delete: false
      //   }
      // });
      
      toast({ title: '成功', description: '算法接口创建成功' });
      setFormData({ name: '', app_addr: '', class_code_key: '' });
      onSuccess();
    } catch (error) {
      toast({ title: '失败', description: (error as Error).message || '创建算法接口失败', variant: 'destructive' });
      console.error('Error creating api config:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', app_addr: '', class_code_key: '' });
    setIsOpen(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="sm:max-w-[525px] p-3">
        <SheetHeader>
          <SheetTitle>新增算法接口</SheetTitle>
          <SheetDescription>
            为当前算法大类创建一个新的算法接口。
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">接口名称</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="请输入算法接口名称"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="app_addr">接口地址</Label>
            <Input
              id="app_addr"
              value={formData.app_addr}
              onChange={(e) => handleInputChange('app_addr', e.target.value)}
              placeholder="请输入接口地址"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="class_code_key">类别代码键</Label>
            <Input
              id="class_code_key"
              value={formData.class_code_key}
              onChange={(e) => handleInputChange('class_code_key', e.target.value)}
              placeholder="请输入类别代码键"
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
            disabled={isSubmitting || !formData.name.trim() || !formData.app_addr.trim() || !formData.class_code_key.trim()}
          >
            {isSubmitting ? '创建中...' : '创建'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
'use client'

import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface CNewModelTypeSheetProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onModelTypeCreate: (name: string) => Promise<void>;
}

export function CNewModelTypeSheet({ 
  isOpen, 
  setIsOpen, 
  onModelTypeCreate 
}: CNewModelTypeSheetProps) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('请输入算法大类名称');
      return;
    }

    try {
      setIsSubmitting(true);
      await onModelTypeCreate(name.trim());
      setName('');
      setIsOpen(false);
    } catch (error) {
      // 错误处理已在父组件中完成
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setName('');
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="sm:max-w-[525px] p-3">
        <SheetHeader>
          <SheetTitle>新增算法大类</SheetTitle>
          <SheetDescription>
            创建一个新的算法大类，用于组织算法类别和接口。
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">算法大类名称</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入算法大类名称"
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
            disabled={isSubmitting || !name.trim()}
          >
            {isSubmitting ? '创建中...' : '创建'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
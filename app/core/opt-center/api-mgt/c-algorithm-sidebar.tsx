'use client'

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ModelType } from './page';
import { CNewModelTypeSheet } from './c-new-model-type-sheet';
import { apiRequest } from '@/lib/api_client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CAlgorithmSidebarProps {
  modelTypes: ModelType[];
  selectedModelType: ModelType | null;
  onModelTypeSelect: (modelType: ModelType) => void;
  onModelTypeCreate?: () => void;
}

export function CAlgorithmSidebar({ 
  modelTypes, 
  selectedModelType, 
  onModelTypeSelect,
  onModelTypeCreate
}: CAlgorithmSidebarProps) {
  const [isNewModelTypeSheetOpen, setIsNewModelTypeSheetOpen] = useState(false);
  const { toast } = useToast();

  const handleModelTypeCreate = async (name: string) => {
    try {
      await apiRequest({
        url: '/ai_config/create_model_type',
        method: 'POST',
        data: { name }
      });
      toast({ title: '成功', description: '算法大类创建成功' });
      onModelTypeCreate?.();
    } catch (error) {
      toast({ title: '失败', description: (error as Error).message || '算法大类创建失败', variant: 'destructive' });
      throw error;
    }
  };

  return (
    <>
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-l">算法大类</CardTitle>
            <Button 
              size="sm"
              onClick={() => setIsNewModelTypeSheetOpen(true)}
              className="flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              新增
            </Button>
          </div>
        </CardHeader>
      <CardContent className="px-3">
        <div className="space-y-1">
          {modelTypes.map((modelType) => (
            <Button
              key={modelType.id}
              variant="ghost"
              className={cn(
                'w-full justify-start px-4 py-2 h-auto text-left group flex rounded-md text-sm font-medium',
                selectedModelType?.id === modelType.id 
                  ? 'bg-gray-100 dark:bg-accent  text-foreground' 
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
              onClick={() => onModelTypeSelect(modelType)}
            >
              <div className="flex items-center w-full">
                {/* <AlignJustify className="w-4 h-4 mr-2" /> */}
                <div className="flex flex-col items-start">
                  <div className="font-medium">{modelType.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    类别: {modelType.class_codes.length} | 接口: {modelType.api_configs.length}
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </div>
        
        {modelTypes.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            暂无算法大类
          </div>
        )}
      </CardContent>
    </Card>

    {/* 新增算法大类Sheet */}
    <CNewModelTypeSheet
      isOpen={isNewModelTypeSheetOpen}
      setIsOpen={setIsNewModelTypeSheetOpen}
      onModelTypeCreate={handleModelTypeCreate}
    />
    </>
  );
}
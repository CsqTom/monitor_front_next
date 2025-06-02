'use client'

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ModelType } from './page';

interface CAlgorithmSidebarProps {
  modelTypes: ModelType[];
  selectedModelType: ModelType | null;
  onModelTypeSelect: (modelType: ModelType) => void;
}

export function CAlgorithmSidebar({ 
  modelTypes, 
  selectedModelType, 
  onModelTypeSelect 
}: CAlgorithmSidebarProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">算法大类</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-1">
          {modelTypes.map((modelType) => (
            <Button
              key={modelType.id}
              variant={selectedModelType?.id === modelType.id ? "default" : "ghost"}
              className="w-full justify-start px-4 py-3 h-auto text-left"
              onClick={() => onModelTypeSelect(modelType)}
            >
              <div className="flex flex-col items-start">
                <div className="font-medium">{modelType.name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  类别: {modelType.class_codes.length} | 接口: {modelType.api_configs.length}
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
  );
}
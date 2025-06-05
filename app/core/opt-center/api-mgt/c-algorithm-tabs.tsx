'use client'

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ModelType } from './page';
import { CClassCodeTable } from './class-code/class-code-table';
import { CApiConfigTable } from './api-config/api-config-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CAlgorithmTabsProps {
  selectedModelType: ModelType;
  onClassCodeUpdate: () => void;
  onApiConfigUpdate: () => void;
}

type TabType = 'class_codes' | 'api_configs';

export function CAlgorithmTabs({ 
  selectedModelType, 
  onClassCodeUpdate, 
  onApiConfigUpdate 
}: CAlgorithmTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('class_codes');

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <h2 className="text-l font-semibold">{selectedModelType.name}</h2>
          <div className="text-sm text-muted-foreground">ID: {selectedModelType.id}</div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden">
        <Tabs 
          defaultValue="class_codes" 
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabType)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="class_codes">
              算法类别 ({selectedModelType.class_codes.length})
            </TabsTrigger>
            <TabsTrigger value="api_configs">
              算法接口 ({selectedModelType.api_configs.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="class_codes" className="mt-0">
            <CClassCodeTable
              modelType={selectedModelType}
              onUpdate={onClassCodeUpdate}
            />
          </TabsContent>
          
          <TabsContent value="api_configs" className="mt-0">
            <CApiConfigTable
              modelType={selectedModelType}
              onUpdate={onApiConfigUpdate}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
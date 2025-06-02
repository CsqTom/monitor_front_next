'use client'

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ModelType } from './page';
import { CClassCodeTable } from './class-code/class-code-table';
import { CApiConfigTable } from './api-config/api-config-table';

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
          <h2 className="text-xl font-semibold">{selectedModelType.name}</h2>
          <div className="text-sm text-gray-500">ID: {selectedModelType.id}</div>
        </div>
        
        {/* Tab 切换按钮 */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <Button
            variant={activeTab === 'class_codes' ? 'default' : 'ghost'}
            size="sm"
            className="flex w-50"
            onClick={() => setActiveTab('class_codes')}
          >
            算法类别 ({selectedModelType.class_codes.length})
          </Button>
          <Button
            variant={activeTab === 'api_configs' ? 'default' : 'ghost'}
            size="sm"
            className="flex w-50"
            onClick={() => setActiveTab('api_configs')}
          >
            算法接口 ({selectedModelType.api_configs.length})
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden">
        {activeTab === 'class_codes' && (
          <CClassCodeTable
            modelType={selectedModelType}
            onUpdate={onClassCodeUpdate}
          />
        )}
        
        {activeTab === 'api_configs' && (
          <CApiConfigTable
            modelType={selectedModelType}
            onUpdate={onApiConfigUpdate}
          />
        )}
      </CardContent>
    </Card>
  );
}
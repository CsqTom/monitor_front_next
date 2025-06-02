'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/api_client';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
import { CAlgorithmSidebar } from './c-algorithm-sidebar';
import { CAlgorithmTabs } from './c-algorithm-tabs';
import { CNewModelTypeSheet } from './c-new-model-type-sheet';

interface ClassCode {
  id: number;
  name: string;
  class_code: string;
  position: number;
}

interface ApiConfig {
  id: number;
  name: string;
  app_addr: string;
  model_type: number;
  is_delete: boolean;
  class_code_key: string;
}

interface ModelType {
  id: number;
  name: string;
  class_codes: ClassCode[];
  api_configs: ApiConfig[];
}

export default function ApiMgtPage() {
  const [modelTypes, setModelTypes] = useState<ModelType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModelType, setSelectedModelType] = useState<ModelType | null>(null);
  const [isNewModelTypeSheetOpen, setIsNewModelTypeSheetOpen] = useState(false);
  const {toast} = useToast();

  useEffect(() => {
    fetchModelTypes();
  }, []);

  useEffect(() => {
    // 默认选中第一个算法大类
    if (modelTypes.length > 0 && !selectedModelType) {
      setSelectedModelType(modelTypes[0]);
    }
  }, [modelTypes, selectedModelType]);

  const fetchModelTypes = async () => {
    try {
      setLoading(true);
      const response = await apiRequest<ModelType[]>({
        url: '/ai_config/model_type_list_more',
        method: 'GET'
      });
      setModelTypes(response);
    } catch (error) {
      toast({title: '失败', description: (error as Error).message || '获取数据失败', variant: 'destructive'})
      console.error('Error fetching model types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModelTypeSelect = (modelType: ModelType) => {
    setSelectedModelType(modelType);
  };

  const handleModelTypeCreate = async (name: string) => {
    try {
      // TODO: 实现新增算法大类的API调用
      toast({title: '成功', description: '算法大类创建成功'});
      await fetchModelTypes();
    } catch (error) {
      toast({title: '失败', description: (error as Error).message || '算法大类创建失败', variant: 'destructive'})
      console.error('Error creating model type:', error);
    }
  };

  const handleClassCodeUpdate = async () => {
    try {
      // 刷新数据
      const response = await apiRequest<ModelType[]>({
        url: '/ai_config/model_type_list_more',
        method: 'GET'
      });
      setModelTypes(response);
      
      // 更新选中的算法大类数据
      if (selectedModelType) {
        const updatedModelType = response.find(mt => mt.id === selectedModelType.id);
        if (updatedModelType) {
          setSelectedModelType(updatedModelType);
        }
      }
    } catch (error) {
      toast({title: '失败', description: (error as Error).message || '获取数据失败', variant: 'destructive'})
      console.error('Error fetching model types:', error);
    }
  };

  const handleApiConfigUpdate = async () => {
    try {
      // 刷新数据
      const response = await apiRequest<ModelType[]>({
        url: '/ai_config/model_type_list_more',
        method: 'GET'
      });
      setModelTypes(response);
      
      // 更新选中的算法大类数据
      if (selectedModelType) {
        const updatedModelType = response.find(mt => mt.id === selectedModelType.id);
        if (updatedModelType) {
          setSelectedModelType(updatedModelType);
        }
      }
    } catch (error) {
      toast({title: '失败', description: (error as Error).message || '获取数据失败', variant: 'destructive'})
      console.error('Error fetching model types:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">API管理</h1>
        <Button 
          onClick={() => setIsNewModelTypeSheetOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          新增算法大类
        </Button>
      </div>

      <div className="flex gap-3 h-[calc(100vh-200px)]">
        {/* 左侧栏 - 算法大类 */}
        <div className="w-60 flex-shrink-0">
          <CAlgorithmSidebar
            modelTypes={modelTypes}
            selectedModelType={selectedModelType}
            onModelTypeSelect={handleModelTypeSelect}
          />
        </div>

        {/* 右侧内容区 - Tab切换 */}
        <div className="flex-1">
          {selectedModelType ? (
            <CAlgorithmTabs
              selectedModelType={selectedModelType}
              onClassCodeUpdate={handleClassCodeUpdate}
              onApiConfigUpdate={handleApiConfigUpdate}
            />
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent>
                <div className="text-center text-gray-500">
                  请选择一个算法大类
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* 新增算法大类Sheet */}
      <CNewModelTypeSheet
        isOpen={isNewModelTypeSheetOpen}
        setIsOpen={setIsNewModelTypeSheetOpen}
        onModelTypeCreate={handleModelTypeCreate}
      />
    </div>
  );
}

export type { ModelType, ClassCode, ApiConfig };

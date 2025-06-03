'use client'

import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/api_client';
import { ApiConfig } from '../page';
import { Plus, Trash2 } from 'lucide-react';

interface ApiParameter {
  id?: number;
  key: string;
  default_value: string;
  is_user_data: boolean;
  is_class_code: boolean;
}

interface UserData {
  all_len: number;
  data_format: string;
  data_para_key: string;
}

interface DetailedApiConfig {
  id: number;
  name: string;
  app_addr: string;
  model_type: number;
  is_delete: boolean;
  class_code_key: string;
  user_data: UserData[];
  api_parameters: ApiParameter[];
}

interface CEditApiConfigSheetProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  apiConfig: ApiConfig;
  onSuccess: () => void;
}

export function CEditApiConfigSheet({ 
  isOpen, 
  setIsOpen, 
  apiConfig, 
  onSuccess 
}: CEditApiConfigSheetProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    app_addr: '',
    class_code_key: ''
  });
  const [apiParameters, setApiParameters] = useState<ApiParameter[]>([]);
  const [userData, setUserData] = useState<UserData[]>([]);
  const [classCodeData, setClassCodeData] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  // 获取详细配置信息
  const fetchDetailedConfig = async (configId: number) => {
    try {
      setLoading(true);
      const response = await apiRequest<DetailedApiConfig>({
        url: `/ai_config/api_config?config_id=${configId}`,
        method: 'GET'
      });
      
      setFormData({
        name: response.name,
        app_addr: response.app_addr,
        class_code_key: response.class_code_key
      });
      setApiParameters(response.api_parameters || []);
      setUserData(response.user_data || []);
      setClassCodeData(response.class_code_key || '');
    } catch (error) {
      toast({ title: '失败', description: '获取配置详情失败', variant: 'destructive' });
      console.error('Error fetching detailed config:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && apiConfig) {
      fetchDetailedConfig(apiConfig.id);
    }
  }, [isOpen, apiConfig]);

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
      
      // 构建更新请求的数据格式
      const updateData = {
        id: apiConfig.id,
        name: formData.name,
        app_addr: formData.app_addr,
        model_type_id: apiConfig.model_type,
        class_code_key: classCodeData || formData.class_code_key,
        api_parameters: apiParameters.map(param => ({
          id: param.id || 0,
          key: param.key,
          default_value: param.default_value,
          is_user_data: param.is_user_data,
          is_class_code: param.is_class_code
        })),
        user_data: userData
      };
      
      await apiRequest({
        url: '/ai_config/update_api_config',
        method: 'POST',
        data: updateData
      });
      
      toast({ title: '成功', description: '算法接口更新成功' });
      setIsOpen(false);
      onSuccess();
    } catch (error) {
      toast({ title: '失败', description: (error as Error).message || '更新算法接口失败', variant: 'destructive' });
      console.error('Error updating api config:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 添加新参数
  const handleAddParameter = () => {
    const newParam: ApiParameter = {
      key: '',
      default_value: '',
      is_user_data: false,
      is_class_code: false
    };
    setApiParameters(prev => [...prev, newParam]);
  };

  // 删除参数
  const handleDeleteParameter = (index: number) => {
    setApiParameters(prev => prev.filter((_, i) => i !== index));
  };

  // 更新参数
  const handleParameterChange = (index: number, field: keyof ApiParameter, value: any) => {
    setApiParameters(prev => prev.map((param, i) => {
      if (i === index) {
        const updatedParam = { ...param, [field]: value };
        
        // 处理数据配置和类别配置的逻辑
        if (field === 'is_user_data' && value) {
          // 启用数据配置时，自动添加到userData
          const existingUserData = userData.find(ud => ud.data_para_key === updatedParam.key);
          if (!existingUserData && updatedParam.key) {
            setUserData(prev => [...prev, {
              all_len: 2,
              data_format: 'tif',
              data_para_key: updatedParam.key
            }]);
          }
        } else if (field === 'is_user_data' && !value) {
          // 禁用数据配置时，从userData中删除
          setUserData(prev => prev.filter(ud => ud.data_para_key !== updatedParam.key));
        }
        
        if (field === 'is_class_code' && value) {
          // 启用类别配置时，设置为类别配置
          setClassCodeData(updatedParam.key);
        } else if (field === 'is_class_code' && !value) {
          // 禁用类别配置时，清空类别配置
          if (classCodeData === updatedParam.key) {
            setClassCodeData('');
          }
        }
        
        return updatedParam;
      }
      return param;
    }));
  };

  // 更新用户数据配置
  const handleUserDataChange = (index: number, field: keyof UserData, value: any) => {
    setUserData(prev => prev.map((data, i) => 
      i === index ? { ...data, [field]: value } : data
    ));
  };

  // 删除用户数据配置
  const handleDeleteUserData = (index: number) => {
    const deletedData = userData[index];
    setUserData(prev => prev.filter((_, i) => i !== index));
    
    // 同时更新对应的参数
    setApiParameters(prev => prev.map(param => 
      param.key === deletedData.data_para_key 
        ? { ...param, is_user_data: false }
        : param
    ));
  };

  return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="sm:max-w-[650px] p-3 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>编辑算法接口</SheetTitle>
            <SheetDescription>
              修改算法接口的信息和参数配置。
            </SheetDescription>
          </SheetHeader>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-sm text-gray-500">加载中...</div>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {/* 基本信息 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">基本信息</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">请求名称 *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="请输入算法接口名称"
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="app_addr">请求地址 *</Label>
                    <Input
                      id="app_addr"
                      value={formData.app_addr}
                      onChange={(e) => handleInputChange('app_addr', e.target.value)}
                      placeholder="请输入接口地址"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* 请求参数 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">请求参数</h3>
                </div>
                
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center font-bold bg-gray-100">参数名</TableHead>
                        <TableHead className="text-center font-bold bg-gray-100">默认值</TableHead>
                        <TableHead className="text-center font-bold bg-gray-100">数据配置</TableHead>
                        <TableHead className="text-center font-bold bg-gray-100">类别配置</TableHead>
                        <TableHead className="text-center font-bold bg-gray-100">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiParameters.map((param, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-center">
                            <Input
                              value={param.key}
                              onChange={(e) => handleParameterChange(index, 'key', e.target.value)}
                              placeholder="参数名"
                              disabled={isSubmitting}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Input
                              value={param.default_value}
                              onChange={(e) => handleParameterChange(index, 'default_value', e.target.value)}
                              placeholder="默认值"
                              disabled={isSubmitting}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={param.is_user_data}
                              onCheckedChange={(checked) => handleParameterChange(index, 'is_user_data', checked)}
                              disabled={isSubmitting}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={param.is_class_code}
                              onCheckedChange={(checked) => handleParameterChange(index, 'is_class_code', checked)}
                              disabled={isSubmitting}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteParameter(index)}
                              disabled={isSubmitting}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex justify-center mb-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddParameter}
                      disabled={isSubmitting}
                      className='w-47 h-9'
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      添加参数
                    </Button>
                  </div>
                </div>
              </div>

              {/* 数据配置 */}
              {userData.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">数据配置</h3>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-center font-bold bg-gray-100">目标字段</TableHead>
                          <TableHead className="text-center font-bold bg-gray-100">上传数量</TableHead>
                          <TableHead className="text-center font-bold bg-gray-100">格式/协议</TableHead>
                          <TableHead className="text-center font-bold bg-gray-100">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userData.map((data, index) => (
                          <TableRow key={index}>
                            <TableCell className="text-center">
                              {data.data_para_key}
                            </TableCell>
                            <TableCell className="text-center">
                              <Input
                                type="number"
                                value={data.all_len}
                                onChange={(e) => handleUserDataChange(index, 'all_len', parseInt(e.target.value) || 0)}
                                disabled={isSubmitting}
                                className="w-20 mx-auto"
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Select
                                value={data.data_format}
                                onValueChange={(value) => handleUserDataChange(index, 'data_format', value)}
                                disabled={isSubmitting}
                              >
                                <div className="flex iteems-center justify-center">
                                <SelectTrigger className="w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="tif">tif</SelectItem>
                                  <SelectItem value="http">http</SelectItem>
                                </SelectContent>
                                </div>
                              </Select>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUserData(index)}
                                disabled={isSubmitting}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* 类别配置 */}
              {classCodeData && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">类别配置</h3>
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <div className="space-y-2">
                      <Label>目标字段</Label>
                      <div className="text-sm text-gray-600">{classCodeData}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

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
              disabled={isSubmitting || !formData.name.trim() || !formData.app_addr.trim()}
            >
              {isSubmitting ? '更新中...' : '确认'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
}
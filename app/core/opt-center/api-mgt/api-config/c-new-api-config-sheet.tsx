'use client'

import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/api_client';
import { Plus, Trash2 } from 'lucide-react';

interface ApiParameter {
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
  const [apiParameters, setApiParameters] = useState<ApiParameter[]>([]);
  const [userData, setUserData] = useState<UserData[]>([]);
  const [classCodeData, setClassCodeData] = useState<string>('');

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({ title: '提示', description: '请输入算法接口名称', variant: 'destructive' });
      return;
    }
    
    if (!formData.app_addr.trim()) {
      toast({ title: '提示', description: '请输入接口地址', variant: 'destructive' });
      return;
    }
    
    if (!(classCodeData || formData.class_code_key).trim()) {
      toast({ title: '提示', description: '请输入类别代码键', variant: 'destructive' });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // 构建创建请求的数据格式
      const createData = {
        name: formData.name,
        app_addr: formData.app_addr,
        model_type_id: modelTypeId,
        is_delete: false,
        class_code_key: classCodeData || formData.class_code_key,
        api_parameters: apiParameters.map(param => ({
          key: param.key,
          default_value: param.default_value,
          is_user_data: param.is_user_data,
          is_class_code: param.is_class_code
        })),
        user_data: userData
      };
      
      await apiRequest({
        url: '/ai_config/create_api_config',
        method: 'POST',
        data: createData
      });
      
      toast({ title: '成功', description: '算法接口创建成功' });
      // 重置所有状态
      setFormData({ name: '', app_addr: '', class_code_key: '' });
      setApiParameters([]);
      setUserData([]);
      setClassCodeData('');
      setIsOpen(false);
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
    setApiParameters([]);
    setUserData([]);
    setClassCodeData('');
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
    const param = apiParameters[index];
    // 删除参数时，同时删除相关的数据配置
    if (param.is_user_data) {
      setUserData(prev => prev.filter(ud => ud.data_para_key !== param.key));
    }
    // 如果是类别配置，清空类别配置
    if (param.is_class_code && classCodeData === param.key) {
      setClassCodeData('');
    }
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
        
        // 如果修改了参数名，需要同步更新相关配置
        if (field === 'key' && param.key !== value) {
          // 更新数据配置中的关联
          if (param.is_user_data) {
            setUserData(prev => prev.map(ud => 
              ud.data_para_key === param.key 
                ? { ...ud, data_para_key: value }
                : ud
            ));
          }
          // 更新类别配置中的关联
          if (param.is_class_code && classCodeData === param.key) {
            setClassCodeData(value);
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
    const userDataItem = userData[index];
    // 删除数据配置时，同步更新对应参数的状态
    setApiParameters(prev => prev.map(param => 
      param.key === userDataItem.data_para_key 
        ? { ...param, is_user_data: false }
        : param
    ));
    setUserData(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="sm:max-w-[650px] p-3 overflow-y-auto max-h-screen">
        <SheetHeader>
          <SheetTitle>新增算法接口</SheetTitle>
          <SheetDescription>
            为当前算法大类创建一个新的算法接口。
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* 基本信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">基本信息</h3>
            <div className="grid grid-cols-1 gap-4">
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
            </div>
          </div>

          {/* 请求参数 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">请求参数</h3>
              
            </div>
            
            {apiParameters.length > 0 && (
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
            )}
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
                            <SelectTrigger className="w-32 mx-auto">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tif">tif</SelectItem>
                              <SelectItem value="shp">shp</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUserData(index)}
                            disabled={isSubmitting}
                          >
                            <Trash2 className="h-4 w-4" />
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
                <p className="text-sm text-gray-600">
                  类别配置字段: <span className="font-medium">{classCodeData}</span>
                </p>
              </div>
            </div>
          )}
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
            disabled={isSubmitting || !formData.name.trim() || !formData.app_addr.trim()}
          >
            {isSubmitting ? '创建中...' : '创建'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
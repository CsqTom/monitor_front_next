'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Download } from 'lucide-react';
import { apiRequest } from '@/lib/api_client';
import ChangeDetectionMap from '@/components/map/change-detection-map';

interface TaskData {
  id: number;
  flag_info: 'before' | 'after';
  store_name: string;
  layer: string;
  url: string;
  center_lat: number;
  center_lon: number;
  extent: [number, number, number, number];
  json_file_path: string;
  address: string;
}

interface ApiResponse {
  code: number;
  msg: string;
  data: TaskData[];
}

interface DownloadResponse {
  zip_http: string;
}

interface UserRoleConfig {
  key: string;
  type_str: string;
  value: boolean;
}

interface UserRoleData {
  configs: UserRoleConfig[];
}

interface ChangeDetectionTaskDetailProps {
  taskId: string | null;
  taskName?: string;
  taskStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  isOpen: boolean;
  onClose: () => void;
}

const CTaskDetailChangeDetection: React.FC<ChangeDetectionTaskDetailProps> = ({
  taskId,
  taskName,
  taskStatus,
  createdAt,
  updatedAt,
  isOpen,
  onClose,
}) => {
  const [dialogSize, setDialogSize] = useState({ width: 'auto', height: 'auto' });
  const [taskDetails, setTaskDetails] = useState<TaskData[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [allowedButtonKeys, setAllowedButtonKeys] = useState<Set<string>>(new Set());
  const [roleLoading, setRoleLoading] = useState<boolean>(false);
  const { toast } = useToast();

  // 获取用户角色权限
  const fetchUserRole = async () => {
    try {
      setRoleLoading(true);
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        console.warn('User ID not found in localStorage');
        return;
      }
      
      const data = await apiRequest<UserRoleData>({
        url: `/user/role?user_id=${userId}`,
        method: 'GET'
      });
      
      // 提取允许的按钮权限keys
      const allowedKeys = new Set<string>();
      data.configs.forEach(config => {
        if (config.type_str === 'button' && config.value) {
          allowedKeys.add(config.key);
        }
      });
      setAllowedButtonKeys(allowedKeys);
      
    } catch (error) {
      console.error('Failed to fetch user role:', error);
    } finally {
      setRoleLoading(false);
    }
  };

  useEffect(() => {
    const updateSize = () => {
      const newWidth = window.innerWidth * 0.9;
      const newHeight = window.innerHeight * 0.9;
      setDialogSize({ width: `${newWidth}px`, height: `${newHeight}px` });
    };

    if (isOpen) {
      updateSize();
      window.addEventListener('resize', updateSize);
      
      // 获取用户权限
      fetchUserRole();
      
      if (taskId) {
        const fetchTaskDetails = async () => {
          setLoading(true);
          setError(null);
          try {
            // TODO: Replace with actual API base URL from a config or env variable
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/task/geoserver_wms_url?task_id=${taskId}`);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result: ApiResponse = await response.json();
            if (result.code === 200) {
              setTaskDetails(result.data);
              setAddress(result.data[0].address);
            } else {
              throw new Error(result.msg || 'Failed to fetch task details');
            }
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
            setError(errorMessage);
            toast({
              title: 'Error',
              description: `Failed to load task details: ${errorMessage}`,
              variant: 'destructive',
            });
            console.error('Failed to fetch task details:', err);
          }
          setLoading(false);
        };
        fetchTaskDetails();
      }
    } else {
      window.removeEventListener('resize', updateSize);
    }

    return () => window.removeEventListener('resize', updateSize);
  }, [isOpen, taskId, toast]);

  const beforeImage = taskDetails?.find(d => d.flag_info === 'before');
  const afterImage = taskDetails?.find(d => d.flag_info === 'after');

  // 从json_file_path中提取geojson文件名
  const extractGeojsonFileName = (jsonFilePath: string): string | null => {
    if (!jsonFilePath) return null;
    const match = jsonFilePath.match(/([^/]+\.geojson)$/);
    return match ? match[1] : null;
  };

  // 下载功能
  const handleDownload = async () => {
    if (!afterImage?.json_file_path) {
      toast({
        title: '错误',
        description: '无法获取geojson文件路径',
        variant: 'destructive',
      });
      return;
    }

    const geojsonFileName = extractGeojsonFileName(afterImage.json_file_path);
    if (!geojsonFileName) {
      toast({
        title: '错误',
        description: '无法从路径中提取geojson文件名',
        variant: 'destructive',
      });
      return;
    }

    setDownloading(true);
    try {
      const response = await apiRequest<DownloadResponse>({
        method: 'GET',
        url: '/task/geojson_result_zip',
        params: {
          geojson_file_name: geojsonFileName
        }
      });

      if (response.zip_http) {
        // 创建一个临时的a标签来触发下载
        const link = document.createElement('a');
        link.href = response.zip_http.trim();
        link.download = geojsonFileName.replace('.geojson', '.zip');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: '成功',
          description: '文件下载已开始',
        });
      } else {
        throw new Error('未获取到下载地址');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '下载失败';
      toast({
        title: '下载失败',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('Download failed:', error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent style={{ width: dialogSize.width, height: dialogSize.height, maxWidth: dialogSize.width }} className="flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle>任务详情：变化检测 {taskName ? `- ${taskName}` : ''}</DialogTitle>
              <DialogDescription>
                查看任务的详细信息和变化检测结果。
              </DialogDescription>
            </div>
            
          </div>
        </DialogHeader>

        <div className="pl-6 pr-6 pb-3 grid grid-cols-1 md:grid-cols-3 gap-4 border-b">
          <div><span>任务ID:</span> {taskId || 'N/A'}</div>
          <div><span>任务名称:</span> {taskName || 'N/A'}</div>
          <div className="flex justify-between items-center">
            <span><span>任务状态:</span> {taskStatus || 'N/A'}</span>
            {allowedButtonKeys.has('result_zip') && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={downloading || !afterImage?.json_file_path}
                className="flex items-center gap-2 text-primary"
              >
                <Download className="h-4 w-4" />
                {downloading ? '下载中...' : '下载结果'}
              </Button>
            )}
          </div>
          <div><span>创建时间:</span> {createdAt || 'N/A'}</div>
          <div><span>更新时间:</span> {updatedAt || 'N/A'}</div>
          <div><span>中心地址:</span> {address || 'N/A'}</div>
        </div>

        <div className="flex-grow overflow-hidden">
          {loading && <p>加载地图数据中...</p>}
          {error && <p className="text-red-500">加载地图数据失败: {error}</p>}
          {!loading && !error && taskDetails && (
            <div className='w-full h-full bg-gray-200 flex items-center justify-center'>
              <ChangeDetectionMap 
                beforeImage={beforeImage}
                afterImage={afterImage}
                geoJsonUrl={afterImage?.json_file_path} 
              />
            </div>
          )}
          {!loading && !error && !taskDetails && isOpen && <p>未能加载任务影像详情。</p>}
        </div>

        <DialogFooter className="p-6 pt-3 border-t">
          <Button variant="outline" onClick={onClose}>关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CTaskDetailChangeDetection;
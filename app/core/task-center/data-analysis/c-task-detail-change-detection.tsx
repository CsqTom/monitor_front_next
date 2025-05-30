'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
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
}

interface ApiResponse {
  code: number;
  msg: string;
  data: TaskData[];
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
  const { toast } = useToast();

  useEffect(() => {
    const updateSize = () => {
      const newWidth = window.innerWidth * 0.9;
      const newHeight = window.innerHeight * 0.9;
      setDialogSize({ width: `${newWidth}px`, height: `${newHeight}px` });
    };

    if (isOpen) {
      updateSize();
      window.addEventListener('resize', updateSize);
      
      if (taskId) {
        const fetchTaskDetails = async () => {
          setLoading(true);
          setError(null);
          try {
            // TODO: Replace with actual API base URL from a config or env variable
            const response = await fetch(`http://localhost:61301/api/task/geoserver_wms_url?task_id=${taskId}`);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result: ApiResponse = await response.json();
            if (result.code === 200) {
              setTaskDetails(result.data);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent style={{ width: dialogSize.width, height: dialogSize.height, maxWidth: dialogSize.width }} className="flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>任务详情：变化检测 {taskName ? `- ${taskName}` : ''}</DialogTitle>
          <DialogDescription>
            查看任务的详细信息和变化检测结果。
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 border-b">
          <div><span className="font-semibold">任务ID:</span> {taskId || 'N/A'}</div>
          <div><span className="font-semibold">任务名称:</span> {taskName || 'N/A'}</div>
          <div><span className="font-semibold">任务状态:</span> {taskStatus || 'N/A'}</div>
          <div><span className="font-semibold">创建时间:</span> {createdAt || 'N/A'}</div>
          <div><span className="font-semibold">更新时间:</span> {updatedAt || 'N/A'}</div>
        </div>

        <div className="flex-grow p-6 overflow-hidden">
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

        <DialogFooter className="p-6 pt-0 border-t">
          <Button variant="outline" onClick={onClose}>关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CTaskDetailChangeDetection;
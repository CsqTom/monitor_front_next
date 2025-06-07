'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/api_client';
import VideoPlayer from '@/components/task/video-player';
import VideoResultGallery from '@/components/task/video-result-gallery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Video, Image, Square } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface VideoTaskData {
  id: number;
  task_id: string;
  task_type: number;
  name: string;
  percent: number;
  status: number;
  msg: string;
  config_id: number;
  params_json: string;
  result_json: string | null;
  create_time: string;
  update_time: string;
}

interface ParsedParamsJson {
  task_id: number;
  src_url: string;
  dst_url: string;
  class_codes: string;
  error_callback_url: string;
  result_folder: string;
}

interface VideoTaskDetailProps {
  task: VideoTaskData | null;
  isOpen: boolean;
  onClose: () => void;
}

const CTaskObjectVideoDialog: React.FC<VideoTaskDetailProps> = ({
  task,
  isOpen,
  onClose,
}) => {
  const [dialogSize, setDialogSize] = useState({ width: 'auto', height: 'auto' });
  const [taskData, setTaskData] = useState<VideoTaskData | null>(null);
  const [parsedParams, setParsedParams] = useState<ParsedParamsJson | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [destroyVideo, setDestroyVideo] = useState<boolean>(false);
  const [stopping, setStopping] = useState<boolean>(false);
  const { toast } = useToast();

  // 解析params_json字符串
  const parseParamsJson = (paramsJsonStr: string): ParsedParamsJson | null => {
    try {
      // 替换单引号为双引号，使其成为有效的JSON
      const jsonStr = paramsJsonStr.replace(/'/g, '"');
      return JSON.parse(jsonStr);
    } catch (err) {
      console.error('Failed to parse params_json:', err);
      return null;
    }
  };

  // 获取任务数据（仅在没有传入task时使用）
  const fetchTaskData = async () => {
    if (!task?.task_id) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<VideoTaskData>({
        url: '/task/get',
        method: 'GET',
        params: { task_id: task.task_id },
      });
      
      if (response) {
        setTaskData(response);
        
        // 解析params_json
        if (response.params_json) {
          const parsed = parseParamsJson(response.params_json);
          if (parsed) {
            setParsedParams(parsed);
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取任务数据失败';
      setError(errorMessage);
      toast({
        title: '错误',
        description: `加载任务详情失败: ${errorMessage}`,
        variant: 'destructive',
      });
      console.error('Failed to fetch task data:', err);
    }
    setLoading(false);
  };

  // 处理对话框关闭
  const handleClose = () => {
    // 先设置销毁视频流标志
    setDestroyVideo(true);
    // 延迟关闭对话框，给视频流销毁一些时间
    setTimeout(() => {
      onClose();
      // 对话框完全关闭后重置状态
      setTimeout(() => {
        setDestroyVideo(false);
      }, 300);
    }, 100);
  };

  // 当传入的task数据变化时，更新本地状态
  useEffect(() => {
    if (task) {
      setTaskData(task);
      setError(null);
      
      // 解析params_json
      if (task.params_json) {
        const parsed = parseParamsJson(task.params_json);
        if (parsed) {
          setParsedParams(parsed);
        }
      }
    }
  }, [task]);

  // 组件挂载和isOpen变化时的处理
  useEffect(() => {
    const updateSize = () => {
      const newWidth = window.innerWidth * 0.9;
      const newHeight = window.innerHeight * 0.9;
      setDialogSize({ width: `${newWidth}px`, height: `${newHeight}px` });
    };

    if (isOpen) {
      updateSize();
      window.addEventListener('resize', updateSize);
      // 如果没有传入task数据，则主动获取
      if (!task) {
        fetchTaskData();
      }
      // 确保打开对话框时视频不是销毁状态
      setDestroyVideo(false);
    } else {
      window.removeEventListener('resize', updateSize);
    }

    return () => window.removeEventListener('resize', updateSize);
  }, [isOpen, task]);

  // 停止任务
  const handleStopTask = async () => {
    if (!taskData) return;
    
    setStopping(true);
    try {
      await apiRequest({
        url: '/task/stop_task/video',
        method: 'POST',
        data: { task_id: taskData.task_id },
      });
      
      toast({
        title: '成功',
        description: '任务停止请求已发送',
        variant: 'default',
      });
      
      // 重新获取任务数据以更新状态
      await fetchTaskData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '停止任务失败';
      toast({
        title: '错误',
        description: `停止任务失败: ${errorMessage}`,
        variant: 'destructive',
      });
      console.error('Failed to stop task:', err);
    } finally {
      setStopping(false);
    }
  };

  // 获取任务状态文本
  const getStatusText = (status: number): string => {
    if (status >= 201 && status <= 299) return '处理中';
    if (status === 200) return '已完成';
    return '失败';
  };

  // 判断任务是否正在处理中
  const isTaskProcessing = (status: number): boolean => {
    return status >= 201 && status <= 299;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent style={{ width: dialogSize.width, height: dialogSize.height, maxWidth: dialogSize.width }} className="flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>视频对象检测任务详情 {taskData?.name ? `- ${taskData.name}` : ''}</DialogTitle>
          <DialogDescription>
            查看视频对象检测任务的详细信息和实时视频流。
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex-grow flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">加载任务数据中...</span>
          </div>
        )}

        {error && (
          <div className="flex-grow flex items-center justify-center text-red-500 ">
            加载失败: {error}
          </div>
        )}

        {!loading && !error && taskData && (
          <>
            <div className="px-6 pb-3 grid grid-cols-1 md:grid-cols-3 gap-4 border-b drank:bg-black-100  text-sm">
              <div><span>任务ID:</span> {taskData.task_id || 'N/A'}</div>
              <div><span>任务名称:</span> {taskData.name || 'N/A'}</div>
              <div><span>任务状态:</span> {getStatusText(taskData.status)}</div>
              <div><span>进度:</span> {taskData.percent}%</div>
              <div><span>创建时间:</span> {taskData.create_time || 'N/A'}</div>
              <div><span>更新时间:</span> {taskData.update_time || 'N/A'}</div>
              <div><span>任务消息:</span> {taskData.msg|| 'N/A'}</div>
            </div>

            <div className="flex-grow px-6 overflow-auto">
              <Tabs defaultValue={taskData.status === 200 ? "results" : "video"} className="w-full">                
                <TabsList className="mb-4">                  
                  <TabsTrigger value="video"><Video className="h-4 w-4 mr-2" />实时视频</TabsTrigger>                  
                  <TabsTrigger value="results"><Image className="h-4 w-4 mr-2" />检测结果</TabsTrigger>                  
                  <TabsTrigger value="params">任务参数</TabsTrigger>                
                </TabsList>
                <TabsContent value="video" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>实时视频流</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {parsedParams && isTaskProcessing(taskData.status) ? (
                        <VideoPlayer 
                          src_url={parsedParams.src_url} 
                          dst_url={parsedParams.dst_url}
                          width="100%"
                          height="360px"
                          destroy={destroyVideo}
                        />
                      ) : (
                        <div className="text-center p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
                          未找到有效的视频流地址 / {taskData.msg || ''}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="results" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>检测结果图片</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {taskData && (
                        <VideoResultGallery taskId={taskData.task_id} />
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="params" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>任务参数</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {parsedParams && (
                          <>
                            <div><span className="font-semibold">源视频流:</span> {parsedParams.src_url || 'N/A'}</div>
                            <div><span className="font-semibold">结果视频流:</span> {parsedParams.dst_url || 'N/A'}</div>
                            <div><span className="font-semibold">类别代码:</span> {parsedParams.class_codes || 'N/A'}</div>
                            <div className='truncate'><span className="font-semibold">结果文件夹:</span> {parsedParams.result_folder || 'N/A'}</div>
                          </>
                        )}
                        {!parsedParams && <div>无法解析任务参数</div>}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

            </div>
          </>
        )}

        <DialogFooter className="p-6 pt-3 border-t">
          {taskData && isTaskProcessing(taskData.status) && (
            <Button 
              variant="destructive" 
              onClick={handleStopTask}
              disabled={stopping}
              className="mr-2"
            >
              {stopping ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  停止中...
                </>
              ) : (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  停止任务
                </>
              )}
            </Button>
          )}
          <Button variant="outline" onClick={handleClose}>关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CTaskObjectVideoDialog;
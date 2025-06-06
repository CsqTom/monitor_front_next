
'use client';

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QPagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ZoomIn, Download } from "lucide-react";
import { apiRequest } from "@/lib/api_client";

interface VideoResult {
  filename: string;
  size: number;
  created_time: number;
  modified_time: number;
}

interface VideoResultsResponse {
  files: VideoResult[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

const VideoResultGallery = ({ taskId }: { taskId: string | number }) => {
  const [results, setResults] = useState<VideoResultsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSize, setPreviewSize] = useState({ width: 'auto', height: 'auto' });
  const { toast } = useToast();
  const [imageCount, setImageCount] = useState(0);

  // 获取图片数量
  const fetchImageCount = async () => {
    try {
      const response = await apiRequest<any>({
        url: '/task/video_task_status',
        method: 'GET',
        params: { task_id: taskId },
      });
      
      if (response) {
        // setStatus(response);
        setImageCount(response.image_count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch task status:', error);
    }
  };

  // 轮询任务状态
  useEffect(() => {
    const interval = setInterval(async () => {
      fetchImageCount();
    }, 5000); // 每5秒轮询一次

    return () => clearInterval(interval);
  }, [taskId]);

  // 获取结果列表
  const fetchResults = async (pageNum: number = 1) => {
    setLoading(true);
    try {
      const response = await apiRequest<VideoResultsResponse>({
        url: '/task/video_results',
        method: 'GET',
        params: { task_id: taskId, page: pageNum, page_size: 20 },
      });
      
      if (response) {
        setResults(response);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Failed to fetch results:', error);
      toast({
        title: '错误',
        description: '获取视频结果失败',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 获取图片URL
  const getImageUrl = (filename: string) => {
    return `http://localhost:61301/api/task/video_image/${taskId}/${filename}`;
  };

  // 下载图片
  const downloadImage = (filename: string) => {
    const link = document.createElement('a');
    link.href = getImageUrl(filename);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 打开预览
  const openPreview = (filename: string) => {
    setSelectedImage(filename);
    setPreviewOpen(true);
  };

  // 更新预览对话框大小
  useEffect(() => {
    const updateSize = () => {
      const newWidth = window.innerWidth * 0.9;
      const newHeight = window.innerHeight * 0.9;
      setPreviewSize({ width: `${newWidth}px`, height: `${newHeight}px` });
    };

    if (previewOpen) {
      updateSize();
      window.addEventListener('resize', updateSize);
    }

    return () => window.removeEventListener('resize', updateSize);
  }, [previewOpen]);

  // 初始加载和图片数量变化时刷新
  useEffect(() => {
    fetchResults(1);
    fetchImageCount();
  }, [taskId]);

  // 当检测到新图片时自动刷新
  useEffect(() => {
    if (imageCount > 0 && results && imageCount > results.total) {
      fetchResults(page);
    }
  }, [imageCount, results]);

  // 处理分页
  const handlePageChange = (newPage: number) => {
    if (newPage !== page) {
      fetchResults(newPage);
    }
  };

  // 格式化时间戳
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">视频检测结果 {imageCount > 0 ? `(${imageCount}张)` : ''}</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fetchResults(page)}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          刷新
        </Button>
      </div>

      {loading && !results && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col">
              <Skeleton className="h-[150px] w-full rounded-md" />
              <Skeleton className="h-4 w-full mt-2" />
            </div>
          ))}
        </div>
      )}

      {!loading && (!results || results.files.length === 0) && (
        <Card>
          <CardContent className="flex items-center justify-center h-[200px]">
            <p className="text-muted-foreground">暂无检测结果</p>
          </CardContent>
        </Card>
      )}

      {results && results.files.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {results.files.map((file) => (
              <Card key={file.filename} className="overflow-hidden">
                <CardContent className="p-2">
                  <div className="relative group">
                    <img 
                      src={getImageUrl(file.filename)} 
                      alt={file.filename}
                      className="w-full h-[150px] object-cover rounded-md cursor-pointer"
                      onClick={() => openPreview(file.filename)}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-50">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-white mr-2" 
                        onClick={(e) => {
                          e.stopPropagation();
                          openPreview(file.filename);
                        }}
                      >
                        <ZoomIn className="h-8 w-8" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-white" 
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadImage(file.filename);
                        }}
                      >
                        <Download className="h-8 w-8" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground truncate">
                    <p className="truncate">{file.filename}</p>
                    <p>{formatTimestamp(file.created_time)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {results.total_pages > 1 && (
            <div className="flex justify-center mt-6">
              <QPagination
                current={page}
                pages={results.total_pages}
                total={results.total}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}

      {/* 图片预览对话框 */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent style={{ width: previewSize.width, height: previewSize.height, maxWidth: previewSize.width }} className="flex flex-col p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>{selectedImage}</DialogTitle>
          </DialogHeader>
          <div className="flex-grow flex items-center justify-center p-6 overflow-auto">
            {selectedImage && (
              <img 
                src={getImageUrl(selectedImage)} 
                alt={selectedImage}
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
          <div className="p-6 pt-0 flex justify-between">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>关闭</Button>
            {selectedImage && (
              <Button onClick={() => downloadImage(selectedImage)}>
                <Download className="h-4 w-4 mr-2" /> 下载
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VideoResultGallery;
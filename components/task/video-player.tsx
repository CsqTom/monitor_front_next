'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import FlvPlayer from './flv-play';

interface VideoPlayerProps {
  src_url?: string;
  dst_url?: string;
  className?: string;
  style?: React.CSSProperties;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  height?: number | string;
  width?: number | string;
  // 添加销毁标志，用于控制组件是否应该销毁视频流连接
  destroy?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src_url,
  dst_url,
  className,
  style,
  controls = true,
  autoPlay = true,
  muted = true,
  height,
  width,
  destroy = false,
}) => {
  const [srcError, setSrcError] = useState<boolean>(false);
  const [dstError, setDstError] = useState<boolean>(false);
  const [srcUrl, setSrcUrl] = useState<string>('');
  const [dstUrl, setDstUrl] = useState<string>('');

  // 将RTMP URL转换为HTTP-FLV URL
  const convertRtmpToHttpFlv = (rtmpUrl: string) => {
    try {
      // 示例: rtmp://localhost:1935/live/example -> http://localhost:8000/live/example.live.flv
      const rtmpRegex = /rtmp:\/\/([^\/]+)(?:\/([^\/]+))(?:\/(.+))/;
      const match = rtmpUrl.match(rtmpRegex);
      
      if (match) {
        const host = match[1].split(':')[0]; // 获取主机名，去掉端口
        const app = match[2] || 'live';
        const streamName = match[3];

        const flv_port = 1980; // HTTP-FLV端口，默认1980
        console.log(`RTMP URL转换为HTTP-FLV URL: ${rtmpUrl} -> http://${host}:${flv_port}/${app}/${streamName}.live.flv`);
        
        return `http://${host}:${flv_port}/${app}/${streamName}.live.flv`;
      }
      
      return rtmpUrl; // 如果无法解析，返回原始URL
    } catch (error) {
      console.error('转换RTMP URL失败:', error);
      return rtmpUrl;
    }
  };

  useEffect(() => {
    // 处理源URL
    if (src_url) {
      setSrcUrl(convertRtmpToHttpFlv(src_url));
      setSrcError(false);
    }

    // 处理目标URL
    if (dst_url) {
      setDstUrl(convertRtmpToHttpFlv(dst_url));
      setDstError(false);
    }
  }, [src_url, dst_url]);

  // 监听destroy属性变化，当需要销毁组件时，清空URL
  useEffect(() => {
    if (destroy) {
      console.log('VideoPlayer组件销毁，停止视频流连接');
      setSrcUrl('');
      setDstUrl('');
    }
  }, [destroy]);

  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      setSrcUrl('');
      setDstUrl('');
    };
  }, []);

  const handleSrcError = (err: any) => {
    console.error('源视频流连接失败:', err);
    setSrcError(true);
  };

  const handleDstError = (err: any) => {
    console.error('目标视频流连接失败:', err);
    setDstError(true);
  };

  return (
    <div className="video-player-container">
      {/* 根据是否有两个URL决定布局 */}
      <div className={`${dst_url ? 'grid grid-cols-2 gap-4' : 'w-full'}`}>
        {/* 源视频播放器 */}
        {srcUrl && !destroy && (
          <div className="video-wrapper">
            <h3 className="text-sm font-medium mb-2">源视频</h3>
            {srcError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  视频流连接失败，请检查URL或网络连接
                </AlertDescription>
              </Alert>
            ) : (
              <FlvPlayer
                url={srcUrl}
                className={className}
                style={style}
                controls={controls}
                autoPlay={autoPlay}
                muted={muted}
                height={height}
                width={width}
                onError={handleSrcError}
              />
            )}
          </div>
        )}

        {/* 目标视频播放器（如果有） */}
        {dstUrl && !destroy && (
          <div className="video-wrapper">
            <h3 className="text-sm font-medium mb-2">结果视频</h3>
            {dstError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  视频流连接失败，请检查URL或网络连接
                </AlertDescription>
              </Alert>
            ) : (
              <FlvPlayer
                url={dstUrl}
                className={className}
                style={style}
                controls={controls}
                autoPlay={autoPlay}
                muted={muted}
                height={height}
                width={width}
                onError={handleDstError}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
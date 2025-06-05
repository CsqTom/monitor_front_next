'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import VideoPlayer from './video-player';

const VideoPlayerExample = () => {
  const [srcUrl, setSrcUrl] = useState<string>('rtmp://localhost:1935/live/example');
  const [dstUrl, setDstUrl] = useState<string>('rtmp://localhost:1935/live/example/result');
  const [showDst, setShowDst] = useState<boolean>(true);
  const [currentSrcUrl, setCurrentSrcUrl] = useState<string>('rtmp://localhost:1935/live/example');
  const [currentDstUrl, setCurrentDstUrl] = useState<string>('rtmp://localhost:1935/live/example/result');

  const handleApply = () => {
    setCurrentSrcUrl(srcUrl);
    setCurrentDstUrl(showDst ? dstUrl : '');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>视频播放器示例</CardTitle>
        <CardDescription>支持单/双视频流播放，自动处理连接失败情况</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="src-url">源视频URL</Label>
              <Input
                id="src-url"
                value={srcUrl}
                onChange={(e) => setSrcUrl(e.target.value)}
                placeholder="输入RTMP或HTTP-FLV视频流地址"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="dst-url">结果视频URL</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="show-dst"
                    checked={showDst}
                    onChange={() => setShowDst(!showDst)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="show-dst" className="text-sm">显示结果视频</Label>
                </div>
              </div>
              <Input
                id="dst-url"
                value={dstUrl}
                onChange={(e) => setDstUrl(e.target.value)}
                placeholder="输入RTMP或HTTP-FLV视频流地址"
                disabled={!showDst}
              />
            </div>
          </div>
          <Button onClick={handleApply}>应用</Button>
        </div>

        <div className="mt-6">
          <VideoPlayer
            src_url={currentSrcUrl}
            dst_url={showDst ? currentDstUrl : undefined}
            height="360px"
            width="100%"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoPlayerExample;
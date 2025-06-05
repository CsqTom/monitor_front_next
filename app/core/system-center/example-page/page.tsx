'use client'

import { useState } from 'react';
import { PageTransition } from '@/components/ui/page-transition';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw } from 'lucide-react';
import VideoPlayerExample from '@/components/task/video-player-example';

export default function ExamplePage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <PageTransition animationType="bounce" duration="default">
      <div className="container mx-auto py-3">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">示例页面</h1>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}/> 刷新
          </Button>
        </div>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-[400px] mb-4">
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="analytics">分析</TabsTrigger>
            <TabsTrigger value="settings">设置</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <PageTransition animationType="bounce" duration="fast">
              <Card>
                <CardHeader>
                  <CardTitle>概览信息</CardTitle>
                  <CardDescription>查看系统概览信息和关键指标</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">总项目数</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">24</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">活跃用户</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">128</div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </PageTransition>
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4">
            <PageTransition animationType="bounce" duration="fast">
              <Card>
                <CardHeader>
                  <CardTitle>数据分析</CardTitle>
                  <CardDescription>查看系统数据分析和趋势</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] flex items-center justify-center border rounded-md">
                    <p className="text-muted-foreground">图表区域</p>
                  </div>
                </CardContent>
              </Card>
            </PageTransition>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4">
            <PageTransition animationType="scale" duration="fast">
              <Card>
                <CardHeader>
                  <CardTitle>系统设置</CardTitle>
                  <CardDescription>管理系统配置和首选项</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>启用通知</span>
                      <Button variant="outline" size="sm">配置</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>数据备份</span>
                      <Button variant="outline" size="sm">设置</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>用户权限</span>
                      <Button variant="outline" size="sm">管理</Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">保存设置</Button>
                </CardFooter>
              </Card>
            </PageTransition>
          </TabsContent>
        </Tabs>
        <VideoPlayerExample />
      </div>
    </PageTransition>
  );
}
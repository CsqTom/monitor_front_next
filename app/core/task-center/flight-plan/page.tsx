'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Eye, Plus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/api_client';
import { QPagination } from '@/components/ui/pagination';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import { FlightPlanDetailSheet, FlightPlan } from './c-flight-plan-detail-sheet';
import { NewFlightPlanSheet } from './c-new-flight-plan-sheet';
import { PageTransition } from '@/components/ui/page-transition';
import { Card } from '@/components/ui/card';

// 分页数据结构
interface FlightPlanPageData {
  records: FlightPlan[];
  current: number;
  size: number;
  total: number;
  pages: number;
}

export default function Page() {
  const { toast } = useToast();
  const [pageData, setPageData] = useState<FlightPlanPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [isNewPlanSheetOpen, setIsNewPlanSheetOpen] = useState(false);
  const [selectedFlightPlan, setSelectedFlightPlan] = useState<FlightPlan | null>(null);

  // 从后端获取数据
  const fetchFlightPlans = async (pageNum: number = 1, pageSize: number = 10, showSuccess: boolean = false) => {
    setLoading(true);
    try {
      const projectId = localStorage.getItem('project_id');
      if (!projectId) {
        toast({
          title: '错误',
          description: '未找到项目ID，请先选择项目',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const data = await apiRequest<FlightPlanPageData>({
        url: '/drone/plan_page',
        method: 'GET',
        params: {
          project_id: projectId,
          page_num: pageNum,
          page_size: pageSize,
        },
      });

      setPageData(data);
      if (showSuccess) {
        toast({
          title: '成功',
          description: '刷新成功',
        });
      }
    } catch (err) {
      toast({
        title: '错误',
        description: (err as Error).message || '获取飞行计划列表失败',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 页面加载时获取数据
  useEffect(() => {
    fetchFlightPlans();
  }, []);

  // 刷新数据
  const handleRefresh = () => {
    fetchFlightPlans(pageData?.current || 1, pageData?.size || 10, true);
  };

  // 处理页码变化
  const handlePageChange = (page: number) => {
    fetchFlightPlans(page, pageData?.size || 10);
  };

  // 查看详情
  const handleViewDetail = (plan: FlightPlan) => {
    setSelectedFlightPlan(plan);
    setIsDetailSheetOpen(true);
  };

  // 格式化时间戳为可读格式
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('zh-CN');
  };

  // 格式化任务类型
  const formatTaskType = (type: string) => {
    switch (type) {
      case 'immediate':
        return '立即执行';
      case 'scheduled':
        return '定时执行';
      case 'recurring':
        return '重复执行';
      case 'continuous':
        return '连续执行';
      default:
        return type;
    }
  };

  // 格式化重复选项
  const formatRepeatOption = (repeatOption: FlightPlan['repeat_option'], repeatType: string) => {
    if (repeatType === 'nonrepeating') {
      return '不重复';
    }

    const { interval, days_of_week, days_of_month, week_of_month } = repeatOption;
    
    if (repeatType === 'daily') {
      return `每${interval}天`;
    } else if (repeatType === 'weekly' && days_of_week) {
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const days = days_of_week.map(day => weekdays[day]).join(', ');
      return `每${interval}周的${days}`;
    } else if (repeatType === 'monthly' && days_of_month) {
      return `每${interval}月的${days_of_month.join(', ')}日`;
    }
    
    return '未知';
  };

  // 格式化状态
  const formatStatus = (status: string) => {
    switch (status) {
      case 'waiting':
        return '等待中';
      case 'executing':
        return '执行中';
      case 'success':
        return '已完成';
      case 'starting_failure':
        return '失败';
      case 'terminated':
        return '被终止';
      case 'suspended':
        return '挂起';
      case 'timeout':
        return '超时';
      default:
        return status;
    }
  };

  return (
    <PageTransition animationType="scale" duration="default">
    <Card>
    <div className="container mx-auto px-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-l font-bold">飞行计划列表</h1>
        <div className="flex space-x-2">
          <Button onClick={() => setIsNewPlanSheetOpen(true)} variant="default" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            新建计划
          </Button>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="table-head-light">ID</TableHead>
              <TableHead className="table-head-light">名称</TableHead>
              <TableHead className="table-head-light">开始时间</TableHead>
              <TableHead className="table-head-light">任务类型</TableHead>
              <TableHead className="table-head-light">重复选项</TableHead>
              <TableHead className="table-head-light">状态/消息</TableHead>
              <TableHead className="table-head-light">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  加载中...
                </TableCell>
              </TableRow>
            ) : pageData && pageData.records.length > 0 ? (
              pageData.records.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="text-center">{plan.id}</TableCell>
                  <TableCell className="text-center">{plan.name}</TableCell> 
                  <TableCell className="text-center">
                    {plan.begin_at ? formatTimestamp(plan.begin_at) : '-'}
                  </TableCell>
                  <TableCell className="text-center">{formatTaskType(plan.task_type)}</TableCell>
                  <TableCell className="text-center">
                    {formatRepeatOption(plan.repeat_option, plan.repeat_type)}
                  </TableCell>
                  <TableCell className="text-center">
                    {formatStatus(plan.status) && formatStatus(plan.status).trim() ? (
                        formatStatus(plan.status).trim().length > 10 ? (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger className="truncate max-w-xs block text-center mx-auto">
                                        {`${formatStatus(plan.status).trim().substring(0,10)}...`}
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{formatStatus(plan.status).trim()}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ) : (
                            <span className="text-center block">{formatStatus(plan.status).trim()}</span>
                        )
                    ) : (
                        <div>
                            {formatStatus(plan.status) ? '运行中' : "N/A"}
                        </div>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetail(plan)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      详情
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  暂无数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pageData && pageData.total > 0 && (
          <QPagination
            current={pageData.current}
            pages={pageData.pages}
            total={pageData.total}
            pageSize={pageData.size}
            onPageChange={handlePageChange}
          />
      )}

      <FlightPlanDetailSheet
        isOpen={isDetailSheetOpen}
        onClose={() => setIsDetailSheetOpen(false)}
        flightPlan={selectedFlightPlan}
      />
      
      <NewFlightPlanSheet
        isOpen={isNewPlanSheetOpen}
        onClose={() => setIsNewPlanSheetOpen(false)}
        onSuccess={handleRefresh}
      />
    </div>
    </Card>
    </PageTransition>
  );
}

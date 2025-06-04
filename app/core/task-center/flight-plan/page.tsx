'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Eye, Plus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/api_client';
import { QPagination } from '@/components/ui/pagination';
import { FlightPlanDetailSheet, FlightPlan } from './c-flight-plan-detail-sheet';
import { NewFlightPlanSheet } from './c-new-flight-plan-sheet';

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
      case 'running':
        return '执行中';
      case 'completed':
        return '已完成';
      case 'failed':
        return '失败';
      case 'canceled':
        return '已取消';
      default:
        return status;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">飞行计划列表</h1>
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
              <TableHead className="text-center font-bold bg-gray-100">ID</TableHead>
              <TableHead className="text-center font-bold bg-gray-100">名称</TableHead>
              <TableHead className="text-center font-bold bg-gray-100">状态</TableHead>
              <TableHead className="text-center font-bold bg-gray-100">开始时间</TableHead>
              <TableHead className="text-center font-bold bg-gray-100">任务类型</TableHead>
              <TableHead className="text-center font-bold bg-gray-100">重复选项</TableHead>
              <TableHead className="text-center font-bold bg-gray-100">操作</TableHead>
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
                  <TableCell className="text-center">{formatStatus(plan.status)}</TableCell>
                  <TableCell className="text-center">
                    {plan.begin_at ? formatTimestamp(plan.begin_at) : '-'}
                  </TableCell>
                  <TableCell className="text-center">{formatTaskType(plan.task_type)}</TableCell>
                  <TableCell className="text-center">
                    {formatRepeatOption(plan.repeat_option, plan.repeat_type)}
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
        <div className="flex justify-center">
          <QPagination
            current={pageData.current}
            pages={pageData.pages}
            total={pageData.total}
            pageSize={pageData.size}
            onPageChange={handlePageChange}
          />
        </div>
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
  );
}

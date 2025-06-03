'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

// 飞行计划详情接口
export interface FlightPlan {
  id: number;
  e_project_id: number;
  e_model_type_id: number;
  e_class_code_dict: string;
  e_rule_dict: string;
  task_uuid: string;
  status: string;
  begin_at: number;
  continuous_task_period: number[][];
  end_at: number;
  min_battery_capacity: number;
  name: string;
  out_of_control_action_in_flight: string;
  recurring_task_start_time_list: number[];
  repeat_option: {
    interval: number;
    days_of_week: number[] | null;
    days_of_month: number[] | null;
    week_of_month: number[] | null;
  };
  repeat_type: string;
  resumable_status: string;
  rth_altitude: number;
  rth_mode: string;
  sn: string;
  task_type: string;
  time_zone: string;
  wayline_precision_type: string;
  wayline_uuid: string;
  landing_dock_sn: string | null;
}

interface FlightPlanDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  flightPlan: FlightPlan | null;
}

export const FlightPlanDetailSheet: React.FC<FlightPlanDetailSheetProps> = ({
  isOpen,
  onClose,
  flightPlan,
}) => {
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

  // 格式化重复类型
  const formatRepeatType = (type: string) => {
    switch (type) {
      case 'nonrepeating':
        return '不重复';
      case 'daily':
        return '每天';
      case 'weekly':
        return '每周';
      case 'monthly':
        return '每月';
      default:
        return type;
    }
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
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-xl p-6">
        <SheetHeader>
          <SheetTitle>飞行计划详情</SheetTitle>
          <SheetDescription>
            查看飞行计划的详细信息
          </SheetDescription>
        </SheetHeader>

        {!flightPlan ? (
          <div className="flex justify-center items-center h-40">
            <p>未找到飞行计划信息</p>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-lg font-bold">基本信息</Label>
              <Separator />
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">计划名称:</div>
                <div className="text-sm">{flightPlan.name}</div>
                
                <div className="text-sm font-medium">计划ID:</div>
                <div className="text-sm">{flightPlan.id}</div>
                
                <div className="text-sm font-medium">状态:</div>
                <div className="text-sm">{formatStatus(flightPlan.status)}</div>
                
                <div className="text-sm font-medium">任务类型:</div>
                <div className="text-sm">{formatTaskType(flightPlan.task_type)}</div>
                
                <div className="text-sm font-medium">重复类型:</div>
                <div className="text-sm">{formatRepeatType(flightPlan.repeat_type)}</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-lg font-bold">时间信息</Label>
              <Separator />
              <div className="grid grid-cols-2 gap-2">
                {flightPlan.begin_at > 0 && (
                  <>
                    <div className="text-sm font-medium">开始时间:</div>
                    <div className="text-sm">{formatTimestamp(flightPlan.begin_at)}</div>
                  </>
                )}
                
                {flightPlan.end_at > 0 && (
                  <>
                    <div className="text-sm font-medium">结束时间:</div>
                    <div className="text-sm">{formatTimestamp(flightPlan.end_at)}</div>
                  </>
                )}
                
                <div className="text-sm font-medium">时区:</div>
                <div className="text-sm">{flightPlan.time_zone}</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-lg font-bold">设备信息</Label>
              <Separator />
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">机场SN:</div>
                <div className="text-sm">{flightPlan.sn}</div>
                
                {flightPlan.landing_dock_sn && (
                  <>
                    <div className="text-sm font-medium">降落机场SN:</div>
                    <div className="text-sm">{flightPlan.landing_dock_sn}</div>
                  </>
                )}
                
                <div className="text-sm font-medium">航线UUID:</div>
                <div className="text-sm">{flightPlan.wayline_uuid}</div>
                
                <div className="text-sm font-medium">航线精度类型:</div>
                <div className="text-sm">{flightPlan.wayline_precision_type}</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-lg font-bold">其他设置</Label>
              <Separator />
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">返航高度:</div>
                <div className="text-sm">{flightPlan.rth_altitude} 米</div>
                
                <div className="text-sm font-medium">返航模式:</div>
                <div className="text-sm">{flightPlan.rth_mode}</div>
                
                <div className="text-sm font-medium">断点续飞:</div>
                <div className="text-sm">{flightPlan.resumable_status}</div>
                
                <div className="text-sm font-medium">最低电量:</div>
                <div className="text-sm">{flightPlan.min_battery_capacity}%</div>
                
                <div className="text-sm font-medium">信号丢失动作:</div>
                <div className="text-sm">{flightPlan.out_of_control_action_in_flight}</div>
              </div>
            </div>
          </div>
        )}

        <SheetFooter className="pt-4">
          <Button onClick={onClose}>关闭</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
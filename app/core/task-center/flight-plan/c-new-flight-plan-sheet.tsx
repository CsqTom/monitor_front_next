'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { apiRequest } from '@/lib/api_client';
import { useToast } from '@/hooks/use-toast';
import { 
  OutOfControlActionInFlight, 
  RthMode, 
  WaylinePrecisionType 
} from './new-plan-params';
import {DeviceObjectRsp, Drone, WayLineListRsp, WayLine} from "./new-plan-rsp";

// 定义接口
interface ClassCode {
  id: number;
  name: string;
  class_code: string;
  position: number;
}


interface NewFlightPlanSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// 任务类型选项
const taskTypeOptions = [
  { value: 'immediate', label: '立即执行' },
  { value: 'scheduled', label: '定时执行' },
  { value: 'recurring', label: '重复执行' },
  { value: 'continuous', label: '连续执行' },
];

// 重复类型选项
const repeatTypeOptions = [
  { value: 'nonrepeating', label: '不重复' },
  { value: 'daily', label: '每天' },
  { value: 'weekly', label: '每周' },
  { value: 'monthly', label: '每月' },
];

export function NewFlightPlanSheet({ isOpen, onClose, onSuccess }: NewFlightPlanSheetProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 表单数据
  const [name, setName] = useState('');
  const [modelTypeId, setModelTypeId] = useState<number>(1); // 默认值
  const [selectedClassCode, setSelectedClassCode] = useState<string>('building_change'); // 默认值
  const [waylineUuid, setWaylineUuid] = useState<string>('');
  const [droneSn, setDroneSn] = useState<string>('');
  const [timeZone, setTimeZone] = useState<string>('Asia/Shanghai'); // 默认值
  const [rthAltitude, setRthAltitude] = useState<number>(10); // 默认值
  
  // 新增参数
  const [taskType, setTaskType] = useState<string>('immediate'); // 默认立即执行
  const [outOfControlAction, setOutOfControlAction] = useState<string>(OutOfControlActionInFlight.ReturnHome); // 默认返航
  const [rthMode, setRthMode] = useState<string>(RthMode.Optimal); // 默认最优路径
  const [waylinePrecisionType, setWaylinePrecisionType] = useState<string>(WaylinePrecisionType.Gnss); // 默认GNSS
  const [minBatteryCapacity, setMinBatteryCapacity] = useState<number>(50); // 默认最低电量50%
  
  // 时间相关参数
  const [beginDate, setBeginDate] = useState<Date | undefined>(new Date());
  const [beginTime, setBeginTime] = useState<string>('12:00');
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [endTime, setEndTime] = useState<string>('18:00');
  
  // 重复任务参数
  const [repeatType, setRepeatType] = useState<string>('nonrepeating');
  const [repeatInterval, setRepeatInterval] = useState<number>(1);
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<number[]>([1]); // 默认周一
  const [selectedDaysOfMonth, setSelectedDaysOfMonth] = useState<number[]>([1]); // 默认每月1号
  
  // 选项数据
  const [classCodes, setClassCodes] = useState<ClassCode[]>([
    { id: 1, name: '违建', class_code: 'building_change', position: 1 },
    { id: 2, name: '林业', class_code: 'forestry_change', position: 2 }
  ]);
  const [droneList, setDroneList] = useState<Drone[]>([]);
  const [waylineList, setWaylineList] = useState<WayLine[]>([]);
  
  // 获取无人机列表
  useEffect(() => {
    if (isOpen) {
      fetchDroneList();
      fetchWaylineList();
    }
  }, [isOpen]);
  
  const fetchDroneList = async () => {
    try {
      const projectId = localStorage.getItem('project_id');
      if (!projectId) {
        toast({
          title: '错误',
          description: '未找到项目ID，请先选择项目',
          variant: 'destructive',
        });
        return;
      }
      
      // 使用API地址获取无人机设备信息
      const response = await apiRequest<DeviceObjectRsp>({
        url: '/drone/device',
        method: 'GET',
        params: { project_id: projectId },
      });
      
      if (response.list && response.list.length > 0) {
        // 从返回数据中提取无人机信息，只获取class为drone的设备
        const drones: Drone[] = response.list
          .filter(item => item.drone && item.drone.device_model && item.drone.device_model.class === 'drone')
          .map(item => item.drone);
        
        setDroneList(drones);
        if (drones.length > 0) {
          setDroneSn(drones[0].sn);
        }
      } else {
        setDroneList([]);
      }
    } catch (err) {
      console.error('获取无人机列表失败:', err);
      toast({
        title: '获取无人机列表失败',
        description: (err as Error).message || '无法连接到服务器或发生未知错误',
        variant: 'destructive',
      });
    }
  };
  
  const fetchWaylineList = async () => {
    try {
      const projectId = localStorage.getItem('project_id');
      if (!projectId) return;
      
      // 这里假设有一个获取航线列表的API
      const data:WayLineListRsp[] = await apiRequest<WayLineListRsp[]>({
        url: '/drone/way_line',
        method: 'GET',
        params: { project_id: projectId },
      });
      
      setWaylineList(data.list || []);
      if (data && data?.list?.length > 0) {
        setWaylineUuid(data.list[0].id);
      }
    } catch (err) {
      console.error('获取航线列表失败:', err);
      toast({
        title: '获取航线列表失败',
        description: (err as Error).message || '无法连接到服务器或发生未知错误',
        variant: 'destructive',
      });
    }
  };
  
  const handleSubmit = async () => {
    // 验证表单
    if (!name.trim()) {
      toast({
        title: '验证失败',
        description: '请输入计划名称',
        variant: 'destructive',
      });
      return;
    }
    
    if (!waylineUuid) {
      toast({
        title: '验证失败',
        description: '请选择航线',
        variant: 'destructive',
      });
      return;
    }
    
    if (!droneSn) {
      toast({
        title: '验证失败',
        description: '请选择无人机',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const projectId = localStorage.getItem('project_id');
      if (!projectId) {
        toast({
          title: '错误',
          description: '未找到项目ID，请先选择项目',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }
      
      // 构建基础请求数据
      let requestData: any = {
        project_id: parseInt(projectId),
        e_model_type_id: modelTypeId,
        e_class_code_dict: { model_sign: selectedClassCode },
        e_rule_dict: { file_path: "1" },
        name: name,
        wayline_uuid: waylineUuid,
        sn: droneSn,
        time_zone: timeZone,
        rth_altitude: rthAltitude,
        task_type: taskType,
        out_of_control_action_in_flight: outOfControlAction,
        rth_mode: rthMode,
        wayline_precision_type: waylinePrecisionType
      };
      
      // 根据任务类型添加特定参数
      if (taskType !== 'immediate') {
        // 计算开始时间戳（秒级）
        if (beginDate) {
          const [hours, minutes] = beginTime.split(':').map(Number);
          const beginDateTime = new Date(beginDate);
          beginDateTime.setHours(hours, minutes, 0, 0);
          requestData.begin_at = Math.floor(beginDateTime.getTime() / 1000);
        }
        
        // 对于重复和连续任务，添加结束时间
        if ((taskType === 'recurring' || taskType === 'continuous') && endDate) {
          const [endHours, endMinutes] = endTime.split(':').map(Number);
          const endDateTime = new Date(endDate);
          endDateTime.setHours(endHours, endMinutes, 0, 0);
          requestData.end_at = Math.floor(endDateTime.getTime() / 1000);
        }
      }
      
      // 添加重复任务参数
      if (taskType === 'recurring' && repeatType !== 'nonrepeating') {
        requestData.repeat_type = repeatType;
        requestData.repeat_option = {
          interval: repeatInterval,
          days_of_week: repeatType === 'weekly' ? selectedDaysOfWeek : [],
          days_of_month: repeatType === 'monthly' ? selectedDaysOfMonth : [],
          week_of_month: []
        };
      }
      
      // 添加连续任务参数
      if (taskType === 'continuous') {
        requestData.min_battery_capacity = minBatteryCapacity;
      }
      
      // 发送请求
      await apiRequest({
        url: '/drone/plan',
        method: 'POST',
        data: requestData,
      });

      console.log('requestData:', requestData);
      
      toast({
        title: '创建成功',
        description: '飞行计划已成功创建',
      });
      
      // 重置表单
      setName('');
      setModelTypeId(1);
      setSelectedClassCode('building_change');
      
      // 关闭弹窗并刷新列表
      onClose();
      onSuccess();
    } catch (err) {
      console.error('创建飞行计划失败:', err);
      toast({
        title: '创建失败',
        description: (err as Error).message || '无法连接到服务器或发生未知错误',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md w-full overflow-y-auto p-3">
        <SheetHeader>
          <SheetTitle>新建飞行计划</SheetTitle>
          <SheetDescription>
            填写以下信息以创建一个新的飞行计划。
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">* 计划名称</Label>
            <Input
              id="name"
              placeholder="请输入计划名称"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label>* 模型类型</Label>
            <Card>
              <CardContent className="pt-6">
                <RadioGroup
                  value={selectedClassCode}
                  onValueChange={setSelectedClassCode}
                  className="flex space-x-4"
                >
                  {classCodes.map((item) => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={item.class_code} id={`class-${item.id}`} />
                      <Label htmlFor={`class-${item.id}`}>{item.name}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="wayline">* 航线</Label>
            <Select value={waylineUuid} onValueChange={setWaylineUuid}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择航线" />
              </SelectTrigger>
              <SelectContent>
                {waylineList.length > 0 ? (
                  waylineList.map((wayline) => (
                    <SelectItem key={wayline.id} value={wayline.id}>
                      {wayline.name || wayline.id}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no_wayline" disabled>
                    暂无可用航线
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="drone">* 无人机</Label>
            <Select value={droneSn} onValueChange={setDroneSn}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择无人机" />
              </SelectTrigger>
              <SelectContent>
                {droneList.length > 0 ? (
                  droneList.map((drone) => (
                    <SelectItem key={drone.sn} value={drone.sn}>
                      {drone.callsign ? `${drone.device_model.name} - ${drone.callsign} (${drone.sn})` 
                      : `${drone.device_model.name} - ${drone.sn}`}
                      {!drone.device_online_status && ' [离线]'}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no_drone" disabled>
                    暂无可用无人机
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>* 任务类型</Label>
            <Tabs value={taskType} onValueChange={setTaskType} className="w-full">
              <TabsList className="grid grid-cols-4 w-full">
                {taskTypeOptions.map((option) => (
                  <TabsTrigger key={option.value} value={option.value}>
                    {option.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {/* 定时执行内容 */}
              <TabsContent value="scheduled" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>执行日期</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !beginDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {beginDate ? format(beginDate, "yyyy-MM-dd") : "选择日期"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={beginDate}
                          onSelect={setBeginDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>执行时间</Label>
                    <Input
                      type="time"
                      value={beginTime}
                      onChange={(e) => setBeginTime(e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>
              
              {/* 重复执行内容 */}
              <TabsContent value="recurring" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>开始日期</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !beginDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {beginDate ? format(beginDate, "yyyy-MM-dd") : "选择日期"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={beginDate}
                          onSelect={setBeginDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>开始时间</Label>
                    <Input
                      type="time"
                      value={beginTime}
                      onChange={(e) => setBeginTime(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>结束日期</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "yyyy-MM-dd") : "选择日期"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>结束时间</Label>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>重复类型</Label>
                  <Select value={repeatType} onValueChange={setRepeatType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="选择重复类型" />
                    </SelectTrigger>
                    <SelectContent>
                      {repeatTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {repeatType === 'weekly' && (
                  <div className="space-y-2">
                    <Label>每周重复日</Label>
                    <div className="flex flex-wrap gap-2">
                      {['周日', '周一', '周二', '周三', '周四', '周五', '周六'].map((day, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`day-${index}`} 
                            checked={selectedDaysOfWeek.includes(index)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedDaysOfWeek([...selectedDaysOfWeek, index]);
                              } else {
                                setSelectedDaysOfWeek(
                                  selectedDaysOfWeek.filter((d) => d !== index)
                                );
                              }
                            }}
                          />
                          <Label htmlFor={`day-${index}`}>{day}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {repeatType === 'monthly' && (
                  <div className="space-y-2">
                    <Label>每月重复日</Label>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <div key={day} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`month-day-${day}`} 
                            checked={selectedDaysOfMonth.includes(day)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedDaysOfMonth([...selectedDaysOfMonth, day]);
                              } else {
                                setSelectedDaysOfMonth(
                                  selectedDaysOfMonth.filter((d) => d !== day)
                                );
                              }
                            }}
                          />
                          <Label htmlFor={`month-day-${day}`}>{day}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label>重复间隔</Label>
                  <Input
                    type="number"
                    min="1"
                    value={repeatInterval}
                    onChange={(e) => setRepeatInterval(parseInt(e.target.value) || 1)}
                  />
                </div>
              </TabsContent>
              
              {/* 连续执行内容 */}
              <TabsContent value="continuous" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>开始日期</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !beginDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {beginDate ? format(beginDate, "yyyy-MM-dd") : "选择日期"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={beginDate}
                          onSelect={setBeginDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>开始时间</Label>
                    <Input
                      type="time"
                      value={beginTime}
                      onChange={(e) => setBeginTime(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>结束日期</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "yyyy-MM-dd") : "选择日期"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>结束时间</Label>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>最低电量 (%)</Label>
                  <Input
                    type="number"
                    min="50"
                    max="100"
                    value={minBatteryCapacity}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 50;
                      setMinBatteryCapacity(Math.min(Math.max(value, 50), 100));
                    }}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="rthAltitude">返航高度 (米)</Label>
            <Input
              id="rthAltitude"
              type="number"
              value={rthAltitude}
              onChange={(e) => setRthAltitude(parseInt(e.target.value) || 10)}
            />
          </div>
          
          <div className="space-y-2">
            <Label>返航模式</Label>
            <Select value={rthMode} onValueChange={setRthMode}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择返航模式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={RthMode.Optimal}>最优路径</SelectItem>
                <SelectItem value={RthMode.Preset}>预设路径</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>信号丢失动作</Label>
            <Select value={outOfControlAction} onValueChange={setOutOfControlAction}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择信号丢失动作" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={OutOfControlActionInFlight.ReturnHome}>返航</SelectItem>
                <SelectItem value={OutOfControlActionInFlight.ContinueTask}>继续任务</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>任务精度</Label>
            <Select value={waylinePrecisionType} onValueChange={setWaylinePrecisionType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择任务精度" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={WaylinePrecisionType.Gnss}>GNSS</SelectItem>
                <SelectItem value={WaylinePrecisionType.Rtk}>RTK</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <SheetFooter className="pt-4">
          <SheetClose asChild>
            <Button variant="outline">取消</Button>
          </SheetClose>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? '创建中...' : '创建计划'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
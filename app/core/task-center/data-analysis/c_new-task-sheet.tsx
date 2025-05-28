'use client';

import {useState, useEffect} from 'react';
import {Button} from '@/components/ui/button';
import {
    Sheet, SheetClose,
    SheetContent, SheetDescription, SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import {Input} from '@/components/ui/input';
import {Switch} from "@/components/ui/switch";
import {Label} from "@/components/ui/label";
import {RefreshCw} from 'lucide-react';
import {request} from '@/lib/api_user';
import {useToast} from '@/hooks/use-toast';
import {Card, CardContent} from "@/components/ui/card";

// Define interfaces here or import from a shared types file
export interface Config {
    id?: number;
    role?: number;
    name: string;
    key: string;
    value: boolean | string | number;
    type_str: string;
}

interface ApiResponse<T> {
    code: number;
    msg: string;
    data: T;
}

interface NewSheetProps {
    isNewSheetOpen: boolean;
    setIsNewSheetOpen: (isOpen: boolean) => void;
    onCreate: () => void; // Callback to refresh roles list
}

export function NewTaskSheet({isNewSheetOpen, setIsNewSheetOpen, onCreate}: NewSheetProps) {
    // 控制提交按钮的提交状态
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleCreate = async () => {

        setIsSubmitting(true);

        setIsSubmitting(false);
    };


    return (
        <Sheet open={isNewSheetOpen} onOpenChange={setIsNewSheetOpen}>
            <SheetContent className="sm:max-w-2xl w-full overflow-y-auto p-3">
                {/*说明*/}
                <SheetHeader>
                    <SheetTitle>新建数据分析任务</SheetTitle>
                    <SheetDescription>
                        填写以下信息以创建一个新任务。
                    </SheetDescription>
                </SheetHeader>

                {/*填写任务信息*/}
                <div className="px-4 pb-4">
                    <Label>
                        * 任务名称
                    </Label>
                    <Input placeholder="请输入任务名称" className="mt-2"/>
                    <div className="py-3"/>

                    <Label>
                        任务配置
                    </Label>
                    <Card className="mt-2">
                        <CardContent>
                            <Label htmlFor="password">密码</Label>
                        </CardContent>
                    </Card>
                </div>

                {/*底部*/}
                <SheetFooter>
                    <SheetClose asChild>
                        <Button type="button" variant="outline">取消</Button>
                    </SheetClose>

                    <Button type="submit" onClick={handleCreate} disabled={isSubmitting}>
                        {isSubmitting ? '创建中...' : '创建任务'}
                    </Button>
                </SheetFooter>

            </SheetContent>
        </Sheet>
    );
}
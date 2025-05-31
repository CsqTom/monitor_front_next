'use client';

import { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from '@/hooks/use-toast';
import { request } from '@/lib/api_client';

interface NewUserSheetProps {
  isNewUserSheetOpen: boolean;
  setIsNewUserSheetOpen: (isOpen: boolean) => void;
  onUserCreate: () => void;
}

interface Role {
  id: number;
  name: string;
}

interface RolesListResponse {
  code: number;
  msg: string;
  data: Role[];
}

interface CreateUserResponse {
  code: number;
  msg: string;
  data: null; // Or a user object if the API returns it
}

export function C_newUserSheet({ isNewUserSheetOpen, setIsNewUserSheetOpen, onUserCreate }: NewUserSheetProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<string | undefined>(undefined);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await request<RolesListResponse>({
          url: '/user/roles_list',
          method: 'GET',
        });
        if (response.data.code === 200 && response.data.data) {
          setRoles(response.data.data);
        } else {
          toast({ title: '错误', description: response.data.msg || '获取角色列表失败', variant: 'destructive' });
        }
      } catch (error) {
        toast({ title: '错误', description: (error as Error).message || '获取角色列表时发生错误', variant: 'destructive' });
      }
    };

    if (isNewUserSheetOpen) {
      fetchRoles();
      // Reset form fields when sheet opens
      setUsername('');
      setPassword('');
      setEmail('');
      setSelectedRoleId(undefined);
    }
  }, [isNewUserSheetOpen, toast]);

  const handleCreateUser = async () => {
    if (!username || !password || !selectedRoleId) { // Removed email from validation
      toast({ title: '提示', description: '用户名、密码和角色为必填项', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
            // 引入Base64, 用于对密码进行base64编码
      let password_baser64 = btoa(password);
      length = password_baser64.length;
      // 在password_baser64中间插入qty三个字符
      password_baser64 = password_baser64.slice(0, length/2) + 'qty' + password_baser64.slice(length/2, length);

      const response = await request<CreateUserResponse>({
        url: '/user/create_user_role',
        method: 'POST',
        data: {
          username,
          password: password_baser64,
          email,
          role_id: parseInt(selectedRoleId, 10),
        },
      });
      if (response.data.code === 200) {
        toast({ title: '成功', description: '用户创建成功' });
        onUserCreate();
        setIsNewUserSheetOpen(false);
      } else {
        toast({ title: '错误', description: response.data.msg || '创建用户失败', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: '错误', description: (error as Error).message || '创建用户时发生错误', variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  return (
    <Sheet open={isNewUserSheetOpen} onOpenChange={setIsNewUserSheetOpen}>
      <SheetContent className="sm:max-w-[525px]">
        <SheetHeader>
          <SheetTitle>新建用户</SheetTitle>
          <SheetDescription>
            填写以下信息以创建一个新用户。
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              用户名
            </Label>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              密码
            </Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              邮箱 (可选)
            </Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              角色
            </Label>
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="选择角色" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={String(role.id)}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button type="button" variant="outline">取消</Button>
          </SheetClose>
          <Button type="submit" onClick={handleCreateUser} disabled={isSubmitting}>
            {isSubmitting ? '创建中...' : '创建用户'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
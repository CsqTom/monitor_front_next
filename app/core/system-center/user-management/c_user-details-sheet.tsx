'use client';

import {useEffect, useState} from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
    SheetClose,
} from '@/components/ui/sheet';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Switch} from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {useToast} from '@/hooks/use-toast';
import {request} from '@/lib/api_user';

export interface Role {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
}

export interface UserRecord {
    id: number;
    username: string;
    email: string;
    role: Role;
    is_active: boolean;
    date_joined: string; // Assuming string format from API
    last_login: string; // Assuming string format from API
    // Add other fields as necessary from your API response
}

interface UserDetailsSheetProps {
    selectedUser: UserRecord | null;
    setSelectedUser: (user: UserRecord | null) => void;
    onUserUpdate: () => void;
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

interface UpdateUserResponse {
    code: number;
    msg: string;
    data: null; // Or a user object if the API returns it
}

export function UserDetailsSheet({selectedUser, setSelectedUser, onUserUpdate}: UserDetailsSheetProps) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState(''); // For changing password, empty means no change
    const [selectedRoleId, setSelectedRoleId] = useState<string | undefined>(undefined);
    const [isActive, setIsActive] = useState(true);
    const [roles, setRoles] = useState<Role[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const {toast} = useToast();

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
                    toast({
                        title: '错误',
                        description: response.data.msg || '获取角色列表失败',
                        variant: 'destructive'
                    });
                }
            } catch (error) {
                toast({
                    title: '错误',
                    description: (error as Error).message || '获取角色列表时发生错误',
                    variant: 'destructive'
                });
            }
        };

        if (selectedUser) {
            fetchRoles();
            setUsername(selectedUser.username);
            setEmail(selectedUser.email);
            setSelectedRoleId(String(selectedUser.role.id)); // Corrected: use selectedUser.role.id
            setIsActive(selectedUser.is_active);
            setPassword(''); // Clear password field on open
        }
    }, [selectedUser, toast]);

    const handleSaveChanges = async () => {
        if (!selectedUser) return;
        if (!username || !selectedRoleId) {
            toast({title: '提示', description: '用户名和角色为必填项', variant: 'destructive'});
            return;
        }
        setIsSubmitting(true);

        const payload: any = {
            user_id: selectedUser.id,
            username,
            email,
            role_id: parseInt(selectedRoleId, 10),
            is_active: isActive,
        };

        if (password) {
            payload.password = password;
        }

        try {
            // 引入Base64, 用于对密码进行base64编码
            let password_baser64 = btoa(password);
            length = password_baser64.length;
            // 在password_baser64中间插入qty三个字符
            password_baser64 = password_baser64.slice(0, length / 2) + 'qty' + password_baser64.slice(length / 2, length);
            payload.password = password_baser64;

            const response = await request<UpdateUserResponse>({
                url: '/user/update_user_role',
                method: 'POST',
                data: payload,
            });
            if (response.data.code === 200) {
                toast({title: '成功', description: '用户信息更新成功'});
                onUserUpdate();
                setSelectedUser(null); // Close the sheet
            } else {
                toast({title: '错误', description: response.data.msg || '更新用户信息失败', variant: 'destructive'});
            }
        } catch (error) {
            toast({
                title: '错误',
                description: (error as Error).message || '更新用户信息时发生错误',
                variant: 'destructive'
            });
        }
        setIsSubmitting(false);
    };

    if (!selectedUser) return null;

    return (
        <Sheet open={!!selectedUser} onOpenChange={(isOpen) => !isOpen && setSelectedUser(null)}>
            <SheetContent className="sm:max-w-[525px]">
                <SheetHeader>
                    <SheetTitle>编辑用户: {selectedUser.username}</SheetTitle>
                    <SheetDescription>
                        修改用户信息并保存。
                    </SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="username-edit" className="text-right">
                            用户名
                        </Label>
                        <Input id="username-edit" value={username} onChange={(e) => setUsername(e.target.value)}
                               className="col-span-3"/>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email-edit" className="text-right">
                            邮箱
                        </Label>
                        <Input id="email-edit" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                               className="col-span-3"/>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password-edit" className="text-right">
                            新密码
                        </Label>
                        <Input id="password-edit" type="password" value={password}
                               onChange={(e) => setPassword(e.target.value)} placeholder="留空则不修改"
                               className="col-span-3"/>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">
                            当前角色
                        </Label>
                        <div className="col-span-3 text-sm py-2">
                            {selectedUser.role.name || 'N/A'}
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role-edit" className="text-right">
                            修改角色
                        </Label>
                        <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="选择角色"/>
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
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status-edit" className="text-right">
                            状态 (启用)
                        </Label>
                        <Switch id="status-edit" checked={isActive} onCheckedChange={setIsActive}
                                className="col-span-3"/>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="last-login-display" className="text-right">
                            上次登录
                        </Label>
                        <div id="last-login-display" className="col-span-3">
                            {selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString() : "未登陆"}
                        </div>
                    </div>
                </div>
                <SheetFooter>
                    <SheetClose asChild>
                        <Button type="button" variant="outline" onClick={() => setSelectedUser(null)}>取消</Button>
                    </SheetClose>
                    <Button type="submit" onClick={handleSaveChanges} disabled={isSubmitting}>
                        {isSubmitting ? '保存中...' : '保存更改'}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
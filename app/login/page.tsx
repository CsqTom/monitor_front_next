'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast'; // Assuming you have a toast hook
import { setTokenData } from '@/lib/api_client';
import { userApi } from '@/lib/api_user';
import WaveBg from '@/components/wave-bg';

interface LoginResponseData {
  id: number;
  access_token: string;
  refresh_token: string;
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      // 引入Base64, 用于对密码进行base64编码
      let password_baser64 = btoa(password);
      length = password_baser64.length;
      // 在password_baser64中间插入qty三个字符
      password_baser64 = password_baser64.slice(0, length/2) + 'qty' + password_baser64.slice(length/2, length);

      const loginData = await userApi.login({
        username,
        password: password_baser64
      });

      console.log('Login response:', loginData);

      setTokenData(loginData.access_token, loginData.refresh_token);
      // Store user_id in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_id', loginData.user_info.id.toString());
      }
      toast({
        title: '登录成功',
        description: '即将跳转到主页面...',
      });
      router.push('/core');
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: '登录出错',
        description: (error as Error).message || '网络请求失败，请稍后再试',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background overflow-hidden">
      {/* 波浪背景 - 仅在浅色主题下显示 */}
      <div className="absolute inset-0 dark:hidden">
        <WaveBg themeColor="#3b82f6" />
      </div>
      
      <Card className="relative z-10 w-full max-w-sm ">
        <CardHeader>
          <CardTitle className="text-2xl">登录</CardTitle>
          <CardDescription>
            请输入您的凭据以访问您的帐户。
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                type="text"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full mt-4" disabled={isLoading}>
              {isLoading ? '登录中...' : '登录'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}


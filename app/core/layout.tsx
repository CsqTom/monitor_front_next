'use client'

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ThemeProvider } from "@/components/theme-provider";
import { SecondaryNavBar, NavItem } from '@/app/core/c-secondary-nav-bar';
import { getTokenData, clearTokenData } from '@/lib/api_client'; 
import { Button } from '@/components/ui/button'; 
import { LogOut, ChevronRight } from 'lucide-react'; 
import { navigationLinks } from '@/app/core/c-secondary-nav-bar'; 
import { HeaderThemeToggle } from '@/components/header-theme-toggle'; // 导入顶部导航栏主题切换组件

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);

  useEffect(() => {
    const { accessToken } = getTokenData();
    if (!accessToken) {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    const pathSegments = pathname.split('/').filter(Boolean); // e.g., ['core', 'system-center', 'user-management']
    const newBreadcrumbs: string[] = [];

    if (pathSegments.length >= 2 && pathSegments[0] === 'core') {
      const groupSlug = pathSegments[1]; // e.g., 'system-center'
      const itemSlug = pathSegments.length > 2 ? pathSegments[2] : undefined;   // e.g., 'user-management'

      // Find the group by checking if any item's href within that group contains the groupSlug
      const currentGroup = navigationLinks.find(group => 
        group.items.some(item => item.href.includes(`/${groupSlug}/`))
      );

      if (currentGroup) {
        newBreadcrumbs.push(currentGroup.group); // First breadcrumb: Group Name

        if (itemSlug) {
          // Find the item within that group whose href ends with the itemSlug
          const currentItem = currentGroup.items.find(item => item.href.endsWith(`/${itemSlug}`));
          if (currentItem) {
            newBreadcrumbs.push(currentItem.name); // Second breadcrumb: Item Name
          }
        }
      }
    }
    setBreadcrumbs(newBreadcrumbs);
  }, [pathname]);
  
  const handleLogout = () => {
    clearTokenData();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_id');
    }
    router.push('/login');
  };

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="flex h-screen">
        <SecondaryNavBar />
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* TopNavBar */}
          <header className="flex h-14 items-center justify-between border-b bg-background px-4 sm:px-6 shrink-0">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              {breadcrumbs.map((crumb, index) => (
                <span key={index} className="flex items-center">
                  {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
                  {crumb}
                </span>
              ))}
            </div>
            <div className="flex items-center space-x-3">
              <HeaderThemeToggle />
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                退出登录
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-background">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}

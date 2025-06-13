'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils'; // Assuming you have a cn utility for classnames
import { apiRequest } from '@/lib/api_client';
import { fetchUserRole, extractAllowedKeys, UserRoleData, RoleConfig } from '@/lib/api_role';
import { RefreshCw, AlignJustify } from 'lucide-react';

interface ProjectInfo {
  id: number;
  name: string;
  logo_path: string;
  is_delete: boolean;
  longitude: number;
  latitude: number;
  altitude: number;
}



// 这里需在与app目录下的的路由相一致
export interface NavItem {
  name: string;
  href: string;
  key?: string; // 权限key，用于匹配后端返回的权限配置
  subItems?: NavItem[]; // For nested navigation
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

export const navigationLinks: NavGroup[] = [
  {
    group: '运维中心',
    items: [
      { name: '项目管理', href: '/core/opt-center/project-info', key: 'project_mgt' },
    ],
  },
  {
    group: '任务中心',
    items: [
      { name: '数据分析', href: '/core/task-center/data-analysis', key: 'data-analysis' },
      { name: '飞行计划', href: '/core/task-center/flight-plan', key: 'flight_plan' },
      { name: '飞行任务', href: '/core/task-center/flight-task', key: 'flight_task' },
    ],
  },
  {
    group: '系统中心',
    items: [
      { name: 'api管理', href: '/core/system-center/api-mgt', key: 'ai_api_config' },
      { name: '角色管理', href: '/core/system-center/role-mgt', key: 'role_config' },
      { name: '用户管理', href: '/core/system-center/user-mgt', key: 'user_mgt' },
      { name: '项目&用户', href: '/core/system-center/project&user', key: 'project&user' },
      { name: '样式示例', href: '/core/system-center/example-page', key: 'ai_api_config' },
    ],
  },
];

// export function SecondaryNavBar() { // Keep the original export if NavItem is not used by it directly
// Let's check if NavItem is used by SecondaryNavBar. It's not. So we can keep the original export.
// The NavItem and navigationLinks are for the layout breadcrumbs.

// 创建一个全局状态来管理项目信息更新
let projectInfoUpdateCallbacks: (() => void)[] = [];

export const triggerProjectInfoUpdate = () => {
  projectInfoUpdateCallbacks.forEach(callback => callback());
};

export function SecondaryNavBar() {
  const pathname = usePathname();
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRoleData | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [allowedMenuKeys, setAllowedMenuKeys] = useState<Set<string>>(new Set());

  const fetchProjectInfo = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        console.warn('User ID not found in localStorage');
        return;
      }
      
      const data = await apiRequest<ProjectInfo>({
        url: `/user/get_default_project?user_id=${userId}`,
        method: 'GET'
      });
      
      setProjectInfo(data);
      localStorage.setItem('project_id', data.id.toString());
    } catch (error) {
      console.error('Failed to fetch project info:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRoleData = async () => {
    try {
      setRoleLoading(true);
      const data = await fetchUserRole();
      setUserRole(data);
      
      // 提取允许的菜单权限keys
      const allowedKeys = extractAllowedKeys(data, 'menu');
      setAllowedMenuKeys(allowedKeys);
      
    } catch (error) {
      console.error('Failed to fetch user role:', error);
    } finally {
      setRoleLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectInfo();
    fetchUserRoleData();
    
    // 注册更新回调, 更新用户当前项目信息，显示在左上角
    projectInfoUpdateCallbacks.push(fetchProjectInfo);
    
    // 清理函数
    return () => {
      projectInfoUpdateCallbacks = projectInfoUpdateCallbacks.filter(cb => cb !== fetchProjectInfo);
    };
  }, []);

  // 根据权限过滤导航菜单
  const getFilteredNavigationLinks = (): NavGroup[] => {
    return navigationLinks.map(group => ({
      ...group,
      items: group.items.filter(item => {
        // 如果没有设置key，则默认显示
        if (!item.key) return true;
        // 检查用户是否有该菜单的权限
        return allowedMenuKeys.has(item.key);
      })
    })).filter(group => group.items.length > 0); // 过滤掉没有子项的分组
  };

  const isHttpUrl = (url: string) => {
    return url.startsWith('http://') || url.startsWith('https://');
  };

  return (
    <nav className="w-55 flex-shrink-0 border-r bg-background dark:bg-sidebar p-4 space-y-4">
      {/* 项目信息显示区域 */}
      <div className="border-b pb-4 mb-4">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <AlignJustify className="animate-spin h-4 w-4 mr-2" />
            <span className="text-sm text-muted-foreground">加载中...</span>
          </div>
        ) : projectInfo ? (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              {projectInfo.logo_path && isHttpUrl(projectInfo.logo_path) && (
                <img 
                  src={projectInfo.logo_path} 
                  alt="项目Logo" 
                  className="w-8 h-8 rounded object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <div>
                <h2 className="font-semibold text-l truncate text-primary" title={projectInfo.name}>
                  {projectInfo.name}
                </h2>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">未找到项目信息</p>
          </div>
        )}
      </div>
      
      {/* 权限控制的导航菜单 */}
      {roleLoading ? (
        <div className="flex items-center justify-center py-4">
          <RefreshCw className="animate-spin h-4 w-4 mr-2" />
          <span className="text-sm text-muted-foreground">加载菜单权限...</span>
        </div>
      ) : (
        getFilteredNavigationLinks().map((group) => (
          <div key={group.group}>
            <h2 className="mb-2 text-sm tracking-tight text-primary">
              <div className='flex pl-4'>
                <AlignJustify className='w-4 h-4 mr-2'  />
                {group.group}
              </div>
            </h2>
            <div className="space-y-1 mb-2">
              {group.items.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex pl-8 rounded-md py-2 text-sm font-medium',
                    pathname === item.href 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <AlignJustify className='w-4 h-4 mr-2'  />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        ))
      )}
    </nav>
  );
}
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils'; // Assuming you have a cn utility for classnames
import { apiRequest } from '@/lib/api_client';
import { RefreshCw } from 'lucide-react';

interface ProjectInfo {
  id: number;
  name: string;
  logo_path: string;
  is_delete: boolean;
  longitude: number;
  latitude: number;
  altitude: number;
}

interface RoleConfig {
  id: number;
  role: number;
  name: string;
  key: string;
  value: boolean;
  type_str: string;
}

interface UserRoleData {
  user: {
    id: number;
    username: string;
    email: string;
    date_joined: string;
    last_login: string;
    is_active: boolean;
  };
  role_id: number;
  role_name: string;
  configs: RoleConfig[];
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
      { name: 'api管理', href: '/core/opt-center/api-mgt', key: 'opt-ai_api_config' },
      { name: '项目管理', href: '/core/opt-center/project-info', key: 'opt-project_info' },
    ],
  },
  {
    group: '任务中心',
    items: [
      { name: '数据分析', href: '/core/task-center/data-analysis', key: 'task-data-analysis' },
      { name: '飞行计划', href: '/core/task-center/flight-plan', key: 'task-flight_plan' },
      { name: '飞行任务', href: '/core/task-center/flight-task', key: 'task-flight_task' },
    ],
  },
  {
    group: '用户中心',
    items: [
      { name: '角色管理', href: '/core/system-center/role-mgt', key: 'sys-role_config' },
      { name: '用户管理', href: '/core/system-center/user-mgt', key: 'sys-user_mgt' },
      { name: '项目&用户', href: '/core/system-center/project-mgt', key: 'sys-project_mgt' },
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

  const fetchUserRole = async () => {
    try {
      setRoleLoading(true);
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        console.warn('User ID not found in localStorage');
        return;
      }
      
      const data: UserRoleData = await apiRequest<{ data: UserRoleData }>({
        url: `/user/role?user_id=${userId}`,
        method: 'GET'
      });
      
      setUserRole(data);

      // 提取允许的菜单权限keys
      const allowedKeys = new Set<string>();
      data.configs.forEach(config => {
        if (config.type_str === 'menu' && config.value) {
          allowedKeys.add(config.key);
        }
      });
      setAllowedMenuKeys(allowedKeys);
      
    } catch (error) {
      console.error('Failed to fetch user role:', error);
    } finally {
      setRoleLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectInfo();
    fetchUserRole();
    
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
    <nav className="w-64 flex-shrink-0 border-r bg-background p-4 space-y-4">
      {/* 项目信息显示区域 */}
      <div className="border-b pb-4 mb-4">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="animate-spin h-4 w-4 mr-2" />
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
                <h2  className="font-semibold text-l truncate" title={projectInfo.name}>
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
            <h2 className="mb-2 text-lg font-semibold tracking-tight text-muted-foreground">
              {group.group}
            </h2>
            <div className="space-y-1">
              {group.items.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
                    pathname === item.href ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                  )}
                >
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
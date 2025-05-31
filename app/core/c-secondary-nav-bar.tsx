'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils'; // Assuming you have a cn utility for classnames

// 这里需在与app目录下的的路由相一致
export interface NavItem {
  name: string;
  href: string;
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
      { name: 'Api管理', href: '/core/opt-center/api-mgt' },
      { name: '项目管理', href: '/core/opt-center/project-info' },
    ],
  },
  {
    group: '任务中心',
    items: [
      { name: '数据分析', href: '/core/task-center/data-analysis' },
      { name: '飞行计划', href: '/core/task-center/flight-result' },
      { name: '飞行任务', href: '/core/task-center/flight-task' },
    ],
  },
  {
    group: '系统中心',
    items: [
      { name: '角色管理', href: '/core/system-center/role-mgt' },
      { name: '用户管理', href: '/core/system-center/user-mgt' },
      { name: '项目管理', href: '/core/system-center/project-mgt' },
    ],
  },
];

// export function SecondaryNavBar() { // Keep the original export if NavItem is not used by it directly
// Let's check if NavItem is used by SecondaryNavBar. It's not. So we can keep the original export.
// The NavItem and navigationLinks are for the layout breadcrumbs.

export function SecondaryNavBar() {
  const pathname = usePathname();

  return (
    <nav className="w-64 flex-shrink-0 border-r bg-background p-4 space-y-4">
      {navigationLinks.map((group) => (
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
      ))}
    </nav>
  );
}
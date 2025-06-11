import { apiRequest } from './api_client';

export interface RoleConfig {
  id: number;
  role: number;
  name: string;
  key: string;
  value: boolean;
  type_str: string;
}

export interface UserRoleData {
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

/**
 * 获取用户角色权限数据
 * @returns Promise<UserRoleData>
 */
export const fetchUserRole = async (): Promise<UserRoleData> => {
  const userId = localStorage.getItem('user_id');
  if (!userId) {
    throw new Error('User ID not found in localStorage');
  }
  
  const data = await apiRequest<UserRoleData>({
    url: `/user/role?user_id=${userId}`,
    method: 'GET'
  });
  
  return data;
};

/**
 * 从用户角色数据中提取指定类型的权限keys
 * @param roleData 用户角色数据
 * @param type 权限类型 ('menu' | 'button')
 * @returns Set<string> 允许的权限keys集合
 */
export const extractAllowedKeys = (roleData: UserRoleData, type: 'menu' | 'button' | 'function'): Set<string> => {
  const allowedKeys = new Set<string>();
  roleData.configs.forEach(config => {
    if (config.type_str === type && config.value) {
      allowedKeys.add(config.key);
    }
  });
  return allowedKeys;
};

/**
 * 获取用户菜单权限keys
 * @returns Promise<Set<string>>
 */
export const getUserMenuKeys = async (): Promise<Set<string>> => {
  try {
    const roleData = await fetchUserRole();
    return extractAllowedKeys(roleData, 'menu');
  } catch (error) {
    console.error('Failed to fetch user menu keys:', error);
    return new Set<string>();
  }
};

/**
 * 获取用户按钮权限keys
 * @returns Promise<Set<string>>
 */
export const getUserButtonKeys = async (): Promise<Set<string>> => {
  try {
    const roleData = await fetchUserRole();
    return extractAllowedKeys(roleData, 'button');
  } catch (error) {
    console.error('Failed to fetch user button keys:', error);
    return new Set<string>();
  }
};

/**
 * 检查用户是否有指定的权限
 * @param key 权限key
 * @param type 权限类型 ('menu' | 'button')
 * @returns Promise<boolean>
 */
export const hasPermission = async (key: string, type: 'menu' | 'button' | 'function'): Promise<boolean> => {
  try {
    const roleData = await fetchUserRole();
    const allowedKeys = extractAllowedKeys(roleData, type);
    return allowedKeys.has(key);
  } catch (error) {
    console.error('Failed to check permission:', error);
    return false;
  }
};
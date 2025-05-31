# Tauri + Nextjs + shadcn/ui

### shadcn/ui

运行初始化命令

```shell
pnpm dlx shadcn@latest init
```

问题是一些风格的选择，默认即可。

shadcn/ui 与其他常规的组件库安装组件的方式不同，每个组件都是独立安装的，所以就可以独立的去维护。

```shell
pnpm dlx shadcn@latest add button
```

#### 初始加载时的中间件
使用getTokenData()获取token信息，判断是否登录，如果未登录则跳转到登录页面。

## API 客户端使用说明

项目中的 `lib/api_client.ts` 提供了两种API调用范式，适用于不同的使用场景。

### 1. 直接使用 `request` 函数

适用于需要完整控制HTTP响应的场景，返回完整的API响应对象。

```typescript
import { request, type ApiResponse } from '@/lib/api_client';

// 示例：获取用户列表
const getUserList = async () => {
  try {
    const response: ApiResponse<User[]> = await request({
      url: '/user/list',
      method: 'GET',
      params: { page: 1, size: 10 }
    });
    
    if (response.code === 200) {
      console.log('用户列表:', response.data);
      console.log('总数:', response.total);
    } else {
      console.error('请求失败:', response.msg);
    }
  } catch (error) {
    console.error('网络错误:', error);
  }
};
```

### 2. 使用 `apiRequest` 函数（推荐）

适用于大多数业务场景，自动处理错误并直接返回业务数据，代码更简洁。

```typescript
import { apiRequest } from '@/lib/api_client';

// 示例：创建用户
const createUser = async (userData: CreateUserRequest) => {
  try {
    // 直接返回业务数据，无需检查 code 和 data
    const newUser = await apiRequest<User>({
      url: '/user/create',
      method: 'POST',
      data: userData
    });
    
    console.log('创建成功:', newUser);
    return newUser;
  } catch (error) {
    // 错误已经被自动处理并抛出
    console.error('创建失败:', error.message);
    throw error;
  }
};
```

### 使用建议

- **推荐使用 `apiRequest`**：适用于90%的业务场景，代码更简洁，错误处理更统一
- **使用 `request`**：当需要访问完整响应信息（如分页信息、状态码等）时使用

### Token 管理

```typescript
import { getTokenData, setTokenData, clearTokenData } from '@/lib/api_client';

// 获取token信息
const tokenData = getTokenData();

// 设置token信息
setTokenData({
  access_token: 'your_access_token',
  refresh_token: 'your_refresh_token'
});

// 清除token信息
clearTokenData();
```


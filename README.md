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
```
middleware.ts 进行登录验证
```
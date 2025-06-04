运行: pnpm
技术栈：tauri + nextjs + shadcn/ui 
ui组件在可以的情况下都使用shadcn/ui, icon使用lucide-react 
文件名用小写,多单启用-连接;组件function用大驼峰;变量用小写。
本前端地址： localhost:3456
Table的页面：<TableHead className="table-head-light">，, <TableCell className="table-cell-center"> 。
table的跳页统一改为QPagination组件。
core文件夹下，各个模块的功能模块都放在各自的文件夹下. pages.tsx同级c-开头为当前页的业务组件，即无法做到复用的业务组件放在core文件夹下。
提到地址:61301端口的都指http://localhost:61301，使用lib/api_client.ts的apiRequest或request调用后端接口。
子页面优先使用sheet组件，sheet组件下如果再子交互界面才使用dialog组件。
新的dialog组件都要动态设置dialog的大小，以下是参考代码：
```
const updateSize = () => {
      const newWidth = window.innerWidth * 0.9;
      const newHeight = window.innerHeight * 0.9;
      setDialogSize({ width: `${newWidth}px`, height: `${newHeight}px` });
    };

    if (isOpen) {
      updateSize();
      window.addEventListener('resize', updateSize);
      ...
    }
```    
提示窗Toast使用：import { useToast } from '@/hooks/use-toast';
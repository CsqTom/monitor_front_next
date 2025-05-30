"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface PaginationProps {
  /** 当前页码 */
  current: number
  /** 总页数 */
  pages: number
  /** 总记录数 */
  total: number
  /** 页面大小 */
  pageSize?: number
  /** 页码变化回调 */
  onPageChange: (page: number) => void
  /** 自定义类名 */
  className?: string
}

export function QPagination({
  current,
  pages,
  total,
  pageSize = 10,
  onPageChange,
  className,
}: PaginationProps) {
  const [inputPage, setInputPage] = React.useState<string>(current.toString())

  React.useEffect(() => {
    setInputPage(current.toString())
  }, [current])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputPage(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const page = parseInt(inputPage)
      if (!isNaN(page) && page >= 1 && page <= pages) {
        onPageChange(page)
      } else {
        setInputPage(current.toString())
      }
    }
  }

  const handlePrevious = () => {
    if (current > 1) {
      onPageChange(current - 1)
    }
  }

  const handleNext = () => {
    if (current < pages) {
      onPageChange(current + 1)
    }
  }

  // 生成页码数组
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5; // 最多显示的页码数
    
    // 始终显示第一页
    pageNumbers.push(1);
    
    if (pages <= maxPagesToShow) {
      // 如果总页数较少，全部显示
      for (let i = 2; i <= pages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // 复杂情况，需要显示省略号
      const leftSide = Math.floor(maxPagesToShow / 2);
      const rightSide = maxPagesToShow - leftSide - 1;
      
      // 当前页靠近开始
      if (current <= leftSide + 1) {
        for (let i = 2; i <= maxPagesToShow - 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(pages);
      }
      // 当前页靠近结束
      else if (current >= pages - rightSide) {
        pageNumbers.push('...');
        for (let i = pages - maxPagesToShow + 2; i < pages; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push(pages);
      }
      // 当前页在中间
      else {
        pageNumbers.push('...');
        for (let i = current - 1; i <= current + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(pages);
      }
    }
    
    return pageNumbers;
  };

  return (
    <div className={cn("flex items-center justify-between space-x-2 py-4", className)}>
      <div className="text-sm text-muted-foreground">
        共 {total} 条记录
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={current <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        {getPageNumbers().map((pageNumber, index) => (
          <React.Fragment key={index}>
            {pageNumber === '...' ? (
              <span className="px-2">...</span>
            ) : (
              <Button
                variant={current === pageNumber ? "default" : "outline"}
                size="sm"
                onClick={() => typeof pageNumber === 'number' && onPageChange(pageNumber)}
                className={cn(
                  "min-w-[32px]",
                  current === pageNumber && "bg-primary text-primary-foreground"
                )}
              >
                {pageNumber}
              </Button>
            )}
          </React.Fragment>
        ))}
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={current >= pages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
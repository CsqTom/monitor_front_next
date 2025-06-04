'use client'

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  animationType?: 'bounce' | 'bounce-inside-out' | 'scale' | 'fade' | 'slide';
  duration?: 'default' | 'fast';
}

export function PageTransition({
  children,
  className,
  animationType = 'bounce',
  duration = 'default',
}: PageTransitionProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 组件挂载后添加动画
    setIsVisible(true);

    // 组件卸载前的清理
    return () => {
      setIsVisible(false);
    };
  }, []);

  // 根据动画类型和持续时间选择合适的类名
  const getAnimationClass = () => {
    if (animationType === 'bounce') {
      return duration === 'fast' ? 'animate-bounce-in-fast' : 'animate-bounce-in';
    } else if (animationType === 'bounce-inside-out') {
      return duration === 'fast' ? 'animate-bounce-in-inside-out-fast' : 'animate-bounce-in-inside-out';
    } else if (animationType === 'scale') {
      return duration === 'fast' ? 'animate-scale-in-fast' : 'animate-scale-in';
    } else if (animationType === 'fade') {
      return 'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0';
    } else if (animationType === 'slide') {
      return 'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-top';
    }
    return 'animate-bounce-in';
  };

  return (
    <div
      className={cn(
        getAnimationClass(),
        isVisible ? 'opacity-100' : 'opacity-0',
        className
      )}
      data-state={isVisible ? 'open' : 'closed'}
    >
      {children}
    </div>
  );
}
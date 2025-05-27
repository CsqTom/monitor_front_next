import { NextIntlClientProvider, AbstractIntlMessages } from 'next-intl'; // Import AbstractIntlMessages
import { useEffect, useState } from 'react';
// import {locals} // This line seems to be an incomplete import, removing it.

// 加载语言文件
// async function loadMessages(locale: string): Promise<AbstractIntlMessages> { // Specify return type
//   try {
//     return (await import(`../../../messages/${locale}.json`)).default;
//   } catch (error) {
//     console.error(`Failed to load messages for locale: ${locale}`, error);
//     // 如果加载失败，返回中文作为后备
//     return (await import(`../../messages/zh.json`)).default;
//   }
// }

export function NextIntlProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<AbstractIntlMessages | null>(null); // Use AbstractIntlMessages
  const [currentLocale, setCurrentLocale] = useState<string>('zh'); // Renamed from locale to currentLocale to avoid conflict

  useEffect(() => {
    // 从 localStorage 获取语言设置
    const savedLocale = localStorage.getItem('app-language') || 'zh';
    setCurrentLocale(savedLocale); // Use setCurrentLocale
    
    // 加载对应的语言文件
    // loadMessages(savedLocale).then(setMessages);
  }, []);

  // 等待消息加载完成
  if (!messages) {
    return null;
  }

  return (
    <NextIntlClientProvider locale={currentLocale} messages={messages}> {/* Use currentLocale here */}
      {children}
    </NextIntlClientProvider>
  );
}

'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeProvider } from "@/components/theme-provider";
import { SecondaryNavBar } from '@/components/navigation/SecondaryNavBar';
import { getTokenData } from '@/lib/api_user'; // 引入 getTokenData

// import useSettingStore from "@/stores/setting"
// import { initChatsDb } from "@/db/chats"
// import dayjs from "dayjs"
// import zh from "dayjs/locale/zh-cn";
// import en from "dayjs/locale/en";
// import { useI18n } from "@/hooks/useI18n"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  // const { initSettingData } = useSettingStore()
  // const { currentLocale } = useI18n()
  useEffect(() => {
    // initSettingData()
    // initChatsDb()
    const { accessToken } = getTokenData();
    if (!accessToken) {
      router.push('/login');
    }
  }, [router]);

  // useEffect(() => {
  //   switch (currentLocale) {
  //     case 'zh':
  //       dayjs.locale(zh);
  //       break;
  //     case 'en':
  //       dayjs.locale(en);
  //       break;
  //     default:
  //       break;
  //   }
  // }, [currentLocale])

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="flex h-screen flex-col">
        {/* Placeholder for TopNavBar */}
        <div className="flex flex-1 overflow-hidden">
          <SecondaryNavBar />
          <main className="flex-1 overflow-y-auto p-4">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}

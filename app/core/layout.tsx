'use client'

import { ThemeProvider } from "@/components/theme-provider";
import { SecondaryNavBar } from '@/components/navigation/SecondaryNavBar';

// import useSettingStore from "@/stores/setting"
// import { useEffect } from "react";
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
  // const { initSettingData } = useSettingStore()
  // const { currentLocale } = useI18n()
  // useEffect(() => {
  //   initSettingData()
  //   initChatsDb()
  // }, [])

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

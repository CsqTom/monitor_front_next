'use client'

import { ThemeProvider } from "@/components/theme-provider"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
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
      <div>
        {children}
      </div>
      {/* <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <main className="flex flex-1 flex-col overflow-hidden w-[calc(100vw-48px)]">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider> */}
    </ThemeProvider>
  );
}

'use client'
// import { Store } from '@tauri-apps/plugin-store'
import { redirect } from 'next/navigation'
import { useEffect } from 'react'
import {getTokenData} from "@/lib/api_user";


export default function Home() {
  useEffect(() => {
    const tokenData = getTokenData();
    if (tokenData && tokenData.accessToken) {
      redirect('/core/task-center/data-analysis');
    } else {
      redirect('/login');
    }
  }, []);
}
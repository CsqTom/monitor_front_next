'use client'
// import { Store } from '@tauri-apps/plugin-store'
import { redirect } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  async function init() { 
    redirect('/core/opt-center/record')
  }
  useEffect(() => {
    init()
  }, [])
}
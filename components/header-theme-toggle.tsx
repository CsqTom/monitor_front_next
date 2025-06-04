"use client"

import * as React from "react"
import { Moon, Sun, SunMoon } from "lucide-react"
import { useTheme } from "next-themes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button";

export function HeaderThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = React.useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-md"
        >
          <ThemeIcon theme={theme} />
          <span className="sr-only">主题</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="animate-fade-in">
        <DropdownMenuItem 
          onClick={() => setTheme("light")} 
          className="flex items-center gap-2 transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20"
        >
          <Sun className="h-4 w-4 text-blue-500 animate-pulse-glow" />
          <span>浅色</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")} 
          className="flex items-center gap-2 transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
        >
          <Moon className="h-4 w-4 text-indigo-400 animate-pulse-glow" />
          <span>深色</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("system")} 
          className="flex items-center gap-2 transition-colors hover:bg-purple-50 dark:hover:bg-purple-900/20"
        >
          <SunMoon className="h-4 w-4 text-purple-500 animate-pulse-glow" />
          <span>系统</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ThemeIcon({ theme }: { theme?: string }) {
  switch (theme) {
    case "light":
      return <Sun className="h-4 w-4 text-blue-500 transition-all duration-300" />
    case "dark":
      return <Moon className="h-4 w-4 text-indigo-400 transition-all duration-300" />
    case "system":
      return <SunMoon className="h-4 w-4 text-purple-500 transition-all duration-300" />
    default:
      return <SunMoon className="h-4 w-4 text-purple-500 transition-all duration-300" />
  }
}
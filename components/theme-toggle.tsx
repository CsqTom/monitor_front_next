"use client"

import * as React from "react"
import { Moon, Sun, SunMoon } from "lucide-react"
import { useTheme } from "next-themes"
import { useTranslations } from 'next-intl'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

export function ModeToggle() {
  const t = useTranslations();
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = React.useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton asChild className="md:h-8 md:p-0"  
          tooltip={{
            children: t('common.theme'),
            hidden: false,
          }}
        >
          <a href="#">
            <div className="flex size-8 items-center justify-center rounded-lg">
              <Button
                variant="ghost"
                size="sm"
                className="relative overflow-hidden transition-all duration-500 hover:bg-primary/10 dark:hover:bg-primary/20"
              >
                <div className="absolute inset-0 opacity-20 dark:opacity-40 bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0 animate-scan-line"></div>
                <span className="relative z-10 transition-transform duration-500 hover:rotate-45">
                  <ThemeIcon theme={theme} />
                </span>
              </Button>
            </div>
          </a>
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="right" className="animate-in fade-in-50 zoom-in-95 duration-200">
        <DropdownMenuItem 
          onClick={() => setTheme("light")} 
          className="group transition-all duration-300"
        >
          <Sun className="mr-2 h-4 w-4 transition-all duration-300 group-hover:text-amber-500 group-hover:rotate-45" />
          <span className="transition-colors duration-300 group-hover:text-amber-500">
            {t('common.light')} {theme === "light" && "✓"}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")} 
          className="group transition-all duration-300"
        >
          <Moon className="mr-2 h-4 w-4 transition-all duration-300 group-hover:text-blue-500 group-hover:rotate-45" />
          <span className="transition-colors duration-300 group-hover:text-blue-500">
            {t('common.dark')} {theme === "dark" && "✓"}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("system")} 
          className="group transition-all duration-300"
        >
          <SunMoon className="mr-2 h-4 w-4 transition-all duration-300 group-hover:text-purple-500 group-hover:rotate-45" />
          <span className="transition-colors duration-300 group-hover:text-purple-500">
            {t('common.system')} {theme === "system" && "✓"}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ThemeIcon({ theme }: { theme?: string }) {
  switch (theme) {
    case "light":
      return <Sun className="text-amber-500 animate-pulse-glow" />
    case "dark":
      return <Moon className="text-blue-500 animate-pulse-glow" />
    case "system":
      return <SunMoon className="text-purple-500 animate-pulse-glow" />
    default:
      return <SunMoon className="text-purple-500 animate-pulse-glow" />
  }
}
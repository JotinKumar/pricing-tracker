'use client'

import {
    Users,
    Briefcase,
    Layers,
    StretchHorizontal,
    MapPin,
    Tags,
    GitBranch,
    Activity,
    CheckCircle,
    FileText,
    Settings,
    LayoutGrid,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'




const ICON_MAP: Record<string, any> = {
    'User': Users,
    'Team': LayoutGrid, // Better than briefcase for Team? Or UsersRound. Let's stick to LayoutGrid for now or maybe Briefcase.
    'Vertical': Layers,
    'Horizontal': StretchHorizontal,
    'Location': MapPin,
    'Category': Tags,
    'Version': GitBranch,
    'Status': Activity,
    'Outcome': CheckCircle,
    'DocumentType': FileText,
    'Settings': Settings
}

export interface AdminSidebarProps {
    tabs: readonly string[]
    activeTab: string
    setActiveTab: (tab: any) => void
    collapsed: boolean
    toggleCollapse: () => void
}

export function AdminSidebar({ tabs, activeTab, setActiveTab, collapsed, toggleCollapse }: AdminSidebarProps) {
    return (
        <div
            className={cn(
                "flex-shrink-0 h-full flex flex-col gap-2 transition-all duration-300 relative",
                collapsed ? "w-16 items-center py-4" : "w-64 p-4"
            )}
        >
            <div className={cn("flex items-center justify-between pb-4", collapsed ? "px-0 justify-center" : "px-2")}>
                {!collapsed && <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider animate-in fade-in duration-300">Menu</h2>}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleCollapse}
                    className="h-6 w-6 text-muted-foreground hover:text-foreground hidden md:flex"
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </Button>
            </div>

            <div className={cn("space-y-1 w-full flex flex-col items-center", !collapsed && "items-stretch")}>
                {tabs.map(tab => {
                    const Icon = ICON_MAP[tab] || Settings
                    const isActive = activeTab === tab

                    return (
                        <Button
                            key={tab}
                            variant="ghost"
                            onClick={() => setActiveTab(tab)}
                            title={collapsed ? tab : undefined}
                            className={cn(
                                "relative font-medium transition-all duration-200",
                                collapsed ? "w-10 h-10 p-0 flex items-center justify-center" : "w-full justify-start gap-3 px-3",
                                isActive
                                    ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            {!collapsed && isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                            )}
                            <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                            {!collapsed && <span>{tab}</span>}
                        </Button>
                    )
                })}
            </div>
        </div>
    )
}

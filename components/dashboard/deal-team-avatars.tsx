"use client"

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface DealTeamMember {
    name: string | null
    role: string
    avatarUrl?: string // Placeholder for future use
}

interface DealTeamAvatarsProps {
    teamMembers: {
        user: { name: string | null }
        team: { display: string | null; teamname: string }
    }[]
}

function getInitials(name: string | null) {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function DealTeamAvatars({
    teamMembers
}: DealTeamAvatarsProps) {
    const members = teamMembers || []
    if (members.length === 0) {
        return <span className="text-muted-foreground/50 text-xs italic">Unassigned</span>
    }

    // Filter for allowed teams only
    const allowedTeams = ['Sales', 'Solution', 'Finance', 'Pricing']

    // Helper to normalize team name checking
    const isTeam = (tm: any, check: string) => {
        const name = tm.team.teamname || '';
        return name.toLowerCase().includes(check.toLowerCase());
    }

    // Filter members based on allowed teams
    const relevantMembers = members.filter(tm =>
        allowedTeams.some(allowed => isTeam(tm, allowed))
    )

    // Separate Pricing from others
    const pricingMembers = relevantMembers.filter(tm => isTeam(tm, 'Pricing'))
    const otherMembers = relevantMembers.filter(tm => !isTeam(tm, 'Pricing'))

    // Sort others for consistent order: Sales, Solution, Finance
    const roleOrder = ['Sales', 'Solution', 'Finance']
    const getRoleIndex = (tm: any) => {
        const name = tm.team.teamname || '';
        const index = roleOrder.findIndex(role => name.toLowerCase().includes(role.toLowerCase()));
        return index === -1 ? 99 : index;
    }
    otherMembers.sort((a, b) => getRoleIndex(a) - getRoleIndex(b))

    return (
        <TooltipProvider delayDuration={100}>
            <div className="flex items-center">

                {/* Full display for Pricing Team - Avatar Only - Showing First */}
                {pricingMembers.length > 0 && (
                    <div className="flex items-center -space-x-1 mr-1 z-20 relative"> {/* Removed mr-1 */}
                        {pricingMembers.map((tm, i) => (
                            <Tooltip key={`pricing-${i}`}>
                                <TooltipTrigger asChild>
                                    <div
                                        className={`
                                            relative
                                            rounded-full
                                            ring-2 ring-background
                                            cursor-default
                                        `}
                                    >
                                        <Avatar className={`h-[33px] w-[33px] text-[10px] font-bold border bg-foreground text-background border-border`}>
                                            <AvatarFallback className={`bg-transparent text-inherit`}>
                                                {getInitials(tm.user.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="font-semibold">{tm.user.name}</span>
                                        <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Pricing</span>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </div>
                )}

                {/* Stacked Avatars for Sales, Solution, Finance */}
                {otherMembers.length > 0 && (
                    <div className="flex items-center -space-x-3">
                        {otherMembers.map((tm, i) => (
                            <Tooltip key={`${tm.team.teamname}-${i}`}>
                                <TooltipTrigger asChild>
                                    <div
                                        className={`
                                            relative 
                                            rounded-full 
                                            ring-2 ring-background 
                                            transition-transform hover:-translate-y-1 hover:z-10 hover:shadow-sm cursor-default
                                        `}
                                    >
                                        <Avatar className={`h-[31px] w-[31px] text-[10px] font-bold border bg-secondary text-secondary-foreground border-border`}>
                                            <AvatarFallback className={`bg-transparent text-inherit`}>
                                                {getInitials(tm.user.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="font-semibold">{tm.user.name}</span>
                                        <span className="text-muted-foreground text-[10px] uppercase tracking-wider">{tm.team.display || tm.team.teamname}</span>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </div>
                )}
            </div>
        </TooltipProvider>
    )
}

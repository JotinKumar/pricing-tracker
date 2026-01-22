
export const STATUS_STYLES: Record<string, string> = {
    'Waiting input': 'bg-primary/10 text-primary border border-primary/20',
    'Completed': 'bg-secondary text-secondary-foreground border border-transparent',
    'Approval': 'bg-secondary text-secondary-foreground border border-transparent', // Simplified to secondary as well
    'Work In Progress': 'bg-muted text-muted-foreground border border-border',
    'DEFAULT': 'bg-muted text-muted-foreground border border-border'
};

// Standardized style for all statuses as requested
export function getStatusStyle(status: string | undefined | null): string {
    return 'bg-muted/50 text-muted-foreground border border-border hover:bg-muted/80';
}
// ... existing code ...

export const TEAM_ORDER = [
    "Pricing",
    "Solution",
    "Sales",
    "Finance",
    "Leaders/Management",
    "Work of Management",
    "Talent Acquisition",
    "None"
]

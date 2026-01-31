
'use client'

import { useState, useEffect, Suspense } from 'react'
import { getAdminData, saveAdminData, deleteAdminData } from '@/lib/actions/admin'
import { AdminSidebar } from './admin-sidebar'
import { SearchInput } from '@/components/ui/search-input'
import { ToastProvider, useToast } from '@/components/ui/toast-custom'
import { AdminTable } from './admin-table'
import { AdminModal } from './admin-modal'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { UserSession } from '@/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

// New Tab Components
import { DefaultsTab } from './tabs/defaults-tab'
import { SettingsTab } from './tabs/settings-tab'
import { PreferencesTab } from './tabs/preferences-tab'
import { useAdminData } from '@/hooks/use-admin-data'
import { getFieldConfigs } from '@/lib/actions/field-config'

interface AdminPanelProps {
    session: UserSession
}

// Updated Tabs list matching new Schema
// Updated Tabs list matching new Schema
const TABS = ['User', 'Team', 'Vertical', 'Horizontal', 'Location', 'Category', 'Version', 'Status', 'Outcome', 'DocumentType', 'Defaults', 'Preferences'] as const
type TabType = typeof TABS[number]

function AdminPanelContent() {
    const { addToast } = useToast()
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()

    // Initialize from URL or default
    const initialTab = (searchParams.get('tab') as TabType) || 'User'
    const [activeTab, setActiveTabState] = useState<TabType>(TABS.includes(initialTab) ? initialTab : 'User')

    // Subtab State for Defaults
    const initialSubTab = searchParams.get('subtab') || 'default-users'
    const [activeSubTab, setActiveSubTabState] = useState<string>(initialSubTab)

    // Wrapper to sync URL for Main Tab
    const setActiveTab = (tab: TabType) => {
        setActiveTabState(tab)
        const params = new URLSearchParams(searchParams)
        params.set('tab', tab)
        // Sync subtab if needed
        if (activeSubTab) params.set('subtab', activeSubTab)
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }

    // Wrapper to sync URL for Sub Tab
    const setActiveSubTab = (subtab: string) => {
        setActiveSubTabState(subtab)
        const params = new URLSearchParams(searchParams)
        params.set('tab', activeTab)
        params.set('subtab', subtab)
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }

    const [defaultCurrency, setDefaultCurrency] = useState('$')

    useEffect(() => {
        getFieldConfigs().then(res => {
            if (res.success && res.data) {
                const acvConfig = res.data.find((c: any) => c.targetField === 'acv')
                if (acvConfig?.prefix) setDefaultCurrency(acvConfig.prefix)
            }
        })
    }, [])

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editItem, setEditItem] = useState<any>(null)
    const [availableTeams, setAvailableTeams] = useState<any[]>([])
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    // Search State
    const [searchTerm, setSearchTerm] = useState('')

    // Get field names
    const getFieldNames = () => {
        switch (activeTab) {
            case 'Team': return { key: 'teamname', label: 'Team Name' }
            case 'Vertical': return { key: 'vertical', label: 'Vertical' }
            case 'Horizontal': return { key: 'horizontal', label: 'Horizontal' }
            case 'Location': return { key: 'country', label: 'Country' }
            case 'Status': return { key: 'status', label: 'Status' }
            case 'Category': return { key: 'category', label: 'Category' }
            case 'Version': return { key: 'version', label: 'Version' }
            case 'Outcome': return { key: 'outcome', label: 'Outcome' }
            case 'DocumentType': return { key: 'type', label: 'Document Type' }
            default: return { key: 'name', label: 'Name' }
        }
    }

    const fields = getFieldNames()

    // Use custom hook for data management with memoized filtering
    const { data, filteredData, loading, refetch: fetchData } = useAdminData({
        activeTab,
        searchTerm,
        fields,
        onError: (message) => addToast({ type: 'error', title: 'Error', message })
    })

    useEffect(() => {
        // Reset search when tab changes
        setSearchTerm('')

        if (activeTab === 'User') {
            getAdminData('Team').then(res => {
                if (res.success) setAvailableTeams(res.data || [])
            })
        }
    }, [activeTab])

    const handleEdit = (item: any) => {
        setEditItem(item)
        setIsModalOpen(true)
    }

    const handleCreate = () => {
        setEditItem(null)
        setIsModalOpen(true)
    }

    const handleDelete = async (id: number) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Delete Item',
            message: 'Are you sure you want to delete this item? This action cannot be undone.',
            onConfirm: async () => {
                const res = await deleteAdminData(activeTab as any, id)
                if (res.success) {
                    fetchData()
                    addToast({ type: 'success', title: 'Deleted', message: 'Item deleted successfully' })
                } else {
                    addToast({ type: 'error', title: 'Deletion Failed', message: res.message || 'Could not delete item' })
                }
                setConfirmConfig(prev => ({ ...prev, isOpen: false }))
            }
        })
    }

    const handleSave = async (data: any) => {
        const payload: any = { ...data }

        if (editItem) {
            payload.id = editItem.id
        }

        const res = await saveAdminData(activeTab as any, payload)

        if (res.success) {
            setIsModalOpen(false)
            fetchData()
            addToast({
                type: 'success',
                title: 'Success',
                message: editItem ? 'Item updated successfully' : 'New record created successfully'
            })
        } else if (!res.errors) {
            addToast({ type: 'error', title: 'Save Failed', message: res.message || 'Unknown error occurred' })
        }
        return res
    }



    return (
        <div className="h-[calc(100vh-65px)] flex flex-col bg-transparent font-sans text-foreground overflow-hidden">
            {/* Main Layout - Full Height with Padding */}
            <div className="flex-1 overflow-hidden flex flex-col max-w-7xl mx-auto w-full p-4 pb-8">

                {/* Container Board */}
                <div className="flex-1 flex overflow-hidden gap-4">

                    {/* Sidebar */}
                    <div className={cn("flex-none bg-card h-full overflow-hidden transition-all duration-300 rounded-xl border border-border/50", isSidebarCollapsed ? "w-16" : "w-64")}>
                        <AdminSidebar
                            tabs={TABS}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            collapsed={isSidebarCollapsed}
                            toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        />
                    </div>

                    <div className="flex-1 bg-card overflow-hidden flex flex-col h-full rounded-xl border border-border/50">
                        {activeTab === 'Defaults' ? (
                            <div className="p-8 h-full overflow-hidden flex flex-col">
                                <DefaultsTab />
                            </div>
                        ) : activeTab === 'Preferences' ? (
                            <div className="p-8 h-full overflow-hidden flex flex-col">
                                <PreferencesTab />
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                {/* Toolbar */}
                                <div className="flex-none p-4 flex justify-between items-center bg-muted/10 gap-4">
                                    <div>
                                        <h2 className="font-bold text-lg text-foreground tracking-tight">
                                            {activeTab === 'User' ? 'Users' :
                                                activeTab === 'Team' ? 'Teams' :
                                                    activeTab === 'Category' ? 'Categories' :
                                                        activeTab === 'Vertical' ? 'Verticals' :
                                                            activeTab === 'Horizontal' ? 'Horizontals' :
                                                                activeTab === 'Location' ? 'Locations' :
                                                                    activeTab === 'Version' ? 'Versions' :
                                                                        activeTab === 'Status' ? 'Statuses' :
                                                                            activeTab === 'Outcome' ? 'Outcomes' :
                                                                                activeTab === 'DocumentType' ? 'Document Types' :
                                                                                    activeTab}
                                        </h2>
                                        <p className="text-xs text-muted-foreground mt-0.5">{filteredData.length} records found</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <SearchInput
                                            placeholder={`Search ${activeTab}...`}
                                            className="w-64"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                        <Button onClick={handleCreate} size="sm" className="gap-2 font-bold h-9 shadow-sm shadow-primary/20">
                                            <Plus className="w-4 h-4" /> Add New
                                        </Button>
                                    </div>
                                </div>

                                {/* Scrollable Table Area */}
                                <div className="flex-1 overflow-auto relative">
                                    <AdminTable
                                        activeTab={activeTab}
                                        data={filteredData}
                                        loading={loading}
                                        handleEdit={handleEdit}
                                        handleCreate={handleCreate}
                                        fields={fields}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                </div>

                {/* Modal */}
                {isModalOpen && activeTab !== 'Defaults' && (
                    <AdminModal
                        editItem={editItem}
                        activeTab={activeTab}
                        fields={fields}
                        handleSave={handleSave}
                        onClose={() => setIsModalOpen(false)}
                        data={data}
                        availableTeams={availableTeams}
                        defaultCurrency={defaultCurrency}
                    />
                )}
                {/* Confirmation Dialog */}
                <ConfirmationDialog
                    isOpen={confirmConfig.isOpen}
                    title={confirmConfig.title}
                    message={confirmConfig.message}
                    onConfirm={confirmConfig.onConfirm}
                    onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                />
            </div>
        </div>
    )
}

export default function AdminPanel(props: AdminPanelProps) {
    return (
        <ToastProvider>
            <Suspense fallback={<div className="p-8">Loading Admin Panel...</div>}>
                <AdminPanelContent />
            </Suspense>
        </ToastProvider>
    )
}

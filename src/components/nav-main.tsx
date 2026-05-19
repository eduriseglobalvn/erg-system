import { useState } from "react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { ChevronRightIcon } from "@/components/icons"
import { cn } from "@/lib/utils"

export function NavMain({
  items,
  activeLeafId,
  onSelectLeaf,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
    tone?: string
    isActive?: boolean
    items?: {
      title: string
      leafId: string
    }[]
  }[]
  activeLeafId: string
  onSelectLeaf: (leafId: string) => void
}) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <SidebarGroup className="px-0 py-0 group-data-[collapsible=icon]:px-0">
      <SidebarMenu className="gap-1.5 group-data-[collapsible=icon]:items-stretch group-data-[collapsible=icon]:gap-1">
        {items.map((item) => {
          const firstLeafId = item.items?.[0]?.leafId
          const isFlatItem = (item.items?.length ?? 0) === 1
          const isOpen = openGroups[item.title] ?? Boolean(item.isActive)

          if (isFlatItem && firstLeafId) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  isActive={Boolean(item.isActive)}
                  onClick={() => onSelectLeaf(firstLeafId)}
                  className={cn(
                    "min-h-11 rounded-xl px-3 py-2.5 text-[14px] font-medium text-slate-700 transition hover:bg-[#f1f3f6] hover:text-slate-950",
                    "data-[active=true]:bg-[#eeeeee] data-[active=true]:font-semibold data-[active=true]:text-slate-900",
                    "group-data-[collapsible=icon]:!h-[74px] group-data-[collapsible=icon]:!w-full group-data-[collapsible=icon]:!flex-col group-data-[collapsible=icon]:!items-center group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!gap-1.5 group-data-[collapsible=icon]:!rounded-none group-data-[collapsible=icon]:!px-1 group-data-[collapsible=icon]:!py-2 group-data-[collapsible=icon]:text-center group-data-[collapsible=icon]:text-[13px] group-data-[collapsible=icon]:leading-4",
                  )}
                >
                  <span className={cn("grid size-6 shrink-0 place-items-center [&_svg]:size-[22px]", item.tone)}>
                    {item.icon}
                  </span>
                  <span className="min-w-0 whitespace-normal break-words group-data-[collapsible=icon]:line-clamp-2 group-data-[collapsible=icon]:max-w-[64px]">
                    {item.title}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

          return (
            <Collapsible
              key={item.title}
              asChild
              open={!isCollapsed && isOpen}
              onOpenChange={(nextOpen) =>
                setOpenGroups((current) => ({ ...current, [item.title]: nextOpen }))
              }
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    isActive={Boolean(item.isActive)}
                    onClick={(event) => {
                      if (!isCollapsed || !firstLeafId || (item.items?.length ?? 0) > 1) return
                      event.preventDefault()
                      onSelectLeaf(firstLeafId)
                    }}
                    className={cn(
                      "min-h-11 rounded-xl px-3 py-2.5 text-[14px] font-medium text-slate-700 transition hover:bg-[#f1f3f6] hover:text-slate-950",
                      "data-[active=true]:bg-[#eeeeee] data-[active=true]:font-semibold data-[active=true]:text-slate-900",
                      "group-data-[collapsible=icon]:!h-[74px] group-data-[collapsible=icon]:!w-full group-data-[collapsible=icon]:!flex-col group-data-[collapsible=icon]:!items-center group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!gap-1.5 group-data-[collapsible=icon]:!rounded-none group-data-[collapsible=icon]:!px-1 group-data-[collapsible=icon]:!py-2 group-data-[collapsible=icon]:text-center group-data-[collapsible=icon]:text-[13px] group-data-[collapsible=icon]:leading-4",
                    )}
                  >
                    <span className={cn("grid size-6 shrink-0 place-items-center [&_svg]:size-[22px]", item.tone)}>
                      {item.icon}
                    </span>
                    <span className="min-w-0 whitespace-normal break-words group-data-[collapsible=icon]:line-clamp-2 group-data-[collapsible=icon]:max-w-[64px]">
                      {item.title}
                    </span>
                    <ChevronRightIcon className="ml-auto size-4 text-slate-400 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" fontSize="inherit" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub className="ml-5 border-l-0 px-0 py-1">
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={subItem.leafId === activeLeafId}
                          className="min-h-8 rounded-lg px-3 text-[13px] font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950 data-[active=true]:bg-[#eeeeee] data-[active=true]:font-semibold data-[active=true]:text-slate-900"
                        >
                          <button type="button" onClick={() => onSelectLeaf(subItem.leafId)}>
                            <span>{subItem.title}</span>
                          </button>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
                {item.items?.length ? (
                  <div className="pointer-events-none absolute left-full top-0 z-50 ml-0 hidden min-w-56 rounded-2xl border border-slate-200 bg-white p-2 text-left shadow-[0_20px_45px_-24px_rgba(15,23,42,0.45)] group-data-[collapsible=icon]:group-hover/menu-item:block group-data-[collapsible=icon]:pointer-events-auto">
                    <div className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                      {item.title}
                    </div>
                    <div className="grid gap-1">
                      {item.items.map((subItem) => (
                        <button
                          key={subItem.leafId}
                          type="button"
                          onClick={() => onSelectLeaf(subItem.leafId)}
                          className={cn(
                            "rounded-xl px-3 py-2 text-left text-sm font-medium transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100",
                            subItem.leafId === activeLeafId ? "bg-[#eeeeee] text-slate-950" : "text-slate-600",
                          )}
                        >
                          {subItem.title}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

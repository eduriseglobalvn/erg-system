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
} from "@/components/ui/sidebar"
import { useSidebar } from "@/components/ui/sidebar-context"
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
                    "relative min-h-11 rounded-lg border border-transparent bg-transparent px-3 py-2.5 text-[15px] font-semibold leading-tight text-[#919EAB] shadow-none transition duration-200 hover:bg-[rgba(255,255,255,0.04)] hover:text-white",
                    "data-[active=true]:bg-[rgba(105,108,255,0.08)] data-[active=true]:text-white data-[active=true]:font-bold data-[active=true]:before:absolute data-[active=true]:before:left-0 data-[active=true]:before:top-2 data-[active=true]:before:h-7 data-[active=true]:before:w-1 data-[active=true]:before:rounded-r-full data-[active=true]:before:bg-[#696CFF]",
                    "group-data-[collapsible=icon]:!min-h-[80px] group-data-[collapsible=icon]:!h-auto group-data-[collapsible=icon]:!w-full group-data-[collapsible=icon]:!flex-col group-data-[collapsible=icon]:!items-center group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!gap-1 group-data-[collapsible=icon]:!rounded-none group-data-[collapsible=icon]:!px-1 group-data-[collapsible=icon]:!py-3 group-data-[collapsible=icon]:text-center group-data-[collapsible=icon]:text-[12px] group-data-[collapsible=icon]:leading-4",
                  )}
                >
                  <span className={cn("grid size-7 shrink-0 place-items-center rounded-md bg-transparent text-[#919EAB] [&_svg]:size-[20px] transition-colors group-hover:text-white group-data-[active=true]:text-[#696CFF]")}>
                    {item.icon}
                  </span>
                  <span className="min-w-0 whitespace-normal break-words text-left group-data-[collapsible=icon]:max-w-[78px] group-data-[collapsible=icon]:text-balance">
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
                      "relative min-h-11 rounded-lg border border-transparent bg-transparent px-3 py-2.5 text-[15px] font-semibold leading-tight text-[#919EAB] shadow-none transition duration-200 hover:bg-[rgba(255,255,255,0.04)] hover:text-white",
                      "data-[active=true]:bg-[rgba(105,108,255,0.08)] data-[active=true]:text-white data-[active=true]:font-bold data-[active=true]:before:absolute data-[active=true]:before:left-0 data-[active=true]:before:top-2 data-[active=true]:before:h-7 data-[active=true]:before:w-1 data-[active=true]:before:rounded-r-full data-[active=true]:before:bg-[#696CFF]",
                      "group-data-[collapsible=icon]:!min-h-[80px] group-data-[collapsible=icon]:!h-auto group-data-[collapsible=icon]:!w-full group-data-[collapsible=icon]:!flex-col group-data-[collapsible=icon]:!items-center group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!gap-1 group-data-[collapsible=icon]:!rounded-none group-data-[collapsible=icon]:!px-1 group-data-[collapsible=icon]:!py-3 group-data-[collapsible=icon]:text-center group-data-[collapsible=icon]:text-[12px] group-data-[collapsible=icon]:leading-4",
                    )}
                  >
                    <span className={cn("grid size-7 shrink-0 place-items-center rounded-md bg-transparent text-[#919EAB] [&_svg]:size-[20px] transition-colors group-hover:text-white group-data-[active=true]:text-[#696CFF]")}>
                      {item.icon}
                    </span>
                    <span className="min-w-0 whitespace-normal break-words text-left group-data-[collapsible=icon]:max-w-[78px] group-data-[collapsible=icon]:text-balance">
                      {item.title}
                    </span>
                    <ChevronRightIcon className="ml-auto size-4 text-[#919EAB] transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" fontSize="inherit" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub className="ml-5 border-l border-[rgba(145,158,171,0.12)] px-2 py-1.5">
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={subItem.leafId === activeLeafId}
                          className="min-h-8 rounded-md px-3 text-[13px] font-medium text-[#919EAB] hover:bg-[rgba(255,255,255,0.02)] hover:text-white data-[active=true]:bg-transparent data-[active=true]:font-bold data-[active=true]:text-[#696CFF]"
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
                  <div className="pointer-events-none absolute left-full top-0 z-50 ml-0 hidden min-w-56 rounded-lg border border-[rgba(145,158,171,0.12)] bg-[#1C252E] p-2 text-left shadow-[0_12px_28px_rgba(0,0,0,0.3)] group-data-[collapsible=icon]:group-hover/menu-item:block group-data-[collapsible=icon]:pointer-events-auto">
                    <div className="px-3 py-2 text-xs font-semibold text-[#919EAB] uppercase tracking-wider">
                      {item.title}
                    </div>
                    <div className="grid gap-1">
                      {item.items.map((subItem) => (
                        <button
                          key={subItem.leafId}
                          type="button"
                          onClick={() => onSelectLeaf(subItem.leafId)}
                          className={cn(
                            "rounded-md px-3 py-2 text-left text-sm font-medium transition hover:bg-[rgba(255,255,255,0.04)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#696CFF]",
                            subItem.leafId === activeLeafId ? "bg-[rgba(105,108,255,0.08)] text-[#696CFF] font-bold" : "text-[#919EAB]",
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

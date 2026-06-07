import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useSidebar } from "@/components/ui/sidebar-context"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useI18n } from "@/platform/i18n"
import {
  ArrowDownwardIcon,
  ArrowUpwardIcon,
  LogoutIcon,
  NotificationsIcon,
  SettingsIcon,
  VerifiedIcon,
} from "@/components/icons"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const { locale, setLocale, t } = useI18n()
  const fallback = user.name
    .split(" ")
    .slice(0, 2)
    .map((item) => item[0])
    .join("")
    .toUpperCase()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="border-[#d9e0ea] bg-white/70 shadow-sm hover:border-[#b8d6fa] hover:bg-white data-[state=open]:border-[#b8d6fa] data-[state=open]:bg-white data-[state=open]:text-[var(--erg-blue)] data-[state=open]:shadow-sm"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-[var(--erg-blue)] text-white">
                  {fallback}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-[#242424]">{user.name}</span>
                <span className="truncate text-xs font-medium text-[#616161]">{user.email}</span>
              </div>
              <span className="ml-auto inline-flex flex-col">
                <ArrowUpwardIcon className="size-3" fontSize="inherit" />
                <ArrowDownwardIcon className="-mt-1 size-3" fontSize="inherit" />
              </span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg bg-[var(--erg-blue)] text-white">
                    {fallback}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-[#242424]">{user.name}</span>
                  <span className="truncate text-xs font-medium text-[#616161]">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <VerifiedIcon fontSize="inherit" />
                {t("common.account")}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <SettingsIcon fontSize="inherit" />
                {t("common.settings")}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <NotificationsIcon fontSize="inherit" />
                {t("common.notifications")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-semibold text-[#616161]">
              {t("locale.language")}
            </DropdownMenuLabel>
            <div className="px-2 pb-2">
              <ToggleGroup
                type="single"
                value={locale}
                onValueChange={(value) => {
                  if (value === "vi" || value === "en") setLocale(value)
                }}
                className="grid w-full grid-cols-2 gap-2"
                size="lg"
                variant="outline"
              >
                <ToggleGroupItem value="vi" aria-label="Tiếng Việt" className="h-9 rounded-md text-sm">
                  VI
                </ToggleGroupItem>
                <ToggleGroupItem value="en" aria-label="English" className="h-9 rounded-md text-sm">
                  EN
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogoutIcon fontSize="inherit" />
              {t("common.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

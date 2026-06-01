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
  useSidebar,
} from "@/components/ui/sidebar"
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
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">{fallback}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
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
                  <AvatarFallback className="rounded-lg">{fallback}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
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
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {t("locale.language")}
            </DropdownMenuLabel>
            <div className="px-2 pb-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLocale("vi")}
                  className={
                    locale === "vi"
                      ? "inline-flex h-9 items-center justify-center rounded-md bg-muted px-3 text-sm font-medium text-foreground"
                      : "inline-flex h-9 items-center justify-center rounded-md border border-transparent px-3 text-sm text-muted-foreground transition hover:bg-muted/70 hover:text-foreground"
                  }
                >
                  VI
                </button>
                <button
                  type="button"
                  onClick={() => setLocale("en")}
                  className={
                    locale === "en"
                      ? "inline-flex h-9 items-center justify-center rounded-md bg-muted px-3 text-sm font-medium text-foreground"
                      : "inline-flex h-9 items-center justify-center rounded-md border border-transparent px-3 text-sm text-muted-foreground transition hover:bg-muted/70 hover:text-foreground"
                  }
                >
                  EN
                </button>
              </div>
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

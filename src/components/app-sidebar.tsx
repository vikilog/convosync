import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ChevronsUpDown, LogOut } from 'lucide-react'

import { useAuth } from '@/context/AuthContext'
import { companyResource } from '@/services/company.service'
import { getNavUnreadSnapshot, NAV_UNREAD_CHANGED_EVENT } from '@/lib/navUnread'
import { BOTTOM_NAV_ITEMS, NAV_SECTIONS, type NavItem } from '@/lib/navigation'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function NavLinkItem({
  item,
  isActive,
  unread,
}: {
  item: NavItem
  isActive: boolean
  unread?: number
}) {
  const badge = unread && unread > 0 ? (unread > 99 ? '99+' : unread) : null
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
        <Link to={item.path}>
          <item.icon />
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
      {badge ? <SidebarMenuBadge>{badge}</SidebarMenuBadge> : null}
    </SidebarMenuItem>
  )
}

export function AppSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { data: company } = companyResource.useGet()
  const [navUnread, setNavUnread] = useState(getNavUnreadSnapshot)

  useEffect(() => {
    const onUnread = () => setNavUnread(getNavUnreadSnapshot())
    window.addEventListener(NAV_UNREAD_CHANGED_EVENT, onUnread)
    return () => window.removeEventListener(NAV_UNREAD_CHANGED_EVENT, onUnread)
  }, [])

  const isActive = (path: string) => location.pathname.startsWith(path)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <img src={company?.logoUrl || '/convosync-logo.png'} alt="" className="size-8 shrink-0 rounded object-cover" />
          <div className="flex flex-col leading-none group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-semibold">{company?.name || 'ConvoSync'}</span>
            <span className="text-muted-foreground text-xs">Workspace</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {NAV_SECTIONS.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <NavLinkItem
                    key={item.path}
                    item={item}
                    isActive={isActive(item.path)}
                    unread={item.unreadKey ? navUnread[item.unreadKey] : undefined}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {BOTTOM_NAV_ITEMS.map((item) => (
                <NavLinkItem key={item.path} item={item} isActive={isActive(item.path)} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <Avatar className="size-7">
                    <AvatarFallback>{user ? initials(user.name) : '?'}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="text-sm font-medium">{user?.name ?? 'Signed out'}</span>
                    <span className="text-muted-foreground text-xs">{user?.role ?? ''}</span>
                  </div>
                  <ChevronsUpDown className="text-muted-foreground ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="w-56">
                <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

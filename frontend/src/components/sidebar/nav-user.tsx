import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { ChevronsUpDownIcon, UserIcon, Bell } from "lucide-react"
import type {User} from "@/types/user"
import Logout from "../auth/Logout"
import { useEffect, useState } from "react"
import FriendRequestDialog from "../friendRequest/FriendRequestDialog"
import ProfileDiaglog from "../profile/ProfileDiaglog"
import { useFriendStore } from "@/stores/useFriendStore"

export function NavUser({
  user,
}: {
  user: User

}) {
  const { isMobile } = useSidebar();
  const [friendRequestOpen, setfriendRequestOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Lấy data từ store theo đúng interface FriendState
  const receivedList = useFriendStore((state) => state.receivedList);
  const getAllFriendRequests = useFriendStore((state) => state.getAllFriendRequests);
  const notiCount = receivedList?.length || 0;

  // Gọi api để lấy số lượng thông báo ngay khi render sidebar
  useEffect(() => {
    getAllFriendRequests();
  }, [getAllFriendRequests]);

  return (
    <>
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />
            }
          >
            <div className="relative">
              <Avatar>
                <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                <AvatarFallback className="rounded-lg">{user.displayName.charAt(0)}</AvatarFallback>
              </Avatar>
                
              {/* Chấm đỏ nhỏ bên ngoài Avatar báo hiệu có Noti ẩn (tuỳ chọn) */}
              {notiCount > 0 && (
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </div>
              
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.displayName}</span>
              <span className="truncate text-xs">{user.email}</span>
            </div>
            <ChevronsUpDownIcon className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar>
                    <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                    <AvatarFallback className="rounded-lg">{user.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.displayName}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                <UserIcon className="text-muted-foreground dark:group-focus:!text-accent-foreground"
                />
                Account
              </DropdownMenuItem>
                
              <DropdownMenuItem onClick={() => setfriendRequestOpen(true)}>
                <div className="relative flex items-center justify-center">
                  <Bell className="text-muted-foreground dark:group-focus:!text-accent-foreground" />
                  {/* Badge đỏ hiển thị số > 0, nếu lớn hơn 9 thì là 9+ */}
                  {notiCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-red-500 px-[4px] text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                      {notiCount > 9 ? '9+' : notiCount}
                    </span>
                  )}
                </div>
                <span>Notification</span>
              </DropdownMenuItem>
              
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" variant="destructive">
              <Logout
              />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>

      <FriendRequestDialog
        open={friendRequestOpen}
        setOpen={setfriendRequestOpen}
      />

      <ProfileDiaglog
        open={profileOpen}
        setOpen={setProfileOpen}
      />
    </>
  )
}

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"

interface IUseAvatarProps {
    type: "sidebar" | "chat" | "profile";
    name: string;
    avatarUrl?: string;
    className?: string 
}

const UserAvatar = ({ type, name, avatarUrl, className }: IUseAvatarProps) => {
    const bgColor = !avatarUrl ? "bg-emerald-200" : "";

    if (!name) {
        name = "Talkify";
    }

  return (
    <Avatar
          className={cn(className ?? "",
              type === "sidebar" && "size-12 text-base",
              type === "chat" && "size-8 text-sm",
              type === "profile" && "size-24 text-3xl shadow-md"
      )}
      >
          <AvatarImage src={avatarUrl} alt={name} />
          <AvatarFallback className={`${bgColor} text-emerald-950 font-semibold`}>
            {name.charAt(0)} {/* tạo ava có chữ cái đầu tiên của tên */}
          </AvatarFallback>

    </Avatar>
  )
}

export default UserAvatar

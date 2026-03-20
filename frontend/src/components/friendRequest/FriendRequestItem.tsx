import type { FriendRequest } from "@/types/user";
import type { ReactNode } from "react";
import UserAvatar from "../chat/UserAvatar";

interface RequestItemProps {
  requestInfo: FriendRequest;
  actions: ReactNode;
  type: "sent" | "received";
}

const FriendRequestItem = ({ requestInfo, actions, type }: RequestItemProps) => {
  if (!requestInfo) return null;

  const info = type === "sent" ? requestInfo.to : requestInfo.from;
  if (!info) return null;

  const intro = requestInfo.message?.trim();

  return (
    <div className="rounded-lg border border-primary-foreground p-3 shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar type="sidebar" name={info.displayName} />
          <div className="min-w-0">
            <p className="font-medium">{info.displayName}</p>
            <p className="text-sm text-muted-foreground">@{info.username}</p>
          </div>
        </div>
        {actions}
      </div>

      <div className="mt-2 pl-11">
        <p className="text-xs font-medium text-muted-foreground">Introduction</p>
        <p className="mt-1 rounded-md bg-muted/40 px-2 py-1 text-sm text-foreground break-words">
          {intro || "No introduction provided."}
        </p>
      </div>
    </div>
  );
};

export default FriendRequestItem;
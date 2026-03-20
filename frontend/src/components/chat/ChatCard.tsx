import { Card } from "@/components/ui/card"
import { formatOnlineTime, cn } from "@/lib/utils"
import { MoreHorizontal, Edit2, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface ChatCardProps {
  convoId: string;
  name: string;
  timestamp?: Date;
  isActive: boolean;
  onSelect: (id: string) => void;
  unreadCount?: number;
  leftSection: React.ReactNode;
  subtitle: React.ReactNode;
  // Thêm 3 props này để xử lý Rename và Delete
  chatType?: "direct" | "group";
  onRename?: (newName: string) => void;
  onDelete?: () => void;
}

const ChatCard = ({
  convoId, name, timestamp, isActive, onSelect, unreadCount, leftSection, subtitle, chatType, onRename, onDelete
}: ChatCardProps) => {
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const handleRenameClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Ngăn việc click làm chọn luôn thẻ chat
    setNewName(name); // Lấy tên hiện tại làm giá trị mặc định
    setIsRenameModalOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && window.confirm("Bạn có chắc chắn muốn xóa cuộc trò chuyện này không?")) {
      onDelete();
    }
  };

  const handleRenameSubmit = () => {
    if (onRename && newName.trim()) {
      onRename(newName.trim());
    }
    setIsRenameModalOpen(false);
  };

  return (
    <>
      <Card
        key={convoId}
        // Thêm class 'group' vào đây để group-hover:opacity-100 hoạt động
        className={cn("group border-none p-3 cursor-pointer transition-smooth glass hover:bg-muted/30",
          isActive && "ring-2 ring-primary/50 bg-gradient-to-tr from-primary-glow/10 to-primary-foreground"
        )}
        onClick={() => onSelect(convoId)}
      >
        <div className="flex items-center gap-3">
          <div className="relative">{leftSection}</div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className={cn("font-semibold text-sm truncate",
                unreadCount && unreadCount > 0 && "text-foreground"
              )}>
                {name}
              </h3>
            
              <span className="text-xs text-muted-foreground">
                {timestamp ? formatOnlineTime(timestamp) : ""}
              </span>
            </div>

            {/* hiển thị subtitle và ... */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 flex-1 min-w-0">{subtitle}</div>
              
              {/* DROPDOWN MENU TẠI ĐÂY */}
              {(onRename || onDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    nativeButton={false}
                    render={<div />}
                    onClick={(e) => e.stopPropagation()}>
                    <button className="outline-none flex items-center justify-center p-1 rounded-md hover:bg-muted/50">
                      <MoreHorizontal
                        className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-smooth"
                      />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    {onRename && (
                      <DropdownMenuItem onClick={handleRenameClick} className="cursor-pointer">
                        <Edit2 className="mr-2 h-4 w-4" />
                        <span>{chatType === "direct" ? "rename" : "rename"}</span>
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem onClick={handleDeleteClick} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>delete</span>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* MODAL ĐỔI TÊN NẰM TRONG CHAT CARD */}
      <Dialog open={isRenameModalOpen} onOpenChange={setIsRenameModalOpen}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>{chatType === "direct" ? "Rename" : "Rename"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Input other name..."
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameModalOpen(false)}>Back</Button>
            <Button onClick={handleRenameSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ChatCard;
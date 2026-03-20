import { useAuthStore } from "@/stores/useAuthStore";
import { useRef, useState } from "react";
import { Button } from "../ui/button";
import { ImagePlus, Send, X } from "lucide-react";
import { Input } from "../ui/input";
import EmojiPicker from "./EmojiPicker";
import type { Conversation } from "@/types/chat";
import { useChatStore } from "@/stores/useChatStore";
import { toast } from "sonner";

const MessageInput = ({ selectedConvo }: { selectedConvo: Conversation }) => {
  const { user } = useAuthStore();
  const { sendDirectMessage, sendGroupMessage } = useChatStore();
  const [value, setValue] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const isBlockedByMe =
    selectedConvo.type === "direct" && Boolean(selectedConvo.isBlockedByMe);

  const isBlockedByOther =
    selectedConvo.type === "direct" && Boolean(selectedConvo.isBlockedByOther);

  const isBlockedConversation = isBlockedByMe || isBlockedByOther;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isBlockedConversation) return;

    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB.");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    e.target.value = "";
  };

  const removeImage = () => {
    if (isBlockedConversation) return;
    setImageFile(null);
    setImagePreview(null);
  };

  const sendMessage = async () => {
    if (isBlockedConversation) return;
    if (!value.trim() && !imageFile) return;

    const currValue = value;
    const currImage = imageFile;
    setValue("");
    setImageFile(null);
    setImagePreview(null);

    try {
      if (selectedConvo.type === "direct") {
        const otherUser = selectedConvo.participants.find((p) => p._id !== user._id);
        if (!otherUser?._id) return;
        await sendDirectMessage(otherUser._id, currValue, currImage ?? undefined);
      } else {
        await sendGroupMessage(selectedConvo._id, currValue, currImage ?? undefined);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to send message, please try again!");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void sendMessage();
    }
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-background">
      {isBlockedConversation && (
        <span className="text-xs text-destructive">
          {isBlockedByMe
            ? "You blocked this user. Messaging is disabled."
            : "This user blocked you. Messaging is disabled."}
        </span>
      )}

      {imagePreview && (
        <div className="relative w-fit">
          <img
            src={imagePreview}
            alt="preview"
            className="max-h-32 rounded-lg object-cover border border-border"
          />
          <button
            type="button"
            onClick={removeImage}
            disabled={isBlockedConversation}
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 hover:bg-destructive/80 disabled:opacity-50"
          >
            <X className="size-3" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 min-h-[56px]">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
          disabled={isBlockedConversation}
        />

        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-primary/10 transition-smooth"
          onClick={() => {
            if (!isBlockedConversation) fileInputRef.current?.click();
          }}
          disabled={isBlockedConversation}
        >
          <ImagePlus className="size-4" />
        </Button>

        <div className="flex-1 relative">
          <Input
            onKeyDown={handleKeyPress}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={
              isBlockedConversation
                ? "Messaging is disabled in this conversation."
                : "Input messages..."
            }
            className="pr-20 h-9 bg-white border-border/50 focus:border-primary/50 transition-smooth resize-none"
            disabled={isBlockedConversation}
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            <Button
              nativeButton={false}
              render={<div />}
              variant="ghost"
              size="icon"
              className="size-8 hover:bg-primary/10 transition-smooth"
              disabled={isBlockedConversation}
            >
              <div>
                <EmojiPicker
                  onChange={(emoji: string) => {
                    if (!isBlockedConversation) setValue(`${value}${emoji}`);
                  }}
                />
              </div>
            </Button>
          </div>
        </div>

        <Button
          onClick={() => void sendMessage()}
          className="bg-gradient-chat hover:shadow-glow transition-smooth hover:scale-105"
          disabled={isBlockedConversation || (!value.trim() && !imageFile)}
        >
          <Send className="size-4 text-white" />
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
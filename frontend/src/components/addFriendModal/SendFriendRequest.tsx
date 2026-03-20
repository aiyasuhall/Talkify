import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { useRef } from "react";
import { toast } from "sonner";
import type { IFormValues } from "../chat/AddFriendModal";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { UserPlus } from "lucide-react";

interface SendRequestProps {
  register: UseFormRegister<IFormValues>;
  errors: FieldErrors<IFormValues>;
  loading: boolean;
  searchedUsername: string;
  onSubmit: (e?: React.FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
}

const MAX_WORDS = 40;

const countWords = (value: string) =>
  value.trim().split(/\s+/).filter(Boolean).length;

const isControlOrNavigationKey = (key: string) =>
  [
    "Backspace",
    "Delete",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "Home",
    "End",
    "Tab",
    "Escape",
    "Enter",
  ].includes(key);

const nextTextAfterInsert = (
  current: string,
  insertText: string,
  start: number,
  end: number
) => current.slice(0, start) + insertText + current.slice(end);

const SendFriendRequest = ({
  register,
  errors,
  loading,
  searchedUsername,
  onSubmit,
  onBack,
}: SendRequestProps) => {
  const lastToastAtRef = useRef(0);

  const showLimitToast = () => {
    const now = Date.now();
    if (now - lastToastAtRef.current < 1200) return;
    lastToastAtRef.current = now;
    toast.error("A maximum of 40 words is allowed.");
  };

  const messageField = register("message", {
    validate: (value) => {
      const words = countWords(value || "");
      return words <= MAX_WORDS || "A maximum of 40 words is allowed.";
    },
  });

  return (
    <form onSubmit={onSubmit}>
      <div className="space-y-4">
        <span className="success-message">
          Found <span className="font-semibold">@{searchedUsername}</span> hehehehe!!! ️🎉
        </span>

        <div className="space-y-2">
          <Label htmlFor="message" className="text-sm font-semibold">
            Introduction
          </Label>

          <Textarea
            id="message"
            rows={3}
            placeholder="Hi, can we be friend ^^!"
            className="glass resize-none border-border/50 transition-smooth focus:border-primary/50 [overflow-wrap:anywhere] break-all"
            {...messageField}
            onKeyDown={(e) => {
              if (e.ctrlKey || e.metaKey || e.altKey) return;
              if (isControlOrNavigationKey(e.key)) return;
              if (e.key.length !== 1) return;

              const el = e.currentTarget;
              const start = el.selectionStart ?? el.value.length;
              const end = el.selectionEnd ?? el.value.length;
              const nextValue = nextTextAfterInsert(el.value, e.key, start, end);

              if (countWords(nextValue) > MAX_WORDS) {
                e.preventDefault();
                showLimitToast();
              }
            }}
            onPaste={(e) => {
              const pasteText = e.clipboardData.getData("text") || "";
              const el = e.currentTarget;
              const start = el.selectionStart ?? el.value.length;
              const end = el.selectionEnd ?? el.value.length;
              const nextValue = nextTextAfterInsert(el.value, pasteText, start, end);

              if (countWords(nextValue) > MAX_WORDS) {
                e.preventDefault();
                showLimitToast();
              }
            }}
          />

          {errors.message && (
            <p className="text-sm text-destructive">{String(errors.message.message)}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="flex-1 glass hover:text-destructive"
            onClick={onBack}
          >
            Back
          </Button>

          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-chat text-white hover:opacity-90 transition-smooth"
          >
            {loading ? (
              <span>Sending...</span>
            ) : (
              <>
                <UserPlus className="size-4 mr-2" /> Add Friend
              </>
            )}
          </Button>
        </DialogFooter>
      </div>
    </form>
  );
};

export default SendFriendRequest;
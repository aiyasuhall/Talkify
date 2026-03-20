import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { UserPlus, Users } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import type { Friend } from "@/types/user";
import SelectedUsersList from "../newGroupChat/SelectedUsersList";
import { toast } from "sonner";
import { useChatStore } from "@/stores/useChatStore";
import { useFriendStore } from "@/stores/useFriendStore";
import { useUserStore } from "@/stores/useUserStore";
import { useAuthStore } from "@/stores/useAuthStore";

const NewGroupChatModal = () => {
  const [groupName, setGroupName] = useState("");
  const [selectedFriendId, setSelectedFriendId] = useState("");
  const [invitedUsers, setInvitedUsers] = useState<Friend[]>([]);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);

  const { friends, getFriends } = useFriendStore();
  const { getBlockedUsers } = useUserStore();
  const { user } = useAuthStore();
  const { loading, createConversation } = useChatStore();

  const handleGetFriends = async () => {
    try {
      await getFriends();

      // ưu tiên blocked ids từ user state (nhanh), fallback từ API blocked users
      const idsFromUser = user?.blockedUsers ?? [];
      if (idsFromUser.length > 0) {
        setBlockedIds(idsFromUser);
        return;
      }

      const blockedRes = await getBlockedUsers(1, 200);
      setBlockedIds((blockedRes.blockedUsers ?? []).map((u) => u._id));
    } catch (error) {
      console.error("Error to load friends/blocked users:", error);
      setBlockedIds([]);
    }
  };

  const selectableFriends = friends.filter(
    (friend) =>
      !blockedIds.includes(friend._id) &&
      !invitedUsers.some((u) => u._id === friend._id)
  );

  const handleSelectFriend = () => {
    if (!selectedFriendId) return;

    const friend = selectableFriends.find((f) => f._id === selectedFriendId);
    if (!friend) return;

    setInvitedUsers((prev) => [...prev, friend]);
    setSelectedFriendId("");
  };

  const handleRemoveFriend = (friend: Friend) => {
    setInvitedUsers((prev) => prev.filter((u) => u._id !== friend._id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();

      if (invitedUsers.length === 0) {
        toast.warning("You need to invite at least 1 user to group");
        return;
      }

      await createConversation(
        "group",
        groupName.trim(),
        invitedUsers.map((u) => u._id)
      );

      setGroupName("");
      setSelectedFriendId("");
      setInvitedUsers([]);
    } catch (error) {
      console.error("Error to handleSubmit in NewGroupChatModal:", error);
    }
  };

  return (
    <Dialog>
      <DialogTrigger nativeButton={false} render={<div />}>
        <Button
          variant="ghost"
          onClick={handleGetFriends}
          className="z-10 flex size-5 cursor-pointer items-center justify-center rounded-full transition hover:bg-sidebar-accent"
        >
          <Users className="size-4" />
          <span className="sr-only">Create group</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="border-none sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="capitalize">create new group message</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="groupName" className="text-sm font-semibold">
              Name group
            </Label>

            <Input
              id="groupName"
              placeholder="Input your name group here..."
              className="glass border-border/50 transition-smooth focus:border-primary/50"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite" className="text-sm font-semibold">
              Invite members
            </Label>

            <div className="flex gap-2">
              <select
                id="invite"
                value={selectedFriendId}
                onChange={(e) => setSelectedFriendId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={selectableFriends.length === 0}
              >
                <option value="">
                  {selectableFriends.length === 0
                    ? "No available friends to invite"
                    : "Select a friend to invite"}
                </option>

                {selectableFriends.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.displayName} (@{f.username})
                  </option>
                ))}
              </select>

              <Button
                type="button"
                variant="outline"
                onClick={handleSelectFriend}
                disabled={!selectedFriendId}
              >
                Add
              </Button>
            </div>

            <SelectedUsersList invitedUsers={invitedUsers} onRemove={handleRemoveFriend} />
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-chat text-white transition-smooth hover:opacity-90"
            >
              {loading ? (
                <span>Creating</span>
              ) : (
                <>
                  <UserPlus className="mr-2 size-4" />
                  Create group
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewGroupChatModal;
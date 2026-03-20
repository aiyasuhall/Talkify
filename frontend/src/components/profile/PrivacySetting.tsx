import { Shield, ShieldBan, Trash2, KeyRound } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState } from "react";
import { useUserStore } from "@/stores/useUserStore";
import { friendService } from "@/services/friendService";
import type { Friend } from "@/types/user";

const PrivacySettings = () => {
  const {
    changePassword,
    blockUserByUsername,
    deleteAccount,
    getBlockedUsers,
    unblockUser,
  } = useUserStore();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [selectedFriendUsername, setSelectedFriendUsername] = useState("");
  const [deletePassword, setDeletePassword] = useState("");

  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  const [blockedUsers, setBlockedUsers] = useState<Friend[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [blockedPage, setBlockedPage] = useState(1);
  const [hasMoreBlocked, setHasMoreBlocked] = useState(false);

  const blockedLimit = 8;

  const selectableFriends = useMemo(() => {
    const blockedIds = new Set(blockedUsers.map((u) => u._id));
    return friends.filter((f) => !blockedIds.has(f._id));
  }, [friends, blockedUsers]);

  const loadFriends = async () => {
    try {
      setLoadingFriends(true);
      const data = await friendService.getFriendList();
      setFriends(data);
    } finally {
      setLoadingFriends(false);
    }
  };

  const loadBlockedUsers = async (page = 1, append = false) => {
    try {
      setLoadingBlocked(true);
      const res = await getBlockedUsers(page, blockedLimit);
      setBlockedUsers((prev) =>
        append ? [...prev, ...res.blockedUsers] : res.blockedUsers
      );
      setBlockedPage(page);
      setHasMoreBlocked(Boolean(res.hasMore));
    } finally {
      setLoadingBlocked(false);
    }
  };

  useEffect(() => {
    loadBlockedUsers(1, false);
    loadFriends();
  }, []);

  useEffect(() => {
    if (
      selectedFriendUsername &&
      !selectableFriends.some((f) => f.username === selectedFriendUsername)
    ) {
      setSelectedFriendUsername("");
    }
  }, [selectedFriendUsername, selectableFriends]);

  const onChangePassword = async () => {
    if (!currentPassword || !newPassword) return;
    await changePassword({ currentPassword, newPassword });
    setCurrentPassword("");
    setNewPassword("");
  };

  const onBlockUser = async () => {
    if (!selectedFriendUsername) return;
    await blockUserByUsername(selectedFriendUsername);
    setSelectedFriendUsername("");
    await Promise.all([loadBlockedUsers(1, false), loadFriends()]);
  };

  const onUnblockUser = async (targetUserId: string) => {
    await unblockUser(targetUserId);
    await Promise.all([loadBlockedUsers(1, false), loadFriends()]);
  };

  const onDeleteAccount = async () => {
    if (!deletePassword) return;
    await deleteAccount(deletePassword);
  };

  return (
    <Card className="glass-strong border-border/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Privacy & Security
        </CardTitle>
        <CardDescription>
          Manage your privacy and security settings
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-3">
          <p className="font-medium">Change Password</p>
          <Input
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Button
            variant="outline"
            className="w-full justify-start glass-light border-border/30"
            onClick={onChangePassword}
          >
            <KeyRound className="mr-2 h-4 w-4" />
            Update Password
          </Button>
        </div>

        <div className="space-y-3">
          <p className="font-medium">Block User</p>

          <select
            value={selectedFriendUsername}
            onChange={(e) => setSelectedFriendUsername(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loadingFriends || selectableFriends.length === 0}
          >
            <option value="">
              {loadingFriends
                ? "Loading friends..."
                : selectableFriends.length === 0
                ? "No available friends to block"
                : "Select a friend to block"}
            </option>

            {selectableFriends.map((f) => (
              <option key={f._id} value={f.username}>
                {f.displayName} (@{f.username})
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            className="w-full justify-start glass-light border-border/30 hover:text-destructive"
            onClick={onBlockUser}
            disabled={!selectedFriendUsername}
          >
            <ShieldBan className="mr-2 size-4" />
            Block User
          </Button>
        </div>

        <div className="space-y-3">
          <p className="font-medium">Blocked Users</p>

          {loadingBlocked && (
            <p className="text-sm text-muted-foreground">Loading blocked users...</p>
          )}

          {!loadingBlocked && blockedUsers.length === 0 && (
            <p className="text-sm text-muted-foreground">No blocked users.</p>
          )}

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-primary/40 hover:[&::-webkit-scrollbar-thumb]:bg-primary/60">
            {!loadingBlocked &&
              blockedUsers.map((u) => (
                <div
                  key={u._id}
                  className="flex items-center justify-between rounded-md border border-border/30 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{u.displayName}</p>
                    <p className="truncate text-xs text-muted-foreground">@{u.username}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUnblockUser(u._id)}
                  >
                    Unblock
                  </Button>
                </div>
              ))}
          </div>

          {hasMoreBlocked && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => loadBlockedUsers(blockedPage + 1, true)}
              disabled={loadingBlocked}
            >
              Load More
            </Button>
          )}
        </div>

        <div className="space-y-3 border-t border-border/30 pt-4">
          <h4 className="font-medium text-destructive">Danger Zone</h4>
          <Input
            type="password"
            placeholder="Confirm your password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
          />
          <Button
            variant="destructive"
            className="w-full"
            onClick={onDeleteAccount}
          >
            <Trash2 className="mr-2 size-4" />
            Delete Account
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrivacySettings;
import { Sun, Moon } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useThemeStore } from "@/stores/useThemeStore";
import { useUserStore } from "@/stores/useUserStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSocketStore } from "@/stores/useSocketStore";
import { useEffect, useState } from "react";

const PreferencesForm = () => {
  const { isDark, toggleTheme } = useThemeStore();
  const { user } = useAuthStore();
  const { updatePreferences } = useUserStore();
  const { socket } = useSocketStore();

  const [showOnlineStatus, setShowOnlineStatus] = useState(
    user?.showOnlineStatus ?? true
  );
  const [isSavingOnlineStatus, setIsSavingOnlineStatus] = useState(false);

  useEffect(() => {
    setShowOnlineStatus(user?.showOnlineStatus ?? true);
  }, [user?.showOnlineStatus]);

  const handleOnlineStatus = async (checked: boolean) => {
    const previous = showOnlineStatus;

    setShowOnlineStatus(checked);
    setIsSavingOnlineStatus(true);

    try {
      await updatePreferences({ showOnlineStatus: checked });
      // notify socket server để broadcast lại online-users ngay lập tức
      socket?.emit("toggle-online-status", checked);
    } catch {
      setShowOnlineStatus(previous);
    } finally {
      setIsSavingOnlineStatus(false);
    }
  };

  return (
    <Card className="glass-strong border-border/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sun className="h-5 w-5 text-primary" />
          App Preferences
        </CardTitle>
        <CardDescription>Personalize your chat experience</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="theme-toggle" className="text-base font-medium">
              Dark Mode
            </Label>
            <p className="text-sm text-muted-foreground">
              Toggle between light and dark themes
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-muted-foreground" />
            <Switch
              id="theme-toggle"
              checked={isDark}
              onCheckedChange={toggleTheme}
              className="data-[state=checked]:bg-primary-glow"
            />
            <Moon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="online-status" className="text-base font-medium">
              Show Online Status
            </Label>
            <p className="text-sm text-muted-foreground">
              Let others see when you are online
            </p>
          </div>

          <Switch
            id="online-status"
            checked={showOnlineStatus}
            onCheckedChange={handleOnlineStatus}
            disabled={isSavingOnlineStatus}
            className="data-[state=checked]:bg-primary-glow"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default PreferencesForm;
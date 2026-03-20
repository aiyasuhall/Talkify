import { User as UserIcon } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { User } from "@/types/user";
import { useEffect, useState } from "react";
import { useUserStore } from "@/stores/useUserStore";

type EditableField = {
  key: keyof Pick<User, "displayName" | "username" | "email">;
  label: string;
  type?: string;
};

const PERSONAL_FIELDS: EditableField[] = [
  { key: "displayName", label: "Display Name" },
  { key: "username", label: "Username" },
  { key: "email", label: "Email", type: "email" },
];

type Props = { userInfo: User | null };

const PersonalInfoForm = ({ userInfo }: Props) => {
  const { updateProfile } = useUserStore();
  const [form, setForm] = useState({
    displayName: "",
    username: "",
    email: "",
    bio: "",
  });

  useEffect(() => {
    if (!userInfo) return;
    setForm({
      displayName: userInfo.displayName ?? "",
      username: userInfo.username ?? "",
      email: userInfo.email ?? "",
      bio: userInfo.bio ?? "",
    });
  }, [userInfo]);

  if (!userInfo) return null;

  const handleSave = async () => {
    await updateProfile({
      displayName: form.displayName,
      email: form.email,
      bio: form.bio,
    });
  };

  return (
    <Card className="glass-strong border-border/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserIcon className="h-5 w-5 text-primary" />
          Personal Information
        </CardTitle>
        <CardDescription>
          Update your personal details and profile information
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {PERSONAL_FIELDS.map(({ key, label, type }) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                type={type ?? "text"}
                value={form[key] ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [key]: e.target.value }))
                }
                className="glass-light border-border/30"
                disabled={key === "username"}
              />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            rows={3}
            value={form.bio}
            onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
            className="glass-light resize-none border-border/30"
          />
        </div>

        <Button
          className="w-full bg-gradient-primary transition-opacity hover:opacity-90 md:w-auto"
          onClick={handleSave}
        >
          Save Changes
        </Button>
      </CardContent>
    </Card>
  );
};

export default PersonalInfoForm;
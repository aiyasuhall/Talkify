import type { Dispatch, SetStateAction } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import ProfileCard from "./ProfileCard";
import { useAuthStore } from "@/stores/useAuthStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import PersonalInfoForm from "./PersonalInfoForm";
import PreferencesForm from "./PreferencesForm";
import PrivacySettings from "./PrivacySetting";

interface ProfileDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const ProfileDiaglog = ({ open, setOpen }: ProfileDialogProps) => {
  const { user } = useAuthStore();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[95vw] sm:max-w-lg p-0 bg-transparent border-0 shadow-2xl">
        <div className="bg-gradient-glass">
          <div className="mx-auto max-w-full p-4">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-bold text-foreground">
                Profile & Settings
              </DialogTitle>
            </DialogHeader>

            <ProfileCard user={user} />

            <Tabs defaultValue="personal" className="my-4 flex w-full flex-col gap-4">
              <TabsList className="grid w-full grid-cols-3 glass-light">
                <TabsTrigger value="personal" className="data-[state=active]:glass-strong">
                  Account
                </TabsTrigger>
                <TabsTrigger value="preferences" className="data-[state=active]:glass-strong">
                  Settings
                </TabsTrigger>
                <TabsTrigger value="privacy" className="data-[state=active]:glass-strong">
                  Security
                </TabsTrigger>
              </TabsList>

              <div className="h-[380px] overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-primary/40 hover:[&::-webkit-scrollbar-thumb]:bg-primary/60">
                <TabsContent value="personal">
                  <PersonalInfoForm userInfo={user} />
                </TabsContent>

                <TabsContent value="preferences">
                  <PreferencesForm />
                </TabsContent>

                <TabsContent value="privacy">
                  <PrivacySettings />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDiaglog;
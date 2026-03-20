import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogHeader } from "../ui/dialog";
import { UserPlus } from "lucide-react";
import type { User } from "@/types/user";
import { useFriendStore } from "@/stores/useFriendStore";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import SearchForm from "../addFriendModal/SearchForm";
import SendFriendRequest from "../addFriendModal/SendFriendRequest";

export interface IFormValues {
  username: string;
  message: string;
}

const AddFriendModal = () => {
  const [open, setOpen] = useState(false);
  const [isFound, setIsFound] = useState<boolean | null>(null);
  const [searchUser, setSearchUser] = useState<User | undefined>(undefined);
  const [searchedUsername, setSearchedUsername] = useState("");

  const { loading, searchByUsername, addFriend } = useFriendStore();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    resetField,
    formState: { errors },
  } = useForm<IFormValues>({
    defaultValues: { username: "", message: "" },
  });

  const usernameValue = watch("username");

  const handleCancel = () => {
    reset();
    setSearchedUsername("");
    setSearchUser(undefined);
    setIsFound(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      handleCancel();
    }
  };

  const handleSearch = handleSubmit(async (data) => {
    const username = data.username.trim();
    if (!username) return;

    setIsFound(null);
    setSearchedUsername(username);

    try {
      const foundUser = await searchByUsername(username);

      if (foundUser) {
        setSearchUser(foundUser);
        setIsFound(true);
      } else {
        setSearchUser(undefined);
        setIsFound(false);
      }
    } catch (error) {
      console.error(error);
      setSearchUser(undefined);
      setIsFound(false);
    }
  });

  const handleSend = handleSubmit(async (data) => {
    if (!searchUser) return;

    const intro = data.message?.trim() ?? "";

    try {
      const resultMessage = await addFriend(searchUser._id, intro);

      if (!resultMessage || /error|failed|fail/i.test(resultMessage)) {
        toast.error(resultMessage || "Failed to send friend request.");
        return;
      }

      toast.success(resultMessage);
      handleCancel();
      setOpen(false);
    } catch (error) {
      console.error("Error to send request from form.", error);
      toast.error("Failed to send friend request.");
    }
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger nativeButton={false} render={<div />}>
        <div className="z-10 flex size-5 cursor-pointer items-center justify-center rounded-full hover:bg-sidebar-accent">
          <UserPlus className="size-4" />
          <span className="sr-only">Add Friend</span>
        </div>
      </DialogTrigger>

      <DialogContent className="border-none sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Friend</DialogTitle>
        </DialogHeader>

        {!isFound && (
          <SearchForm
            register={register}
            errors={errors}
            usernameValue={usernameValue}
            loading={loading}
            isFound={isFound}
            searchedUsername={searchedUsername}
            onSubmit={handleSearch}
            onCancel={handleCancel}
          />
        )}

        {isFound && (
          <SendFriendRequest
            register={register}
            errors={errors}
            loading={loading}
            searchedUsername={searchedUsername}
            onSubmit={handleSend}
            onBack={() => {
              setIsFound(null);
              resetField("message");
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddFriendModal;
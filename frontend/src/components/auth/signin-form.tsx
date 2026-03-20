import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "../ui/label"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuthStore } from "@/stores/useAuthStore"
import { useNavigate } from "react-router"
import { toast } from "sonner";

const signInSchema = z.object({
  username: z.string().min(3, "Username must have at least 3 characters."),
  password: z.string().min(6, "Password must have at least 6 characters."),
}); // mô tả 1 đối tượng có nhiều trường

type SignInFormValues = z.infer<typeof signInSchema> // từ schema suy ra kiểu của form

export function SigninForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const { signIn } = useAuthStore();
    const navigate = useNavigate();

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignInFormValues>({
        resolver: zodResolver(signInSchema)
      
      });
    
      const onSubmit = async (data: SignInFormValues) => {
      const { username, password } = data;

      try {
        await signIn(username, password);
        navigate("/app");
      } catch (error) {
        toast.error("Login failed!");
      }
    };

    return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 border-border bg-white">
        <CardContent className="grid p-0 md:grid-cols-2 bg-white">
          <form className="p-6 md:p-8 bg-white" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              {/* header - logo */}
              <div className="flex flex-col items-center text-center gap-2">
                <a href="/"
                  className="mx-auto block w-fit text-center">
                  <img className="w-40 h-40 object-contain" src="/logo.svg" alt="logo" />
                </a>
                <h1 className="text-2xl font-bold"> Sign In! </h1>
                <p className="text-muted-foreground text-balance"> Welcome back!!! Sign in and have fun with your friends ^^</p>
              </div>

              {/* username */}
              <div className="flex flex-col gap-3">
                <Label htmlFor="username" className="block text-sm">
                  Username
                </Label>
                <Input
                  type="text"
                  id="username"
                  placeholder="talkify"
                  {...register("username")}
                />
                {errors.username && (
                  <p className="text-destructive text-sm"> {errors.username.message}</p>
                )}
              </div>

              {/* password */}
              <div className="flex flex-col gap-3">
                <Label htmlFor="password" className="block text-sm">
                  Password
                </Label>
                <Input
                  type="password"
                  id="password"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-destructive text-sm"> {errors.password.message}</p>
                )}
              </div>

              {/* nút đăng ký */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}>
                Sign In
              </Button>

              <div className="text-center text-sm">
                You don't have an account? {" "}
                <a href="/signup"
                  className="underline underline-offset-4">
                  Sign Up here!
                </a>
              </div>

            </div>
          </form>
          <div className="relative hidden md:block overflow-hidden bg-white">
            <img
            src="/placeholder.png"
            alt="Image"
            className="absolute inset-0 w-full h-full object-contain bg-white"
          />
          </div>
        </CardContent>
      </Card>
      <div className="text-xs text-balance px-6 text-center *:[a]:hover:text-primary text-muted-foreground *:[a]:underline *:[a]:underline-offetset-4">
        By clicking continue, you agree to our <a href="/terms">Terms of Service</a>{" "}
        and <a href="/privacy">Privacy Policy</a>.
      </div>
    </div>
  );
 }
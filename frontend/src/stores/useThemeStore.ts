// quản lí state và logic liên quan tới theme
import type { ThemeState } from "@/types/store"
import { create } from "zustand"
import { persist } from "zustand/middleware"

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            isDark: false,

            toggleTheme: () => {
                const newValue = !get().isDark;
                set({ isDark: newValue }); // cập nhật lại state

                if (newValue) {
                    document.documentElement.classList.add("dark")
                } else {
                    document.documentElement.classList.remove("dark")
                }
            },

            setTheme: (dark: boolean) => {
                set({ isDark: dark }); // set theme theo giá trị truyền vào

                if (dark) {
                    document.documentElement.classList.add("dark")
                } else {
                    document.documentElement.classList.remove("dark")
                }
            }
        }),
        {
            name: "theme-storage"
        }
    )
)
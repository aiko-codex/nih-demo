import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={`Switch to ${nextTheme} theme`}>
      {theme === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}

"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import React from "react";
import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";
import { VIEW_ANALYSIS_LINK } from "./hero-section";
import { WaitListDialog } from "./WaitListDialog";
import { joinWaitlist } from "@/app/actions";

export const HeroHeader = () => {
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [status, setStatus] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);


  async function handleSubmit(formData: FormData) {
    const result = await joinWaitlist(formData);
    if (result.error) {
      setStatus({ type: "error", message: result.error });
    } else {
      setStatus({
        type: "success",
        message: "Successfully joined the waitlist! 🚀",
      });
      setTimeout(() => {
        setIsDialogOpen(false);
        setStatus(null);
      }, 2000);
    }
  }
  return (
    <header>
      <nav className="fixed z-20 w-full px-2">
        <div
          className={cn(
            "mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12",
            isScrolled &&
              "bg-background/50 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5"
          )}
        >
          <div className="relative flex items-center justify-between gap-6 py-3 lg:py-4">
            <Link
              href="/"
              aria-label="home"
              className="flex items-center space-x-3 group"
            >
              <img src="/logo.jpeg" alt="HawkEye" width={200} height={100} />
            </Link>

            <div className="flex items-center gap-4">
              <Button
                onClick={() => setIsDialogOpen(true)}
                size="sm"
                className="cursor-pointer"
              >
                Join Waitlist
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="font-medium"
              >
                <Link href={VIEW_ANALYSIS_LINK}>View Analysis</Link>
              </Button>
            </div>
          </div>
        </div>
        <WaitListDialog
          isDialogOpen={isDialogOpen}
          setIsDialogOpen={setIsDialogOpen}
          handleSubmit={handleSubmit}
          status={status}
        />
      </nav>
    </header>
  );
};

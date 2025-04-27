import { Dialog } from "@radix-ui/react-dialog";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export const WaitListDialog = ({
  isDialogOpen,
  setIsDialogOpen,
  handleSubmit,
  status,
}: {
  isDialogOpen: boolean;
  setIsDialogOpen: (isDialogOpen: boolean) => void;
  handleSubmit: (formData: FormData) => Promise<void>;
  status: {
    type: "success" | "error";
    message: string;
  } | null;
}) => {
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join the Waitlist</DialogTitle>
          <DialogDescription>
            Be among the first to experience our powerful new agent. Enter your
            email to join the waitlist.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              required
              className="w-full px-4 py-2 rounded-lg border bg-background"
            />
          </div>
          <div>
            <textarea
              name="message"
              placeholder="Optional message (e.g., what features you're interested in)"
              className="w-full px-4 py-2 rounded-lg border bg-background"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full">
              Join Waitlist
            </Button>
          </DialogFooter>
        </form>

        {status && (
          <Alert
            variant={status?.type === "error" ? "destructive" : "default"}
            className="mt-4 w-full flex"
          >
            {status?.message}
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
};

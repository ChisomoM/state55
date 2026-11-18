import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AuthCard, AuthShell } from "@/components/auth/AuthShell";

/** Shown when a signed-in user opens a page their role cannot access. */
export default function UnauthorizedPage() {
  return (
    <AuthShell>
      <AuthCard title="Access restricted" subtitle="Your account doesn't have permission to open that page.">
        <Button asChild size="lg" className="w-full">
          <Link to="/">Go to my dashboard</Link>
        </Button>
      </AuthCard>
    </AuthShell>
  );
}

import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

export function ProfileSecurityTab({ onLogoutAll }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Security</CardTitle>
        <CardDescription>
          Sign out of every device where you are currently logged in.
        </CardDescription>
      </CardHeader>

      <Button variant="danger" onClick={onLogoutAll}>
        Log out of all devices
      </Button>
    </Card>
  );
}

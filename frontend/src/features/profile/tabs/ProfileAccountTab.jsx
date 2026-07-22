import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Alert } from "@/components/ui/Alert";
import { ProfileAvatarEditor } from "@/features/profile/ProfileAvatarEditor";

export function ProfileAccountTab({
  user,
  name,
  onNameChange,
  profileError,
  avatarError,
  onAvatarUpload,
  onAvatarRemove,
  isUploadingAvatar,
  isRemovingAvatar,
  onAvatarError,
  onSave,
  isSaving,
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Profile</CardTitle>
        <CardDescription>Your personal account details.</CardDescription>
      </CardHeader>

      {profileError ? (
        <Alert variant="error" className="mb-4">
          {profileError}
        </Alert>
      ) : null}

      {avatarError ? (
        <Alert variant="error" className="mb-4">
          {avatarError}
        </Alert>
      ) : null}

      <div className="space-y-4">
        <ProfileAvatarEditor
          user={user}
          onUpload={onAvatarUpload}
          onRemove={onAvatarRemove}
          isUploading={isUploadingAvatar}
          isRemoving={isRemovingAvatar}
          onError={onAvatarError}
        />
        <div className="space-y-2">
          <Label htmlFor="profile-name">Name</Label>
          <Input
            id="profile-name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
          />
        </div>
        <div>
          <p className="text-sm text-text-muted">Email</p>
          <p className="break-all font-medium">{user?.email}</p>
        </div>
        <div>
          <p className="text-sm text-text-muted">Role</p>
          <p className="font-medium capitalize">
            {user?.role?.replaceAll("_", " ")}
          </p>
        </div>
        <Button onClick={onSave} isLoading={isSaving}>
          Save profile
        </Button>
      </div>
    </Card>
  );
}

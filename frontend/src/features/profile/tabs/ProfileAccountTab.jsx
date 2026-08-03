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
  jobTitle,
  onJobTitleChange,
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
  const isTeamMember = user?.role === "team_member";

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
        {isTeamMember ? (
          <div className="space-y-2">
            <Label htmlFor="profile-role">Role</Label>
            <Input
              id="profile-role"
              value={jobTitle}
              onChange={(e) => onJobTitleChange(e.target.value)}
              placeholder="e.g. Frontend Developer"
              maxLength={80}
            />
            <p className="text-xs text-text-muted">
              This is shown next to your name in chat and community messages.
            </p>
          </div>
        ) : null}
        <div>
          <p className="text-sm text-text-muted">Email</p>
          <p className="break-all font-medium">{user?.email}</p>
        </div>
        {!isTeamMember ? (
          <div>
            <p className="text-sm text-text-muted">Role</p>
            <p className="font-medium capitalize">
              {user?.role?.replaceAll("_", " ")}
            </p>
          </div>
        ) : null}
        <Button onClick={onSave} isLoading={isSaving}>
          Save profile
        </Button>
      </div>
    </Card>
  );
}

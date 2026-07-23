import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/lib/authApi";
import { usersApi } from "@/lib/usersApi";
import { withMutationToasts } from "@/lib/mutationToasts";
import { useAuthStore } from "@/store/authStore";

export function useUpdateProfile() {
  return useMutation(
    withMutationToasts(
      {
        mutationFn: authApi.updateProfile,
        onSuccess: (result) => {
          if (result?.user) {
            useAuthStore.getState().setUser(result.user);
          }
        },
      },
      { success: "Profile updated." }
    )
  );
}

export function useChangePassword() {
  return useMutation(
    withMutationToasts(
      {
        mutationFn: authApi.changePassword,
      },
      { success: "Password updated." }
    )
  );
}

function updateUserInStore(result) {
  if (result?.user) {
    usersApi.clearAvatarCache(result.user.id);
    useAuthStore.getState().setUser(result.user);
  }
}

export function useUploadAvatar() {
  return useMutation(
    withMutationToasts(
      {
        mutationFn: authApi.uploadAvatar,
        onSuccess: updateUserInStore,
      },
      { success: "Profile photo updated." }
    )
  );
}

export function useDeleteAvatar() {
  return useMutation(
    withMutationToasts(
      {
        mutationFn: authApi.deleteAvatar,
        onSuccess: updateUserInStore,
      },
      { success: "Profile photo removed." }
    )
  );
}

import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/lib/authApi";
import { usersApi } from "@/lib/usersApi";
import { useAuthStore } from "@/store/authStore";

export function useUpdateProfile() {
  return useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (result) => {
      if (result?.user) {
        useAuthStore.getState().setUser(result.user);
      }
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: authApi.changePassword,
  });
}

function updateUserInStore(result) {
  if (result?.user) {
    usersApi.clearAvatarCache(result.user.id);
    useAuthStore.getState().setUser(result.user);
  }
}

export function useUploadAvatar() {
  return useMutation({
    mutationFn: authApi.uploadAvatar,
    onSuccess: updateUserInStore,
  });
}

export function useDeleteAvatar() {
  return useMutation({
    mutationFn: authApi.deleteAvatar,
    onSuccess: updateUserInStore,
  });
}

import * as authService from "../services/auth.service.js";

export async function getUserAvatar(req, res, next) {
  try {
    const { userId } = req.params;
    const avatar = await authService.getAvatarForViewer({
      viewer: req.user,
      targetUserId: userId,
    });

    if (!avatar) {
      return res.status(404).json({ message: "Avatar not found" });
    }

    res.set("Content-Type", avatar.mimeType);
    res.set("Cache-Control", "private, max-age=3600");
    res.send(avatar.data);
  } catch (err) {
    next(err);
  }
}

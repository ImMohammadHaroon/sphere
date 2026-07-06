import { z } from "zod";
const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

const orgRoles = ["org_admin", "project_manager", "team_member", "client"];

export const orgUserIdParamSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

export const updateUserRoleSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z
    .object({
      role: z.enum(orgRoles),
    })
    .strict(),
});

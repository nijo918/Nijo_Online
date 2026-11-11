import { developmentClient, findUser } from "./dev-common.mjs";
const client = developmentClient();
const email = process.env.ADMIN_EMAIL;
if (!email)
  throw new Error("Set ADMIN_EMAIL for an existing verified development user.");
const user = await findUser(client, email);
if (!user?.email_confirmed_at)
  throw new Error("Create and verify this account first.");
const { error } = await client.rpc("dev_set_admin", { p_user: user.id });
if (error) throw error;
console.log(
  "Development admin membership granted. Sign in again to refresh the interface.",
);

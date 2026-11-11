import { developmentClient, findUser } from "./dev-common.mjs";
const client = developmentClient({ localOnly: true });
for (const role of ["LEARNER", "ADMIN"]) {
  const email = process.env["DEMO_" + role + "_EMAIL"],
    password = process.env["DEMO_" + role + "_PASSWORD"];
  if (!email || !password || password.length < 10)
    throw new Error(
      "Supply DEMO_" +
        role +
        "_EMAIL and DEMO_" +
        role +
        "_PASSWORD (at least 10 characters) for this run.",
    );
  let user = await findUser(client, email);
  if (!user) {
    const { data, error } = await client.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: role === "ADMIN" ? "Demo Admin" : "Demo Learner",
      },
    });
    if (error) throw error;
    user = data.user;
  } else {
    const { error } = await client.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
    });
    if (error) throw error;
  }
  if (role === "ADMIN") {
    const { error } = await client.rpc("dev_set_admin", { p_user: user.id });
    if (error) throw error;
  }
  console.log(role + " development account ready.");
}

import { runRemote } from "./loutools";

export default async function Command() {
  await runRemote(["next"], "Next track");
}

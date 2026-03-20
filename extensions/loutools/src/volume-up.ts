import { runRemote } from "./loutools";

export default async function Command() {
  await runRemote(["volume", "+5"], "Volume up");
}

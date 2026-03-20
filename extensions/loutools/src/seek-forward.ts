import { runRemote } from "./loutools";

export default async function Command() {
  await runRemote(["seek", "+10"], "Skipped forward 10s");
}

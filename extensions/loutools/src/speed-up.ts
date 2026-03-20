import { runRemote } from "./loutools";

export default async function Command() {
  await runRemote(["speed", "+0.25"], "Speed +0.25x");
}

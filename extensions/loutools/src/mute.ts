import { runRemote } from "./loutools";

export default async function Command() {
  await runRemote(["mute"], "Mute toggled");
}

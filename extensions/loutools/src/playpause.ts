import { runRemote } from "./loutools";

export default async function Command() {
  await runRemote(["playpause"], "Play/Pause toggled");
}

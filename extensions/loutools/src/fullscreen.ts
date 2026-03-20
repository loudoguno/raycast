import { runRemote } from "./loutools";

export default async function Command() {
  await runRemote(["fullscreen"], "Fullscreen toggled");
}

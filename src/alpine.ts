import type { Alpine } from "alpinejs";
import { registerAppDrawerStore } from "./modules/app/drawerStore";
import { registerJsonStore } from "./store/jsonStore";

export default function initAlpine(Alpine: Alpine) {
  registerAppDrawerStore(Alpine);
  registerJsonStore(Alpine);

  if (typeof window !== "undefined") {
    window.Alpine = Alpine;
  }
}

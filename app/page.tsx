import Home from "@/components/screens/home";
import { SiteShell } from "@/components/site-shell";

export default function Page() {
  return (
    <SiteShell chrome={false}>
      <Home />
    </SiteShell>
  );
}

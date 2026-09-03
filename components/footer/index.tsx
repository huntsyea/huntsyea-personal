import { AppThemeSwitcher } from "@/components/theme";

const Footer = () => {
  return (
    <div className="flex w-full items-center justify-between border-border border-t pt-2">
      <div className="text-fg-muted text-sm">
        Built with love in Franklin, TN.
      </div>
      <div className="text-fg-muted text-sm">
        <AppThemeSwitcher />
      </div>
    </div>
  );
};

export { Footer };

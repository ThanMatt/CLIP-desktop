import { SettingsIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Lead, Small } from "../ui/typography";
import { Switch } from "../ui/switch";
import { Settings } from "../../../types";

type SettingsPopoverProps = {
  settings: Settings;
  onCheckedChange: (
    settingName: keyof Settings,
    value: Settings[keyof Settings]
  ) => void;
};

const SettingsPopover = ({
  settings,
  onCheckedChange,
}: SettingsPopoverProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          <SettingsIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="p-4" sideOffset={5}>
        <div className="space-y-4">
          <Lead>Settings</Lead>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <Small>Dark mode</Small>
              <Switch
                onCheckedChange={() => {
                  if (settings) {
                    onCheckedChange("darkMode", !settings?.darkMode);
                  }
                }}
                checked={!!settings?.darkMode}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <Small>Launch on startup</Small>
              <Switch
                onCheckedChange={() => {
                  if (settings) {
                    onCheckedChange(
                      "launchOnStartup",
                      !settings?.launchOnStartup
                    );
                  }
                }}
                checked={!!settings?.launchOnStartup}
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

SettingsPopover.displayName = "SettingsPopover";

export default SettingsPopover;

import { SettingsIcon, Info } from "lucide-react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Lead } from "../ui/typography";
import { Settings } from "../../../types";
import { SettingItem } from "../SettingItem";

type SettingsPopoverProps = {
  settings: Settings;
  onCheckedChange: (
    settingName: keyof Settings,
    value: Settings[keyof Settings]
  ) => void;
  onAboutClick: () => void;
};

const SettingsPopover = ({
  settings,
  onCheckedChange,
  onAboutClick,
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
            <SettingItem
              label="Dark mode"
              onCheckedChange={() => {
                if (settings) {
                  onCheckedChange("darkMode", !settings?.darkMode);
                }
              }}
              checked={!!settings?.darkMode}
            />
          </div>

          <div className="space-y-2">
            <SettingItem
              label="Launch on startup"
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
          <div className="space-y-2">
            <SettingItem
              label="Minimize on close"
              onCheckedChange={() => {
                if (settings) {
                  onCheckedChange(
                    "minimizeOnClose",
                    !settings?.minimizeOnClose
                  );
                }
              }}
              checked={!!settings?.minimizeOnClose}
            />
          </div>

          <div className="pt-2 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={onAboutClick}
            >
              <Info className="h-4 w-4 mr-2" />
              About
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

SettingsPopover.displayName = "SettingsPopover";

export default SettingsPopover;

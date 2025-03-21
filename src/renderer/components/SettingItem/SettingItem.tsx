import { Settings } from "../../../types";
import { Switch } from "../ui/switch";
import { Small } from "../ui/typography";

type SettingItemProps = {
  checked: Settings[keyof Settings];
  label: string;
  onCheckedChange: () => void;
};

const SettingItem = ({ checked, label, onCheckedChange }: SettingItemProps) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <Small>{label}</Small>
      <Switch onCheckedChange={onCheckedChange} checked={!!checked} />
    </div>
  );
};

SettingItem.displayName = "SettingItem";

export default SettingItem;

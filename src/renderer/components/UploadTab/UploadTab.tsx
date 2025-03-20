import { useState, useEffect } from "react";
import {
  Bird,
  Squirrel,
  Dog,
  Cat,
  Smile,
  Camera,
  Mouse,
  Fish,
  Rabbit,
  Turtle,
} from "lucide-react";
import { Subtle } from "../ui/typography";

const UploadTab = () => {
  const icons = [
    Bird,
    Squirrel,
    Dog,
    Cat,
    Smile,
    Camera,
    Mouse,
    Fish,
    Rabbit,
    Turtle,
  ];

  const randomIndex = Math.floor(Math.random() * icons.length);
  const IconComponent = icons[randomIndex];

  return (
    <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors">
      <IconComponent className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <Subtle>Coming soon...</Subtle>
    </div>
  );
};

UploadTab.displayName = "UploadTab";

export default UploadTab;

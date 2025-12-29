import {
  BookOpenTextIcon,
  LightbulbIcon,
  NotepadIcon,
} from "@phosphor-icons/react/dist/ssr";

export const SUGGESTIONS = [
  {
    label: "Teach",
    highlight: "Teach",
    prompt: "Teach",
    items: [
      "Teach how to tune a drivetrain for consistent autonomous path following",
      "Teach how to interpret scouting data to identify robot performance trends",
      "Teach best practices for configuring motor controllers and PID slots",
      "Teach routine electrical inspection steps to prevent match failures",
    ],
    icon: NotepadIcon,
  },
  {
    label: "Find",
    highlight: "Find",
    prompt: "Find",
    items: [
      "Find drivetrain configuration details in the technical binder",
      "Find subsystem design descriptions for scoring and manipulation mechanisms",
      "Find relevant rules and constraints from the game manual",
      "Find documented testing procedures or calibration steps in team documentation",
    ],
    icon: BookOpenTextIcon,
  },
  {
    label: "Explain",
    highlight: "Explain",
    prompt: "Explain",
    items: [
      "Explain common causes of autonomous drift and how teams mitigate them",
      "Explain how current limiting and voltage compensation affect robot behavior",
      "Explain tradeoffs between speed and accuracy in scoring mechanisms",
      "Explain how field layout and game rules influence robot design decisions",
    ],
    icon: LightbulbIcon,
  },
];

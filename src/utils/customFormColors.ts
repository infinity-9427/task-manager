import { TaskStatus, formAction, IColorSchema, StatusColorVariant } from "@/app/shared/types/tasks";

export const colorSchemeHelper = (action: string): IColorSchema => {
  return action === formAction.CREATE
    ? {
        primary: "teal-600",
        hover: "teal-700",
        focus: "teal-300",
        button: "bg-sky-700 hover:bg-sky-600 text-white",
        titleColor: "text-teal-700 dark:text-teal-300",
      }
    : {
        primary: "indigo-600",
        hover: "indigo-700",
        focus: "indigo-300",
        button: "bg-slate-600 hover:bg-slate-700 text-white",
        titleColor: "text-indigo-700 dark:text-indigo-300",
      };
};

const statusColorMap: Record<TaskStatus, StatusColorVariant> = {
  [TaskStatus.PENDING]: {
    selected: "bg-violet-500 text-white border border-violet-500",
    default: "bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-300",
  },
  [TaskStatus.IN_PROGRESS]: {
    selected: "bg-cyan-500 text-white border border-cyan-500",
    default: "bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-300",
  },
  [TaskStatus.COMPLETED]: {
    selected: "bg-emerald-600 text-white border border-emerald-400",
    default: "bg-emerald-100 text-lime-700 hover:bg-lime-100 border border-lime-300",
  },
};

const defaultStatusColor: StatusColorVariant = {
  selected: "bg-zinc-600 text-white border border-zinc-600",
  default: "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 border border-zinc-300",
};

export const getStatusColors = (status: TaskStatus, isSelected: boolean): string => {
  const colors = statusColorMap[status] || defaultStatusColor;
  return isSelected ? colors.selected : colors.default;
};
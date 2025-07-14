export const STATUS_COLORS = {
  yes: 'bg-green-500',
  no: 'bg-red-500',
  maybe: 'bg-yellow-500'
} as const;

export const STATUS_BUTTON_STYLES = {
  yes: "bg-green-600 text-white border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.5)]",
  no: "bg-red-600 text-white border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.5)]",
  maybe: "bg-yellow-600 text-white border-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.5)]"
} as const;

export const MAX_COMMENT_LENGTH = 150; 
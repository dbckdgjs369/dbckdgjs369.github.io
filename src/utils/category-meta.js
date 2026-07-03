// 카테고리별 이모지와 색상(hue). 썸네일 없이도 카드가 살아있도록.
const CATEGORY_META = {
  Algorithm: { emoji: "🌳", hue: 150 },
  JavaScript: { emoji: "🍋", hue: 90 },
  "Problem-Solving": { emoji: "🧩", hue: 170 },
  React: { emoji: "⚛️", hue: 190 },
  Web: { emoji: "🌐", hue: 130 },
}

const DEFAULT_META = { emoji: "🌱", hue: 145 }

export const getCategoryMeta = category => {
  const key = Array.isArray(category) ? category[0] : category
  return CATEGORY_META[key] || DEFAULT_META
}

export const getCategoryName = category =>
  Array.isArray(category) ? category[0] : category || "Etc"

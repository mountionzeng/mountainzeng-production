export interface VisualVideoItem {
  id: string;
  title: string;
  fileName: string;
}

export interface VisualImageItem {
  id: string;
  title: string;
  fileName: string;
}

export const DEFAULT_VISUAL_CDN_BASE_URL = "https://mountion.oss-cn-beijing.aliyuncs.com/visual";

const TOTAL_VISUAL_CLIPS = 43;
const TOTAL_VISUAL_IMAGES = 67;
// 直接按原始文件编号剔除的图片
const EXCLUDED_VISUAL_IMAGE_NUMBERS = new Set([2]);
// 布局规则：前两张是独占行，其余按 3 列排布
const VISUAL_SOLO_ROW_COUNT = 2;
const VISUAL_GRID_COLUMN_COUNT = 3;
// 按“排版后的行号”剔除整行（含起止）
const EXCLUDED_VISUAL_IMAGE_ROW_RANGE = { start: 4, end: 11 };
// 在前面筛选后，再按展示位置剔除单张
const EXCLUDED_VISUAL_IMAGE_DISPLAY_POSITIONS = new Set([6]);

export const VISUAL_VIDEO_ITEMS: VisualVideoItem[] = Array.from(
  { length: TOTAL_VISUAL_CLIPS },
  (_, index) => {
    const clipNo = index + 1;
    return {
      id: `visual-clip-${clipNo}`,
      title: `视觉片段 ${String(clipNo).padStart(2, "0")}`,
      fileName: `media${clipNo}.mov`,
    };
  }
);

const rawVisualImageItems: VisualImageItem[] = Array.from(
  { length: TOTAL_VISUAL_IMAGES },
  (_, index) => {
    const imageNo = index + 1;
    return {
      id: `visual-image-${imageNo}`,
      title: `视觉图片 ${String(imageNo).padStart(2, "0")}`,
      fileName: `image${imageNo}.jpg`,
    };
  }
).filter((item) => {
  const imageNo = Number(item.fileName.replace(/^image(\d+)\.jpg$/i, "$1"));
  return !EXCLUDED_VISUAL_IMAGE_NUMBERS.has(imageNo);
});

function getVisualLayoutRowByIndex(index: number): number {
  // 前两张单独成行，后续按 3 列网格换算行号
  if (index <= VISUAL_SOLO_ROW_COUNT) {
    return index;
  }
  const gridIndex = index - VISUAL_SOLO_ROW_COUNT - 1;
  return VISUAL_SOLO_ROW_COUNT + Math.floor(gridIndex / VISUAL_GRID_COLUMN_COUNT) + 1;
}

const visualImagesAfterRowFilter = rawVisualImageItems.filter((_, index) => {
  const row = getVisualLayoutRowByIndex(index + 1);
  return row < EXCLUDED_VISUAL_IMAGE_ROW_RANGE.start || row > EXCLUDED_VISUAL_IMAGE_ROW_RANGE.end;
});

// 最终导出的图片列表：先删原始编号，再删排版行，再删指定展示位
export const VISUAL_IMAGE_ITEMS: VisualImageItem[] = visualImagesAfterRowFilter.filter((_, index) => {
  const displayPosition = index + 1;
  return !EXCLUDED_VISUAL_IMAGE_DISPLAY_POSITIONS.has(displayPosition);
});

export const VISUAL_TEXT_SNIPPETS = [
  "曾翔羽",
  "《长津湖》",
  "《巨怪猎人》",
  "《长安三万里》",
  "《哈利波特》",
  "CG",
  "动画",
  "概念设计",
  "《侍神令》",
  "本科",
  "作品",
  "近期作品",
  "《白蛇：缘起》",
  "祝好～",
] as const;

export function buildVisualVideoUrl(
  cdnBaseUrl: string | undefined,
  fileName: string
): string | null {
  if (!cdnBaseUrl) return null;
  const normalized = cdnBaseUrl.trim().replace(/\/+$/, "");
  if (!normalized) return null;
  return `${normalized}/${fileName}`;
}

export function buildVisualPosterUrl(
  cdnBaseUrl: string | undefined,
  fileName: string
): string | null {
  if (!cdnBaseUrl) return null;
  const normalized = cdnBaseUrl.trim().replace(/\/+$/, "");
  if (!normalized) return null;
  const posterFileName = fileName.replace(/\.mov$/i, ".jpg");
  return `${normalized}/posters/${posterFileName}`;
}

export function buildVisualImageUrl(
  cdnBaseUrl: string | undefined,
  fileName: string
): string | null {
  if (!cdnBaseUrl) return null;
  const normalized = cdnBaseUrl.trim().replace(/\/+$/, "");
  if (!normalized) return null;
  return `${normalized}/images/${fileName}`;
}

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

export interface VisualMixedMediaItem {
  id: string;
  title: string;
  kind: "image" | "video";
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

// 中文注释：AIGC 栏目视频，顺序与用户本地目录保持一致（按文件名顺序）
const AIGC_VIDEO_FILE_NAMES = [
  "01.mp4",
  "02.mp4",
  "03.mp4",
  "04.mp4",
  "05.mp4",
  "06.mp4",
  "07.mp4",
  "08.mp4",
  "11.mp4",
  "12.mp4",
  "13.mp4",
  "14.mp4",
  "15.mp4",
  "16.mp4",
  "17.mp4",
  "18.mp4",
  "19.mp4",
  "20.mp4",
  "23.mp4",
  "24.mp4",
] as const;

export const VISUAL_AIGC_VIDEO_ITEMS: VisualVideoItem[] = AIGC_VIDEO_FILE_NAMES.map((fileName, index) => ({
  id: `visual-aigc-${index + 1}`,
  title: `AIGC ${String(index + 1).padStart(2, "0")}`,
  fileName,
}));

const TOTAL_CLASSIC_CG_IMAGES = 21;
const TOTAL_CLASSIC_CG_CLIPS = 43;

// 中文注释：古法视效栏目图片，按本地文件顺序（图片1.png ~ 图片21.png）映射为 01.png ~ 21.png
const CLASSIC_CG_IMAGE_FILE_NAMES = Array.from({ length: TOTAL_CLASSIC_CG_IMAGES }, (_, index) =>
  `${String(index + 1).padStart(2, "0")}.png`
);

// 中文注释：古法视效栏目视频，按本地文件顺序（视频1.mov ~ 视频43.mov）映射为 01.mp4 ~ 43.mp4
const CLASSIC_CG_VIDEO_FILE_NAMES = Array.from({ length: TOTAL_CLASSIC_CG_CLIPS }, (_, index) =>
  `${String(index + 1).padStart(2, "0")}.mp4`
);

const VISUAL_CLASSIC_CG_IMAGE_ITEMS: VisualImageItem[] = CLASSIC_CG_IMAGE_FILE_NAMES.map((fileName, index) => ({
  id: `visual-classic-cg-image-${index + 1}`,
  title: `古法图片 ${String(index + 1).padStart(2, "0")}`,
  fileName,
}));

export const VISUAL_CLASSIC_CG_VIDEO_ITEMS: VisualVideoItem[] = CLASSIC_CG_VIDEO_FILE_NAMES.map(
  (fileName, index) => ({
    id: `visual-classic-cg-video-${index + 1}`,
    title: `古法视效 ${String(index + 1).padStart(2, "0")}`,
    fileName,
  })
);

// 中文注释：古法栏目的展示顺序按“同编号交叉”：图片1→视频1→图片2→视频2 ...，剩余视频继续顺延
export const VISUAL_CLASSIC_CG_MEDIA_ITEMS: VisualMixedMediaItem[] = (() => {
  const merged: VisualMixedMediaItem[] = [];
  // 中文注释：按用户新需求删除最底部尾部素材，只保留“图片+视频”成对交叉内容
  const total = Math.min(VISUAL_CLASSIC_CG_IMAGE_ITEMS.length, VISUAL_CLASSIC_CG_VIDEO_ITEMS.length);

  for (let index = 0; index < total; index += 1) {
    const imageItem = VISUAL_CLASSIC_CG_IMAGE_ITEMS[index];
    merged.push({
      id: imageItem.id,
      title: imageItem.title,
      kind: "image",
      fileName: imageItem.fileName,
    });

    const videoItem = VISUAL_CLASSIC_CG_VIDEO_ITEMS[index];
    merged.push({
      id: videoItem.id,
      title: videoItem.title,
      kind: "video",
      fileName: videoItem.fileName,
    });
  }

  return merged;
})();

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

export function buildVisualAigcVideoUrl(
  cdnBaseUrl: string | undefined,
  fileName: string
): string {
  const normalized = (cdnBaseUrl ?? "").trim().replace(/\/+$/, "");
  if (normalized) {
    return `${normalized}/aigc/${fileName}`;
  }
  // 中文注释：未配置 CDN 时本地兜底，方便开发调试
  return `/visual-local/aigc/${fileName}`;
}

export function buildVisualClassicCgVideoUrl(
  cdnBaseUrl: string | undefined,
  fileName: string
): string {
  const normalized = (cdnBaseUrl ?? "").trim().replace(/\/+$/, "");
  if (normalized) {
    return `${normalized}/gufa-cg/${fileName}`;
  }
  // 中文注释：未配置 CDN 时本地兜底，方便开发调试
  return `/visual-local/gufa-cg/${fileName}`;
}

export function buildVisualClassicCgImageUrl(
  cdnBaseUrl: string | undefined,
  fileName: string
): string {
  const normalized = (cdnBaseUrl ?? "").trim().replace(/\/+$/, "");
  if (normalized) {
    return `${normalized}/gufa-cg/images/${fileName}`;
  }
  // 中文注释：未配置 CDN 时本地兜底，方便开发调试
  return `/visual-local/gufa-cg/images/${fileName}`;
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

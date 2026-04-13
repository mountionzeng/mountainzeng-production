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

// 中文注释：旧版视觉图库/视频区素材已下线，数量置 0，避免页面继续渲染历史数据
const TOTAL_VISUAL_CLIPS = 0;
const TOTAL_VISUAL_IMAGES = 0;
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

// 中文注释：AIGC 栏目混合媒体，顺序按用户文件夹顺序；其中 02.mov 已转换为 02.mp4
const AIGC_MEDIA_SEQUENCE: Array<{ kind: "video" | "image"; fileName: string }> = [
  { kind: "video", fileName: "01.mp4" },
  { kind: "video", fileName: "02.mp4" },
  { kind: "video", fileName: "03.mp4" },
  { kind: "video", fileName: "04.mp4" },
  { kind: "video", fileName: "05.mp4" },
  { kind: "video", fileName: "06.mp4" },
  { kind: "video", fileName: "07.mp4" },
  { kind: "video", fileName: "08.mp4" },
  { kind: "image", fileName: "09.png" },
  { kind: "image", fileName: "10.png" },
  { kind: "video", fileName: "11.mp4" },
  { kind: "video", fileName: "12.mp4" },
  { kind: "video", fileName: "13.mp4" },
  { kind: "video", fileName: "14.mp4" },
  { kind: "video", fileName: "15.mp4" },
  { kind: "video", fileName: "16.mp4" },
  { kind: "video", fileName: "17.mp4" },
  { kind: "video", fileName: "18.mp4" },
  { kind: "video", fileName: "19.mp4" },
  { kind: "video", fileName: "20.mp4" },
  { kind: "image", fileName: "21.webp" },
  { kind: "image", fileName: "22.webp" },
  { kind: "video", fileName: "23.mp4" },
  { kind: "video", fileName: "24.mp4" },
];

export const VISUAL_AIGC_MEDIA_ITEMS: VisualMixedMediaItem[] = AIGC_MEDIA_SEQUENCE.map((item, index) => ({
  id: `visual-aigc-${item.kind}-${index + 1}`,
  title: `AIGC ${String(index + 1).padStart(2, "0")}`,
  kind: item.kind,
  fileName: item.fileName,
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

// 中文注释：古法原始本地编号（混合图/视频）：
// 中文注释：1-5 图、6-33 视频、34-36 图、37-51 视频、52-64 图
const CLASSIC_CG_LOCAL_IMAGE_NUMBERS = [1, 2, 3, 4, 5, 34, 35, 36, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64];
const CLASSIC_CG_LOCAL_VIDEO_NUMBERS = [
  ...Array.from({ length: 28 }, (_, index) => index + 6),
  ...Array.from({ length: 15 }, (_, index) => index + 37),
];
const CLASSIC_CG_LOCAL_IMAGE_NUMBER_SET = new Set(CLASSIC_CG_LOCAL_IMAGE_NUMBERS);
const CLASSIC_CG_LOCAL_VIDEO_NUMBER_SET = new Set(CLASSIC_CG_LOCAL_VIDEO_NUMBERS);

// 中文注释：从 PPT（/Users/yuandai/Desktop/作品的迁移/网站需要的东西/简历/曾翔羽 作品.pptx）识别出的“同内容素材”顺序（按首次出现）
// 中文注释：未识别到的图片不参与重排，保持原位不动
const CLASSIC_CG_PPT_RECOGNIZED_LOCAL_ORDER = [
  5, 4, 6, 9, 8, 7, 13, 11, 12, 14, 16, 15, 17, 18, 19, 22, 20, 21, 24, 23, 25, 26, 30, 27, 29, 28, 32, 33, 31, 37,
  38, 39, 40, 41, 42, 43, 45, 44, 46, 48, 47, 50, 49, 51, 52, 53, 57, 56, 55, 54,
];
const CLASSIC_CG_PPT_RECOGNIZED_SET = new Set(CLASSIC_CG_PPT_RECOGNIZED_LOCAL_ORDER);

function mapClassicCgLocalNumberToMedia(localNumber: number): VisualMixedMediaItem | null {
  if (CLASSIC_CG_LOCAL_IMAGE_NUMBER_SET.has(localNumber)) {
    const imageIndex = CLASSIC_CG_LOCAL_IMAGE_NUMBERS.indexOf(localNumber) + 1;
    return {
      id: `visual-classic-cg-image-local-${localNumber}`,
      title: `古法图片 ${String(localNumber).padStart(2, "0")}`,
      kind: "image",
      fileName: `${String(imageIndex).padStart(2, "0")}.png`,
    };
  }

  if (CLASSIC_CG_LOCAL_VIDEO_NUMBER_SET.has(localNumber)) {
    const videoIndex = CLASSIC_CG_LOCAL_VIDEO_NUMBERS.indexOf(localNumber) + 1;
    return {
      id: `visual-classic-cg-video-local-${localNumber}`,
      title: `古法视效 ${String(localNumber).padStart(2, "0")}`,
      kind: "video",
      fileName: `${String(videoIndex).padStart(2, "0")}.mp4`,
    };
  }

  return null;
}

// 中文注释：先按本地自然顺序生成，再仅重排“识别到的素材槽位”
// 中文注释：这样未识别图片保持原位，不会被误处理
const CLASSIC_CG_LOCAL_BASE_ORDER = Array.from({ length: 64 }, (_, index) => index + 1).filter(
  (localNumber) =>
    CLASSIC_CG_LOCAL_IMAGE_NUMBER_SET.has(localNumber) || CLASSIC_CG_LOCAL_VIDEO_NUMBER_SET.has(localNumber)
);

const CLASSIC_CG_LOCAL_REORDERED_ORDER = (() => {
  const reordered = [...CLASSIC_CG_LOCAL_BASE_ORDER];
  const recognizedSlots = CLASSIC_CG_LOCAL_BASE_ORDER.reduce<number[]>((slots, localNumber, index) => {
    if (CLASSIC_CG_PPT_RECOGNIZED_SET.has(localNumber)) slots.push(index);
    return slots;
  }, []);

  recognizedSlots.forEach((slotIndex, index) => {
    const nextLocalNumber = CLASSIC_CG_PPT_RECOGNIZED_LOCAL_ORDER[index];
    if (typeof nextLocalNumber === "number") {
      reordered[slotIndex] = nextLocalNumber;
    }
  });

  return reordered;
})();

export const VISUAL_CLASSIC_CG_MEDIA_ITEMS: VisualMixedMediaItem[] = CLASSIC_CG_LOCAL_REORDERED_ORDER.map(
  (localNumber) => mapClassicCgLocalNumberToMedia(localNumber)
).filter((item): item is VisualMixedMediaItem => item !== null);

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

export function buildVisualAigcImageUrl(
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

function appendOssProcess(url: string, process: string): string {
  // 中文注释：本地调试资源不走 OSS 处理参数，避免无效请求
  if (!url || url.startsWith("/")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}x-oss-process=${process}`;
}

export function buildVisualGalleryImageUrl(url: string, width: number): string {
  // 中文注释：画廊仅加载压缩缩略图，点击预览再看原图，降低首屏体积
  const safeWidth = Math.max(320, Math.floor(width));
  return appendOssProcess(url, `image/resize,w_${safeWidth},m_lfit/quality,q_75/format,webp`);
}

export function buildVisualVideoSnapshotPosterUrl(
  videoUrl: string,
  width = 960
): string | null {
  // 中文注释：本地路径无法做 OSS 快照，直接返回空
  if (!videoUrl || videoUrl.startsWith("/")) return null;
  const safeWidth = Math.max(320, Math.floor(width));
  return appendOssProcess(videoUrl, `video/snapshot,t_0,f_jpg,w_${safeWidth},m_fast`);
}

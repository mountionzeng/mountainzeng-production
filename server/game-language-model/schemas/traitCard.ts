/*
 * Trait Card schema —— 服务端这一侧补充：颜色与图标白名单
 * 共享的字段定义在 shared/traitCard.ts
 *
 * 图标列表说明：
 * - 全部使用 lucide-react 图标名（PascalCase）
 * - 数量保持在 ~300，用作 tool input_schema 的 enum 约束
 * - 即便个别图标名在某些 lucide 版本中缺失，前端 renderIcon 已有 Sparkles 兜底
 * - 按语义分组只是为了人类维护，模型只看到扁平 enum
 */

export type { TraitCard, TraitCardDraft } from "../../../shared/traitCard";

/** 模型可选择的特质卡主题色板。控制视觉一致性，避免输出任意 hex */
export const TRAIT_CARD_COLORS = [
  "#FF6B6B", // 暖珊瑚
  "#FFD93D", // 明黄
  "#6BCB77", // 草绿
  "#4D96FF", // 天蓝
  "#9B59B6", // 紫
  "#FF9F43", // 橙
  "#1ABC9C", // 青
  "#E84393", // 玫红
] as const;

/** 模型可选择的 lucide 图标白名单（约 300 个，按语义分组方便人类维护） */
export const TRAIT_CARD_ICONS = [
  // 方向 / 探索
  "Compass", "Anchor", "Map", "MapPin", "MapPinned", "Navigation", "Navigation2",
  "Route", "Signpost", "Crosshair", "Target", "Footprints", "Milestone", "Flag",
  "FlagTriangleRight", "Waypoints", "Telescope", "Binoculars", "Mountain",
  "MountainSnow", "Globe", "Earth", "Tent", "Backpack",
  // 出行 / 载具
  "Sailboat", "Ship", "Plane", "Rocket", "Train", "Car", "Bike", "Truck", "Bus",
  // 光 / 星 / 灵感
  "Sun", "Sunrise", "Sunset", "SunMoon", "Moon", "MoonStar", "Star", "Stars",
  "Sparkles", "Sparkle", "Lightbulb", "Lamp", "Flashlight", "Wand", "Wand2",
  "Rainbow", "Aperture",
  // 能量 / 火 / 电
  "Zap", "Flame", "Plug", "PlugZap", "BatteryFull", "Power", "Atom", "Orbit",
  // 大地 / 山水 / 元素
  "Cloud", "CloudRain", "CloudSnow", "CloudLightning", "CloudDrizzle", "CloudFog",
  "CloudHail", "Cloudy", "Snowflake", "Droplet", "Droplets", "Waves", "Umbrella",
  "Wind", "Tornado",
  // 植物 / 生长
  "Sprout", "Leaf", "LeafyGreen", "TreePine", "TreeDeciduous", "Trees", "Flower",
  "Flower2", "Cherry", "Apple", "Grape", "Banana", "Carrot", "Wheat", "Cactus",
  "Clover", "Citrus",
  // 动物 / 生灵
  "Bird", "Fish", "FishSymbol", "Cat", "Dog", "Rabbit", "Squirrel", "Turtle",
  "Bug", "Snail", "Egg", "Feather", "Shell", "Rat", "PawPrint", "Bone", "Skull",
  // 心 / 身 / 感官
  "Heart", "HeartHandshake", "HeartPulse", "HeartCrack", "Brain", "Eye", "EyeOff",
  "Ear", "EarOff", "Hand", "HandHeart", "HandMetal", "Handshake", "Smile",
  "Frown", "Meh", "Angry", "Laugh",
  // 关系 / 群体
  "Users", "User", "UserPlus", "UserCheck", "UserCircle", "Users2", "Contact",
  "Network", "Share", "Share2", "Link", "Link2",
  // 沟通 / 表达
  "MessageCircle", "MessageSquare", "MessagesSquare", "Mail", "MailOpen", "Send",
  "Phone", "Smartphone", "Megaphone", "Mic", "MicVocal", "Speech", "Quote",
  "Languages", "Tv", "Radio", "Bell", "BellRing",
  // 工具 / 手作
  "Hammer", "Wrench", "Screwdriver", "Saw", "Pickaxe", "Axe", "Drill", "Magnet",
  "Scissors", "Paperclip", "Pen", "PenLine", "PenTool", "Pencil", "Brush",
  "PaintBucket", "Palette", "Eraser", "Ruler", "Settings", "Cog",
  // 知识 / 书 / 信息
  "Book", "BookOpen", "BookOpenText", "BookHeart", "BookMarked", "Library",
  "Bookmark", "Newspaper", "Notebook", "NotebookPen", "FileText", "Files",
  "Archive", "ScrollText", "Scroll", "GraduationCap", "School", "Award",
  // 时间 / 节奏
  "Clock", "Hourglass", "Timer", "Watch", "Calendar", "CalendarHeart", "History",
  "Repeat", "RotateCcw", "RotateCw",
  // 思考 / 逻辑 / 代码
  "Code", "Code2", "Codepen", "Terminal", "Cpu", "Database", "Server",
  "GitBranch", "GitMerge", "GitPullRequest", "GitFork", "Hash", "Layers",
  "LayoutGrid", "Grid3x3", "Boxes", "Box", "Package", "PackageOpen", "Workflow",
  "Sigma", "FunctionSquare",
  // 形状 / 几何
  "Circle", "CircleDot", "Square", "Triangle", "Hexagon", "Octagon", "Diamond",
  "Spade", "Club", "Pyramid", "Cone", "Cylinder", "Asterisk", "Disc", "Infinity",
  "Squircle", "Slash", "Plus", "Minus",
  // 建筑 / 居所
  "Building", "Building2", "Castle", "Church", "Hospital", "Hotel", "Store",
  "Factory", "Warehouse", "Landmark", "Home", "House", "Door", "DoorOpen",
  "DoorClosed",
  // 守护 / 战斗
  "Shield", "ShieldCheck", "ShieldHeart", "ShieldHalf", "Sword", "Swords",
  "Lock", "LockOpen", "Unlock", "Key", "KeyRound", "KeySquare", "Fingerprint",
  // 游戏 / 表演
  "Dices", "Gamepad", "Gamepad2", "Joystick", "Puzzle", "Drum", "Guitar",
  "Piano", "Music", "Headphones", "Theater",
  // 财富 / 价值 / 嘉奖
  "Gem", "Crown", "Trophy", "Medal", "Ribbon", "Gift", "DollarSign", "Coins",
  "Wallet", "PiggyBank",
  // 神秘 / 科学 / 魔法
  "Ghost", "Dna", "Microscope", "FlaskConical", "TestTube", "Beaker",
] as const;

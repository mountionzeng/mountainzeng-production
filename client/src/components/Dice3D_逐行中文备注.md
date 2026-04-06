# Dice3D.tsx 逐行中文备注

- 原文件：`/Users/yuandai/Documents/New project/mountainzeng-production/client/src/components/Dice3D.tsx`
- 总行数：398
- 说明：左列是源码行号与原文，右列是逐行中文备注。

| 行号 | 原代码 | 中文备注 |
|---:|---|---|
| 1 | `/*` | 块注释开始：说明该文件的总体定位。 |
| 2 | ` * 3D Dice — 高级版本` | 块注释内容：补充设计说明。 |
| 3 | ` * 更精致的材质、光影和动画效果` | 块注释内容：补充设计说明。 |
| 4 | ` */` | 块注释结束。 |
| 5 | `(空行)` | 空行：用于分隔逻辑块，提升可读性。 |
| 6 | `import { useState, useRef, useCallback, useEffect } from "react";` | 导入依赖模块，供当前组件使用。 |
| 7 | `import type { SVGProps, TransitionEvent } from "react";` | 导入 TypeScript 类型定义，运行时不会打包为值。 |
| 8 | `import * as LucideIcons from "lucide-react";` | 导入依赖模块，供当前组件使用。 |
| 9 | `import { DICE_FACES } from "@/lib/diceData";` | 导入依赖模块，供当前组件使用。 |
| 10 | `import {` | 导入依赖模块，供当前组件使用。 |
| 11 | `  buildSpinRotation,` | 调用旋转引擎计算目标角度。 |
| 12 | `  getSpinDurationMs,` | 根据模式读取本次旋转时长。 |
| 13 | `  randomFaceId,` | 随机选择骰子面编号。 |
| 14 | `  SPIN_CONFIG,` | 对象/参数列表中的当前字段或参数项。 |
| 15 | `  type SpinMode,` | 定义联合类型或别名，限制取值范围。 |
| 16 | `} from "@/lib/diceEngine";` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 17 | `(空行)` | 空行：用于分隔逻辑块，提升可读性。 |
| 18 | `// 图标渲染辅助函数` | 行注释：解释当前代码意图。 |
| 19 | `const renderIcon = (iconName: string, props: SVGProps<SVGSVGElement> & { className?: string }) => {` | 声明函数常量，封装可复用逻辑。 |
| 20 | `  const IconComponent = (LucideIcons as any)[iconName];` | 声明常量或引用，保存配置/状态句柄。 |
| 21 | `  return IconComponent ? <IconComponent {...props} /> : <span className={props.className}>{iconName}</span>;` | 返回结果并结束当前函数/分支。 |
| 22 | `};` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 23 | `(空行)` | 空行：用于分隔逻辑块，提升可读性。 |
| 24 | `interface Dice3DProps {` | 定义类型接口，约束 props/状态结构。 |
| 25 | `  onFaceSelected: (faceId: number) => void;` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 26 | `  isRolling: boolean;` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 27 | `  onRollStart: () => void;` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 28 | `  onTargetFaceSettled?: () => void;` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 29 | `  targetFace?: number;` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 30 | `  activeColor?: string;` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 31 | `}` | 代码块边界：表示作用域开始/结束。 |
| 32 | `(空行)` | 空行：用于分隔逻辑块，提升可读性。 |
| 33 | `const IDLE_RESUME_DELAY_MS = 300;` | 声明常量或引用，保存配置/状态句柄。 |
| 34 | `const SPIN_END_FALLBACK_MS = 80;` | 声明常量或引用，保存配置/状态句柄。 |
| 35 | `(空行)` | 空行：用于分隔逻辑块，提升可读性。 |
| 36 | `interface SpinState {` | 定义类型接口，约束 props/状态结构。 |
| 37 | `  id: number;` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 38 | `  faceId: number;` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 39 | `  mode: SpinMode;` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 40 | `  completed: boolean;` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 41 | `}` | 代码块边界：表示作用域开始/结束。 |
| 42 | `(空行)` | 空行：用于分隔逻辑块，提升可读性。 |
| 43 | `export default function Dice3D({` | 导出主组件：Dice3D。 |
| 44 | `  onFaceSelected,` | 对象/参数列表中的当前字段或参数项。 |
| 45 | `  isRolling,` | 对象/参数列表中的当前字段或参数项。 |
| 46 | `  onRollStart,` | 对象/参数列表中的当前字段或参数项。 |
| 47 | `  onTargetFaceSettled,` | 对象/参数列表中的当前字段或参数项。 |
| 48 | `  targetFace,` | 对象/参数列表中的当前字段或参数项。 |
| 49 | `  activeColor,` | 对象/参数列表中的当前字段或参数项。 |
| 50 | `}: Dice3DProps) {` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 51 | `  const cubeSize = "clamp(46.8px, 6.48vw, 75.6px)";` | 声明常量或引用，保存配置/状态句柄。 |
| 52 | `  const cubeRef = useRef<HTMLDivElement>(null);` | 声明常量或引用，保存配置/状态句柄。 |
| 53 | `  const [rotation, setRotation] = useState({ x: -20, y: 25 });` | 声明常量或引用，保存配置/状态句柄。 |
| 54 | `  const [spinDurationMs, setSpinDurationMs] = useState(SPIN_CONFIG.fastDurationMs);` | 声明常量或引用，保存配置/状态句柄。 |
| 55 | `  const [isIdle, setIsIdle] = useState(true);` | 声明常量或引用，保存配置/状态句柄。 |
| 56 | `  const idleRef = useRef<number>(0);` | 声明常量或引用，保存配置/状态句柄。 |
| 57 | `  const spinEndTimeoutRef = useRef<ReturnType<typeof setTimeout> \| null>(null);` | 声明常量或引用，保存配置/状态句柄。 |
| 58 | `  const spinStateRef = useRef<SpinState \| null>(null);` | 声明常量或引用，保存配置/状态句柄。 |
| 59 | `  const finishSpinRef = useRef<(spinId: number) => void>(() => undefined);` | 声明函数常量，封装可复用逻辑。 |
| 60 | `  const spinQueueRef = useRef<number[]>([]);` | 声明常量或引用，保存配置/状态句柄。 |
| 61 | `  const isSpinningRef = useRef(false);` | 声明常量或引用，保存配置/状态句柄。 |
| 62 | `  const shouldResumeIdleRef = useRef(true);` | 声明常量或引用，保存配置/状态句柄。 |
| 63 | `(空行)` | 空行：用于分隔逻辑块，提升可读性。 |
| 64 | `  // Idle 悬浮动画` | 行注释：解释当前代码意图。 |
| 65 | `  useEffect(() => {` | 使用 useEffect 管理副作用与清理逻辑。 |
| 66 | `    if (!isIdle \|\| isRolling) return;` | 条件分支：根据当前状态决定后续流程。 |
| 67 | `    let t = 0;` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 68 | `    const baseX = -20;` | 声明常量或引用，保存配置/状态句柄。 |
| 69 | `    const baseY = 25;` | 声明常量或引用，保存配置/状态句柄。 |
| 70 | `    const animate = () => {` | 声明函数常量，封装可复用逻辑。 |
| 71 | `      t += 0.005;` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 72 | `      setRotation({` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 73 | `        x: baseX + Math.sin(t * 0.8) * 5,` | 通过正弦函数生成周期变化，实现漂浮感。 |
| 74 | `        y: baseY + Math.sin(t * 1.2) * 6,` | 通过正弦函数生成周期变化，实现漂浮感。 |
| 75 | `      });` | 代码块边界：表示作用域开始/结束。 |
| 76 | `      idleRef.current = requestAnimationFrame(animate);` | 注册浏览器逐帧回调，实现平滑动画。 |
| 77 | `    };` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 78 | `    idleRef.current = requestAnimationFrame(animate);` | 注册浏览器逐帧回调，实现平滑动画。 |
| 79 | `    return () => cancelAnimationFrame(idleRef.current);` | 取消逐帧动画，避免内存泄漏与重复循环。 |
| 80 | `  }, [isIdle, isRolling]);` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 81 | `(空行)` | 空行：用于分隔逻辑块，提升可读性。 |
| 82 | `  const clearSpinEndTimeout = useCallback(() => {` | 声明函数常量，封装可复用逻辑。 |
| 83 | `    if (spinEndTimeoutRef.current) {` | 条件分支：根据当前状态决定后续流程。 |
| 84 | `      clearTimeout(spinEndTimeoutRef.current);` | 清理定时器，防止脏状态回调。 |
| 85 | `      spinEndTimeoutRef.current = null;` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 86 | `    }` | 代码块边界：表示作用域开始/结束。 |
| 87 | `  }, []);` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 88 | `(空行)` | 空行：用于分隔逻辑块，提升可读性。 |
| 89 | `  const startSpin = useCallback(` | 声明常量或引用，保存配置/状态句柄。 |
| 90 | `    (faceId: number, mode: SpinMode) => {` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 91 | `      setIsIdle(false);` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 92 | `      cancelAnimationFrame(idleRef.current);` | 取消逐帧动画，避免内存泄漏与重复循环。 |
| 93 | `      clearSpinEndTimeout();` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 94 | `(空行)` | 空行：用于分隔逻辑块，提升可读性。 |
| 95 | `      isSpinningRef.current = true;` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 96 | `      shouldResumeIdleRef.current = mode === "random";` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 97 | `(空行)` | 空行：用于分隔逻辑块，提升可读性。 |
| 98 | `      const durationMs = getSpinDurationMs(mode, SPIN_CONFIG);` | 声明常量或引用，保存配置/状态句柄。 |
| 99 | `      setSpinDurationMs(durationMs);` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 100 | `(空行)` | 空行：用于分隔逻辑块，提升可读性。 |
| 101 | `      const finalRotation = buildSpinRotation(faceId, mode, SPIN_CONFIG);` | 声明常量或引用，保存配置/状态句柄。 |
| 102 | `      const spinId = Date.now() + Math.random();` | 声明常量或引用，保存配置/状态句柄。 |
| 103 | `(空行)` | 空行：用于分隔逻辑块，提升可读性。 |
| 104 | `      spinStateRef.current = {` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 105 | `        id: spinId,` | 对象/参数列表中的当前字段或参数项。 |
| 106 | `        faceId,` | 对象/参数列表中的当前字段或参数项。 |
| 107 | `        mode,` | 对象/参数列表中的当前字段或参数项。 |
| 108 | `        completed: false,` | 对象/参数列表中的当前字段或参数项。 |
| 109 | `      };` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 110 | `(空行)` | 空行：用于分隔逻辑块，提升可读性。 |
| 111 | `      setRotation(finalRotation);` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 112 | `      spinEndTimeoutRef.current = setTimeout(` | 注册定时器，控制动画完成时机或延迟行为。 |
| 113 | `        () => finishSpinRef.current(spinId),` | 对象/参数列表中的当前字段或参数项。 |
| 114 | `        durationMs + SPIN_END_FALLBACK_MS` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 115 | `      );` | 结束当前函数调用或表达式。 |
| 116 | `    },` | 代码块边界：表示作用域开始/结束。 |
| 117 | `    [clearSpinEndTimeout]` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 118 | `  );` | 结束当前函数调用或表达式。 |
| 119 | `(空行)` | 空行：用于分隔逻辑块，提升可读性。 |
| 120 | `  const finishSpin = useCallback(` | 声明常量或引用，保存配置/状态句柄。 |
| 121 | `    (spinId: number) => {` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 122 | `      const currentSpin = spinStateRef.current;` | 声明常量或引用，保存配置/状态句柄。 |
| 123 | `      if (!currentSpin \|\| currentSpin.id !== spinId \|\| currentSpin.completed) return;` | 条件分支：根据当前状态决定后续流程。 |
| 124 | `(空行)` | 空行：用于分隔逻辑块，提升可读性。 |
| 125 | `      currentSpin.completed = true;` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 126 | `      spinStateRef.current = null;` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 127 | `      isSpinningRef.current = false;` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 128 | `      clearSpinEndTimeout();` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 129 | `(空行)` | 空行：用于分隔逻辑块，提升可读性。 |
| 130 | `      if (currentSpin.mode === "random") {` | 条件分支：根据当前状态决定后续流程。 |
| 131 | `        // 随机滚动结束后清空队列，避免历史请求串入` | 行注释：解释当前代码意图。 |
| 132 | `        spinQueueRef.current = [];` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 133 | `        onFaceSelected(currentSpin.faceId);` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 134 | `        return;` | 返回结果并结束当前函数/分支。 |
| 135 | `      }` | 代码块边界：表示作用域开始/结束。 |
| 136 | `(空行)` | 空行：用于分隔逻辑块，提升可读性。 |
| 137 | `      // 目标面滚动只保留最新请求，按顺序消费` | 行注释：解释当前代码意图。 |
| 138 | `      if (spinQueueRef.current.length > 0) {` | 条件分支：根据当前状态决定后续流程。 |
| 139 | `        const nextFaceId = spinQueueRef.current[spinQueueRef.current.length - 1];` | 声明常量或引用，保存配置/状态句柄。 |
| 140 | `        spinQueueRef.current = [];` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 141 | `        startSpin(nextFaceId, "target");` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 142 | `        return;` | 返回结果并结束当前函数/分支。 |
| 143 | `      }` | 代码块边界：表示作用域开始/结束。 |
| 144 | `(空行)` | 空行：用于分隔逻辑块，提升可读性。 |
| 145 | `      onTargetFaceSettled?.();` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 146 | `    },` | 代码块边界：表示作用域开始/结束。 |
| 147 | `    [clearSpinEndTimeout, onFaceSelected, onTargetFaceSettled, startSpin]` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 148 | `  );` | 结束当前函数调用或表达式。 |
| 149 | `(空行)` | 空行：用于分隔逻辑块，提升可读性。 |
| 150 | `  useEffect(() => {` | 使用 useEffect 管理副作用与清理逻辑。 |
| 151 | `    finishSpinRef.current = finishSpin;` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 152 | `  }, [finishSpin]);` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 153 | `(空行)` | 空行：用于分隔逻辑块，提升可读性。 |
| 154 | `  const requestTargetSpin = useCallback(` | 声明常量或引用，保存配置/状态句柄。 |
| 155 | `    (faceId: number) => {` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 156 | `      const currentSpin = spinStateRef.current;` | 声明常量或引用，保存配置/状态句柄。 |
| 157 | `      // 快档随机滚动期间忽略标签请求，避免与随机揭示流程冲突` | 行注释：解释当前代码意图。 |
| 158 | `      if (currentSpin?.mode === "random") return;` | 条件分支：根据当前状态决定后续流程。 |
| 159 | `(空行)` | 空行：用于分隔逻辑块，提升可读性。 |
| 160 | `      if (!isSpinningRef.current) {` | 条件分支：根据当前状态决定后续流程。 |
| 161 | `        startSpin(faceId, "target");` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 162 | `        return;` | 返回结果并结束当前函数/分支。 |
| 163 | `      }` | 代码块边界：表示作用域开始/结束。 |
| 164 | `(空行)` | 空行：用于分隔逻辑块，提升可读性。 |
| 165 | `      // 队列只保留最新目标，防止快速点击产生过多排队` | 行注释：解释当前代码意图。 |
| 166 | `      spinQueueRef.current = [faceId];` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 167 | `    },` | 代码块边界：表示作用域开始/结束。 |
| 168 | `    [startSpin]` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 169 | `  );` | 结束当前函数调用或表达式。 |
| 170 | `(空行)` | 空行：用于分隔逻辑块，提升可读性。 |
| 171 | `  const roll = useCallback(() => {` | 声明函数常量，封装可复用逻辑。 |
| 172 | `    if (isRolling \|\| isSpinningRef.current) return;` | 条件分支：根据当前状态决定后续流程。 |
| 173 | `    onRollStart();` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 174 | `    spinQueueRef.current = [];` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 175 | `    const selectedFace = randomFaceId(DICE_FACES.length);` | 声明常量或引用，保存配置/状态句柄。 |
| 176 | `    startSpin(selectedFace, "random");` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 177 | `  }, [isRolling, onRollStart, startSpin]);` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 178 | `(空行)` | 空行：用于分隔逻辑块，提升可读性。 |
| 179 | `  // 标签切换时联动骰子旋转到对应面（不触发详情弹层）` | 行注释：解释当前代码意图。 |
| 180 | `  useEffect(() => {` | 使用 useEffect 管理副作用与清理逻辑。 |
| 181 | `    if (!targetFace) return;` | 条件分支：根据当前状态决定后续流程。 |
| 182 | `    requestTargetSpin(targetFace);` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 183 | `  }, [requestTargetSpin, targetFace]);` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 184 | `(空行)` | 空行：用于分隔逻辑块，提升可读性。 |
| 185 | `  const handleCubeTransitionEnd = useCallback(` | 声明常量或引用，保存配置/状态句柄。 |
| 186 | `    (event: TransitionEvent<HTMLDivElement>) => {` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 187 | `      if (event.target !== cubeRef.current \|\| event.propertyName !== "transform") return;` | 条件分支：根据当前状态决定后续流程。 |
| 188 | `      const currentSpin = spinStateRef.current;` | 声明常量或引用，保存配置/状态句柄。 |
| 189 | `      if (!currentSpin) return;` | 条件分支：根据当前状态决定后续流程。 |
| 190 | `      finishSpinRef.current(currentSpin.id);` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 191 | `    },` | 代码块边界：表示作用域开始/结束。 |
| 192 | `    []` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 193 | `  );` | 结束当前函数调用或表达式。 |
| 194 | `(空行)` | 空行：用于分隔逻辑块，提升可读性。 |
| 195 | `  useEffect(() => {` | 使用 useEffect 管理副作用与清理逻辑。 |
| 196 | `    return () => {` | 开始返回 JSX 视图结构。 |
| 197 | `      cancelAnimationFrame(idleRef.current);` | 取消逐帧动画，避免内存泄漏与重复循环。 |
| 198 | `      clearSpinEndTimeout();` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 199 | `      spinQueueRef.current = [];` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 200 | `      isSpinningRef.current = false;` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 201 | `      spinStateRef.current = null;` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 202 | `    };` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 203 | `  }, [clearSpinEndTimeout]);` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 204 | `(空行)` | 空行：用于分隔逻辑块，提升可读性。 |
| 205 | `  useEffect(() => {` | 使用 useEffect 管理副作用与清理逻辑。 |
| 206 | `    if (!isRolling) {` | 条件分支：根据当前状态决定后续流程。 |
| 207 | `      if (!shouldResumeIdleRef.current) {` | 条件分支：根据当前状态决定后续流程。 |
| 208 | `        setIsIdle(false);` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 209 | `        return;` | 返回结果并结束当前函数/分支。 |
| 210 | `      }` | 代码块边界：表示作用域开始/结束。 |
| 211 | `      const timer = setTimeout(() => {` | 声明函数常量，封装可复用逻辑。 |
| 212 | `        setIsIdle(true);` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 213 | `      }, IDLE_RESUME_DELAY_MS);` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 214 | `      return () => clearTimeout(timer);` | 清理定时器，防止脏状态回调。 |
| 215 | `    }` | 代码块边界：表示作用域开始/结束。 |
| 216 | `  }, [isRolling]);` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 217 | `(空行)` | 空行：用于分隔逻辑块，提升可读性。 |
| 218 | `  return (` | 开始返回 JSX 视图结构。 |
| 219 | `    <div className="flex flex-col items-center select-none gap-10">` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 220 | `      {/* 3D 场景 */}` | 代码块边界：表示作用域开始/结束。 |
| 221 | `      <div` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 222 | `        className="relative group"` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 223 | `        style={{` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 224 | `          perspective: "1200px",` | 对象/参数列表中的当前字段或参数项。 |
| 225 | `          perspectiveOrigin: "50% 50%",` | 对象/参数列表中的当前字段或参数项。 |
| 226 | `        }}` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 227 | `      >` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 228 | `        {/* 背景光晕 - 更强烈 */}` | 代码块边界：表示作用域开始/结束。 |
| 229 | `        <div` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 230 | `          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-all duration-1000"` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 231 | `          style={{` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 232 | `            width: isRolling ? "600px" : "500px",` | 对象/参数列表中的当前字段或参数项。 |
| 233 | `            height: isRolling ? "600px" : "500px",` | 对象/参数列表中的当前字段或参数项。 |
| 234 | `            background: isRolling` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 235 | `              ? "radial-gradient(circle, rgba(139,92,246,0.12) 0%, rgba(244,114,182,0.065) 40%, transparent 70%)"` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 236 | `              : "radial-gradient(circle, rgba(139,92,246,0.065) 0%, rgba(244,114,182,0.032) 40%, transparent 70%)",` | 对象/参数列表中的当前字段或参数项。 |
| 237 | `            filter: \`blur(${isRolling ? 60 : 50}px)\`,` | 对象/参数列表中的当前字段或参数项。 |
| 238 | `          }}` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 239 | `        />` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 240 | `(空行)` | 空行：用于分隔逻辑块，提升可读性。 |
| 241 | `        {/* 特定页面的彩色光晕 */}` | 代码块边界：表示作用域开始/结束。 |
| 242 | `        {activeColor && !isRolling && (` | 代码块边界：表示作用域开始/结束。 |
| 243 | `          <div` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 244 | `            key={activeColor}` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 245 | `            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 246 | `            style={{` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 247 | `              width: "550px",` | 对象/参数列表中的当前字段或参数项。 |
| 248 | `              height: "550px",` | 对象/参数列表中的当前字段或参数项。 |
| 249 | `              background: \`radial-gradient(circle, ${activeColor}60 0%, ${activeColor}32 35%, transparent 65%)\`,` | 对象/参数列表中的当前字段或参数项。 |
| 250 | `              filter: "blur(50px)",` | 对象/参数列表中的当前字段或参数项。 |
| 251 | `              willChange: "opacity",` | 对象/参数列表中的当前字段或参数项。 |
| 252 | `              animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",` | 对象/参数列表中的当前字段或参数项。 |
| 253 | `            }}` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 254 | `          />` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 255 | `        )}` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 256 | `(空行)` | 空行：用于分隔逻辑块，提升可读性。 |
| 257 | `        {/* 地面阴影 */}` | 代码块边界：表示作用域开始/结束。 |
| 258 | `        <div` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 259 | `          className="absolute left-1/2 -translate-x-1/2 pointer-events-none transition-all duration-700"` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 260 | `          style={{` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 261 | `            bottom: "-60px",` | 对象/参数列表中的当前字段或参数项。 |
| 262 | `            width: isRolling ? "180px" : "280px",` | 对象/参数列表中的当前字段或参数项。 |
| 263 | `            height: "80px",` | 对象/参数列表中的当前字段或参数项。 |
| 264 | `            background: "radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 40%, transparent 70%)",` | 对象/参数列表中的当前字段或参数项。 |
| 265 | `            filter: "blur(25px)",` | 对象/参数列表中的当前字段或参数项。 |
| 266 | `            opacity: isRolling ? 0.4 : 0.8,` | 对象/参数列表中的当前字段或参数项。 |
| 267 | `          }}` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 268 | `        />` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 269 | `(空行)` | 空行：用于分隔逻辑块，提升可读性。 |
| 270 | `        {/* 骰子容器 */}` | 代码块边界：表示作用域开始/结束。 |
| 271 | `        <div` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 272 | `          className="cursor-pointer hover:scale-[1.02] transition-transform duration-300"` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 273 | `          onClick={roll}` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 274 | `          style={{` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 275 | `            width: \`calc(${cubeSize} * 2.2)\`,` | 对象/参数列表中的当前字段或参数项。 |
| 276 | `            height: \`calc(${cubeSize} * 2.2)\`,` | 对象/参数列表中的当前字段或参数项。 |
| 277 | `            transformStyle: "preserve-3d",` | 对象/参数列表中的当前字段或参数项。 |
| 278 | `            willChange: "transform",` | 对象/参数列表中的当前字段或参数项。 |
| 279 | `          }}` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 280 | `        >` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 281 | `          {/* 骰子立方体 */}` | 代码块边界：表示作用域开始/结束。 |
| 282 | `          <div` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 283 | `            ref={cubeRef}` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 284 | `            onTransitionEnd={handleCubeTransitionEnd}` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 285 | `            style={{` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 286 | `              width: "100%",` | 对象/参数列表中的当前字段或参数项。 |
| 287 | `              height: "100%",` | 对象/参数列表中的当前字段或参数项。 |
| 288 | `              transformStyle: "preserve-3d",` | 对象/参数列表中的当前字段或参数项。 |
| 289 | `              transform: \`translateZ(0) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)\`,` | 对象/参数列表中的当前字段或参数项。 |
| 290 | `              transition: isRolling` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 291 | `                ? \`transform ${spinDurationMs}ms cubic-bezier(0.12, 0.84, 0.2, 1)\`` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 292 | `                : "none",` | 对象/参数列表中的当前字段或参数项。 |
| 293 | `              willChange: "transform",` | 对象/参数列表中的当前字段或参数项。 |
| 294 | `              backfaceVisibility: "hidden",` | 对象/参数列表中的当前字段或参数项。 |
| 295 | `              WebkitBackfaceVisibility: "hidden",` | 对象/参数列表中的当前字段或参数项。 |
| 296 | `            }}` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 297 | `          >` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 298 | `            {DICE_FACES.map((face, i) => {` | 代码块边界：表示作用域开始/结束。 |
| 299 | `              const transforms = [` | 声明常量或引用，保存配置/状态句柄。 |
| 300 | `                \`translateZ(${cubeSize})\`,` | 对象/参数列表中的当前字段或参数项。 |
| 301 | `                \`rotateY(-90deg) translateZ(${cubeSize})\`,` | 对象/参数列表中的当前字段或参数项。 |
| 302 | `                \`rotateX(90deg) translateZ(${cubeSize})\`,` | 对象/参数列表中的当前字段或参数项。 |
| 303 | `                \`rotateX(-90deg) translateZ(${cubeSize})\`,` | 对象/参数列表中的当前字段或参数项。 |
| 304 | `                \`rotateY(90deg) translateZ(${cubeSize})\`,` | 对象/参数列表中的当前字段或参数项。 |
| 305 | `                \`rotateY(180deg) translateZ(${cubeSize})\`,` | 对象/参数列表中的当前字段或参数项。 |
| 306 | `              ];` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 307 | `(空行)` | 空行：用于分隔逻辑块，提升可读性。 |
| 308 | `              const r = parseInt(face.color.slice(1, 3), 16);` | 声明常量或引用，保存配置/状态句柄。 |
| 309 | `              const g = parseInt(face.color.slice(3, 5), 16);` | 声明常量或引用，保存配置/状态句柄。 |
| 310 | `              const b = parseInt(face.color.slice(5, 7), 16);` | 声明常量或引用，保存配置/状态句柄。 |
| 311 | `(空行)` | 空行：用于分隔逻辑块，提升可读性。 |
| 312 | `              const glowBoost = isRolling ? 2 : 1;` | 声明常量或引用，保存配置/状态句柄。 |
| 313 | `(空行)` | 空行：用于分隔逻辑块，提升可读性。 |
| 314 | `              return (` | 开始返回 JSX 视图结构。 |
| 315 | `                <div` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 316 | `                  key={face.id}` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 317 | `                  className={\`absolute inset-0 flex flex-col items-center justify-center gap-2 ${` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 318 | `                    isRolling ? "" : "backdrop-blur-sm"` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 319 | `                  }\`}` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 320 | `                  style={{` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 321 | `                    transform: transforms[i],` | 对象/参数列表中的当前字段或参数项。 |
| 322 | `                    background: \`linear-gradient(135deg, rgba(20,20,25,0.95) 0%, rgba(12,12,16,0.98) 50%, rgba(8,8,10,1) 100%)\`,` | 对象/参数列表中的当前字段或参数项。 |
| 323 | `                    border: \`1px solid rgba(${r},${g},${b},${0.42 * glowBoost})\`,` | 对象/参数列表中的当前字段或参数项。 |
| 324 | `                    borderRadius: "16px",` | 对象/参数列表中的当前字段或参数项。 |
| 325 | `                    boxShadow: \`0 0 20px rgba(${r},${g},${b},${0.16 * glowBoost})\`,` | 对象/参数列表中的当前字段或参数项。 |
| 326 | `                    backfaceVisibility: "hidden",` | 对象/参数列表中的当前字段或参数项。 |
| 327 | `                    WebkitBackfaceVisibility: "hidden",` | 对象/参数列表中的当前字段或参数项。 |
| 328 | `                    transformStyle: "preserve-3d",` | 对象/参数列表中的当前字段或参数项。 |
| 329 | `                    willChange: "transform",` | 对象/参数列表中的当前字段或参数项。 |
| 330 | `                    overflow: "hidden",` | 对象/参数列表中的当前字段或参数项。 |
| 331 | `                  }}` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 332 | `                >` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 333 | `                  {/* 角标编号 */}` | 代码块边界：表示作用域开始/结束。 |
| 334 | `                  <div` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 335 | `                    className="absolute top-4 left-4 text-xs font-bold tracking-wider"` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 336 | `                    style={{` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 337 | `                      fontFamily: "var(--font-label)",` | 对象/参数列表中的当前字段或参数项。 |
| 338 | `                      color: \`rgba(${r},${g},${b},0.42)\`,` | 对象/参数列表中的当前字段或参数项。 |
| 339 | `                      textShadow: \`0 0 10px rgba(${r},${g},${b},0.24)\`,` | 对象/参数列表中的当前字段或参数项。 |
| 340 | `                    }}` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 341 | `                  >` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 342 | `                    {String(face.id).padStart(2, "0")}` | 代码块边界：表示作用域开始/结束。 |
| 343 | `                  </div>` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 344 | `(空行)` | 空行：用于分隔逻辑块，提升可读性。 |
| 345 | `                  {/* 中心光效 */}` | 代码块边界：表示作用域开始/结束。 |
| 346 | `                  <div className="relative flex items-center justify-center">` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 347 | `                    <div` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 348 | `                      className="absolute rounded-full animate-pulse"` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 349 | `                      style={{` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 350 | `                        width: "90px",` | 对象/参数列表中的当前字段或参数项。 |
| 351 | `                        height: "90px",` | 对象/参数列表中的当前字段或参数项。 |
| 352 | `                        background: \`radial-gradient(circle, rgba(${r},${g},${b},0.16) 0%, rgba(${r},${g},${b},0.04) 50%, transparent 70%)\`,` | 对象/参数列表中的当前字段或参数项。 |
| 353 | `                        filter: "blur(20px)",` | 对象/参数列表中的当前字段或参数项。 |
| 354 | `                      }}` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 355 | `                    />` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 356 | `                    <span` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 357 | `                      className="relative text-4xl sm:text-5xl md:text-6xl"` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 358 | `                      style={{` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 359 | `                        color: face.color,` | 对象/参数列表中的当前字段或参数项。 |
| 360 | `                        filter: \`drop-shadow(0 0 15px rgba(${r},${g},${b},0.5)) drop-shadow(0 0 30px rgba(${r},${g},${b},0.24))\`,` | 对象/参数列表中的当前字段或参数项。 |
| 361 | `                      }}` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 362 | `                    >` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 363 | `                      {renderIcon(face.icon, { className: "w-10 h-10" })}` | 代码块边界：表示作用域开始/结束。 |
| 364 | `                    </span>` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 365 | `                  </div>` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 366 | `(空行)` | 空行：用于分隔逻辑块，提升可读性。 |
| 367 | `                  {/* 副标题 */}` | 代码块边界：表示作用域开始/结束。 |
| 368 | `                  <span` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 369 | `                    className="text-[9px] sm:text-[10px] tracking-[0.4em] uppercase font-medium"` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 370 | `                    style={{` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 371 | `                      fontFamily: "var(--font-label)",` | 对象/参数列表中的当前字段或参数项。 |
| 372 | `                      color: \`rgba(${r},${g},${b},0.62)\`,` | 对象/参数列表中的当前字段或参数项。 |
| 373 | `                      textShadow: \`0 0 8px rgba(${r},${g},${b},0.32)\`,` | 对象/参数列表中的当前字段或参数项。 |
| 374 | `                    }}` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 375 | `                  >` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 376 | `                    {face.subtitle}` | 代码块边界：表示作用域开始/结束。 |
| 377 | `                  </span>` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 378 | `(空行)` | 空行：用于分隔逻辑块，提升可读性。 |
| 379 | `                  {/* 底部装饰线 */}` | 代码块边界：表示作用域开始/结束。 |
| 380 | `                  <div` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 381 | `                    className="absolute bottom-0 left-[15%] right-[15%] h-[2px]"` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 382 | `                    style={{` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 383 | `                      background: \`linear-gradient(90deg, transparent, rgba(${r},${g},${b},0.24), transparent)\`,` | 对象/参数列表中的当前字段或参数项。 |
| 384 | `                    }}` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 385 | `                  />` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 386 | `                </div>` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 387 | `              );` | 结束当前函数调用或表达式。 |
| 388 | `            })}` | 实现骰子组件的状态流转、动画控制或视图细节。 |
| 389 | `          </div>` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 390 | `        </div>` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 391 | `      </div>` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 392 | `(空行)` | 空行：用于分隔逻辑块，提升可读性。 |
| 393 | `      {/* 投掷按钮 */}` | 代码块边界：表示作用域开始/结束。 |
| 394 | `      ` | 空行：用于分隔逻辑块，提升可读性。 |
| 395 | `    </div>` | JSX 结构行：定义界面元素、样式或动画属性。 |
| 396 | `  );` | 结束当前函数调用或表达式。 |
| 397 | `}` | 代码块边界：表示作用域开始/结束。 |
| 398 | `(空行)` | 空行：用于分隔逻辑块，提升可读性。 |

import { useEffect, useState, type ReactNode } from "react";

const STORY_VIDEO_URL = "/videos/sheself-v1-20260824.mp4";
const STORY_POSTER_URL = "/images/qiji-followup/sheself-cover.png";

const SHIGUANG_VIDEO_URL = "/videos/shiguang-hackathon-20260830.mp4";
const SHIGUANG_POSTER_URL = "/images/qiji-followup/shiguang-cover.jpg";

const productViews = [
  {
    id: "chat-bot",
    label: "Chat Bot",
    body: "随时识别到用户的意图（比方说用户只是想开心，咱们会生成一个喜剧的剧本。用户想和某个人建立联系，咱们就会分析他们之间可能产生情感共鸣的因素），随时感知用户选中的每一张图，每一段文字，并学习用户的每一次修改行为，以及分析该内容在故事中的位置。Bot会为用户提供素材，用户自行判断。",
    images: [
      "/images/qiji-followup/00-chat-intent.png",
      "/images/qiji-followup/01-chat-bot.png",
    ],
  },
  {
    id: "storyboard",
    label: "Storyboard",
    body: "图片/音乐/视频生成+剪辑都在这个面板上完成，用户可以在对应的表格上直接修改，系统会自动的更新版本。",
    images: ["/images/qiji-followup/02-storyboard.png"],
  },
  {
    id: "assets",
    label: "素材仓库",
    body: "整理用户可用于渲染的所有资料以及人物场景艺术skil资产，后期可以把属于用户自己的资产分享给其他人，用户之间可以互相扩写故事共用场景，添加人物改良艺术skil。",
    images: ["/images/qiji-followup/03-assets.png"],
  },
];

function ProductViews() {
  const [active, setActive] = useState(productViews[0].id);
  const [missing, setMissing] = useState<Record<string, boolean>>({});
  const view = productViews.find(item => item.id === active) ?? productViews[0];

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-x-6 gap-y-3 border-b border-black/10">
        {productViews.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActive(item.id)}
            className={`relative pb-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0884FF] ${
              active === item.id
                ? "text-[#0884FF]"
                : "text-[#6b7280] hover:text-[#1f2328]"
            }`}
          >
            {item.label}
            {active === item.id && (
              <span className="absolute inset-x-0 bottom-[-1px] h-[2px] bg-[#0884FF]" />
            )}
          </button>
        ))}
      </div>

      <div className="grid gap-6 py-7 md:grid-cols-[minmax(0,1.55fr)_minmax(15rem,0.85fr)] md:items-start md:gap-10 md:py-10">
        <div
          className={`grid aspect-[16/10] items-center gap-2 overflow-hidden rounded-[5px] bg-black/[0.035] p-2 ring-1 ring-black/10 sm:gap-3 sm:p-3 ${
            view.images.length > 1
              ? "grid-cols-[minmax(0,0.35fr)_minmax(0,1fr)]"
              : "grid-cols-1"
          }`}
        >
          {view.images.map((src, index) => {
            const imageKey = `${view.id}-${index}`;
            return missing[imageKey] ? null : (
              <img
                key={src}
                src={src}
                alt={
                  view.images.length > 1
                    ? `${view.label} 界面截图 ${index + 1}`
                    : view.label
                }
                className="h-full w-full object-contain"
                onError={() =>
                  setMissing(value => ({ ...value, [imageKey]: true }))
                }
              />
            );
          })}
        </div>
        <div className="pt-1">
          <h3 className="text-xl font-semibold leading-snug text-[#1f2328]">
            {view.label}
          </h3>
          <p className="mt-4 text-sm leading-7 text-[#4b5563]">{view.body}</p>
        </div>
      </div>
    </div>
  );
}

function Thought({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="grid gap-5 border-t border-black/10 py-10 md:grid-cols-[minmax(13rem,0.7fr)_minmax(0,1.3fr)] md:gap-12 md:py-14">
      <h3 className="text-xl font-semibold leading-snug text-[#1f2328] sm:text-2xl">
        {title}
      </h3>
      <div className="space-y-5 text-base leading-8 text-[#363c44]">
        {children}
      </div>
    </article>
  );
}

export default function QijiFollowUpPage() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "面试后补充材料";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-white font-sans text-[#1f2328] selection:bg-[#0884FF] selection:text-white">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10">
        <header className="border-b border-black/10 py-7">
          <h1 className="text-sm font-medium tracking-[0.04em] text-[#1f2328]">
            面试后补充材料
          </h1>
        </header>

        <section className="py-12 sm:py-16 lg:py-20">
          <h2 className="text-3xl font-semibold tracking-[-0.025em] text-[#111] sm:text-5xl">
            故事影像：
          </h2>

          <div className="mt-9 flex flex-wrap items-baseline gap-x-5 gap-y-2 border-t border-black/10 py-5">
            <span className="text-sm text-[#0884FF]">v1 · 2026-08-24</span>
            <strong className="text-base font-semibold text-[#1f2328]">
              第一版
            </strong>
          </div>

          <p className="mb-2 text-xs tracking-[0.04em] text-[#6b7280]">
            视频：
          </p>
          <h3 className="mb-4 text-2xl font-semibold text-[#111]">
            根基 · SheSelf
          </h3>
          <div className="overflow-hidden rounded-[5px] bg-black ring-1 ring-black/10">
            <video
              className="block h-auto w-full bg-black"
              src={STORY_VIDEO_URL}
              poster={STORY_POSTER_URL}
              aria-label="《根基》SheSelf 第一版视频"
              controls
              playsInline
              preload="metadata"
            />
          </div>

          <article className="mt-10 grid gap-6 border-t border-black/10 pt-8 md:grid-cols-[minmax(13rem,0.7fr)_minmax(0,1.3fr)] md:gap-12 md:pt-10">
            <h3 className="text-xl font-semibold leading-snug text-[#1f2328] sm:text-2xl">
              这个故事讲的是一段很私人的生命体验。
            </h3>
            <div className="space-y-5 text-base leading-8 text-[#363c44]">
              <p>
                我刚步入社会时，会持续的感觉到害怕：所有社会规则都可能把我吞掉。我当时感受到的是：一个男性只要看懂形势、勤奋、别作死，社会仿佛就会兑现承诺，让他过上想要的生活。他自然而然在踏入社会的时候就会野心勃勃。但对女性而言，每一种选择都可能留下遗憾，也没有一条被明确承诺的标准道路。我后来发现，这并不只是我一个人的处境。
              </p>
              <p>
                但这对我来说也无所谓。我的天性里有很强悍的生命力和创作欲望，她们会引导我拿到真正我想拥有的东西。
              </p>
              <p>
                这条片子的美术提示词和小仓库词条包括 Élisabeth Louise Vigée Le
                Brun、克勒惠支、波伏娃和伍尔夫。Élisabeth Louise Vigée Le Brun
                完全是系统自己推荐的，我此前对她没有印象。克勒惠支和波伏娃对我的影响很深；我毕业时读到波伏娃关于女性处境的文字，把其中的意思记成了一句话：「男性被要求走一条艰难但向上的道路，而女性则受到诱惑，
                <strong>“不被要求奋发向上，只被鼓励滑下去”</strong>
                」伍尔夫的意识流则直接影响了这条片子的剪辑。
              </p>
              <p>
                这些“提示词”共同组成了影片的语言。它们描绘了作为“第二性”的不同状态，也是我说出自己故事的动力。
              </p>
            </div>
          </article>
        </section>

        <section className="border-t border-black/10 py-12 sm:py-16 lg:py-20">
          <h2 className="text-3xl font-semibold tracking-[-0.025em] text-[#111] sm:text-5xl">
            另一个视频：
          </h2>

          <div className="mt-9 flex flex-wrap items-baseline gap-x-5 gap-y-2 border-t border-black/10 py-5">
            <span className="text-sm text-[#0884FF]">2026-08-30</span>
            <strong className="text-base font-semibold text-[#1f2328]">
              黑客松项目
            </strong>
          </div>

          <h3 className="mb-6 text-2xl font-semibold text-[#111]">
            拾光Ai小程序宣传片
          </h3>

          <div className="grid gap-8 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] md:gap-12 md:items-start">
            <div className="overflow-hidden rounded-[5px] bg-black ring-1 ring-black/10">
              <video
                className="block h-auto w-full bg-black"
                src={SHIGUANG_VIDEO_URL}
                poster={SHIGUANG_POSTER_URL}
                aria-label="拾光Ai 黑客松项目视频"
                controls
                playsInline
                preload="metadata"
              />
            </div>

            <div className="space-y-5 text-base leading-8 text-[#363c44]">
              <p>
                和群友聊下来，家人之间的联系最常发生在微信上——情感的流动在家人之间产生的概率更大，所以它做成了微信小程序。为了照顾老年人和小朋友，前端重新做了一遍，上面这条视频里能看到。
              </p>
              <p>后端的数据和代码和 Drinking Time 通用。</p>
              <p>两个用户群加起来 100 人。</p>
              <p>
                我希望尽量多地采集用户自己写下的文字。文字越多，图片的抽卡率越低，用户就越能专注在创作里，而不是反复重抽。
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-black/10 py-12 sm:py-16 lg:py-20">
          <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[#111] sm:text-4xl">
            产品界面截图
          </h2>
          <ProductViews />
        </section>

        <section className="border-t border-black/10 py-12 sm:py-16 lg:py-20">
          <p className="text-xs tracking-[0.06em] text-[#0884FF]">面试之后</p>
          <h2 className="mt-6 max-w-5xl text-3xl font-semibold leading-tight tracking-[-0.025em] text-[#111] sm:text-5xl sm:leading-tight">
            人类的所有的精神文明，可以接住我们当下的所有情绪，借由我们的真情实感创造出属于普通人的
            AI 艺术品。
          </h2>

          <div className="mt-14 sm:mt-20">
            <Thought title="「它成了我收藏的垃圾」">
              <p>
                网上有很多艺术家和爱好者发布的 skill，很有趣，但跟普通人没关系。
              </p>
              <p>
                免费、门槛又不高的，我会收藏——然后它就成了我收藏的垃圾。要我付费，要我专门去学，我不会。
              </p>
            </Thought>

            <Thought title="「我只愿意为真正打动我的东西付费」">
              <p>
                别人的
                skill，可以白嫖。但付费的门槛不在工具好不好用，在于是否打动用户。
              </p>
              <p>
                人类的情感体验是想通的，由借前人的才华，做出自己的东西。不需要刻意的训练，即刻体验到创作的乐趣
              </p>
            </Thought>

            <article className="border-t border-black/10 py-12 sm:py-16">
              <p className="max-w-4xl text-2xl font-semibold leading-relaxed tracking-[-0.02em] text-[#111] sm:text-4xl sm:leading-relaxed">
                我不希望用所谓的“专业影视知识”限制 AIGC。我觉得 AIGC
                是一种新的艺术形式，就像相机之于电影一样。
              </p>
              <p className="mt-8 max-w-3xl text-base leading-8 text-[#4b5563]">
                我调用和判断模型时，不会把「跟真的一样」当成标准。如果只是追求真实性，人的视觉很快就会疲劳。AIGC
                不应该只把现实复制得更像。
              </p>
              <p className="mt-5 max-w-3xl text-base leading-8 text-[#4b5563]">
                我希望美术模型和文字模型能够借鉴人类过去积累的创作形式，用不同的艺术语言，接住当下真实的情绪。
              </p>
            </article>

            <Thought title="工具一直在变，我对画面的判断没有变。">
              <p>
                我以前做的东西就没丑东西，只是制作工具不一样。Drinking Time
                和其他 AI
                视频软件不一样的地方，不是多一个生成按钮，而是把这种判断放进产品里。
              </p>
              <p>
                我希望它做出来的画面是漂亮的，表达来自用户真正的情感，不要求用户学习工具。漂亮、动人、容易上手，是同一件事：让普通人能够做出真正打动自己的作品。
              </p>
              <p>
                我希望把界面做成最通用的表格结构。我的语料库也会和其他更广的艺术形式关联。
              </p>
            </Thought>

            <Thought title="「怎么组合数据，是 Drinking Time 在做」">
              <p>我们做的其实是提示词工程，加一个比较小的艺术家仓库。</p>
              <p>数据是 AI 公司买的，但怎么组合数据是 Drinking Time 在做。</p>
            </Thought>

            <Thought title="「不是教你做事」">
              <p>
                人类所有的精神文明，都是给人力量、给人抚慰的。不是教你做事/赚你的钱/消耗你时间，也不是满足某个艺术家的全能自恋。
              </p>
            </Thought>

            <Thought title="「我之所为，皆是艺术」">
              <p>
                我很喜欢这句话。对我来说，它意味着生活中的每一刻都是创作的进行时与未来时。艺术不仅限于画布或雕塑，而是融入我的每一次呼吸、每一个决定和每一段情感表达之中。
              </p>
              <p>
                这是一种坚持生活与艺术必须融合的生命态度，让我在日常生活中也能感觉到创造的力量。我理直气壮地做每一件事，都是基于这么强烈而坚定的信念。
              </p>
            </Thought>

            <Thought title="「以前的观众，现在可以自己享受创造的过程」">
              <p>
                今人和古人，人性是一样的，创作的形式不一样。AI
                让普通人有更大的发挥空间，也更能享受创作本身。
              </p>
              <p>
                变的是创作的主体。以前，人们买票进电影院看别人的故事，在网上为别人的漫剧和
                skill 花时间——他们是观众。现在，观众可以自己享受创造的过程。
              </p>
            </Thought>

            <p className="border-y border-black/10 py-12 text-2xl font-semibold leading-relaxed tracking-[-0.02em] text-[#111] sm:py-16 sm:text-4xl sm:leading-relaxed">
              我相信每次生产力的爆发，艺术会以更普惠的形式服务人民
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

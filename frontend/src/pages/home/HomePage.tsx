import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ChevronRight,
  Cloud,
  CloudRain,
  Droplets,
  FlaskConical,
  ScanEye,
  Sparkles,
  Sprout,
  Star,
  Sun,
  Truck,
  TrendingUp,
  Activity,
  ShoppingBag,
  Store,
} from "lucide-react";

import { QuickActionTile } from "@/components/common/QuickActionTile";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { mockCategories } from "@/data/mock/mockCategories";
import { mockMandiSnapshot } from "@/data/mock/mockMandi";
import { mockWeatherSnapshot } from "@/data/mock/mockWeather";
import { mockRecommendedProducts } from "@/data/mock/mockProducts";
import { mockRecentOrders } from "@/data/mock/mockOrders";
import { formatINR, formatPercentChange } from "@/utils/format";
import { cn } from "@/utils/cn";

function useGreetingKey():
  | "home.greetingMorning"
  | "home.greetingAfternoon"
  | "home.greetingEvening" {
  const hour = new Date().getHours();

  if (hour < 12) return "home.greetingMorning";
  if (hour < 17) return "home.greetingAfternoon";

  return "home.greetingEvening";
}

const ORDER_STATUS_STYLES: Record<string, string> = {
  placed: "bg-[#eee9dc] text-[#625d50]",
  confirmed: "bg-[#e5ecdf] text-[#506846]",
  packed: "bg-[#f1e5b7] text-[#765f1e]",
  shipped: "bg-[#dce7d6] text-[#435c39]",
  delivered: "bg-[#d1dfc9] text-[#3c5735]",
};

export default function HomePage() {
  const { user, isSeller } = useAuth();
  const { t } = useLanguage();

  const greetingKey = useGreetingKey();
  const firstName = user?.name?.split(" ")[0] ?? "";

  const mandi = mockMandiSnapshot[0];

  /*
   * ---------------------------------------------------------
   * WEATHER CONDITION
   * ---------------------------------------------------------
   */

  const weatherCondition = mockWeatherSnapshot.condition?.toLowerCase() ?? "";

  const isRainy =
    weatherCondition.includes("rain") ||
    weatherCondition.includes("drizzle") ||
    weatherCondition.includes("storm");

  const isCloudy =
    weatherCondition.includes("cloud") || weatherCondition.includes("overcast");

  const isSunny =
    weatherCondition.includes("sun") ||
    weatherCondition.includes("sunny") ||
    weatherCondition.includes("clear") ||
    weatherCondition.includes("bright");

  return (
    <div className="min-h-screen bg-[#f4f0e6] text-[#292b24]">
      <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-9">
        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="relative overflow-hidden rounded-[28px] bg-[#27351d] px-5 py-7 text-[#f8f4e9] sm:px-8 sm:py-8 lg:px-10 lg:py-9">
          <div className="relative z-10 max-w-4xl">
            {/* IMPORTANT:
                White / cream main text.
                Yellow only for emphasis.
            */}

            <h1 className="max-w-4xl text-[1rem] font-semibold leading-[1.06] tracking-[-0.045em] text-[#fbf7ec] sm:text-[3.25rem] lg:text-[3rem]">
              {t(greetingKey)}
              {firstName ? `, ${firstName}` : ""}.
              <br />
              <span className="text-[#d8bd55]">
                Your farm, market and decisions
              </span>
              <br></br>
              <span className="text-[#fbf7ec]"> in one place.</span>
            </h1>

            <p className="mt-5 max-w-2xl text-[14px] leading-6 text-[#d5d9d0] sm:text-[15px]">
              {t("home.subGreeting")}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/market"
                className="group flex items-center gap-2 rounded-full bg-[#d6b841] px-5 py-3 text-[11px] font-black uppercase tracking-[0.08em] text-[#262c1d] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#e0c64d]"
              >
                <ShoppingBag className="h-4 w-4" />
                Explore marketplace
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>

              <Link
                to="/ai/chat"
                className="flex items-center gap-2 rounded-full border border-[#68765e] bg-[#303f26] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#f0ede3] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#394a2d]"
              >
                <Sparkles className="h-4 w-4 text-[#d6b841]" />
                Ask Anndataa AI
              </Link>
            </div>
          </div>

          <div className="pointer-events-none absolute -bottom-16 -right-5 hidden opacity-[0.13] sm:block lg:right-8">
            <Sprout className="h-64 w-64 text-[#d6b841]" strokeWidth={0.65} />
          </div>
        </section>

        {/* =====================================================
            SNAPSHOT
        ===================================================== */}

        {/* =====================================================
    SNAPSHOT
===================================================== */}

<section className="mt-5 grid gap-3 md:grid-cols-3">

  {/* =================================================
      WEATHER
  ================================================= */}

  <Link
    to="/weather"
    className="group relative overflow-hidden rounded-[22px] bg-[#d9c37a] p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_35px_rgba(72,64,36,0.10)]"
  >

    <div className="relative min-h-[125px]">

      {/* WEATHER ILLUSTRATION */}

      <div className="pointer-events-none absolute right-0 top-0 h-24 w-28">

        {/* SUN */}

        {isSunny && (
          <div className="absolute right-4 top-1">

            <div className="relative flex h-12 w-12 items-center justify-center">

              <span className="absolute inset-0 rounded-full border-[4px] border-[#e7c94e] opacity-30" />

              <Sun
                className="h-9 w-9 text-[#e7b92f]"
                strokeWidth={1.5}
              />

            </div>

          </div>
        )}


        {/* CLOUD */}

        {isCloudy && !isRainy && (
          <div className="absolute right-0 top-5">

            <Cloud
              className="h-16 w-16 text-[#eee4c1]"
              strokeWidth={1.1}
            />

          </div>
        )}


        {/* RAIN */}

        {isRainy && (
          <div className="absolute right-0 top-1">

            <CloudRain
              className="h-16 w-16 text-[#6e7d7f]"
              strokeWidth={1.2}
            />

            <div className="absolute left-4 top-[52px] flex gap-1.5">

              <span className="h-4 w-[1.5px] rounded-full bg-[#738a91]" />
              <span className="h-5 w-[1.5px] rounded-full bg-[#738a91]" />
              <span className="h-3 w-[1.5px] rounded-full bg-[#738a91]" />
              <span className="h-5 w-[1.5px] rounded-full bg-[#738a91]" />

            </div>

          </div>
        )}


        {/* FALLBACK */}

        {!isSunny && !isCloudy && !isRainy && (
          <Sun
            className="absolute right-4 top-2 h-10 w-10 text-[#e7b92f]"
            strokeWidth={1.4}
          />
        )}

      </div>


      {/* WEATHER TEXT */}

      <div className="relative z-10">

        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#665c39]">
          Field conditions
        </p>


        <div className="mt-2 flex items-end gap-2">

          <p className="text-[2.6rem] font-semibold leading-none tracking-[-0.05em] text-[#303526]">
            {mockWeatherSnapshot.tempC}°
          </p>

          <span className="mb-1 text-[14px] font-semibold text-[#665f45]">
            {mockWeatherSnapshot.condition}
          </span>

        </div>

      </div>


      {/* BOTTOM */}

      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between">

        <div>

          <p className="text-[16px] font-semibold text-[#686347]">
            {mockWeatherSnapshot.location.split(',')[0]}
          </p>

          <p className="mt-0.5 text-[11px] text-[#777154]">
            Current field weather
          </p>

        </div>


        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e5d398]">

          <ArrowUpRight
            className="h-3.5 w-3.5 text-[#5b5d3c] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />

        </span>

      </div>

    </div>

  </Link>


  {/* =================================================
      MANDI
  ================================================= */}

  <Link
    to="/mandi"
    className="group rounded-[22px] border border-[#d8d0bf] bg-[#fffdf7] p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_35px_rgba(63,55,38,0.08)]"
  >

    <div className="flex items-start justify-between">

      <div>

        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#898274]">
          Mandi / Current rate
        </p>

        <p className="mt-3 text-[14px] font-bold text-[#454238]">
          {mandi.crop}
        </p>

        <p className="mt-0.5 text-[10px] text-[#969082]">
          {mandi.mandi}
        </p>

      </div>


      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e7eddf]">

        <TrendingUp
          className="h-4.5 w-4.5 text-[#5f7651]"
          strokeWidth={1.6}
        />

      </div>

    </div>


    {/* PRICE */}

    <div className="mt-5">

      <p className="text-[1.8rem] font-semibold leading-none tracking-[-0.04em] text-[#25291f]">
        {formatINR(mandi.pricePerQuintal)}
      </p>


      <div className="mt-2 flex items-center gap-2">

        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[9px] font-bold',
            mandi.changePercent >= 0
              ? 'bg-[#e1e9d9] text-[#527044]'
              : 'bg-[#eee0d7] text-[#8a513d]',
          )}
        >
          {formatPercentChange(mandi.changePercent)}
        </span>

        <span className="text-[9px] text-[#928b7d]">
          today
        </span>

      </div>

    </div>


    {/* FOOTER */}

    <div className="mt-4 flex items-center justify-between border-t border-[#e5dfd1] pt-2.5">

      <span className="text-[9px] text-[#8d877a]">
        Latest mandi rate
      </span>

      <ArrowUpRight
        className="h-3.5 w-3.5 text-[#668057] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
      />

    </div>

  </Link>


  {/* =================================================
      MARKET SIGNAL
  ================================================= */}

  <div className="rounded-[22px] bg-[#554536] p-4 text-[#f7f1e4]">

    <div className="flex items-start justify-between">

      <div>

        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#c8bca8]">
          Market signal
        </p>

        <h3 className="mt-2 text-[16px] font-semibold text-[#f7f1e4]">
          Stable movement
        </h3>

      </div>


      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#675645]">

        <Activity
          className="h-4 w-4 text-[#d6b841]"
          strokeWidth={1.6}
        />

      </div>

    </div>


    {/* SIGNAL BAR */}

    <div className="mt-5">

      <div className="flex h-1.5 overflow-hidden rounded-full bg-[#43362b]">

        <div className="w-[68%] bg-[#788d66]" />

        <div className="w-[20%] bg-[#c0a842]" />

        <div className="w-[12%] bg-[#766050]" />

      </div>


      <div className="mt-2 flex justify-between text-[8px] uppercase tracking-[0.1em] text-[#bfb3a2]">

        <span>Stable</span>

        <span>Watch</span>

        <span>Risk</span>

      </div>

    </div>


    {/* FOOTER */}

    <div className="mt-4 flex items-end justify-between border-t border-[#756555] pt-3">

      <p className="max-w-[150px] text-[9px] leading-3.5 text-[#cfc5b5]">
        Current market movement based on the latest mandi feed.
      </p>

      <Link
        to="/mandi"
        className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-[#ddc766]"
      >
        Open

        <ArrowUpRight className="h-3 w-3" />

      </Link>

    </div>

  </div>

</section>

        {/* =====================================================
            AI COMMAND CENTER
        ===================================================== */}

        <section className="mt-9">
          <div className="mb-5 flex items-end justify-between">
            <div>
            
              <h2 className="mt-1.5 text-[22px] font-extrabold  tracking-[-0.03em] text-[#292c23]">
                All AI Solution
              </h2>
            </div>

            <Link
              to="/ai/chat"
              className="hidden items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#5c744d] sm:flex"
            >
              Open AI
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <QuickActionTile
              to="/ai/disease"
              label={t("home.diseaseCheck")}
              icon={ScanEye}
              colorClass="bg-[#eee0d7] text-[#8a513d]"
            />

            <QuickActionTile
              to="/ai/crop-advisor"
              label={t("home.cropAdvisor")}
              icon={Sprout}
              colorClass="bg-[#e2eadb] text-[#557347]"
            />

            <QuickActionTile
              to="/ai/soil"
              label={t("home.soilAnalysis")}
              icon={FlaskConical}
              colorClass="bg-[#e7ddd0] text-[#765c46]"
            />

            <QuickActionTile
              to="/ai/irrigation"
              label={t("home.irrigationAdvice")}
              icon={Droplets}
              colorClass="bg-[#e1e8df] text-[#526a4a]"
            />

            <QuickActionTile
              to="/ai/chat"
              label={t("home.askAI")}
              icon={Sparkles}
              colorClass="bg-[#f1e6bb] text-[#786321]"
            />
          </div>
        </section>

        {/* =====================================================
            MAIN CONTENT
        ===================================================== */}

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.65fr_0.75fr]">
          <div className="min-w-0">
            {/* =================================================
                CATEGORIES
            ================================================= */}

            <section>
              <div className="mb-5 flex items-end justify-between">
                <div>
                  
                  <h2 className="mt-1.5 text-[22px] font-extrabold tracking-[-0.03em]">
                    Marketplace categories
                  </h2>
                </div>

                <Link
                  to="/market"
                  className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#5c744d]"
                >
                  View all
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="scrollbar-none flex gap-3 overflow-x-auto pb-2">
                {mockCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/market/${cat.slug}`}
                    className="group flex min-w-[105px] shrink-0 flex-col rounded-[18px] border border-[#ddd6c6] bg-[#fffdf7] p-3.5 transition-all duration-300 hover:-translate-y-1 hover:border-[#aebca2] hover:shadow-[0_12px_25px_rgba(60,55,40,0.07)]"
                  >
                    <span
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-[14px]",
                        cat.colorClass,
                      )}
                    >
                      <cat.icon className="h-5.5 w-5.5" strokeWidth={1.6} />
                    </span>

                    <span className="mt-3 text-[11px] font-bold leading-tight text-[#514f46]">
                      {cat.name}
                    </span>

                    <ArrowUpRight className="mt-3 h-3.5 w-3.5 text-[#aaa393] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            </section>

            {/* =================================================
                RECOMMENDED MARKETPLACE
            ================================================= */}

            <section className="mt-10">
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <h2 className="mt-1.5 text-[22px] font-extrabold tracking-[-0.03em]">
                    Recommended Marketplace
                  </h2>
                </div>

                <Link
                  to="/market"
                  className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#5c744d]"
                >
                  Explore
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {mockRecommendedProducts.map((product) => (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    className="group relative overflow-hidden rounded-[24px] border border-[#ddd6c6] bg-[#fffdf7] shadow-[0_4px_18px_rgba(60,55,40,0.04)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[#bdc9b4] hover:shadow-[0_20px_40px_rgba(60,55,40,0.11)]"
                  >
                    {/* =================================================
        PRODUCT IMAGE
    ================================================= */}

                    <div className="relative h-[175px] overflow-hidden bg-[#e9e5d9]">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />

                      {/* Image overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />

                      {/* Availability */}
                      <div className="absolute left-4 top-4 z-10">
                        <span className="rounded-full border border-white/40 bg-white/90 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.13em] text-[#5d7652] shadow-sm backdrop-blur-sm">
                          Available
                        </span>
                      </div>

                      {/* Arrow */}
                      <div className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/50 bg-white/90 shadow-sm backdrop-blur-sm transition-all duration-300 group-hover:scale-105">
                        <ArrowUpRight className="h-4 w-4 text-[#5c744d] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </div>
                    </div>

                    {/* =================================================
        PRODUCT INFORMATION
    ================================================= */}

                    <div className="p-4">
                      {/* Product name */}
                      <p className="min-h-[40px] line-clamp-2 text-[13px] font-bold leading-[1.55] tracking-[-0.01em] text-[#2b2d25]">
                        {product.name}
                      </p>

                      {/* Rating + Location */}
                      <div className="mt-2.5 flex min-w-0 items-center gap-1.5">
                        <div className="flex shrink-0 items-center gap-1 rounded-full bg-[#f2ead0] px-2 py-1">
                          <Star className="h-3 w-3 fill-[#b79c36] text-[#b79c36]" />

                          <span className="text-[9px] font-bold text-[#77652b]">
                            {product.rating}
                          </span>
                        </div>

                        <span className="text-[#c5beb0]">•</span>

                        <span className="truncate text-[9px] font-medium text-[#888274]">
                          {product.location}
                        </span>
                      </div>

                      {/* Divider */}
                      <div className="my-3.5 h-px bg-[#ebe5d8]" />

                      {/* Price */}
                      <div className="flex items-end justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[17px] font-black tracking-[-0.025em] text-[#282b22]">
                            {formatINR(product.price)}
                          </p>

                          <p className="mt-0.5 text-[9px] font-medium text-[#999184]">
                            per {product.unit}
                          </p>
                        </div>

                        {/* Arrow */}
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e7eee1] transition-all duration-300 group-hover:bg-[#d9e5d2]">
                          <ChevronRight className="h-4 w-4 text-[#5c744d] transition-transform duration-300 group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          {/* =====================================================
              RIGHT RAIL
          ===================================================== */}

          <aside className="space-y-5">
            {/* RECENT ORDERS */}

            <section className="rounded-[24px] border border-[#d8d0bf] bg-[#fffdf7] p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
    

                  <h2 className="mt-1.5 text-[17px] font-extrabold">
                    Recent Orders
                  </h2>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e6ecdf]">
                  <Truck className="h-4 w-4 text-[#5c744d]" />
                </div>
              </div>

              <ul className="space-y-1">
                {mockRecentOrders.map((order) => (
                  <li key={order.id}>
                    <Link
                      to={`/orders/${order.id}`}
                      className="group flex items-center gap-3 rounded-[14px] px-2 py-3 transition-colors hover:bg-[#f2eee4]"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eee9dc] text-[#65735a]">
                        <Truck className="h-4 w-4" />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12px] font-bold text-[#383930]">
                          {order.itemsLabel}
                        </span>

                        <span className="mt-1.5 flex items-center gap-2">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[9px] font-bold capitalize",
                              ORDER_STATUS_STYLES[order.status],
                            )}
                          >
                            {order.status}
                          </span>

                          <span className="text-[10px] font-semibold text-[#777164]">
                            {formatINR(order.total)}
                          </span>
                        </span>
                      </span>

                      <ChevronRight className="h-4 w-4 text-[#b0a99b] transition-transform group-hover:translate-x-1" />
                    </Link>
                  </li>
                ))}
              </ul>

              <Link
                to="/orders"
                className="mt-4 flex items-center justify-center rounded-xl border border-[#d8d0bf] py-2.5 text-[10px] font-black uppercase tracking-[0.15em] text-[#5c744d] transition-colors hover:bg-[#f2eee4]"
              >
                View complete order history
              </Link>
            </section>

            {/* MARKET WATCH */}

            <section className="rounded-[24px] bg-[#554536] p-5 text-[#f7f1e4] sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                

                  <h2 className="mt-1.5 text-[17px] text-[#f7f1e4] font-extrabold">
                    Mandi prices
                  </h2>
                </div>

                <Store className="h-5 w-5 text-[#d6b841]" />
              </div>

              <ul className="divide-y divide-[#756555]">
                {mockMandiSnapshot.map((row) => (
                  <li
                    key={row.crop}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="text-[12px] font-bold text-[#f5efe2]">
                        {row.crop}
                      </p>

                      <p className="mt-1 text-[10px] text-[#c1b5a4]">
                        {row.mandi}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[13px] font-bold text-[#f5efe2]">
                        {formatINR(row.pricePerQuintal)}
                      </p>

                      <p
                        className={cn(
                          "mt-1 text-[10px] font-bold",
                          row.changePercent >= 0
                            ? "text-[#d6c05e]"
                            : "text-[#d49b83]",
                        )}
                      >
                        {formatPercentChange(row.changePercent)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <Link
                to="/mandi"
                className="mt-4 flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.15em] text-[#ddc766]"
              >
                Open full market
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </section>
<<<<<<< HEAD
=======

            {/* SELLER */}

            {!isSeller && (
              <Link
                to="/seller/onboarding"
                className="group block rounded-[24px] border border-[#c8bfae] bg-[#e8e1d2] p-5 transition-all duration-300 hover:-translate-y-1 hover:bg-[#ded5c3]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#cfdac5]">
                    <Store className="h-4 w-4 text-[#526b46]" />
                  </div>

                  <ArrowUpRight className="h-4 w-4 text-[#777363] transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                </div>

                <p className="mt-6 text-[17px] font-bold text-[#34372c]">
                  Start selling through Anndataa
                </p>

                <p className="mt-2 text-[12px] leading-5 text-[#777265]">
                  Bring your produce directly to buyers and grow your digital
                  marketplace presence.
                </p>

                <div className="mt-5 text-[10px] font-black uppercase tracking-[0.16em] text-[#5c744d]">
                  Become a seller
                </div>
              </Link>
            )}
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
          </aside>
        </div>
      </main>
    </div>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a

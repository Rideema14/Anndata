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
import { useOrders } from "@/context/OrderContext";
import {
  categoryService,
  type Category,
} from "@/services/categoryService";
import { productService } from "@/services/productService";
import { weatherService } from "@/services/weatherService";
import { mandiService } from "@/services/mandiService";
import type { Product } from "@/types";
import { formatINR } from "@/utils/format";
import { cn } from "@/utils/cn";
import { useEffect, useState } from "react";

/* =========================================================
   GREETING
========================================================= */

function useGreetingKey():
  | "home.greetingMorning"
  | "home.greetingAfternoon"
  | "home.greetingEvening" {
  const hour = new Date().getHours();

  if (hour < 12) return "home.greetingMorning";
  if (hour < 17) return "home.greetingAfternoon";

  return "home.greetingEvening";
}

/* =========================================================
   ORDER STATUS
========================================================= */

const ORDER_STATUS_STYLES: Record<string, string> = {
  placed: "bg-[#eee9dc] text-[#625d50]",
  confirmed: "bg-[#e5ecdf] text-[#506846]",
  packed: "bg-[#f1e5b7] text-[#765f1e]",
  shipped: "bg-[#dce7d6] text-[#435c39]",
  out_for_delivery: "bg-[#dce7d6] text-[#435c39]",
  delivered: "bg-[#d1dfc9] text-[#3c5735]",
  cancelled: "bg-[#f0ddd7] text-[#8a513d]",
  returned: "bg-[#f0ddd7] text-[#8a513d]",
};

/* =========================================================
   TYPES
========================================================= */

interface HomeWeatherSnapshot {
  tempC: number;
  condition: string;
  location: string;
}

interface HomeMandiRow {
  crop: string;
  mandi: string;
  pricePerQuintal: number;
  updatedLabel: string;
}

/* =========================================================
   PAGE
========================================================= */

export default function HomePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { orders: recentOrders } = useOrders();

  const greetingKey = useGreetingKey();
  const firstName = user?.name?.split(" ")[0] ?? "";

  /* =======================================================
     CATEGORIES + PRODUCTS
  ======================================================= */

  const [categories, setCategories] = useState<Category[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>(
    [],
  );

  useEffect(() => {
    let cancelled = false;

    categoryService
      .list()
      .then((items) => {
        if (!cancelled) setCategories(items);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });

    productService
      .list({
        sortBy: "popular",
        limit: 4,
      })
      .then((res) => {
        if (!cancelled) {
          setRecommendedProducts(res.items);
        }
      })
      .catch(() => {
        if (!cancelled) setRecommendedProducts([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
     WEATHER
  ======================================================= */

  const [weather, setWeather] =
    useState<HomeWeatherSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;

    function fetchWeather(
      lat: number,
      lng: number,
      locationLabel: string,
    ) {
      weatherService
        .getWeather(lat, lng, 1)
        .then((res: any) => {
          if (cancelled) return;

          const payload = res.data || res;
          const current = payload.current;

          if (current) {
            setWeather({
              tempC: Math.round(current.temperatureC),
              condition: current.condition,
              location: locationLabel,
            });
          }
        })
        .catch(() => {
          if (!cancelled) setWeather(null);
        });
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchWeather(
            pos.coords.latitude,
            pos.coords.longitude,
            "Your area",
          );
        },
        () => {
          fetchWeather(
            28.6139,
            77.209,
            "New Delhi",
          );
        },
      );
    } else {
      fetchWeather(
        28.6139,
        77.209,
        "New Delhi",
      );
    }

    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
     MANDI
  ======================================================= */

  const [mandiRows, setMandiRows] = useState<HomeMandiRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    mandiService
      .getPrices({
        state: "Madhya Pradesh",
        limit: 20,
      })
      .then((res: any) => {
        if (cancelled) return;

        const items = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
            ? res.data
            : [];

        setMandiRows(
          items.map((item: any) => ({
            crop: item.crop?.name ?? "Unknown crop",
            mandi: item.mandi?.name ?? "Unknown mandi",
            pricePerQuintal: Number(item.modalPrice) || 0,
            updatedLabel: item.priceDate
              ? new Date(item.priceDate).toLocaleDateString()
              : "",
          })),
        );
      })
      .catch(() => {
        if (!cancelled) setMandiRows([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
     WEATHER CONDITION
  ======================================================= */

  const weatherCondition =
    weather?.condition?.toLowerCase() ?? "";

  const isRainy =
    weatherCondition.includes("rain") ||
    weatherCondition.includes("drizzle") ||
    weatherCondition.includes("storm");

  const isCloudy =
    weatherCondition.includes("cloud") ||
    weatherCondition.includes("overcast");

  const isSunny =
    weatherCondition.includes("sun") ||
    weatherCondition.includes("sunny") ||
    weatherCondition.includes("clear") ||
    weatherCondition.includes("bright");

  /* =======================================================
     RETURN
  ======================================================= */

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f4f0e6] text-[#292b24]">

      <main
        className="
          mx-auto w-full max-w-[1500px]
          px-3.5 py-4
          sm:px-5 sm:py-6
          md:px-7
          lg:px-10 lg:py-9
        "
      >

        {/* =================================================
            HERO
        ================================================= */}

        <section
          className="
            relative overflow-hidden
            rounded-[24px] sm:rounded-[28px]
            bg-[#27351d]
            px-4 py-6
            sm:px-7 sm:py-8
            md:px-8
            lg:px-10 lg:py-9
          "
        >
          <div className="relative z-10 max-w-4xl">

            <h1
              className="
                max-w-4xl
                text-[1.65rem]
                font-semibold
                leading-[1.13]
                tracking-[-0.025em]
                text-[#fbf7ec]
                min-[380px]:text-[1.85rem]
                sm:text-[2.65rem]
                sm:leading-[1.08]
                lg:text-[3.25rem]
                lg:leading-[1.06]
              "
            >
              {t(greetingKey)}
              {firstName ? `, ${firstName}` : ""}.

              <br />

              <span className="text-[#d8bd55]">
                Your farm, market and decisions
              </span>

              <br />

              <span className="text-[#fbf7ec]">
                in one place.
              </span>
            </h1>

            <p
              className="
                mt-4 max-w-2xl
                text-[13px] leading-[1.65]
                text-[#d5d9d0]
                sm:mt-5 sm:text-[15px] sm:leading-6
              "
            >
              {t("home.subGreeting")}
            </p>

            {/* HERO ACTIONS */}

            <div
              className="
                mt-5
                flex flex-col
                gap-2.5
                min-[420px]:flex-row
                sm:mt-6
              "
            >
              <Link
                to="/market"
                className="
                  group
                  inline-flex min-h-[44px]
                  items-center justify-center gap-2
                  rounded-full
                  bg-[#d6b841]
                  px-4 py-2.5
                  text-[10px]
                  font-black
                  uppercase
                  tracking-[0.08em]
                  text-[#262c1d]
                  transition-all duration-300
                  hover:-translate-y-0.5
                  hover:bg-[#e0c64d]
                  active:scale-[0.98]
                  sm:px-5 sm:py-3 sm:text-[11px]
                "
              >
                <ShoppingBag className="h-4 w-4" />

                <span>Explore marketplace</span>

                <ArrowUpRight
                  className="
                    h-3.5 w-3.5
                    transition-transform
                    group-hover:-translate-y-0.5
                    group-hover:translate-x-0.5
                  "
                />
              </Link>

              <Link
                to="/ai/chat"
                className="
                  inline-flex min-h-[44px]
                  items-center justify-center gap-2
                  rounded-full
                  border border-[#68765e]
                  bg-[#303f26]
                  px-4 py-2.5
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.08em]
                  text-[#f0ede3]
                  transition-all duration-300
                  hover:-translate-y-0.5
                  hover:bg-[#394a2d]
                  active:scale-[0.98]
                  sm:px-5 sm:py-3 sm:text-[11px]
                "
              >
                <Sparkles className="h-4 w-4 text-[#d6b841]" />

                Ask Anndataa AI
              </Link>
            </div>
          </div>

          {/* Decorative plant */}

          <div
            className="
              pointer-events-none
              absolute -bottom-16 -right-8
              hidden opacity-[0.13]
              sm:block
              lg:right-8
            "
          >
            <Sprout
              className="h-64 w-64 text-[#d6b841]"
              strokeWidth={0.65}
            />
          </div>
        </section>


        {/* =================================================
            SNAPSHOT
        ================================================= */}

        <section
          className="
            mt-4
            grid grid-cols-1 gap-3
            sm:grid-cols-2
            lg:grid-cols-3
            lg:gap-4
          "
        >

          {/* WEATHER */}

          <Link
            to="/weather"
            className="
              group relative overflow-hidden
              min-h-[150px]
              rounded-[20px]
              bg-[#d9c37a]
              p-4
              transition-all duration-300
              hover:-translate-y-1
              hover:shadow-[0_16px_35px_rgba(72,64,36,0.10)]
              active:scale-[0.99]
              sm:min-h-[160px]
              lg:min-h-[170px]
            "
          >
            <div className="relative h-full min-h-[118px]">

              {/* WEATHER ICON */}

              <div className="pointer-events-none absolute right-0 top-0 h-24 w-28">

                {isSunny && (
                  <div className="absolute right-3 top-1 animate-[pulse_3s_ease-in-out_infinite]">
                    <div className="relative flex h-12 w-12 items-center justify-center">
                      <span className="absolute inset-0 rounded-full border-[4px] border-[#e7c94e] opacity-30" />

                      <Sun
                        className="h-9 w-9 text-[#e7b92f]"
                        strokeWidth={1.5}
                      />
                    </div>
                  </div>
                )}

                {isCloudy && !isRainy && (
                  <div className="absolute right-0 top-5 animate-[pulse_4s_ease-in-out_infinite]">
                    <Cloud
                      className="h-16 w-16 text-[#eee4c1]"
                      strokeWidth={1.1}
                    />
                  </div>
                )}

                {isRainy && (
                  <div className="absolute right-0 top-1">
                    <CloudRain
                      className="h-16 w-16 text-[#6e7d7f]"
                      strokeWidth={1.2}
                    />

                    <div className="absolute left-4 top-[52px] flex gap-1.5">
                      <span className="h-4 w-[1.5px] rounded-full bg-[#738a91] animate-[pulse_1.5s_ease-in-out_infinite]" />
                      <span className="h-5 w-[1.5px] rounded-full bg-[#738a91] animate-[pulse_1.2s_ease-in-out_infinite]" />
                      <span className="h-3 w-[1.5px] rounded-full bg-[#738a91] animate-[pulse_1.7s_ease-in-out_infinite]" />
                      <span className="h-5 w-[1.5px] rounded-full bg-[#738a91] animate-[pulse_1.3s_ease-in-out_infinite]" />
                    </div>
                  </div>
                )}

                {!isSunny && !isCloudy && !isRainy && (
                  <Sun
                    className="absolute right-4 top-2 h-10 w-10 text-[#e7b92f]"
                    strokeWidth={1.4}
                  />
                )}
              </div>

              <div className="relative z-10">

                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#665c39] sm:text-[11px] sm:tracking-[0.16em]">
                  Field conditions
                </p>

                <div className="mt-2 flex flex-wrap items-end gap-2 pr-16 sm:pr-20">

                  <p className="text-[2.4rem] font-semibold leading-none tracking-[-0.05em] text-[#303526] sm:text-[2.6rem]">
                    {weather ? `${weather.tempC}°` : "—"}
                  </p>

                  <span className="mb-1 line-clamp-1 text-[12px] font-semibold text-[#665f45] sm:text-[14px]">
                    {weather?.condition ?? "Loading…"}
                  </span>

                </div>
              </div>

              <div
                className="
                  absolute bottom-0 left-0 right-0
                  mt-4 flex items-end justify-between gap-3
                "
              >
                <div className="min-w-0">

                  <p className="truncate text-[14px] font-semibold text-[#686347] sm:text-[16px]">
                    {weather?.location ?? "Your area"}
                  </p>

                  <p className="mt-0.5 text-[10px] text-[#777154] sm:text-[11px]">
                    Current field weather
                  </p>
                </div>

                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e5d398]">
                  <ArrowUpRight
                    className="
                      h-3.5 w-3.5
                      text-[#5b5d3c]
                      transition-transform duration-300
                      group-hover:-translate-y-0.5
                      group-hover:translate-x-0.5
                    "
                  />
                </span>
              </div>
            </div>
          </Link>


          {/* MANDI */}

          <Link
            to="/mandi"
            className="
              group
              min-h-[150px]
              rounded-[20px]
              border border-[#d8d0bf]
              bg-[#fffdf7]
              p-4
              transition-all duration-300
              hover:-translate-y-1
              hover:shadow-[0_16px_35px_rgba(63,55,38,0.08)]
              active:scale-[0.99]
              sm:min-h-[160px]
              lg:min-h-[170px]
            "
          >
            <div className="flex items-start justify-between gap-3">

              <div className="min-w-0">

                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#898274]">
                  Mandi / Current rate
                </p>

                <p className="mt-3 truncate text-[14px] font-bold text-[#454238]">
                  {mandiRows[0]?.crop ?? "—"}
                </p>

                <p className="mt-0.5 truncate text-[10px] text-[#969082]">
                  {mandiRows[0]?.mandi ?? "Loading mandi data…"}
                </p>

              </div>

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e7eddf]">
                <TrendingUp
                  className="h-4 w-4 text-[#5f7651]"
                  strokeWidth={1.6}
                />
              </div>
            </div>

            <div className="mt-5">

              <p className="text-[1.7rem] font-semibold leading-none tracking-[-0.04em] text-[#25291f] sm:text-[1.8rem]">
                {mandiRows[0]
                  ? formatINR(mandiRows[0].pricePerQuintal)
                  : "—"}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-2">

                <span className="rounded-full bg-[#e1e9d9] px-2 py-0.5 text-[9px] font-bold text-[#527044]">
                  per quintal
                </span>

                <span className="text-[9px] text-[#928b7d]">
                  {mandiRows[0]?.updatedLabel ?? ""}
                </span>

              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-[#e5dfd1] pt-2.5">
              <span className="text-[9px] text-[#8d877a]">
                Latest mandi rate
              </span>

              <ArrowUpRight
                className="
                  h-3.5 w-3.5
                  text-[#668057]
                  transition-transform
                  group-hover:-translate-y-0.5
                  group-hover:translate-x-0.5
                "
              />
            </div>
          </Link>


          {/* MARKET SIGNAL */}

          <div
            className="
              min-h-[150px]
              rounded-[20px]
              bg-[#554536]
              p-4
              text-[#f7f1e4]
              sm:min-h-[160px]
              lg:min-h-[170px]
            "
          >
            <div className="flex items-start justify-between gap-3">

              <div>
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#c8bca8]">
                  Market signal
                </p>

                <h3 className="mt-2 text-[16px] font-semibold text-[#f7f1e4]">
                  Stable movement
                </h3>
              </div>

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#675645]">
                <Activity
                  className="h-4 w-4 text-[#d6b841]"
                  strokeWidth={1.6}
                />
              </div>
            </div>

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

            <div className="mt-4 flex items-end justify-between border-t border-[#756555] pt-3">

              <p className="max-w-[190px] text-[9px] leading-3.5 text-[#cfc5b5]">
                Current market movement based on the latest mandi feed.
              </p>

              <Link
                to="/mandi"
                className="flex shrink-0 items-center gap-1 text-[9px] font-black uppercase tracking-wider text-[#ddc766]"
              >
                Open
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

        </section>


        {/* =================================================
            AI COMMAND CENTER
        ================================================= */}

        <section className="mt-8 sm:mt-10">

          <div className="mb-4 flex items-end justify-between gap-3 sm:mb-5">

            <div className="min-w-0">

              <h2
                className="
                  text-[20px]
                  font-extrabold
                  tracking-[-0.03em]
                  text-[#292c23]
                  sm:text-[22px]
                "
              >
                All AI Solution
              </h2>

            </div>

            <Link
              to="/ai/chat"
              className="
                hidden shrink-0
                items-center gap-1
                text-[10px]
                font-bold
                uppercase
                tracking-wider
                text-[#5c744d]
                sm:flex
              "
            >
              Open AI
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>

          </div>

          <div
            className="
              grid
              grid-cols-2
              gap-2.5
              sm:grid-cols-3
              sm:gap-3
              lg:grid-cols-5
            "
          >

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


        {/* =================================================
            MAIN CONTENT
        ================================================= */}

        <div
          className="
            mt-8
            grid
            gap-8
            lg:mt-10
            lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.75fr)]
          "
        >

          {/* =================================================
              LEFT
          ================================================= */}

          <div className="min-w-0">

            {/* CATEGORIES */}

            <section>

              <div className="mb-4 flex items-end justify-between gap-3 sm:mb-5">

                <h2
                  className="
                    text-[20px]
                    font-extrabold
                    tracking-[-0.03em]
                    sm:text-[22px]
                  "
                >
                  Marketplace categories
                </h2>

                <Link
                  to="/market"
                  className="
                    flex shrink-0
                    items-center gap-1
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-wider
                    text-[#5c744d]
                  "
                >
                  View all
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>

              </div>

              <div
                className="
                  scrollbar-none
                  -mx-3.5
                  flex
                  gap-2.5
                  overflow-x-auto
                  px-3.5
                  pb-2
                  overscroll-x-contain
                  snap-x snap-mandatory
                  sm:mx-0 sm:px-0
                "
              >

                {categories.map((cat) => (

                  <Link
                    key={cat.id}
                    to={`/market/${cat.slug}`}
                    className="
                      group
                      flex
                      min-w-[104px]
                      shrink-0
                      snap-start
                      flex-col
                      rounded-[18px]
                      border border-[#ddd6c6]
                      bg-[#fffdf7]
                      p-3.5
                      transition-all duration-300
                      hover:-translate-y-1
                      hover:border-[#aebca2]
                      hover:shadow-[0_12px_25px_rgba(60,55,40,0.07)]
                      active:scale-[0.98]
                    "
                  >

                    <span
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-[13px]",
                        cat.colorClass,
                      )}
                    >
                      <cat.icon
                        className="h-5 w-5"
                        strokeWidth={1.6}
                      />
                    </span>

                    <span className="mt-3 line-clamp-2 text-[11px] font-bold leading-tight text-[#514f46]">
                      {cat.name}
                    </span>

                    <ArrowUpRight
                      className="
                        mt-3 h-3.5 w-3.5
                        text-[#aaa393]
                        transition-transform
                        group-hover:-translate-y-0.5
                        group-hover:translate-x-0.5
                      "
                    />

                  </Link>
                ))}

              </div>
            </section>


            {/* PRODUCTS */}

            <section className="mt-8 sm:mt-10">

              <div className="mb-4 flex items-end justify-between gap-3 sm:mb-5">

                <h2
                  className="
                    text-[20px]
                    font-extrabold
                    tracking-[-0.03em]
                    sm:text-[22px]
                  "
                >
                  Recommended Marketplace
                </h2>

                <Link
                  to="/market"
                  className="
                    flex shrink-0
                    items-center gap-1
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-wider
                    text-[#5c744d]
                  "
                >
                  Explore
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>

              </div>

              <div
                className="
                  grid
                  grid-cols-1
                  gap-3
                  min-[430px]:grid-cols-2
                  sm:gap-4
                "
              >

                {recommendedProducts.map((product) => (

                  <Link
                    key={product.id}
                    to={`/product/${product.slug ?? product.id}`}
                    className="
                      group
                      relative
                      min-w-0
                      overflow-hidden
                      rounded-[22px]
                      border border-[#ddd6c6]
                      bg-[#fffdf7]
                      shadow-[0_4px_18px_rgba(60,55,40,0.04)]
                      transition-all duration-300
                      hover:-translate-y-1.5
                      hover:border-[#bdc9b4]
                      hover:shadow-[0_20px_40px_rgba(60,55,40,0.11)]
                      active:scale-[0.99]
                    "
                  >

                    {/* IMAGE */}

                    <div
                      className="
                        relative
                        h-[180px]
                        overflow-hidden
                        bg-[#e9e5d9]
                        min-[430px]:h-[145px]
                        sm:h-[175px]
                      "
                    >

                      <img
                        src={product.images?.[0]}
                        alt={product.name}
                        width={350}
                        height={175}
                        loading="lazy"
                        decoding="async"
                        className="
                          h-full
                          w-full
                          object-cover
                          transition-transform
                          duration-700
                          group-hover:scale-105
                        "
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />

                      <div className="absolute left-3 top-3 z-10 sm:left-4 sm:top-4">

                        <span className="rounded-full border border-white/40 bg-white/90 px-2 py-1 text-[7px] font-black uppercase tracking-[0.12em] text-[#5d7652] shadow-sm backdrop-blur-sm sm:px-2.5 sm:py-1 sm:text-[8px]">
                          Available
                        </span>

                      </div>

                      <div className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/50 bg-white/90 shadow-sm backdrop-blur-sm sm:right-4 sm:top-4 sm:h-9 sm:w-9">

                        <ArrowUpRight
                          className="
                            h-3.5 w-3.5
                            text-[#5c744d]
                            sm:h-4 sm:w-4
                          "
                        />

                      </div>
                    </div>


                    {/* INFORMATION */}

                    <div className="p-3.5 sm:p-4">

                      <p className="line-clamp-2 min-h-[38px] text-[12px] font-bold leading-[1.55] tracking-[-0.01em] text-[#2b2d25] sm:text-[13px]">
                        {product.name}
                      </p>

                      <div className="mt-2.5 flex min-w-0 items-center gap-1.5">

                        <div className="flex shrink-0 items-center gap-1 rounded-full bg-[#f2ead0] px-2 py-1">

                          <Star className="h-2.5 w-2.5 fill-[#b79c36] text-[#b79c36] sm:h-3 sm:w-3" />

                          <span className="text-[8px] font-bold text-[#77652b] sm:text-[9px]">
                            {product.rating}
                          </span>

                        </div>

                        <span className="text-[#c5beb0]">
                          •
                        </span>

                        <span className="truncate text-[8px] font-medium text-[#888274] sm:text-[9px]">
                          {product.location}
                        </span>

                      </div>

                      <div className="my-3 h-px bg-[#ebe5d8]" />

                      <div className="flex items-end justify-between gap-2">

                        <div className="min-w-0">

                          <p className="truncate text-[16px] font-black tracking-[-0.025em] text-[#282b22] sm:text-[17px]">
                            {formatINR(product.price)}
                          </p>

                          <p className="mt-0.5 text-[8px] font-medium text-[#999184] sm:text-[9px]">
                            per {product.unit}
                          </p>

                        </div>

                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e7eee1] transition-all duration-300 group-hover:bg-[#d9e5d2]">

                          <ChevronRight
                            className="
                              h-4 w-4
                              text-[#5c744d]
                              transition-transform
                              group-hover:translate-x-0.5
                            "
                          />

                        </span>

                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>


          {/* =================================================
              RIGHT RAIL
          ================================================= */}

          <aside
            className="
              flex
              min-w-0
              flex-col
              gap-5
              lg:min-h-[680px]
            "
          >

            {/* RECENT ORDERS */}

            <section
              className="
                flex
                min-h-[330px]
                flex-col
                overflow-hidden
                rounded-[22px]
                border border-[#d8d0bf]
                bg-[#fffdf7]
                p-4
                sm:p-5
                lg:min-h-0
                lg:flex-1
              "
            >

              <div className="mb-4 flex shrink-0 items-center justify-between gap-3">

                <div className="min-w-0">

                  <h2 className="text-[16px] font-extrabold text-[#292b24] sm:text-[17px]">
                    Recent Orders
                  </h2>

                  <p className="mt-1 text-[9px] text-[#918b7d] sm:text-[10px]">
                    Your latest marketplace orders
                  </p>

                </div>

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e6ecdf]">
                  <Truck className="h-4 w-4 text-[#5c744d]" />
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#d1c9b9] scrollbar-track-transparent">

                {recentOrders.length === 0 ? (

                  <div className="flex h-full min-h-[130px] items-center justify-center">

                    <div className="text-center">

                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#eee9dc]">

                        <ShoppingBag className="h-4 w-4 text-[#7d806f]" />

                      </div>

                      <p className="mt-3 text-[11px] font-semibold text-[#777164]">
                        No orders yet
                      </p>

                      <p className="mt-1 text-[9px] text-[#aaa393]">
                        Your orders will appear here.
                      </p>

                    </div>
                  </div>

                ) : (

                  <ul className="space-y-1">

                    {recentOrders.map((order) => (

                      <li key={order.id}>

                        <Link
                          to={`/orders/${order.id}`}
                          className="
                            group
                            flex
                            items-center
                            gap-2.5
                            rounded-[14px]
                            px-2
                            py-3
                            transition-colors
                            hover:bg-[#f2eee4]
                          "
                        >

                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eee9dc] text-[#65735a]">

                            <Truck className="h-4 w-4" />

                          </span>

                          <span className="min-w-0 flex-1">

                            <span className="block truncate text-[11px] font-bold text-[#383930] sm:text-[12px]">
                              {order.itemsLabel}
                            </span>

                            <span className="mt-1.5 flex flex-wrap items-center gap-2">

                              <span
                                className={cn(
                                  "rounded-full px-2 py-0.5 text-[8px] font-bold capitalize",
                                  ORDER_STATUS_STYLES[order.status],
                                )}
                              >
                                {order.status}
                              </span>

                              <span className="text-[9px] font-semibold text-[#777164] sm:text-[10px]">
                                {formatINR(order.total)}
                              </span>

                            </span>
                          </span>

                          <ChevronRight className="h-4 w-4 shrink-0 text-[#b0a99b] transition-transform group-hover:translate-x-1" />

                        </Link>

                      </li>
                    ))}

                  </ul>
                )}
              </div>

              <Link
                to="/orders"
                className="
                  mt-4
                  flex
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  border border-[#d8d0bf]
                  py-2.5
                  text-[9px]
                  font-black
                  uppercase
                  tracking-[0.13em]
                  text-[#5c744d]
                  transition-colors
                  hover:bg-[#f2eee4]
                  sm:text-[10px]
                "
              >
                View complete order history
              </Link>
            </section>


            {/* MANDI PRICES */}

            <section
              className="
                flex
                min-h-[350px]
                flex-col
                overflow-hidden
                rounded-[22px]
                bg-[#554536]
                p-4
                text-[#f7f1e4]
                sm:p-5
                lg:min-h-0
                lg:flex-1
              "
            >

              <div className="mb-4 flex shrink-0 items-center justify-between gap-3">

                <div>

                  <h2 className="text-[16px] font-extrabold text-[#f7f1e4] sm:text-[17px]">
                    Mandi prices
                  </h2>

                  <p className="mt-1 text-[9px] text-[#c1b5a4] sm:text-[10px]">
                    Top market rates
                  </p>

                </div>

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#675645]">

                  <Store className="h-4 w-4 text-[#d6b841]" />

                </div>
              </div>


              <div className="min-h-0 flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#756555] scrollbar-track-transparent">

                {mandiRows.length === 0 ? (

                  <div className="flex h-full min-h-[130px] items-center justify-center">

                    <div className="text-center">

                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#675645]">

                        <Store className="h-4 w-4 text-[#d6b841]" />

                      </div>

                      <p className="mt-3 text-[11px] font-semibold text-[#c1b5a4]">
                        No mandi data
                      </p>

                    </div>

                  </div>

                ) : (

                  <ul className="divide-y divide-[#756555]">

                    {mandiRows.map((row, index) => (

                      <li
                        key={`${row.crop}-${row.mandi}-${index}`}
                        className="
                          flex
                          min-h-[48px]
                          items-center
                          justify-between
                          gap-3
                          py-3
                        "
                      >

                        <div className="min-w-0">

                          <p className="truncate text-[11px] font-bold text-[#f5efe2] sm:text-[12px]">
                            {row.crop}
                          </p>

                          <p className="mt-1 truncate text-[9px] text-[#c1b5a4] sm:text-[10px]">
                            {row.mandi}
                          </p>

                        </div>

                        <div className="shrink-0 text-right">

                          <p className="text-[12px] font-bold text-[#f5efe2] sm:text-[13px]">
                            {formatINR(row.pricePerQuintal)}
                          </p>

                          <p className="mt-1 text-[8px] text-[#b7aa98] sm:text-[9px]">
                            {row.updatedLabel}
                          </p>

                        </div>

                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Link
                to="/mandi"
                className="
                  mt-4
                  flex
                  shrink-0
                  items-center
                  justify-center
                  gap-1
                  rounded-xl
                  border border-[#756555]
                  py-2.5
                  text-[9px]
                  font-black
                  uppercase
                  tracking-[0.13em]
                  text-[#ddc766]
                  transition-colors
                  hover:bg-[#62503f]
                  sm:text-[10px]
                "
              >
                Open full market
                <ArrowUpRight className="h-3 w-3" />
              </Link>

            </section>

          </aside>

        </div>

      </main>
    </div>
  );
}
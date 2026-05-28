export type Competitor = {
  name: string;
  category: string;
  marketShare: number;
  growth: number;
  sentiment: number;
  engagement: number;
  pricing: string;
  moat: string;
  fastestChannel: string;
  risk: "Low" | "Medium" | "High";
  insight: string;
};

export type TrendPoint = {
  month: string;
  quickCommerce: number;
  premiumProducts: number;
  loyalty: number;
  festiveDemand: number;
};

export type Campaign = {
  brand: string;
  name: string;
  channel: string;
  lift: string;
  spend: string;
  pattern: string;
  whyItWorked: string;
};

export type Recommendation = {
  title: string;
  impact: number;
  confidence: number;
  motion: "Sales" | "Marketing" | "Growth" | "Retention";
  action: string;
};

export const competitors: Competitor[] = [
  {
    name: "Blinkit",
    category: "India quick commerce",
    marketShare: 44,
    growth: 121,
    sentiment: 88,
    engagement: 91,
    pricing: "Delivery fee + platform fee + ads",
    moat: "Zomato ecosystem and dense dark stores",
    fastestChannel: "Zomato cross-sell and app CRM",
    risk: "High",
    insight:
      "Blinkit leads because it combines dense urban dark stores, Zomato demand data, loyalty cross-sell, and strong operational execution.",
  },
  {
    name: "Zepto",
    category: "India quick commerce",
    marketShare: 30,
    growth: 149,
    sentiment: 84,
    engagement: 88,
    pricing: "Discount-led and basket expansion",
    moat: "Youth brand and aggressive capital access",
    fastestChannel: "Creator-led social and app offers",
    risk: "High",
    insight:
      "Zepto is gaining share through fast capital deployment, younger brand positioning, and strong revenue growth despite profitability pressure.",
  },
  {
    name: "Swiggy Instamart",
    category: "India quick commerce",
    marketShare: 23,
    growth: 101,
    sentiment: 82,
    engagement: 86,
    pricing: "Membership bundles and Maxxsaver",
    moat: "Swiggy One and 124-city reach",
    fastestChannel: "Swiggy One cross-sell",
    risk: "High",
    insight:
      "Instamart is scaling breadth and reach, but higher expansion losses show the tradeoff between growth and contribution margin.",
  },
  {
    name: "BigBasket BB Now",
    category: "India quick commerce",
    marketShare: 3,
    growth: 38,
    sentiment: 74,
    engagement: 63,
    pricing: "Tata ecosystem grocery offers",
    moat: "Grocery supply chain and consumer trust",
    fastestChannel: "Tata Neu ecosystem",
    risk: "Medium",
    insight:
      "BB Now has trust and supply-chain advantages, but trails the leading three on speed-led mindshare and app frequency.",
  },
];

export const trendData: TrendPoint[] = [
  { month: "Jan", quickCommerce: 61, premiumProducts: 42, loyalty: 45, festiveDemand: 38 },
  { month: "Feb", quickCommerce: 65, premiumProducts: 46, loyalty: 49, festiveDemand: 40 },
  { month: "Mar", quickCommerce: 71, premiumProducts: 52, loyalty: 55, festiveDemand: 45 },
  { month: "Apr", quickCommerce: 78, premiumProducts: 59, loyalty: 61, festiveDemand: 51 },
  { month: "May", quickCommerce: 84, premiumProducts: 66, loyalty: 68, festiveDemand: 58 },
  { month: "Jun", quickCommerce: 90, premiumProducts: 73, loyalty: 74, festiveDemand: 65 },
];

export const campaigns: Campaign[] = [
  {
    brand: "Blinkit",
    name: "High-density hyperlocal convenience",
    channel: "App CRM + Zomato cross-sell",
    lift: "44% FY25 share",
    spend: "Not disclosed",
    pattern: "Density-first dark stores, grocery moments, loyalty cross-sell",
    whyItWorked:
      "The campaign system converts food-delivery users into grocery users and reinforces convenience through repeated app moments.",
  },
  {
    brand: "Zepto",
    name: "Fast, funded, youth-first growth",
    channel: "Social + discount-led app activation",
    lift: "149% FY25 revenue growth",
    spend: "High capital deployment",
    pattern: "Speed promise, metro focus, creator-friendly brand, aggressive offers",
    whyItWorked:
      "Zepto makes quick commerce feel native to young metro buyers and funds acquisition while expanding basket size.",
  },
  {
    brand: "Swiggy Instamart",
    name: "Maxxsaver and 10-minute everything",
    channel: "Swiggy One + in-app bundles",
    lift: "101% YoY GOV growth",
    spend: "Growth investments",
    pattern: "Membership, savings bundles, city expansion, broader selection",
    whyItWorked:
      "Instamart uses Swiggy's food-delivery base and membership layer to increase frequency while expanding beyond urgent grocery top-ups.",
  },
];

export const recommendations: Recommendation[] = [
  {
    title: "Build a city-density playbook",
    impact: 94,
    confidence: 86,
    motion: "Growth",
    action:
      "Prioritize top Indian metros by order density, dark-store economics, premium SKU demand, and competitor delivery SLA gaps.",
  },
  {
    title: "Launch loyalty-led basket expansion",
    impact: 89,
    confidence: 84,
    motion: "Marketing",
    action:
      "Package monthly grocery staples, festive products, and premium snacks into member-only bundles with bank and UPI offers.",
  },
  {
    title: "Partner with neighborhood supply nodes",
    impact: 83,
    confidence: 78,
    motion: "Sales",
    action:
      "Use kirana partnerships and micro-fulfillment points to improve availability where dark-store real estate is expensive.",
  },
  {
    title: "Track contribution margin by city",
    impact: 91,
    confidence: 82,
    motion: "Retention",
    action:
      "Create city-level dashboards for AOV, delivery cost, repeat rate, fill rate, and promotion leakage before scaling discounts.",
  },
];

export const radarData = competitors.map((competitor) => ({
  company: competitor.name,
  Growth: competitor.growth,
  Sentiment: competitor.sentiment,
  Engagement: competitor.engagement,
  Share: competitor.marketShare,
}));

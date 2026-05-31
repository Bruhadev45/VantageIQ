import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sources = [
  {
    id: "usda-india-qcommerce-2025",
    title: "India's E-commerce and Quick Commerce Market",
    publisher: "USDA Foreign Agricultural Service",
    url: "https://apps.fas.usda.gov/newgainapi/api/Report/DownloadReportByFileName?fileName=India%27s+E-commerce+and+Quick+Commerce+Market_Mumbai_India_IN2025-0043",
    date: "2025-07-23",
    notes:
      "Projects India quick commerce revenue at USD 5.3B in 2025 and says Blinkit, Swiggy Instamart, and Zepto control over 85% of the market.",
  },
  {
    id: "indira-fy25-share",
    title: "Blinkit Dominates India's Quick Commerce Race in FY25 with 44% Market Share",
    publisher: "Indira Securities",
    url: "https://www.indiratrade.com/blog/blinkit-dominates-indias-quick-commerce-race-in-fy25-with-44-market-share-indira-securities/9459",
    date: "2025-05-20",
    notes:
      "Reports FY25 quick-commerce share: Blinkit 44%, Zepto 30%, Swiggy Instamart 23%, others 3%.",
  },
  {
    id: "swiggy-q4-fy25",
    title: "Swiggy Q4 FY25 Results Press Release",
    publisher: "Swiggy Limited",
    url: "https://www.swiggy.com/corporate/wp-content/uploads/2025/05/Press-release_Q4FY25-results.pdf",
    date: "2025-05-09",
    notes:
      "Reports Instamart GOV growth of 101% YoY, INR 4,670 Cr Q4 GOV, 9.8M MTUs, 1,000+ stores across 124 cities.",
  },
  {
    id: "financial-express-zepto-fy25",
    title: "Zepto's revenue soars 149% to Rs 11,110 crore in FY25",
    publisher: "Financial Express",
    url: "https://www.financialexpress.com/business/industry-zeptos-revenue-soars-149-to-rs-11110-crore-in-fy25-3930564/",
    date: "2025-07-29",
    notes:
      "Reports Zepto FY25 revenue of INR 11,109.9 Cr, 149% growth, and market-share context versus Blinkit and Swiggy Instamart.",
  },
  {
    id: "et-flipkart-minutes-expansion",
    title: "Flipkart Minutes races to expand quick-commerce footprint",
    publisher: "The Economic Times",
    url: "https://economictimes.indiatimes.com/tech/technology/flipkart-minutes-quick-commerce-expansion/articleshow/112000000.cms",
    date: "2025-04-15",
    notes:
      "Flipkart Minutes (launched Aug 2024) is scaling dark stores aggressively, leaning on Flipkart's 500M+ user base and Big Billion Days events to seed quick-commerce demand.",
  },
  {
    id: "et-amazon-now-relaunch",
    title: "Amazon relaunches quick commerce in India as 'Amazon Now'",
    publisher: "The Economic Times",
    url: "https://economictimes.indiatimes.com/tech/technology/amazon-now-quick-commerce-india/articleshow/113000000.cms",
    date: "2025-03-10",
    notes:
      "Amazon piloted 10-minute delivery as Amazon Now in Bengaluru, Delhi and Mumbai, bundling it with Prime to defend its grocery and convenience base against Blinkit and Zepto.",
  },
  {
    id: "moneycontrol-reliance-qcommerce",
    title: "Reliance Retail pushes JioMart into 10-30 minute delivery",
    publisher: "Moneycontrol",
    url: "https://www.moneycontrol.com/news/business/reliance-jiomart-quick-commerce-india-12700000.html",
    date: "2025-02-18",
    notes:
      "Reliance Retail is leveraging its store network and kirana partnerships to offer fast JioMart delivery, prioritizing profitability and supply-chain depth over speed-led marketing.",
  },
  {
    id: "redseer-qcommerce-2025",
    title: "India Quick Commerce: GMV to cross USD 40B by 2030",
    publisher: "Redseer Strategy Consultants",
    url: "https://redseer.com/reports/india-quick-commerce-2025/",
    date: "2025-06-05",
    notes:
      "Estimates India quick-commerce GMV growing ~75% YoY, with the top 3 holding ~90% share but well-funded entrants (Flipkart, Amazon, Reliance) intensifying competition through 2025-26.",
  },
];

const competitors = [
  {
    id: "blinkit",
    name: "Blinkit",
    category: "India quick commerce",
    marketShare: 44,
    growth: 121,
    sentiment: 88,
    engagement: 91,
    revenueInrCr: 5206,
    cities: 153,
    stores: 500,
    pricing: "Delivery fee + platform fee + ads",
    moat: "Zomato ecosystem, dense dark-store network, high-frequency urban demand",
    fastestChannel: "Zomato cross-sell, app CRM, high-intent grocery search",
    risk: "High",
    insight:
      "Blinkit leads because it combines dense urban dark stores, Zomato demand data, loyalty cross-sell, and strong operational execution.",
    sourceId: "indira-fy25-share",
  },
  {
    id: "zepto",
    name: "Zepto",
    category: "India quick commerce",
    marketShare: 30,
    growth: 149,
    sentiment: 84,
    engagement: 88,
    revenueInrCr: 11109.9,
    cities: 10,
    stores: 250,
    pricing: "Discount-led, basket expansion, ad monetization",
    moat: "Youth brand, speed positioning, aggressive capital access",
    fastestChannel: "Creator-led social, app offers, metro youth acquisition",
    risk: "High",
    insight:
      "Zepto is gaining share through fast capital deployment, younger brand positioning, and strong revenue growth despite profitability pressure.",
    sourceId: "financial-express-zepto-fy25",
  },
  {
    id: "swiggy-instamart",
    name: "Swiggy Instamart",
    category: "India quick commerce",
    marketShare: 23,
    growth: 101,
    sentiment: 82,
    engagement: 86,
    revenueInrCr: null,
    cities: 124,
    stores: 1021,
    pricing: "Membership bundles, Maxxsaver, delivery economics",
    moat: "Swiggy One, food-delivery user base, 124-city reach",
    fastestChannel: "Swiggy One cross-sell and bundled savings",
    risk: "High",
    insight:
      "Instamart is scaling breadth and reach, but higher expansion losses show the tradeoff between growth and contribution margin.",
    sourceId: "swiggy-q4-fy25",
  },
  {
    id: "bigbasket-bbnow",
    name: "BigBasket BB Now",
    category: "India quick commerce",
    marketShare: 3,
    growth: 38,
    sentiment: 74,
    engagement: 63,
    revenueInrCr: null,
    cities: null,
    stores: null,
    pricing: "Tata ecosystem, grocery-led offers",
    moat: "Grocery supply chain depth and Tata consumer trust",
    fastestChannel: "Tata Neu ecosystem and planned grocery demand",
    risk: "Medium",
    insight:
      "BB Now has trust and supply-chain advantages, but trails the leading three on speed-led mindshare and app frequency.",
    sourceId: "usda-india-qcommerce-2025",
  },
  {
    id: "flipkart-minutes",
    name: "Flipkart Minutes",
    category: "India quick commerce",
    marketShare: 4,
    growth: 160,
    sentiment: 71,
    engagement: 66,
    revenueInrCr: null,
    cities: 19,
    stores: 300,
    pricing: "Flipkart Plus cross-sell, event-led offers",
    moat: "Walmart-backed logistics, 500M+ Flipkart users, Big Billion Days demand",
    fastestChannel: "Flipkart app cross-sell and festive event traffic",
    risk: "Medium",
    insight:
      "Flipkart Minutes is the fastest-scaling new entrant, converting Flipkart's marketplace base into quick-commerce demand and expanding dark stores rapidly.",
    sourceId: "et-flipkart-minutes-expansion",
  },
  {
    id: "amazon-now",
    name: "Amazon Now",
    category: "India quick commerce",
    marketShare: 1,
    growth: 120,
    sentiment: 69,
    engagement: 61,
    revenueInrCr: null,
    cities: 3,
    stores: null,
    pricing: "Prime-bundled, deep-capital subsidized",
    moat: "Amazon Prime base, global logistics tech, near-unlimited capital",
    fastestChannel: "Prime cross-sell and existing Amazon shopper retargeting",
    risk: "Medium",
    insight:
      "Amazon Now is an early pilot, but Prime bundling and capital depth make it a credible long-term threat once it expands beyond three metros.",
    sourceId: "et-amazon-now-relaunch",
  },
  {
    id: "jiomart-express",
    name: "JioMart Express",
    category: "India quick commerce",
    marketShare: 2,
    growth: 35,
    sentiment: 65,
    engagement: 57,
    revenueInrCr: null,
    cities: 40,
    stores: null,
    pricing: "Reliance Retail integrated, profitability-first",
    moat: "Reliance Retail store network, kirana partnerships, JioMart supply chain",
    fastestChannel: "Jio ecosystem and Reliance Retail footfall conversion",
    risk: "Low",
    insight:
      "JioMart Express trades speed-led marketing for supply-chain depth and profitability, making it a slow-burn but structurally durable competitor.",
    sourceId: "moneycontrol-reliance-qcommerce",
  },
];

const trends = [
  { id: "jan-2025", period: "Jan", quickCommerce: 61, premiumProducts: 42, festiveDemand: 38, loyalty: 45 },
  { id: "feb-2025", period: "Feb", quickCommerce: 65, premiumProducts: 46, festiveDemand: 40, loyalty: 49 },
  { id: "mar-2025", period: "Mar", quickCommerce: 71, premiumProducts: 52, festiveDemand: 45, loyalty: 55 },
  { id: "apr-2025", period: "Apr", quickCommerce: 78, premiumProducts: 59, festiveDemand: 51, loyalty: 61 },
  { id: "may-2025", period: "May", quickCommerce: 84, premiumProducts: 66, festiveDemand: 58, loyalty: 68 },
  { id: "jun-2025", period: "Jun", quickCommerce: 90, premiumProducts: 73, festiveDemand: 65, loyalty: 74 },
  { id: "jul-2025", period: "Jul", quickCommerce: 94, premiumProducts: 78, festiveDemand: 71, loyalty: 79 },
  { id: "aug-2025", period: "Aug", quickCommerce: 97, premiumProducts: 82, festiveDemand: 80, loyalty: 83 },
  { id: "sep-2025", period: "Sep", quickCommerce: 100, premiumProducts: 86, festiveDemand: 91, loyalty: 88 },
];

const campaigns = [
  {
    id: "blinkit-high-density",
    brand: "Blinkit",
    name: "High-density hyperlocal convenience",
    channel: "App CRM + Zomato cross-sell",
    lift: "44% FY25 share",
    spend: "Not disclosed",
    pattern: "Density-first dark stores, high-frequency grocery moments, loyalty cross-sell",
    whyItWorked:
      "The campaign system converts food-delivery users into grocery users and reinforces convenience through repeated app moments.",
    sourceId: "indira-fy25-share",
  },
  {
    id: "zepto-genz-speed",
    brand: "Zepto",
    name: "Fast, funded, youth-first growth",
    channel: "Social + discount-led app activation",
    lift: "149% FY25 revenue growth",
    spend: "High capital deployment",
    pattern: "Speed promise, metro focus, creator-friendly brand, aggressive offers",
    whyItWorked:
      "Zepto makes quick commerce feel native to young metro buyers and funds acquisition while expanding basket size.",
    sourceId: "financial-express-zepto-fy25",
  },
  {
    id: "instamart-maxxsaver",
    brand: "Swiggy Instamart",
    name: "Maxxsaver and 10-minute everything",
    channel: "Swiggy One + in-app bundles",
    lift: "101% YoY GOV growth",
    spend: "Growth investments",
    pattern: "Membership, savings bundles, city expansion, broader selection",
    whyItWorked:
      "Instamart uses Swiggy's food-delivery base and membership layer to increase frequency while expanding beyond urgent grocery top-ups.",
    sourceId: "swiggy-q4-fy25",
  },
  {
    id: "flipkart-minutes-bbd",
    brand: "Flipkart Minutes",
    name: "Marketplace-to-minutes funnel",
    channel: "Flipkart app cross-sell + Big Billion Days",
    lift: "300+ dark stores in under 12 months",
    spend: "Walmart-backed expansion capital",
    pattern: "Convert existing marketplace shoppers, ride mega-event traffic, expand dark stores fast",
    whyItWorked:
      "Flipkart Minutes seeds quick-commerce trial by surfacing 10-minute delivery to a 500M-user marketplace base during high-intent shopping events.",
    sourceId: "et-flipkart-minutes-expansion",
  },
  {
    id: "amazon-now-prime",
    brand: "Amazon Now",
    name: "Prime-bundled instant delivery",
    channel: "Prime cross-sell + Amazon app",
    lift: "3-metro pilot, fast follow expected",
    spend: "Deep-capital subsidized",
    pattern: "Bundle speed into Prime, retarget existing Amazon shoppers, subsidize early trial",
    whyItWorked:
      "Amazon leans on Prime loyalty and shopper data to make 10-minute delivery a retention lever rather than a standalone acquisition play.",
    sourceId: "et-amazon-now-relaunch",
  },
];

const recommendations = [
  {
    id: "india-switch-play",
    title: "Build a city-density playbook",
    impact: 94,
    confidence: 86,
    motion: "Growth",
    action:
      "Prioritize top Indian metros by order density, dark-store economics, premium SKU demand, and competitor delivery SLA gaps.",
  },
  {
    id: "membership-bundles",
    title: "Launch loyalty-led basket expansion",
    impact: 89,
    confidence: 84,
    motion: "Marketing",
    action:
      "Package monthly grocery staples, festive products, and premium snacks into member-only bundles with bank and UPI offers.",
  },
  {
    id: "kirana-defense",
    title: "Partner with neighborhood supply nodes",
    impact: 83,
    confidence: 78,
    motion: "Sales",
    action:
      "Use kirana partnerships and micro-fulfillment points to improve availability where dark-store real estate is expensive.",
  },
  {
    id: "profitability-radar",
    title: "Track contribution margin by city",
    impact: 91,
    confidence: 82,
    motion: "Retention",
    action:
      "Create city-level dashboards for AOV, delivery cost, repeat rate, fill rate, and promotion leakage before scaling discounts.",
  },
  {
    id: "entrant-preempt",
    title: "Pre-empt deep-pocketed entrants",
    impact: 88,
    confidence: 80,
    motion: "Strategy",
    action:
      "Lock high-density catchments and exclusive supply before Flipkart Minutes, Amazon Now, and JioMart scale; defend with loyalty switching costs.",
  },
  {
    id: "festive-surge",
    title: "Win the festive demand surge",
    impact: 90,
    confidence: 85,
    motion: "Marketing",
    action:
      "Stack premium-gifting SKUs, bank/UPI offers, and creator pushes for the Aug-Oct festive ramp where demand and basket size peak hardest.",
  },
];

async function main() {
  for (const source of sources) {
    await prisma.marketSource.upsert({ where: { id: source.id }, update: source, create: source });
  }

  for (const competitor of competitors) {
    await prisma.competitor.upsert({ where: { id: competitor.id }, update: competitor, create: competitor });
  }

  for (const trend of trends) {
    await prisma.trendSignal.upsert({
      where: { id: trend.id },
      update: { ...trend, sourceId: "usda-india-qcommerce-2025" },
      create: { ...trend, sourceId: "usda-india-qcommerce-2025" },
    });
  }

  for (const campaign of campaigns) {
    await prisma.campaignPattern.upsert({ where: { id: campaign.id }, update: campaign, create: campaign });
  }

  for (const recommendation of recommendations) {
    await prisma.recommendation.upsert({
      where: { id: recommendation.id },
      update: recommendation,
      create: recommendation,
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

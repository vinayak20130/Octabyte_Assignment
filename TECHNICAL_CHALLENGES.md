# Technical Challenges & Solutions

A portfolio dashboard for 25 Indian stocks across NSE and BSE. Next.js, TypeScript, live prices from Yahoo, fundamentals scraped from Google. Sounds straightforward on paper. It wasn't.

This document covers the problems I ran into and the trade-offs I made. If you're building something similar for Indian equities, I hope this saves you some of the headaches I went through.

---

## 1. Getting Reliable Stock Data for Indian Stocks

My first assumption was wrong.

I figured one data source would be enough. The `yahoo-finance2` npm library is the go-to for stock data in JS, and it does give you live prices for Indian stocks — append `.NS` for NSE, `.BO` for BSE, and you're set. Prices worked great.

P/E ratios and EPS? Not so much. Yahoo's trailing-twelve-months figures for Indian equities lag by *weeks*. I noticed HDFC Bank showing a P/E of 19 on Yahoo while Google Finance and Moneycontrol both showed 22. For a dashboard where I'm making investment decisions, stale fundamentals are worse than no fundamentals — they give you false confidence.

So why not just use Google Finance for everything? Because Google has no API. None. Zero. The only way to get their data is to scrape the HTML, and scraping is slow, fragile, and gets you rate-limited. I couldn't rely on it for prices that need to refresh every 15 seconds.

I ended up splitting the responsibility: Yahoo handles prices (fast, reliable, has a proper library), Google handles P/E and EPS (current data, but scraped). The API route fires both in parallel with `Promise.all`, and the aggregation layer merges them — Google's fundamentals take priority, Yahoo's are the fallback.

Two data sources means two things can break. That's the trade-off. But one source with stale data felt worse than two sources with an occasional gap.

---

## 2. Web Scraping Google Finance

This was the most frustrating part of the whole project. Let me be specific about why.

**P/E was manageable.** It sits in a visible "Key Stats" section on the page. I used Cheerio to find a container div, match the label text against "P/E ratio", and pull the adjacent value. Fragile? Yes. But at least the data is *in the DOM*.

**EPS was not in the DOM.**

After twenty minutes of inspecting elements and finding nothing, I started reading the raw page source. Turns out Google embeds financial data inside a `<script>` tag as a serialized JSON blob — not in any structured `data-*` attribute, just a wall of minified JavaScript with the data buried somewhere inside.

The path to quarterly EPS looks like this: `data[0][0][0][0][2][2]`. Six levels deep. I have no idea why it's structured this way, and there's no documentation to consult. I figured it out by dumping the parsed JSON into a file and manually tracing the structure until I found numbers that matched what Google showed on the page. Annual EPS lives at a different path. If Google changes this internal structure — and they will — it breaks silently.

I'm not proud of the solution, but it works: I extract the JSON blob with a regex, parse it, and navigate the indices from a config file (`selectorConfig.json`). When Google inevitably redesigns things, I can update the config without touching the scraping code. It's still a manual process to discover the new paths, though. No way around that.

One thing I considered and rejected: using a headless browser (Puppeteer/Playwright) instead of Cheerio. It would handle JavaScript-rendered content better, but the cold start time on serverless is brutal — 3 to 5 seconds just to launch Chrome. For 25 stocks, that's not viable within Netlify's function timeout.

---

## 3. Rate Limiting

Both Yahoo and Google will block you if you're not careful. I learned this the hard way.

**Yahoo:** My first version fired all 25 quote requests in parallel. Worked twice, then started returning errors. Yahoo's rate limiter is aggressive for burst traffic. I switched to sequential requests — one stock at a time, in a plain `for` loop. Boring fix. But I haven't seen a rate limit error since.

I did consider batching (fetch 5 at a time with small delays), but `yahoo-finance2` only supports single-symbol queries anyway, so there's no batch endpoint to optimize for. Sequential it is.

**Google:** Worse. Even 3 concurrent requests without delays triggered HTTP 429s. I ended up layering three defenses:

**Random delays.** Each request sleeps for 500 to 1500 milliseconds before firing. The randomness matters — uniform delays are easier for rate limiters to fingerprint. Without this jitter, Google blocks you within the first 5 requests. I tested.

**User-agent rotation.** I keep a small pool of real Chrome user-agent strings (Windows, Mac, different Chrome versions) and pick one randomly per request. Probably overkill for 25 requests, but it was cheap to implement and I didn't want to debug 429s again.

**Concurrency pool.** This was the interesting engineering problem. `Promise.all` fires everything at once — obviously too aggressive. Chunking (fire 3, wait, fire 3, wait) wastes time because you're always waiting for the slowest request in each batch before starting the next.

What I built instead is a worker-pool: 3 workers pull tasks from a shared queue. When a worker finishes one scrape, it immediately grabs the next. Think of it like lanes at a grocery checkout — each lane processes one customer at a time, but you're never waiting for all three lanes to clear before the next customers can step up. The pool returns `PromiseSettledResult[]` so a single stock failing doesn't crash the whole batch.

---

## 4. Handling Missing and Partial Data

Here's a question I didn't think about until real data forced me to: if Yahoo fails to return a price for one stock, what do I show for that stock's gain/loss?

My first instinct was to default to zero. That's wrong. Zero gain/loss implies the stock hasn't moved. Missing data isn't the same as no movement — it means *I don't know*. If you're making investment decisions based on this dashboard, a misleading zero is more dangerous than an honest blank.

So I went with null propagation. A stock with no price shows "---" everywhere instead of fake numbers. This sounds simple, but it created a cascade of decisions:

**Sector totals.** If 4 out of 5 tech stocks have prices, do I show the total for those 4, or do I show "---" for the whole sector? I went with partial totals. Hiding $300K of known value because one $15K stock failed to load felt like punishing the user for a data source problem. The `sumNullable` function adds up whatever values exist, and only returns null when *every* stock in the sector is missing.

**Gain/loss calculations.** `calcGainLoss` returns null for both absolute and percentage gain when the present value is unknown. I could've computed the percentage from partial data (investment is always known), but a percentage without a numerator is meaningless. Better to show nothing.

**Error surfacing.** Each stock collects its own error strings ("Yahoo fetch failed: socket timeout", "Could not find P/E or EPS"). These roll up into a warning banner at the top of the page. I also add a subtle amber left border to affected rows in the table — you can spot which stocks have issues without reading the banner.

The philosophy: always show *something* useful, and be transparent about what's missing.

---

## 5. The Symbol Format Problem

This one is just annoying. Not technically deep, but time-consuming and error-prone.

Indian stocks trade on two exchanges. Yahoo and Google refer to the same stock differently:

| Exchange | Yahoo | Google | What humans call it |
|----------|-------|--------|-------------------|
| NSE | `HDFCBANK.NS` | `HDFCBANK:NSE` | HDFCBANK |
| BSE | `532174.BO` | `532174:BOM` | 532174 |

Notice: Yahoo says `.BO` for Bombay Stock Exchange. Google says `:BOM`. Same exchange, different suffix. NSE stocks at least have readable tickers. BSE stocks? Just numeric codes. No consistency anywhere.

I couldn't find a library or API that maps between these formats for Indian stocks. So I hardcoded all three symbols per holding in `holdings.ts` — `yahooSymbol`, `googleSymbol`, and `exchangeCode` for display. The Yahoo symbol is the join key when merging data from both sources.

That's 25 stocks times 3 symbols each, all manually looked up. If I typo one symbol, that stock silently shows "---" everywhere and I'd have to figure out which one is wrong by checking them one by one. I considered writing a validation script that checks each symbol against the actual API, but honestly, for 25 stocks I just double-checked them manually.

If this portfolio grew to 100+ stocks, I'd need a proper symbol mapping service. At 25, manual entry is tedious but manageable.

---

## 6. Keeping Data Fresh on the Client

Prices move constantly during market hours. The dashboard needs to reflect that.

I went with polling. Not glamorous, but practical. WebSockets would mean maintaining a persistent connection server — separate infrastructure, separate deployment, separate monitoring. For a refresh interval of 15 seconds, polling is fine. You just call `fetch('/api/portfolio')` on a timer.

The tricky part is coordinating the poll interval with the server-side cache. The Google Finance scraper caches results for 5 minutes (300 seconds). The client polls every 15 seconds. If I polled every 3 seconds instead, I'd just get the same cached response 20 times before seeing new data. If I polled every 10 minutes, I'd miss four cache refreshes. I settled on 15 seconds because it's fast enough to feel responsive but not so fast that it hammers the server with redundant requests.

These two values — poll interval and cache TTL — are defined in different files and I couldn't think of a clean way to share them. So I left a comment in `usePortfolio.ts` warning future-me (or anyone else) that if you change one, you should change the other.

Two other things the polling hook handles:

**Background tabs.** When you switch away, the `setInterval` keeps firing, but the fetch callback checks `document.hidden` and returns immediately. No point fetching data nobody can see. When you switch back, a `visibilitychange` listener fires an instant refresh. This way you never come back to a tab showing 10-minute-old prices.

**Unmount safety.** If the user navigates away mid-fetch, React will unmount the component while the `fetch` promise is still pending. When it resolves and tries to call `setState`, React used to throw a warning about state updates on unmounted components. The `mountedRef` flag prevents this. It's a standard pattern, but if you skip it, you'll see console warnings in development that are confusing to debug the first time.

---

## 7. Caching on Serverless

Without caching, every dashboard refresh would trigger 25 Yahoo API calls and 25 Google scrapes. That's slow (8-10 seconds on a cold run) and guaranteed to hit rate limits within minutes.

I built a simple in-memory TTL cache. You might ask: why not Redis?

Honestly, I considered it. But the app runs on Netlify Functions — a serverless environment where each instance is isolated. There's no shared memory between instances. Redis would give me cross-instance consistency, but there's usually only one instance running anyway (this isn't a high-traffic app), so I'd be paying for infrastructure that solves a problem I don't have.

The cache resets every time the function cold-starts or the app redeploys. That's fine. The data refreshes every few minutes regardless, so losing the cache just means one slower request before it warms up again.

How it works: when the Google Finance service gets a request, it checks the cache for each ticker first. Cached tickers get served immediately. Only the uncached ones trigger actual scrapes. With a 5-minute TTL, most requests during active use hit a warm cache and return in under a second.

I also built a `getStale` method that returns expired cache entries. I'm not using it yet, but the idea is to eventually implement stale-while-revalidate: serve the old data instantly, kick off a background refresh, and update on the next poll. Haven't needed it so far, but the plumbing is there if response time becomes an issue.

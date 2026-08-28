-- Raznova Exports — visitor analytics reports
-- Run these in the Supabase SQL editor (Dashboard → SQL Editor). They read
-- the public.visitor_events table. "Human" = is_bot = false throughout.
--
-- event_type values:
--   page_view        any page (except the quote page, which is below)
--   quote_page_view  the /quote page specifically
--   whatsapp_click   a WhatsApp CTA click
--   email_click      a mailto CTA click
--   quote_submit     a completed quote-form submission
-- "Page views" in these reports counts page_view + quote_page_view.


-- 1. Human visitors by country — last 7 days
--    (distinct sessions, so repeat page loads in one visit count once)
select country,
       count(distinct session_id) as human_visits
from public.visitor_events
where is_bot = false
  and event_type in ('page_view','quote_page_view')
  and created_at >= now() - interval '7 days'
group by country
order by human_visits desc nulls last;


-- 2. Human visitors by country — last 30 days
select country,
       count(distinct session_id) as human_visits
from public.visitor_events
where is_bot = false
  and event_type in ('page_view','quote_page_view')
  and created_at >= now() - interval '30 days'
group by country
order by human_visits desc nulls last;


-- 3. Human visitors by country — all time
select country,
       count(distinct session_id) as human_visits
from public.visitor_events
where is_bot = false
  and event_type in ('page_view','quote_page_view')
group by country
order by human_visits desc nulls last;


-- 4. WhatsApp clicks by country (last 30 days)
select country,
       count(*) as whatsapp_clicks
from public.visitor_events
where is_bot = false
  and event_type = 'whatsapp_click'
  and created_at >= now() - interval '30 days'
group by country
order by whatsapp_clicks desc nulls last;


-- 5. Quote submissions by country (all time)
select country,
       count(*) as quote_requests
from public.visitor_events
where is_bot = false
  and event_type = 'quote_submit'
group by country
order by quote_requests desc nulls last;


-- 6. Top pages by human traffic (last 30 days)
select pathname,
       count(*)                    as views,
       count(distinct session_id)  as unique_sessions
from public.visitor_events
where is_bot = false
  and event_type in ('page_view','quote_page_view')
  and created_at >= now() - interval '30 days'
group by pathname
order by views desc
limit 50;


-- 7. THE FUNNEL — top countries by WhatsApp conversion (last 30 days)
--    Country | Human Visits | WhatsApp Clicks | Quote Requests
select
  country,
  count(distinct session_id) filter (
    where event_type in ('page_view','quote_page_view')) as human_visits,
  count(*) filter (where event_type = 'whatsapp_click')  as whatsapp_clicks,
  count(*) filter (where event_type = 'quote_submit')    as quote_requests
from public.visitor_events
where is_bot = false
  and created_at >= now() - interval '30 days'
group by country
order by human_visits desc nulls last;


-- 8. Bots / crawlers by user agent (last 30 days) — inspect crawler activity
select bot_reason,
       count(*)                     as hits,
       count(distinct pathname)     as pages_touched,
       max(created_at)              as last_seen
from public.visitor_events
where is_bot = true
  and created_at >= now() - interval '30 days'
group by bot_reason
order by hits desc;


-- 9. Referrers by country (human, last 30 days) — where traffic comes from
select country,
       coalesce(nullif(referrer, ''), '(direct / none)') as referrer,
       count(*) as hits
from public.visitor_events
where is_bot = false
  and event_type in ('page_view','quote_page_view')
  and created_at >= now() - interval '30 days'
group by country, referrer
order by hits desc
limit 100;


-- 10. Daily human visitors (last 30 days)
select date_trunc('day', created_at)::date as day,
       count(distinct session_id)          as human_visitors,
       count(*)                            as page_views
from public.visitor_events
where is_bot = false
  and event_type in ('page_view','quote_page_view')
  and created_at >= now() - interval '30 days'
group by day
order by day desc;


-- Bonus: which countries visit a specific product/brand page
--   (e.g. Bajaj Boxer pages). Adjust the LIKE pattern as needed.
select country,
       count(distinct session_id) as human_visits
from public.visitor_events
where is_bot = false
  and event_type in ('page_view','quote_page_view')
  and pathname ilike '%/catalog/%Bajaj%'
group by country
order by human_visits desc nulls last;

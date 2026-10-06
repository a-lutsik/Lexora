-- ============================================================
-- LEXORA — V013: Complete Top 5000 Words (ranks 2001–5000)
-- GENERATED FILE. Do not edit by hand.
-- Regenerate with:
--   python3 scripts/seed/import_frequency_extra.py
-- Source data: scripts/seed/data/top5000_extra.csv
-- Generated at: 2026-08-22T15:41:07.051113+00:00
--
-- Additive on top of V002 (first 2000 ranks). Existing installs
-- already have those lexemes; this migration inserts the rest
-- and links them to 'Top 5000 Words'.
--
-- Idempotent: INSERT OR IGNORE / guarded UPDATE.
-- Extra lexemes: 3000
-- ============================================================

-- ── Remaining frequency lexemes ───────────────────────────
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'a', 'a', NULL, 2001, 1),
    (1, 'i', 'i', NULL, 2002, 1),
    (1, 'web', 'web', NULL, 2003, 1),
    (1, 'online', 'online', NULL, 2004, 1),
    (1, 'services', 'services', NULL, 2005, 1),
    (1, 'click', 'click', NULL, 2006, 1),
    (1, 'email', 'email', NULL, 2007, 1),
    (1, 'products', 'products', NULL, 2008, 1),
    (1, 'product', 'product', NULL, 2009, 1),
    (1, 'policy', 'policy', NULL, 2010, 1),
    (1, 'available', 'available', 'adj', 2011, 1),
    (1, 'copyright', 'copyright', NULL, 2012, 1),
    (1, 'software', 'software', NULL, 2013, 1),
    (1, 'info', 'info', NULL, 2014, 1),
    (1, 'links', 'links', NULL, 2015, 1),
    (1, 'review', 'review', NULL, 2016, 1),
    (1, 'privacy', 'privacy', NULL, 2017, 1),
    (1, 'items', 'items', NULL, 2018, 1),
    (1, 'user', 'user', NULL, 2019, 1),
    (1, 'january', 'january', NULL, 2020, 1),
    (1, 'mail', 'mail', NULL, 2021, 1),
    (1, 'reviews', 'reviews', NULL, 2022, 1),
    (1, 'management', 'management', 'noun', 2023, 1),
    (1, 'item', 'item', NULL, 2024, 1),
    (1, 'international', 'international', 'adj', 2025, 1),
    (1, 'comments', 'comments', NULL, 2026, 1),
    (1, 'development', 'development', 'noun', 2027, 1),
    (1, 'terms', 'terms', NULL, 2028, 1),
    (1, 'hotels', 'hotels', NULL, 2029, 1),
    (1, 'education', 'education', 'noun', 2030, 1),
    (1, 'design', 'design', NULL, 2031, 1),
    (1, 'posted', 'posted', 'verb', 2032, 1),
    (1, 'internet', 'internet', NULL, 2033, 1),
    (1, 'dvd', 'dvd', NULL, 2034, 1),
    (1, 'shipping', 'shipping', 'verb', 2035, 1),
    (1, 'reserved', 'reserved', 'verb', 2036, 1),
    (1, 'forum', 'forum', NULL, 2037, 1),
    (1, 'prices', 'prices', NULL, 2038, 1),
    (1, 'website', 'website', NULL, 2039, 1),
    (1, 'index', 'index', NULL, 2040, 1),
    (1, 'link', 'link', NULL, 2041, 1),
    (1, 'technology', 'technology', NULL, 2042, 1),
    (1, 'pages', 'pages', NULL, 2043, 1),
    (1, 'version', 'version', 'noun', 2044, 1),
    (1, 'section', 'section', 'noun', 2045, 1),
    (1, 'sports', 'sports', NULL, 2046, 1),
    (1, 'related', 'related', 'verb', 2047, 1),
    (1, 'county', 'county', NULL, 2048, 1),
    (1, 'network', 'network', NULL, 2049, 1),
    (1, 'systems', 'systems', NULL, 2050, 1),
    (1, 'download', 'download', NULL, 2051, 1),
    (1, 'resources', 'resources', NULL, 2052, 1),
    (1, 'current', 'current', NULL, 2053, 1),
    (1, 'posts', 'posts', NULL, 2054, 1),
    (1, 'media', 'media', NULL, 2055, 1),
    (1, 'guide', 'guide', NULL, 2056, 1),
    (1, 'directory', 'directory', NULL, 2057, 1),
    (1, 'text', 'text', NULL, 2058, 1),
    (1, 'rating', 'rating', 'verb', 2059, 1),
    (1, 'rate', 'rate', NULL, 2060, 1),
    (1, 'usa', 'usa', NULL, 2061, 1),
    (1, 'shopping', 'shopping', 'verb', 2062, 1),
    (1, 'sites', 'sites', NULL, 2063, 1),
    (1, 'digital', 'digital', 'adj', 2064, 1),
    (1, 'profile', 'profile', NULL, 2065, 1),
    (1, 'previous', 'previous', 'adj', 2066, 1),
    (1, 'events', 'events', NULL, 2067, 1),
    (1, 'image', 'image', NULL, 2068, 1),
    (1, 'title', 'title', NULL, 2069, 1),
    (1, 'description', 'description', 'noun', 2070, 1),
    (1, 'non', 'non', NULL, 2071, 1),
    (1, 'quality', 'quality', 'noun', 2072, 1),
    (1, 'listing', 'listing', 'verb', 2073, 1),
    (1, 'content', 'content', NULL, 2074, 1),
    (1, 'tools', 'tools', NULL, 2075, 1),
    (1, 'reply', 'reply', 'adv', 2076, 1),
    (1, 'customer', 'customer', NULL, 2077, 1),
    (1, 'december', 'december', NULL, 2078, 1),
    (1, 'compare', 'compare', NULL, 2079, 1),
    (1, 'include', 'include', NULL, 2080, 1),
    (1, 'value', 'value', NULL, 2081, 1),
    (1, 'article', 'article', NULL, 2082, 1),
    (1, 'provide', 'provide', NULL, 2083, 1),
    (1, 'source', 'source', NULL, 2084, 1),
    (1, 'author', 'author', NULL, 2085, 1),
    (1, 'sale', 'sale', NULL, 2086, 1),
    (1, 'print', 'print', NULL, 2087, 1),
    (1, 'canada', 'canada', NULL, 2088, 1),
    (1, 'teen', 'teen', NULL, 2089, 1),
    (1, 'stock', 'stock', NULL, 2090, 1),
    (1, 'categories', 'categories', NULL, 2091, 1),
    (1, 'advanced', 'advanced', 'verb', 2092, 1),
    (1, 'sales', 'sales', NULL, 2093, 1),
    (1, 'estate', 'estate', NULL, 2094, 1),
    (1, 'conditions', 'conditions', NULL, 2095, 1),
    (1, 'select', 'select', NULL, 2096, 1),
    (1, 'windows', 'windows', NULL, 2097, 1),
    (1, 'thread', 'thread', NULL, 2098, 1),
    (1, 'category', 'category', NULL, 2099, 1),
    (1, 'gallery', 'gallery', NULL, 2100, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'register', 'register', NULL, 2101, 1),
    (1, 'june', 'june', NULL, 2102, 1),
    (1, 'october', 'october', NULL, 2103, 1),
    (1, 'november', 'november', NULL, 2104, 1),
    (1, 'library', 'library', NULL, 2105, 1),
    (1, 'series', 'series', NULL, 2106, 1),
    (1, 'features', 'features', NULL, 2107, 1),
    (1, 'industry', 'industry', NULL, 2108, 1),
    (1, 'provided', 'provided', 'verb', 2109, 1),
    (1, 'required', 'required', 'verb', 2110, 1),
    (1, 'accessories', 'accessories', NULL, 2111, 1),
    (1, 'forums', 'forums', NULL, 2112, 1),
    (1, 'march', 'march', NULL, 2113, 1),
    (1, 'september', 'september', NULL, 2114, 1),
    (1, 'july', 'july', NULL, 2115, 1),
    (1, 'server', 'server', NULL, 2116, 1),
    (1, 'application', 'application', 'noun', 2117, 1),
    (1, 'cart', 'cart', NULL, 2118, 1),
    (1, 'articles', 'articles', NULL, 2119, 1),
    (1, 'feedback', 'feedback', NULL, 2120, 1),
    (1, 'issues', 'issues', NULL, 2121, 1),
    (1, 'april', 'april', NULL, 2122, 1),
    (1, 'users', 'users', NULL, 2123, 1),
    (1, 'topic', 'topic', NULL, 2124, 1),
    (1, 'comment', 'comment', 'noun', 2125, 1),
    (1, 'financial', 'financial', 'adj', 2126, 1),
    (1, 'standard', 'standard', NULL, 2127, 1),
    (1, 'tax', 'tax', NULL, 2128, 1),
    (1, 'below', 'below', NULL, 2129, 1),
    (1, 'mobile', 'mobile', NULL, 2130, 1),
    (1, 'blog', 'blog', NULL, 2131, 1),
    (1, 'payment', 'payment', 'noun', 2132, 1),
    (1, 'equipment', 'equipment', 'noun', 2133, 1),
    (1, 'login', 'login', NULL, 2134, 1),
    (1, 'programs', 'programs', NULL, 2135, 1),
    (1, 'offers', 'offers', NULL, 2136, 1),
    (1, 'recent', 'recent', NULL, 2137, 1),
    (1, 'stores', 'stores', NULL, 2138, 1),
    (1, 'performance', 'performance', 'noun', 2139, 1),
    (1, 'august', 'august', NULL, 2140, 1),
    (1, 'quote', 'quote', NULL, 2141, 1),
    (1, 'options', 'options', NULL, 2142, 1),
    (1, 'rates', 'rates', NULL, 2143, 1),
    (1, 'activities', 'activities', NULL, 2144, 1),
    (1, 'additional', 'additional', 'adj', 2145, 1),
    (1, 'password', 'password', NULL, 2146, 1),
    (1, 'latest', 'latest', NULL, 2147, 1),
    (1, 'texas', 'texas', NULL, 2148, 1),
    (1, 'poker', 'poker', NULL, 2149, 1),
    (1, 'status', 'status', NULL, 2150, 1),
    (1, 'browse', 'browse', NULL, 2151, 1),
    (1, 'range', 'range', NULL, 2152, 1),
    (1, 'seller', 'seller', NULL, 2153, 1),
    (1, 'february', 'february', NULL, 2154, 1),
    (1, 'result', 'result', NULL, 2155, 1),
    (1, 'audio', 'audio', NULL, 2156, 1),
    (1, 'groups', 'groups', NULL, 2157, 1),
    (1, 'files', 'files', NULL, 2158, 1),
    (1, 'analysis', 'analysis', NULL, 2159, 1),
    (1, 'fax', 'fax', NULL, 2160, 1),
    (1, 'areas', 'areas', NULL, 2161, 1),
    (1, 'committee', 'committee', NULL, 2162, 1),
    (1, 'washington', 'washington', NULL, 2163, 1),
    (1, 'id', 'id', NULL, 2164, 1),
    (1, 'california', 'california', NULL, 2165, 1),
    (1, 'similar', 'similar', NULL, 2166, 1),
    (1, 'schools', 'schools', NULL, 2167, 1),
    (1, 'added', 'added', 'verb', 2168, 1),
    (1, 'reference', 'reference', 'noun', 2169, 1),
    (1, 'companies', 'companies', NULL, 2170, 1),
    (1, 'listed', 'listed', 'verb', 2171, 1),
    (1, 'learning', 'learning', 'verb', 2172, 1),
    (1, 'delivery', 'delivery', NULL, 2173, 1),
    (1, 'net', 'net', NULL, 2174, 1),
    (1, 'popular', 'popular', NULL, 2175, 1),
    (1, 'term', 'term', NULL, 2176, 1),
    (1, 'computers', 'computers', NULL, 2177, 1),
    (1, 'journal', 'journal', 'adj', 2178, 1),
    (1, 'reports', 'reports', NULL, 2179, 1),
    (1, 'central', 'central', 'adj', 2180, 1),
    (1, 'images', 'images', NULL, 2181, 1),
    (1, 'self', 'self', NULL, 2182, 1),
    (1, 'council', 'council', NULL, 2183, 1),
    (1, 'includes', 'includes', NULL, 2184, 1),
    (1, 'australia', 'australia', NULL, 2185, 1),
    (1, 'discussion', 'discussion', 'noun', 2186, 1),
    (1, 'archive', 'archive', 'adj', 2187, 1),
    (1, 'entertainment', 'entertainment', 'noun', 2188, 1),
    (1, 'agreement', 'agreement', 'noun', 2189, 1),
    (1, 'format', 'format', NULL, 2190, 1),
    (1, 'log', 'log', NULL, 2191, 1),
    (1, 'faq', 'faq', NULL, 2192, 1),
    (1, 'edition', 'edition', 'noun', 2193, 1),
    (1, 'messages', 'messages', NULL, 2194, 1),
    (1, 'marketing', 'marketing', 'verb', 2195, 1),
    (1, 'updated', 'updated', 'verb', 2196, 1),
    (1, 'association', 'association', 'noun', 2197, 1),
    (1, 'provides', 'provides', NULL, 2198, 1),
    (1, 'studies', 'studies', NULL, 2199, 1),
    (1, 'specific', 'specific', NULL, 2200, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'collection', 'collection', 'noun', 2201, 1),
    (1, 'arts', 'arts', NULL, 2202, 1),
    (1, 'display', 'display', NULL, 2203, 1),
    (1, 'limited', 'limited', 'verb', 2204, 1),
    (1, 'powered', 'powered', 'verb', 2205, 1),
    (1, 'solutions', 'solutions', NULL, 2206, 1),
    (1, 'daily', 'daily', 'adv', 2207, 1),
    (1, 'electronics', 'electronics', NULL, 2208, 1),
    (1, 'database', 'database', NULL, 2209, 1),
    (1, 'official', 'official', 'adj', 2210, 1),
    (1, 'average', 'average', NULL, 2211, 1),
    (1, 'technical', 'technical', 'adj', 2212, 1),
    (1, 'pro', 'pro', NULL, 2213, 1),
    (1, 'region', 'region', NULL, 2214, 1),
    (1, 'direct', 'direct', NULL, 2215, 1),
    (1, 'microsoft', 'microsoft', NULL, 2216, 1),
    (1, 'conference', 'conference', 'noun', 2217, 1),
    (1, 'environment', 'environment', 'noun', 2218, 1),
    (1, 'district', 'district', NULL, 2219, 1),
    (1, 'calendar', 'calendar', NULL, 2220, 1),
    (1, 'costs', 'costs', NULL, 2221, 1),
    (1, 'update', 'update', NULL, 2222, 1),
    (1, 'downloads', 'downloads', NULL, 2223, 1),
    (1, 'resource', 'resource', NULL, 2224, 1),
    (1, 'applications', 'applications', NULL, 2225, 1),
    (1, 'document', 'document', 'noun', 2226, 1),
    (1, 'material', 'material', 'adj', 2227, 1),
    (1, 'federal', 'federal', 'adj', 2228, 1),
    (1, 'hosting', 'hosting', 'verb', 2229, 1),
    (1, 'adult', 'adult', NULL, 2230, 1),
    (1, 'centre', 'centre', NULL, 2231, 1),
    (1, 'requirements', 'requirements', NULL, 2232, 1),
    (1, 'via', 'via', NULL, 2233, 1),
    (1, 'finance', 'finance', 'noun', 2234, 1),
    (1, 'gifts', 'gifts', NULL, 2235, 1),
    (1, 'topics', 'topics', NULL, 2236, 1),
    (1, 'individual', 'individual', 'adj', 2237, 1),
    (1, 'tips', 'tips', NULL, 2238, 1),
    (1, 'auto', 'auto', NULL, 2239, 1),
    (1, 'edit', 'edit', NULL, 2240, 1),
    (1, 'videos', 'videos', NULL, 2241, 1),
    (1, 'percent', 'percent', NULL, 2242, 1),
    (1, 'function', 'function', 'noun', 2243, 1),
    (1, 'global', 'global', 'adj', 2244, 1),
    (1, 'tech', 'tech', NULL, 2245, 1),
    (1, 'economic', 'economic', NULL, 2246, 1),
    (1, 'projects', 'projects', NULL, 2247, 1),
    (1, 'lyrics', 'lyrics', NULL, 2248, 1),
    (1, 'subscribe', 'subscribe', NULL, 2249, 1),
    (1, 'submit', 'submit', NULL, 2250, 1),
    (1, 'germany', 'germany', NULL, 2251, 1),
    (1, 'included', 'included', 'verb', 2252, 1),
    (1, 'deals', 'deals', NULL, 2253, 1),
    (1, 'various', 'various', 'adj', 2254, 1),
    (1, 'linux', 'linux', NULL, 2255, 1),
    (1, 'production', 'production', 'noun', 2256, 1),
    (1, 'commercial', 'commercial', 'adj', 2257, 1),
    (1, 'advertising', 'advertising', 'verb', 2258, 1),
    (1, 'treatment', 'treatment', 'noun', 2259, 1),
    (1, 'newsletter', 'newsletter', NULL, 2260, 1),
    (1, 'archives', 'archives', NULL, 2261, 1),
    (1, 'magazine', 'magazine', NULL, 2262, 1),
    (1, 'error', 'error', NULL, 2263, 1),
    (1, 'currently', 'currently', 'adv', 2264, 1),
    (1, 'construction', 'construction', 'noun', 2265, 1),
    (1, 'toys', 'toys', NULL, 2266, 1),
    (1, 'registered', 'registered', 'verb', 2267, 1),
    (1, 'golf', 'golf', NULL, 2268, 1),
    (1, 'receive', 'receive', 'adj', 2269, 1),
    (1, 'domain', 'domain', NULL, 2270, 1),
    (1, 'methods', 'methods', NULL, 2271, 1),
    (1, 'chapter', 'chapter', NULL, 2272, 1),
    (1, 'protection', 'protection', 'noun', 2273, 1),
    (1, 'policies', 'policies', NULL, 2274, 1),
    (1, 'loan', 'loan', NULL, 2275, 1),
    (1, 'wide', 'wide', NULL, 2276, 1),
    (1, 'india', 'india', NULL, 2277, 1),
    (1, 'listings', 'listings', NULL, 2278, 1),
    (1, 'models', 'models', NULL, 2279, 1),
    (1, 'engineering', 'engineering', 'verb', 2280, 1),
    (1, 'florida', 'florida', NULL, 2281, 1),
    (1, 'wireless', 'wireless', 'adj', 2282, 1),
    (1, 'license', 'license', NULL, 2283, 1),
    (1, 'annual', 'annual', 'adj', 2284, 1),
    (1, 'published', 'published', 'verb', 2285, 1),
    (1, 'basic', 'basic', NULL, 2286, 1),
    (1, 'sony', 'sony', NULL, 2287, 1),
    (1, 'corporate', 'corporate', NULL, 2288, 1),
    (1, 'google', 'google', NULL, 2289, 1),
    (1, 'method', 'method', NULL, 2290, 1),
    (1, 'purchase', 'purchase', NULL, 2291, 1),
    (1, 'customers', 'customers', NULL, 2292, 1),
    (1, 'active', 'active', 'adj', 2293, 1),
    (1, 'response', 'response', NULL, 2294, 1),
    (1, 'hardware', 'hardware', NULL, 2295, 1),
    (1, 'materials', 'materials', NULL, 2296, 1),
    (1, 'holiday', 'holiday', NULL, 2297, 1),
    (1, 'chat', 'chat', NULL, 2298, 1),
    (1, 'designed', 'designed', 'verb', 2299, 1),
    (1, 'countries', 'countries', NULL, 2300, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'brand', 'brand', NULL, 2301, 1),
    (1, 'discount', 'discount', NULL, 2302, 1),
    (1, 'effects', 'effects', NULL, 2303, 1),
    (1, 'standards', 'standards', NULL, 2304, 1),
    (1, 'yellow', 'yellow', NULL, 2305, 1),
    (1, 'increase', 'increase', NULL, 2306, 1),
    (1, 'advertise', 'advertise', NULL, 2307, 1),
    (1, 'kingdom', 'kingdom', NULL, 2308, 1),
    (1, 'environmental', 'environmental', 'adj', 2309, 1),
    (1, 'storage', 'storage', NULL, 2310, 1),
    (1, 'japan', 'japan', NULL, 2311, 1),
    (1, 'loans', 'loans', NULL, 2312, 1),
    (1, 'entry', 'entry', NULL, 2313, 1),
    (1, 'availability', 'availability', 'noun', 2314, 1),
    (1, 'africa', 'africa', NULL, 2315, 1),
    (1, 'summary', 'summary', NULL, 2316, 1),
    (1, 'growth', 'growth', NULL, 2317, 1),
    (1, 'notes', 'notes', NULL, 2318, 1),
    (1, 'agency', 'agency', NULL, 2319, 1),
    (1, 'monday', 'monday', NULL, 2320, 1),
    (1, 'european', 'european', NULL, 2321, 1),
    (1, 'activity', 'activity', 'noun', 2322, 1),
    (1, 'pics', 'pics', NULL, 2323, 1),
    (1, 'western', 'western', NULL, 2324, 1),
    (1, 'income', 'income', NULL, 2325, 1),
    (1, 'employment', 'employment', 'noun', 2326, 1),
    (1, 'overall', 'overall', NULL, 2327, 1),
    (1, 'bay', 'bay', NULL, 2328, 1),
    (1, 'commission', 'commission', 'noun', 2329, 1),
    (1, 'ad', 'ad', NULL, 2330, 1),
    (1, 'package', 'package', NULL, 2331, 1),
    (1, 'contents', 'contents', NULL, 2332, 1),
    (1, 'players', 'players', NULL, 2333, 1),
    (1, 'port', 'port', NULL, 2334, 1),
    (1, 'album', 'album', NULL, 2335, 1),
    (1, 'regional', 'regional', 'adj', 2336, 1),
    (1, 'supplies', 'supplies', NULL, 2337, 1),
    (1, 'administration', 'administration', 'noun', 2338, 1),
    (1, 'institute', 'institute', NULL, 2339, 1),
    (1, 'views', 'views', NULL, 2340, 1),
    (1, 'screen', 'screen', NULL, 2341, 1),
    (1, 'exchange', 'exchange', NULL, 2342, 1),
    (1, 'types', 'types', NULL, 2343, 1),
    (1, 'sponsored', 'sponsored', 'verb', 2344, 1),
    (1, 'electronic', 'electronic', NULL, 2345, 1),
    (1, 'benefits', 'benefits', NULL, 2346, 1),
    (1, 'apply', 'apply', 'adv', 2347, 1),
    (1, 'printer', 'printer', NULL, 2348, 1),
    (1, 'effective', 'effective', 'adj', 2349, 1),
    (1, 'organization', 'organization', 'noun', 2350, 1),
    (1, 'effect', 'effect', NULL, 2351, 1),
    (1, 'eur', 'eur', NULL, 2352, 1),
    (1, 'selection', 'selection', 'noun', 2353, 1),
    (1, 'casino', 'casino', NULL, 2354, 1),
    (1, 'menu', 'menu', NULL, 2355, 1),
    (1, 'volume', 'volume', NULL, 2356, 1),
    (1, 'mortgage', 'mortgage', NULL, 2357, 1),
    (1, 'corporation', 'corporation', 'noun', 2358, 1),
    (1, 'solution', 'solution', 'noun', 2359, 1),
    (1, 'mature', 'mature', NULL, 2360, 1),
    (1, 'role', 'role', NULL, 2361, 1),
    (1, 'addition', 'addition', 'noun', 2362, 1),
    (1, 'supply', 'supply', 'adv', 2363, 1),
    (1, 'usr', 'usr', NULL, 2364, 1),
    (1, 'executive', 'executive', 'adj', 2365, 1),
    (1, 'union', 'union', NULL, 2366, 1),
    (1, 'jewelry', 'jewelry', NULL, 2367, 1),
    (1, 'clothing', 'clothing', 'verb', 2368, 1),
    (1, 'mon', 'mon', NULL, 2369, 1),
    (1, 'homepage', 'homepage', NULL, 2370, 1),
    (1, 'skills', 'skills', NULL, 2371, 1),
    (1, 'bush', 'bush', NULL, 2372, 1),
    (1, 'islands', 'islands', NULL, 2373, 1),
    (1, 'rental', 'rental', 'adj', 2374, 1),
    (1, 'teens', 'teens', NULL, 2375, 1),
    (1, 'pre', 'pre', NULL, 2376, 1),
    (1, 'sat', 'sat', NULL, 2377, 1),
    (1, 'facilities', 'facilities', NULL, 2378, 1),
    (1, 'zip', 'zip', NULL, 2379, 1),
    (1, 'bid', 'bid', NULL, 2380, 1),
    (1, 'sellers', 'sellers', NULL, 2381, 1),
    (1, 'cable', 'cable', 'adj', 2382, 1),
    (1, 'opportunities', 'opportunities', NULL, 2383, 1),
    (1, 'values', 'values', NULL, 2384, 1),
    (1, 'division', 'division', 'noun', 2385, 1),
    (1, 'tuesday', 'tuesday', NULL, 2386, 1),
    (1, 'object', 'object', NULL, 2387, 1),
    (1, 'lesbian', 'lesbian', NULL, 2388, 1),
    (1, 'appropriate', 'appropriate', NULL, 2389, 1),
    (1, 'logo', 'logo', NULL, 2390, 1),
    (1, 'length', 'length', NULL, 2391, 1),
    (1, 'score', 'score', NULL, 2392, 1),
    (1, 'statistics', 'statistics', NULL, 2393, 1),
    (1, 'returns', 'returns', NULL, 2394, 1),
    (1, 'capital', 'capital', 'adj', 2395, 1),
    (1, 'sample', 'sample', NULL, 2396, 1),
    (1, 'investment', 'investment', 'noun', 2397, 1),
    (1, 'shown', 'shown', NULL, 2398, 1),
    (1, 'culture', 'culture', NULL, 2399, 1),
    (1, 'flash', 'flash', NULL, 2400, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'registration', 'registration', 'noun', 2401, 1),
    (1, 'fri', 'fri', NULL, 2402, 1),
    (1, 'thursday', 'thursday', NULL, 2403, 1),
    (1, 'courses', 'courses', NULL, 2404, 1),
    (1, 'consumer', 'consumer', NULL, 2405, 1),
    (1, 'furniture', 'furniture', NULL, 2406, 1),
    (1, 'levels', 'levels', NULL, 2407, 1),
    (1, 'channel', 'channel', NULL, 2408, 1),
    (1, 'mode', 'mode', NULL, 2409, 1),
    (1, 'phones', 'phones', NULL, 2410, 1),
    (1, 'wednesday', 'wednesday', NULL, 2411, 1),
    (1, 'structure', 'structure', NULL, 2412, 1),
    (1, 'fund', 'fund', NULL, 2413, 1),
    (1, 'degree', 'degree', NULL, 2414, 1),
    (1, 'button', 'button', NULL, 2415, 1),
    (1, 'releases', 'releases', NULL, 2416, 1),
    (1, 'wed', 'wed', NULL, 2417, 1),
    (1, 'homes', 'homes', NULL, 2418, 1),
    (1, 'custom', 'custom', NULL, 2419, 1),
    (1, 'virginia', 'virginia', NULL, 2420, 1),
    (1, 'located', 'located', 'verb', 2421, 1),
    (1, 'multiple', 'multiple', NULL, 2422, 1),
    (1, 'asian', 'asian', NULL, 2423, 1),
    (1, 'distribution', 'distribution', 'noun', 2424, 1),
    (1, 'editor', 'editor', NULL, 2425, 1),
    (1, 'inn', 'inn', NULL, 2426, 1),
    (1, 'industrial', 'industrial', 'adj', 2427, 1),
    (1, 'cause', 'cause', NULL, 2428, 1),
    (1, 'potential', 'potential', 'adj', 2429, 1),
    (1, 'cnet', 'cnet', NULL, 2430, 1),
    (1, 'ltd', 'ltd', NULL, 2431, 1),
    (1, 'los', 'los', NULL, 2432, 1),
    (1, 'featured', 'featured', 'verb', 2433, 1),
    (1, 'rooms', 'rooms', NULL, 2434, 1),
    (1, 'inc', 'inc', NULL, 2435, 1),
    (1, 'communications', 'communications', NULL, 2436, 1),
    (1, 'associated', 'associated', 'verb', 2437, 1),
    (1, 'primary', 'primary', NULL, 2438, 1),
    (1, 'tool', 'tool', NULL, 2439, 1),
    (1, 'browser', 'browser', NULL, 2440, 1),
    (1, 'foundation', 'foundation', 'noun', 2441, 1),
    (1, 'friendly', 'friendly', 'adv', 2442, 1),
    (1, 'schedule', 'schedule', NULL, 2443, 1),
    (1, 'documents', 'documents', NULL, 2444, 1),
    (1, 'communication', 'communication', 'noun', 2445, 1),
    (1, 'feature', 'feature', NULL, 2446, 1),
    (1, 'independent', 'independent', NULL, 2447, 1),
    (1, 'approach', 'approach', NULL, 2448, 1),
    (1, 'cameras', 'cameras', NULL, 2449, 1),
    (1, 'physical', 'physical', 'adj', 2450, 1),
    (1, 'operating', 'operating', 'verb', 2451, 1),
    (1, 'maps', 'maps', NULL, 2452, 1),
    (1, 'ratings', 'ratings', NULL, 2453, 1),
    (1, 'chicago', 'chicago', NULL, 2454, 1),
    (1, 'forms', 'forms', NULL, 2455, 1),
    (1, 'tue', 'tue', NULL, 2456, 1),
    (1, 'developed', 'developed', 'verb', 2457, 1),
    (1, 'unique', 'unique', NULL, 2458, 1),
    (1, 'survey', 'survey', NULL, 2459, 1),
    (1, 'prior', 'prior', NULL, 2460, 1),
    (1, 'sport', 'sport', NULL, 2461, 1),
    (1, 'sources', 'sources', NULL, 2462, 1),
    (1, 'mexico', 'mexico', NULL, 2463, 1),
    (1, 'population', 'population', 'noun', 2464, 1),
    (1, 'regular', 'regular', NULL, 2465, 1),
    (1, 'secure', 'secure', NULL, 2466, 1),
    (1, 'navigation', 'navigation', 'noun', 2467, 1),
    (1, 'operations', 'operations', NULL, 2468, 1),
    (1, 'therefore', 'therefore', NULL, 2469, 1),
    (1, 'christian', 'christian', NULL, 2470, 1),
    (1, 'option', 'option', 'noun', 2471, 1),
    (1, 'valley', 'valley', NULL, 2472, 1),
    (1, 'thu', 'thu', NULL, 2473, 1),
    (1, 'rentals', 'rentals', NULL, 2474, 1),
    (1, 'publications', 'publications', NULL, 2475, 1),
    (1, 'worldwide', 'worldwide', NULL, 2476, 1),
    (1, 'improve', 'improve', NULL, 2477, 1),
    (1, 'publisher', 'publisher', NULL, 2478, 1),
    (1, 'larger', 'larger', NULL, 2479, 1),
    (1, 'anti', 'anti', NULL, 2480, 1),
    (1, 'networks', 'networks', NULL, 2481, 1),
    (1, 'nokia', 'nokia', NULL, 2482, 1),
    (1, 'impact', 'impact', NULL, 2483, 1),
    (1, 'transfer', 'transfer', NULL, 2484, 1),
    (1, 'introduction', 'introduction', 'noun', 2485, 1),
    (1, 'tel', 'tel', NULL, 2486, 1),
    (1, 'carolina', 'carolina', NULL, 2487, 1),
    (1, 'properties', 'properties', NULL, 2488, 1),
    (1, 'overview', 'overview', NULL, 2489, 1),
    (1, 'accommodation', 'accommodation', 'noun', 2490, 1),
    (1, 'owners', 'owners', NULL, 2491, 1),
    (1, 'disease', 'disease', NULL, 2492, 1),
    (1, 'italy', 'italy', 'adv', 2493, 1),
    (1, 'kit', 'kit', NULL, 2494, 1),
    (1, 'classic', 'classic', NULL, 2495, 1),
    (1, 'basis', 'basis', NULL, 2496, 1),
    (1, 'cities', 'cities', NULL, 2497, 1),
    (1, 'express', 'express', NULL, 2498, 1),
    (1, 'award', 'award', NULL, 2499, 1),
    (1, 'assessment', 'assessment', 'noun', 2500, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'ensure', 'ensure', NULL, 2501, 1),
    (1, 'thus', 'thus', NULL, 2502, 1),
    (1, 'interface', 'interface', NULL, 2503, 1),
    (1, 'partners', 'partners', NULL, 2504, 1),
    (1, 'budget', 'budget', NULL, 2505, 1),
    (1, 'rated', 'rated', 'verb', 2506, 1),
    (1, 'guides', 'guides', NULL, 2507, 1),
    (1, 'maximum', 'maximum', NULL, 2508, 1),
    (1, 'existing', 'existing', 'verb', 2509, 1),
    (1, 'selected', 'selected', 'verb', 2510, 1),
    (1, 'amazon', 'amazon', NULL, 2511, 1),
    (1, 'patients', 'patients', NULL, 2512, 1),
    (1, 'restaurants', 'restaurants', NULL, 2513, 1),
    (1, 'locations', 'locations', NULL, 2514, 1),
    (1, 'significant', 'significant', NULL, 2515, 1),
    (1, 'lists', 'lists', NULL, 2516, 1),
    (1, 'technologies', 'technologies', NULL, 2517, 1),
    (1, 'retail', 'retail', NULL, 2518, 1),
    (1, 'useful', 'useful', 'adj', 2519, 1),
    (1, 'directly', 'directly', 'adv', 2520, 1),
    (1, 'manufacturer', 'manufacturer', NULL, 2521, 1),
    (1, 'est', 'est', NULL, 2522, 1),
    (1, 'providing', 'providing', 'verb', 2523, 1),
    (1, 'mac', 'mac', NULL, 2524, 1),
    (1, 'housing', 'housing', 'verb', 2525, 1),
    (1, 'iii', 'iii', NULL, 2526, 1),
    (1, 'gmt', 'gmt', NULL, 2527, 1),
    (1, 'catalog', 'catalog', NULL, 2528, 1),
    (1, 'searches', 'searches', NULL, 2529, 1),
    (1, 'authority', 'authority', 'noun', 2530, 1),
    (1, 'considered', 'considered', 'verb', 2531, 1),
    (1, 'traffic', 'traffic', NULL, 2532, 1),
    (1, 'programme', 'programme', NULL, 2533, 1),
    (1, 'joined', 'joined', 'verb', 2534, 1),
    (1, 'input', 'input', NULL, 2535, 1),
    (1, 'strategy', 'strategy', NULL, 2536, 1),
    (1, 'valid', 'valid', NULL, 2537, 1),
    (1, 'bin', 'bin', NULL, 2538, 1),
    (1, 'modern', 'modern', NULL, 2539, 1),
    (1, 'senior', 'senior', NULL, 2540, 1),
    (1, 'ireland', 'ireland', NULL, 2541, 1),
    (1, 'teaching', 'teaching', 'verb', 2542, 1),
    (1, 'testing', 'testing', 'verb', 2543, 1),
    (1, 'units', 'units', NULL, 2544, 1),
    (1, 'canadian', 'canadian', NULL, 2545, 1),
    (1, 'enterprise', 'enterprise', NULL, 2546, 1),
    (1, 'ships', 'ships', NULL, 2547, 1),
    (1, 'educational', 'educational', 'adj', 2548, 1),
    (1, 'leading', 'leading', 'verb', 2549, 1),
    (1, 'metal', 'metal', 'adj', 2550, 1),
    (1, 'fitness', 'fitness', 'noun', 2551, 1),
    (1, 'asia', 'asia', NULL, 2552, 1),
    (1, 'abstract', 'abstract', NULL, 2553, 1),
    (1, 'uses', 'uses', NULL, 2554, 1),
    (1, 'output', 'output', NULL, 2555, 1),
    (1, 'funds', 'funds', NULL, 2556, 1),
    (1, 'greater', 'greater', NULL, 2557, 1),
    (1, 'develop', 'develop', NULL, 2558, 1),
    (1, 'employees', 'employees', NULL, 2559, 1),
    (1, 'artists', 'artists', NULL, 2560, 1),
    (1, 'alternative', 'alternative', 'adj', 2561, 1),
    (1, 'processing', 'processing', 'verb', 2562, 1),
    (1, 'resolution', 'resolution', 'noun', 2563, 1),
    (1, 'java', 'java', NULL, 2564, 1),
    (1, 'publication', 'publication', 'noun', 2565, 1),
    (1, 'relations', 'relations', NULL, 2566, 1),
    (1, 'contains', 'contains', NULL, 2567, 1),
    (1, 'session', 'session', 'noun', 2568, 1),
    (1, 'multi', 'multi', NULL, 2569, 1),
    (1, 'photography', 'photography', NULL, 2570, 1),
    (1, 'republic', 'republic', NULL, 2571, 1),
    (1, 'fees', 'fees', NULL, 2572, 1),
    (1, 'components', 'components', NULL, 2573, 1),
    (1, 'vacation', 'vacation', 'noun', 2574, 1),
    (1, 'academic', 'academic', NULL, 2575, 1),
    (1, 'assistance', 'assistance', 'noun', 2576, 1),
    (1, 'completed', 'completed', 'verb', 2577, 1),
    (1, 'graphics', 'graphics', NULL, 2578, 1),
    (1, 'indian', 'indian', NULL, 2579, 1),
    (1, 'prev', 'prev', NULL, 2580, 1),
    (1, 'ads', 'ads', NULL, 2581, 1),
    (1, 'grade', 'grade', NULL, 2582, 1),
    (1, 'pacific', 'pacific', NULL, 2583, 1),
    (1, 'organizations', 'organizations', NULL, 2584, 1),
    (1, 'filter', 'filter', NULL, 2585, 1),
    (1, 'mailing', 'mailing', 'verb', 2586, 1),
    (1, 'vehicle', 'vehicle', NULL, 2587, 1),
    (1, 'int', 'int', NULL, 2588, 1),
    (1, 'northern', 'northern', NULL, 2589, 1),
    (1, 'panel', 'panel', NULL, 2590, 1),
    (1, 'proposed', 'proposed', 'verb', 2591, 1),
    (1, 'default', 'default', NULL, 2592, 1),
    (1, 'require', 'require', NULL, 2593, 1),
    (1, 'iraq', 'iraq', NULL, 2594, 1),
    (1, 'outdoor', 'outdoor', NULL, 2595, 1),
    (1, 'allows', 'allows', NULL, 2596, 1),
    (1, 'protein', 'protein', NULL, 2597, 1),
    (1, 'reported', 'reported', 'verb', 2598, 1),
    (1, 'transportation', 'transportation', 'noun', 2599, 1),
    (1, 'mini', 'mini', NULL, 2600, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'politics', 'politics', NULL, 2601, 1),
    (1, 'disclaimer', 'disclaimer', NULL, 2602, 1),
    (1, 'authors', 'authors', NULL, 2603, 1),
    (1, 'boards', 'boards', NULL, 2604, 1),
    (1, 'faculty', 'faculty', NULL, 2605, 1),
    (1, 'parties', 'parties', NULL, 2606, 1),
    (1, 'membership', 'membership', NULL, 2607, 1),
    (1, 'string', 'string', 'verb', 2608, 1),
    (1, 'modified', 'modified', 'verb', 2609, 1),
    (1, 'released', 'released', 'verb', 2610, 1),
    (1, 'internal', 'internal', 'adj', 2611, 1),
    (1, 'goods', 'goods', NULL, 2612, 1),
    (1, 'recommended', 'recommended', 'verb', 2613, 1),
    (1, 'detailed', 'detailed', 'verb', 2614, 1),
    (1, 'approved', 'approved', 'verb', 2615, 1),
    (1, 'background', 'background', NULL, 2616, 1),
    (1, 'usb', 'usb', NULL, 2617, 1),
    (1, 'maintenance', 'maintenance', 'noun', 2618, 1),
    (1, 'ability', 'ability', 'noun', 2619, 1),
    (1, 'functions', 'functions', NULL, 2620, 1),
    (1, 'brands', 'brands', NULL, 2621, 1),
    (1, 'trademarks', 'trademarks', NULL, 2622, 1),
    (1, 'phentermine', 'phentermine', NULL, 2623, 1),
    (1, 'spain', 'spain', NULL, 2624, 1),
    (1, 'southern', 'southern', NULL, 2625, 1),
    (1, 'etc', 'etc', NULL, 2626, 1),
    (1, 'battery', 'battery', NULL, 2627, 1),
    (1, 'youth', 'youth', NULL, 2628, 1),
    (1, 'submitted', 'submitted', 'verb', 2629, 1),
    (1, 'boston', 'boston', NULL, 2630, 1),
    (1, 'debt', 'debt', NULL, 2631, 1),
    (1, 'keywords', 'keywords', NULL, 2632, 1),
    (1, 'medium', 'medium', NULL, 2633, 1),
    (1, 'television', 'television', 'noun', 2634, 1),
    (1, 'core', 'core', NULL, 2635, 1),
    (1, 'purposes', 'purposes', NULL, 2636, 1),
    (1, 'throughout', 'throughout', NULL, 2637, 1),
    (1, 'sets', 'sets', NULL, 2638, 1),
    (1, 'wood', 'wood', NULL, 2639, 1),
    (1, 'msn', 'msn', NULL, 2640, 1),
    (1, 'defined', 'defined', 'verb', 2641, 1),
    (1, 'awards', 'awards', NULL, 2642, 1),
    (1, 'fee', 'fee', NULL, 2643, 1),
    (1, 'studio', 'studio', NULL, 2644, 1),
    (1, 'reader', 'reader', NULL, 2645, 1),
    (1, 'virtual', 'virtual', 'adj', 2646, 1),
    (1, 'device', 'device', NULL, 2647, 1),
    (1, 'established', 'established', 'verb', 2648, 1),
    (1, 'las', 'las', NULL, 2649, 1),
    (1, 'remote', 'remote', NULL, 2650, 1),
    (1, 'programming', 'programming', 'verb', 2651, 1),
    (1, 'external', 'external', 'adj', 2652, 1),
    (1, 'apple', 'apple', NULL, 2653, 1),
    (1, 'regarding', 'regarding', 'verb', 2654, 1),
    (1, 'instructions', 'instructions', NULL, 2655, 1),
    (1, 'min', 'min', NULL, 2656, 1),
    (1, 'offered', 'offered', 'verb', 2657, 1),
    (1, 'remove', 'remove', NULL, 2658, 1),
    (1, 'aid', 'aid', NULL, 2659, 1),
    (1, 'surface', 'surface', NULL, 2660, 1),
    (1, 'minimum', 'minimum', NULL, 2661, 1),
    (1, 'visual', 'visual', 'adj', 2662, 1),
    (1, 'host', 'host', NULL, 2663, 1),
    (1, 'variety', 'variety', NULL, 2664, 1),
    (1, 'teachers', 'teachers', NULL, 2665, 1),
    (1, 'isbn', 'isbn', NULL, 2666, 1),
    (1, 'manual', 'manual', 'adj', 2667, 1),
    (1, 'subjects', 'subjects', NULL, 2668, 1),
    (1, 'agents', 'agents', NULL, 2669, 1),
    (1, 'increased', 'increased', 'verb', 2670, 1),
    (1, 'repair', 'repair', NULL, 2671, 1),
    (1, 'civil', 'civil', NULL, 2672, 1),
    (1, 'steel', 'steel', NULL, 2673, 1),
    (1, 'understanding', 'understanding', 'verb', 2674, 1),
    (1, 'songs', 'songs', NULL, 2675, 1),
    (1, 'associates', 'associates', NULL, 2676, 1),
    (1, 'updates', 'updates', NULL, 2677, 1),
    (1, 'desktop', 'desktop', NULL, 2678, 1),
    (1, 'classes', 'classes', NULL, 2679, 1),
    (1, 'ohio', 'ohio', NULL, 2680, 1),
    (1, 'sector', 'sector', NULL, 2681, 1),
    (1, 'capacity', 'capacity', 'noun', 2682, 1),
    (1, 'requires', 'requires', NULL, 2683, 1),
    (1, 'jersey', 'jersey', NULL, 2684, 1),
    (1, 'fully', 'fully', 'adv', 2685, 1),
    (1, 'electric', 'electric', NULL, 2686, 1),
    (1, 'instruments', 'instruments', NULL, 2687, 1),
    (1, 'quotes', 'quotes', NULL, 2688, 1),
    (1, 'businesses', 'businesses', NULL, 2689, 1),
    (1, 'unknown', 'unknown', NULL, 2690, 1),
    (1, 'specified', 'specified', 'verb', 2691, 1),
    (1, 'pst', 'pst', NULL, 2692, 1),
    (1, 'procedures', 'procedures', NULL, 2693, 1),
    (1, 'workers', 'workers', NULL, 2694, 1),
    (1, 'georgia', 'georgia', NULL, 2695, 1),
    (1, 'traditional', 'traditional', 'adj', 2696, 1),
    (1, 'campus', 'campus', NULL, 2697, 1),
    (1, 'creative', 'creative', 'adj', 2698, 1),
    (1, 'coast', 'coast', NULL, 2699, 1),
    (1, 'benefit', 'benefit', NULL, 2700, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'progress', 'progress', NULL, 2701, 1),
    (1, 'funding', 'funding', 'verb', 2702, 1),
    (1, 'devices', 'devices', NULL, 2703, 1),
    (1, 'sub', 'sub', NULL, 2704, 1),
    (1, 'fiction', 'fiction', 'noun', 2705, 1),
    (1, 'watches', 'watches', NULL, 2706, 1),
    (1, 'careers', 'careers', NULL, 2707, 1),
    (1, 'museum', 'museum', NULL, 2708, 1),
    (1, 'transport', 'transport', NULL, 2709, 1),
    (1, 'blogs', 'blogs', NULL, 2710, 1),
    (1, 'evaluation', 'evaluation', 'noun', 2711, 1),
    (1, 'accepted', 'accepted', 'verb', 2712, 1),
    (1, 'former', 'former', NULL, 2713, 1),
    (1, 'implementation', 'implementation', 'noun', 2714, 1),
    (1, 'hits', 'hits', NULL, 2715, 1),
    (1, 'zone', 'zone', NULL, 2716, 1),
    (1, 'complex', 'complex', NULL, 2717, 1),
    (1, 'galleries', 'galleries', NULL, 2718, 1),
    (1, 'references', 'references', NULL, 2719, 1),
    (1, 'presented', 'presented', 'verb', 2720, 1),
    (1, 'flow', 'flow', NULL, 2721, 1),
    (1, 'agencies', 'agencies', NULL, 2722, 1),
    (1, 'literature', 'literature', NULL, 2723, 1),
    (1, 'respective', 'respective', 'adj', 2724, 1),
    (1, 'parent', 'parent', NULL, 2725, 1),
    (1, 'michigan', 'michigan', NULL, 2726, 1),
    (1, 'columbia', 'columbia', NULL, 2727, 1),
    (1, 'setting', 'setting', 'verb', 2728, 1),
    (1, 'scale', 'scale', NULL, 2729, 1),
    (1, 'economy', 'economy', NULL, 2730, 1),
    (1, 'highest', 'highest', NULL, 2731, 1),
    (1, 'helpful', 'helpful', 'adj', 2732, 1),
    (1, 'monthly', 'monthly', 'adv', 2733, 1),
    (1, 'critical', 'critical', 'adj', 2734, 1),
    (1, 'frame', 'frame', NULL, 2735, 1),
    (1, 'musical', 'musical', 'adj', 2736, 1),
    (1, 'definition', 'definition', 'noun', 2737, 1),
    (1, 'angeles', 'angeles', NULL, 2738, 1),
    (1, 'networking', 'networking', 'verb', 2739, 1),
    (1, 'australian', 'australian', NULL, 2740, 1),
    (1, 'employee', 'employee', NULL, 2741, 1),
    (1, 'magazines', 'magazines', NULL, 2742, 1),
    (1, 'packages', 'packages', NULL, 2743, 1),
    (1, 'detail', 'detail', NULL, 2744, 1),
    (1, 'francisco', 'francisco', NULL, 2745, 1),
    (1, 'laws', 'laws', NULL, 2746, 1),
    (1, 'pet', 'pet', NULL, 2747, 1),
    (1, 'individuals', 'individuals', NULL, 2748, 1),
    (1, 'colorado', 'colorado', NULL, 2749, 1),
    (1, 'switch', 'switch', NULL, 2750, 1),
    (1, 'largest', 'largest', NULL, 2751, 1),
    (1, 'african', 'african', NULL, 2752, 1),
    (1, 'titles', 'titles', NULL, 2753, 1),
    (1, 'relevant', 'relevant', NULL, 2754, 1),
    (1, 'guidelines', 'guidelines', NULL, 2755, 1),
    (1, 'connect', 'connect', NULL, 2756, 1),
    (1, 'bible', 'bible', 'adj', 2757, 1),
    (1, 'dev', 'dev', NULL, 2758, 1),
    (1, 'basket', 'basket', NULL, 2759, 1),
    (1, 'applied', 'applied', 'verb', 2760, 1),
    (1, 'weekly', 'weekly', 'adv', 2761, 1),
    (1, 'vol', 'vol', NULL, 2762, 1),
    (1, 'installation', 'installation', 'noun', 2763, 1),
    (1, 'described', 'described', 'verb', 2764, 1),
    (1, 'demand', 'demand', NULL, 2765, 1),
    (1, 'suite', 'suite', NULL, 2766, 1),
    (1, 'vegas', 'vegas', NULL, 2767, 1),
    (1, 'advance', 'advance', 'noun', 2768, 1),
    (1, 'skip', 'skip', NULL, 2769, 1),
    (1, 'diet', 'diet', NULL, 2770, 1),
    (1, 'auction', 'auction', 'noun', 2771, 1),
    (1, 'gear', 'gear', NULL, 2772, 1),
    (1, 'nation', 'nation', 'noun', 2773, 1),
    (1, 'sheet', 'sheet', NULL, 2774, 1),
    (1, 'firm', 'firm', NULL, 2775, 1),
    (1, 'illinois', 'illinois', NULL, 2776, 1),
    (1, 'regulations', 'regulations', NULL, 2777, 1),
    (1, 'elements', 'elements', NULL, 2778, 1),
    (1, 'species', 'species', NULL, 2779, 1),
    (1, 'cells', 'cells', NULL, 2780, 1),
    (1, 'module', 'module', NULL, 2781, 1),
    (1, 'resort', 'resort', NULL, 2782, 1),
    (1, 'facility', 'facility', 'noun', 2783, 1),
    (1, 'random', 'random', NULL, 2784, 1),
    (1, 'pricing', 'pricing', 'verb', 2785, 1),
    (1, 'dvds', 'dvds', NULL, 2786, 1),
    (1, 'certificate', 'certificate', NULL, 2787, 1),
    (1, 'motion', 'motion', 'noun', 2788, 1),
    (1, 'fashion', 'fashion', NULL, 2789, 1),
    (1, 'directions', 'directions', NULL, 2790, 1),
    (1, 'visitors', 'visitors', NULL, 2791, 1),
    (1, 'documentation', 'documentation', 'noun', 2792, 1),
    (1, 'monitor', 'monitor', NULL, 2793, 1),
    (1, 'trading', 'trading', 'verb', 2794, 1),
    (1, 'coverage', 'coverage', NULL, 2795, 1),
    (1, 'vision', 'vision', 'noun', 2796, 1),
    (1, 'ending', 'ending', 'verb', 2797, 1),
    (1, 'clients', 'clients', NULL, 2798, 1),
    (1, 'actions', 'actions', NULL, 2799, 1),
    (1, 'automotive', 'automotive', 'adj', 2800, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'goal', 'goal', 'adj', 2801, 1),
    (1, 'successful', 'successful', 'adj', 2802, 1),
    (1, 'communities', 'communities', NULL, 2803, 1),
    (1, 'clinical', 'clinical', 'adj', 2804, 1),
    (1, 'sciences', 'sciences', NULL, 2805, 1),
    (1, 'markets', 'markets', NULL, 2806, 1),
    (1, 'lowest', 'lowest', NULL, 2807, 1),
    (1, 'highly', 'highly', 'adv', 2808, 1),
    (1, 'publishing', 'publishing', 'verb', 2809, 1),
    (1, 'appear', 'appear', NULL, 2810, 1),
    (1, 'developing', 'developing', 'verb', 2811, 1),
    (1, 'currency', 'currency', NULL, 2812, 1),
    (1, 'leather', 'leather', NULL, 2813, 1),
    (1, 'determine', 'determine', NULL, 2814, 1),
    (1, 'temperature', 'temperature', NULL, 2815, 1),
    (1, 'palm', 'palm', NULL, 2816, 1),
    (1, 'announcements', 'announcements', NULL, 2817, 1),
    (1, 'actual', 'actual', 'adj', 2818, 1),
    (1, 'historical', 'historical', 'adj', 2819, 1),
    (1, 'commerce', 'commerce', NULL, 2820, 1),
    (1, 'ringtones', 'ringtones', NULL, 2821, 1),
    (1, 'persons', 'persons', NULL, 2822, 1),
    (1, 'scientific', 'scientific', NULL, 2823, 1),
    (1, 'satellite', 'satellite', NULL, 2824, 1),
    (1, 'tests', 'tests', NULL, 2825, 1),
    (1, 'accounts', 'accounts', NULL, 2826, 1),
    (1, 'amateur', 'amateur', NULL, 2827, 1),
    (1, 'xbox', 'xbox', NULL, 2828, 1),
    (1, 'particularly', 'particularly', 'adv', 2829, 1),
    (1, 'factors', 'factors', NULL, 2830, 1),
    (1, 'settings', 'settings', NULL, 2831, 1),
    (1, 'buyer', 'buyer', NULL, 2832, 1),
    (1, 'cultural', 'cultural', 'adj', 2833, 1),
    (1, 'oral', 'oral', 'adj', 2834, 1),
    (1, 'ford', 'ford', NULL, 2835, 1),
    (1, 'poster', 'poster', NULL, 2836, 1),
    (1, 'edge', 'edge', NULL, 2837, 1),
    (1, 'functional', 'functional', 'adj', 2838, 1),
    (1, 'root', 'root', NULL, 2839, 1),
    (1, 'holidays', 'holidays', NULL, 2840, 1),
    (1, 'pink', 'pink', NULL, 2841, 1),
    (1, 'zealand', 'zealand', NULL, 2842, 1),
    (1, 'balance', 'balance', 'noun', 2843, 1),
    (1, 'monitoring', 'monitoring', 'verb', 2844, 1),
    (1, 'graduate', 'graduate', NULL, 2845, 1),
    (1, 'replies', 'replies', NULL, 2846, 1),
    (1, 'architecture', 'architecture', NULL, 2847, 1),
    (1, 'initial', 'initial', 'adj', 2848, 1),
    (1, 'label', 'label', NULL, 2849, 1),
    (1, 'llc', 'llc', NULL, 2850, 1),
    (1, 'sec', 'sec', NULL, 2851, 1),
    (1, 'recommend', 'recommend', NULL, 2852, 1),
    (1, 'canon', 'canon', NULL, 2853, 1),
    (1, 'league', 'league', NULL, 2854, 1),
    (1, 'provider', 'provider', NULL, 2855, 1),
    (1, 'optional', 'optional', 'adj', 2856, 1),
    (1, 'dictionary', 'dictionary', NULL, 2857, 1),
    (1, 'accounting', 'accounting', 'verb', 2858, 1),
    (1, 'manufacturing', 'manufacturing', 'verb', 2859, 1),
    (1, 'sections', 'sections', NULL, 2860, 1),
    (1, 'fishing', 'fishing', 'verb', 2861, 1),
    (1, 'effort', 'effort', NULL, 2862, 1),
    (1, 'phase', 'phase', NULL, 2863, 1),
    (1, 'fields', 'fields', NULL, 2864, 1),
    (1, 'fantasy', 'fantasy', NULL, 2865, 1),
    (1, 'motor', 'motor', NULL, 2866, 1),
    (1, 'context', 'context', NULL, 2867, 1),
    (1, 'install', 'install', NULL, 2868, 1),
    (1, 'apparel', 'apparel', NULL, 2869, 1),
    (1, 'generally', 'generally', 'adv', 2870, 1),
    (1, 'continued', 'continued', 'verb', 2871, 1),
    (1, 'mass', 'mass', NULL, 2872, 1),
    (1, 'breast', 'breast', NULL, 2873, 1),
    (1, 'techniques', 'techniques', NULL, 2874, 1),
    (1, 'ibm', 'ibm', NULL, 2875, 1),
    (1, 'johnson', 'johnson', NULL, 2876, 1),
    (1, 'websites', 'websites', NULL, 2877, 1),
    (1, 'religion', 'religion', NULL, 2878, 1),
    (1, 'claim', 'claim', NULL, 2879, 1),
    (1, 'patch', 'patch', NULL, 2880, 1),
    (1, 'measures', 'measures', NULL, 2881, 1),
    (1, 'generation', 'generation', 'noun', 2882, 1),
    (1, 'kansas', 'kansas', NULL, 2883, 1),
    (1, 'chemical', 'chemical', 'adj', 2884, 1),
    (1, 'task', 'task', NULL, 2885, 1),
    (1, 'reduce', 'reduce', NULL, 2886, 1),
    (1, 'component', 'component', NULL, 2887, 1),
    (1, 'enable', 'enable', 'adj', 2888, 1),
    (1, 'exercise', 'exercise', NULL, 2889, 1),
    (1, 'bug', 'bug', NULL, 2890, 1),
    (1, 'mid', 'mid', NULL, 2891, 1),
    (1, 'guarantee', 'guarantee', NULL, 2892, 1),
    (1, 'diamond', 'diamond', NULL, 2893, 1),
    (1, 'israel', 'israel', NULL, 2894, 1),
    (1, 'processes', 'processes', NULL, 2895, 1),
    (1, 'servers', 'servers', NULL, 2896, 1),
    (1, 'meetings', 'meetings', NULL, 2897, 1),
    (1, 'jones', 'jones', NULL, 2898, 1),
    (1, 'arizona', 'arizona', NULL, 2899, 1),
    (1, 'keyword', 'keyword', NULL, 2900, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'interests', 'interests', NULL, 2901, 1),
    (1, 'congress', 'congress', NULL, 2902, 1),
    (1, 'fuel', 'fuel', NULL, 2903, 1),
    (1, 'username', 'username', NULL, 2904, 1),
    (1, 'produced', 'produced', 'verb', 2905, 1),
    (1, 'italian', 'italian', NULL, 2906, 1),
    (1, 'paperback', 'paperback', NULL, 2907, 1),
    (1, 'classifieds', 'classifieds', NULL, 2908, 1),
    (1, 'supported', 'supported', 'verb', 2909, 1),
    (1, 'saint', 'saint', NULL, 2910, 1),
    (1, 'argument', 'argument', 'noun', 2911, 1),
    (1, 'creating', 'creating', 'verb', 2912, 1),
    (1, 'joint', 'joint', NULL, 2913, 1),
    (1, 'premium', 'premium', NULL, 2914, 1),
    (1, 'providers', 'providers', NULL, 2915, 1),
    (1, 'characters', 'characters', NULL, 2916, 1),
    (1, 'upgrade', 'upgrade', NULL, 2917, 1),
    (1, 'factor', 'factor', NULL, 2918, 1),
    (1, 'stream', 'stream', NULL, 2919, 1),
    (1, 'apartments', 'apartments', NULL, 2920, 1),
    (1, 'eastern', 'eastern', NULL, 2921, 1),
    (1, 'auctions', 'auctions', NULL, 2922, 1),
    (1, 'therapy', 'therapy', NULL, 2923, 1),
    (1, 'entries', 'entries', NULL, 2924, 1),
    (1, 'dates', 'dates', NULL, 2925, 1),
    (1, 'generated', 'generated', 'verb', 2926, 1),
    (1, 'upper', 'upper', NULL, 2927, 1),
    (1, 'administrative', 'administrative', 'adj', 2928, 1),
    (1, 'prime', 'prime', NULL, 2929, 1),
    (1, 'samsung', 'samsung', NULL, 2930, 1),
    (1, 'limit', 'limit', NULL, 2931, 1),
    (1, 'louis', 'louis', NULL, 2932, 1),
    (1, 'steps', 'steps', NULL, 2933, 1),
    (1, 'errors', 'errors', NULL, 2934, 1),
    (1, 'shops', 'shops', NULL, 2935, 1),
    (1, 'del', 'del', NULL, 2936, 1),
    (1, 'efforts', 'efforts', NULL, 2937, 1),
    (1, 'informed', 'informed', 'verb', 2938, 1),
    (1, 'creek', 'creek', NULL, 2939, 1),
    (1, 'quantity', 'quantity', 'noun', 2940, 1),
    (1, 'urban', 'urban', NULL, 2941, 1),
    (1, 'practices', 'practices', NULL, 2942, 1),
    (1, 'sorted', 'sorted', 'verb', 2943, 1),
    (1, 'reporting', 'reporting', 'verb', 2944, 1),
    (1, 'essential', 'essential', 'adj', 2945, 1),
    (1, 'tours', 'tours', NULL, 2946, 1),
    (1, 'platform', 'platform', NULL, 2947, 1),
    (1, 'load', 'load', NULL, 2948, 1),
    (1, 'affiliate', 'affiliate', NULL, 2949, 1),
    (1, 'labor', 'labor', NULL, 2950, 1),
    (1, 'admin', 'admin', NULL, 2951, 1),
    (1, 'nursing', 'nursing', 'verb', 2952, 1),
    (1, 'machines', 'machines', NULL, 2953, 1),
    (1, 'designated', 'designated', 'verb', 2954, 1),
    (1, 'tags', 'tags', NULL, 2955, 1),
    (1, 'recovery', 'recovery', NULL, 2956, 1),
    (1, 'integrated', 'integrated', 'verb', 2957, 1),
    (1, 'configuration', 'configuration', 'noun', 2958, 1),
    (1, 'merchant', 'merchant', NULL, 2959, 1),
    (1, 'comprehensive', 'comprehensive', 'adj', 2960, 1),
    (1, 'expert', 'expert', NULL, 2961, 1),
    (1, 'universal', 'universal', 'adj', 2962, 1),
    (1, 'solid', 'solid', NULL, 2963, 1),
    (1, 'cds', 'cds', NULL, 2964, 1),
    (1, 'presentation', 'presentation', 'noun', 2965, 1),
    (1, 'languages', 'languages', NULL, 2966, 1),
    (1, 'orange', 'orange', NULL, 2967, 1),
    (1, 'compliance', 'compliance', 'noun', 2968, 1),
    (1, 'vehicles', 'vehicles', NULL, 2969, 1),
    (1, 'prevent', 'prevent', NULL, 2970, 1),
    (1, 'theme', 'theme', NULL, 2971, 1),
    (1, 'campaign', 'campaign', NULL, 2972, 1),
    (1, 'marine', 'marine', NULL, 2973, 1),
    (1, 'improvement', 'improvement', 'noun', 2974, 1),
    (1, 'guitar', 'guitar', NULL, 2975, 1),
    (1, 'pennsylvania', 'pennsylvania', NULL, 2976, 1),
    (1, 'examples', 'examples', NULL, 2977, 1),
    (1, 'ipod', 'ipod', NULL, 2978, 1),
    (1, 'claims', 'claims', NULL, 2979, 1),
    (1, 'motorola', 'motorola', NULL, 2980, 1),
    (1, 'acceptance', 'acceptance', 'noun', 2981, 1),
    (1, 'strategies', 'strategies', NULL, 2982, 1),
    (1, 'affairs', 'affairs', NULL, 2983, 1),
    (1, 'intended', 'intended', 'verb', 2984, 1),
    (1, 'goals', 'goals', NULL, 2985, 1),
    (1, 'hire', 'hire', NULL, 2986, 1),
    (1, 'election', 'election', 'noun', 2987, 1),
    (1, 'branch', 'branch', NULL, 2988, 1),
    (1, 'charges', 'charges', NULL, 2989, 1),
    (1, 'affiliates', 'affiliates', NULL, 2990, 1),
    (1, 'mount', 'mount', NULL, 2991, 1),
    (1, 'latin', 'latin', NULL, 2992, 1),
    (1, 'multimedia', 'multimedia', NULL, 2993, 1),
    (1, 'certified', 'certified', 'verb', 2994, 1),
    (1, 'rank', 'rank', NULL, 2995, 1),
    (1, 'computing', 'computing', 'verb', 2996, 1),
    (1, 'oregon', 'oregon', NULL, 2997, 1),
    (1, 'element', 'element', 'noun', 2998, 1),
    (1, 'virus', 'virus', NULL, 2999, 1),
    (1, 'abuse', 'abuse', NULL, 3000, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'interactive', 'interactive', 'adj', 3001, 1),
    (1, 'requests', 'requests', NULL, 3002, 1),
    (1, 'separate', 'separate', NULL, 3003, 1),
    (1, 'quarter', 'quarter', NULL, 3004, 1),
    (1, 'procedure', 'procedure', NULL, 3005, 1),
    (1, 'leadership', 'leadership', NULL, 3006, 1),
    (1, 'tables', 'tables', NULL, 3007, 1),
    (1, 'define', 'define', NULL, 3008, 1),
    (1, 'racing', 'racing', 'verb', 3009, 1),
    (1, 'religious', 'religious', 'adj', 3010, 1),
    (1, 'facts', 'facts', NULL, 3011, 1),
    (1, 'kong', 'kong', NULL, 3012, 1),
    (1, 'column', 'column', NULL, 3013, 1),
    (1, 'plants', 'plants', NULL, 3014, 1),
    (1, 'chain', 'chain', NULL, 3015, 1),
    (1, 'developer', 'developer', NULL, 3016, 1),
    (1, 'identify', 'identify', NULL, 3017, 1),
    (1, 'avenue', 'avenue', NULL, 3018, 1),
    (1, 'approximately', 'approximately', 'adv', 3019, 1),
    (1, 'domestic', 'domestic', NULL, 3020, 1),
    (1, 'sitemap', 'sitemap', NULL, 3021, 1),
    (1, 'recommendations', 'recommendations', NULL, 3022, 1),
    (1, 'houston', 'houston', NULL, 3023, 1),
    (1, 'comparison', 'comparison', NULL, 3024, 1),
    (1, 'mental', 'mental', 'adj', 3025, 1),
    (1, 'viewed', 'viewed', 'verb', 3026, 1),
    (1, 'extended', 'extended', 'verb', 3027, 1),
    (1, 'sequence', 'sequence', 'noun', 3028, 1),
    (1, 'inch', 'inch', NULL, 3029, 1),
    (1, 'centers', 'centers', NULL, 3030, 1),
    (1, 'reserve', 'reserve', NULL, 3031, 1),
    (1, 'recipes', 'recipes', NULL, 3032, 1),
    (1, 'cvs', 'cvs', NULL, 3033, 1),
    (1, 'gamma', 'gamma', NULL, 3034, 1),
    (1, 'plastic', 'plastic', NULL, 3035, 1),
    (1, 'produce', 'produce', NULL, 3036, 1),
    (1, 'placed', 'placed', 'verb', 3037, 1),
    (1, 'counter', 'counter', NULL, 3038, 1),
    (1, 'failure', 'failure', NULL, 3039, 1),
    (1, 'follows', 'follows', NULL, 3040, 1),
    (1, 'dollar', 'dollar', NULL, 3041, 1),
    (1, 'ontario', 'ontario', NULL, 3042, 1),
    (1, 'automatically', 'automatically', 'adv', 3043, 1),
    (1, 'des', 'des', NULL, 3044, 1),
    (1, 'minnesota', 'minnesota', NULL, 3045, 1),
    (1, 'films', 'films', NULL, 3046, 1),
    (1, 'native', 'native', 'adj', 3047, 1),
    (1, 'williams', 'williams', NULL, 3048, 1),
    (1, 'movement', 'movement', 'noun', 3049, 1),
    (1, 'printing', 'printing', 'verb', 3050, 1),
    (1, 'baseball', 'baseball', NULL, 3051, 1),
    (1, 'owned', 'owned', 'verb', 3052, 1),
    (1, 'approval', 'approval', 'adj', 3053, 1),
    (1, 'draft', 'draft', NULL, 3054, 1),
    (1, 'chart', 'chart', NULL, 3055, 1),
    (1, 'contacts', 'contacts', NULL, 3056, 1),
    (1, 'readers', 'readers', NULL, 3057, 1),
    (1, 'clubs', 'clubs', NULL, 3058, 1),
    (1, 'lcd', 'lcd', NULL, 3059, 1),
    (1, 'jackson', 'jackson', NULL, 3060, 1),
    (1, 'equal', 'equal', 'adj', 3061, 1),
    (1, 'adventure', 'adventure', NULL, 3062, 1),
    (1, 'matching', 'matching', 'verb', 3063, 1),
    (1, 'offering', 'offering', 'verb', 3064, 1),
    (1, 'shirts', 'shirts', NULL, 3065, 1),
    (1, 'profit', 'profit', NULL, 3066, 1),
    (1, 'leaders', 'leaders', NULL, 3067, 1),
    (1, 'posters', 'posters', NULL, 3068, 1),
    (1, 'institutions', 'institutions', NULL, 3069, 1),
    (1, 'variable', 'variable', 'adj', 3070, 1),
    (1, 'ave', 'ave', NULL, 3071, 1),
    (1, 'advertisement', 'advertisement', 'noun', 3072, 1),
    (1, 'parking', 'parking', 'verb', 3073, 1),
    (1, 'headlines', 'headlines', NULL, 3074, 1),
    (1, 'compared', 'compared', 'verb', 3075, 1),
    (1, 'determined', 'determined', 'verb', 3076, 1),
    (1, 'wholesale', 'wholesale', NULL, 3077, 1),
    (1, 'workshop', 'workshop', NULL, 3078, 1),
    (1, 'russia', 'russia', NULL, 3079, 1),
    (1, 'codes', 'codes', NULL, 3080, 1),
    (1, 'kinds', 'kinds', NULL, 3081, 1),
    (1, 'extension', 'extension', 'noun', 3082, 1),
    (1, 'seattle', 'seattle', NULL, 3083, 1),
    (1, 'statements', 'statements', NULL, 3084, 1),
    (1, 'golden', 'golden', NULL, 3085, 1),
    (1, 'teams', 'teams', NULL, 3086, 1),
    (1, 'fort', 'fort', NULL, 3087, 1),
    (1, 'lighting', 'lighting', 'verb', 3088, 1),
    (1, 'senate', 'senate', NULL, 3089, 1),
    (1, 'gene', 'gene', NULL, 3090, 1),
    (1, 'portable', 'portable', 'adj', 3091, 1),
    (1, 'electrical', 'electrical', 'adj', 3092, 1),
    (1, 'applicable', 'applicable', 'adj', 3093, 1),
    (1, 'disc', 'disc', NULL, 3094, 1),
    (1, 'pattern', 'pattern', NULL, 3095, 1),
    (1, 'theatre', 'theatre', NULL, 3096, 1),
    (1, 'laser', 'laser', NULL, 3097, 1),
    (1, 'manufacturers', 'manufacturers', NULL, 3098, 1),
    (1, 'sponsor', 'sponsor', NULL, 3099, 1),
    (1, 'classical', 'classical', 'adj', 3100, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'icon', 'icon', NULL, 3101, 1),
    (1, 'warranty', 'warranty', NULL, 3102, 1),
    (1, 'dedicated', 'dedicated', 'verb', 3103, 1),
    (1, 'indiana', 'indiana', NULL, 3104, 1),
    (1, 'basketball', 'basketball', NULL, 3105, 1),
    (1, 'objects', 'objects', NULL, 3106, 1),
    (1, 'delete', 'delete', NULL, 3107, 1),
    (1, 'assembly', 'assembly', 'adv', 3108, 1),
    (1, 'nuclear', 'nuclear', NULL, 3109, 1),
    (1, 'taxes', 'taxes', NULL, 3110, 1),
    (1, 'mouse', 'mouse', NULL, 3111, 1),
    (1, 'issued', 'issued', 'verb', 3112, 1),
    (1, 'sexual', 'sexual', 'adj', 3113, 1),
    (1, 'wisconsin', 'wisconsin', NULL, 3114, 1),
    (1, 'obtained', 'obtained', 'verb', 3115, 1),
    (1, 'false', 'false', NULL, 3116, 1),
    (1, 'cast', 'cast', NULL, 3117, 1),
    (1, 'flower', 'flower', NULL, 3118, 1),
    (1, 'personnel', 'personnel', NULL, 3119, 1),
    (1, 'supplied', 'supplied', 'verb', 3120, 1),
    (1, 'identified', 'identified', 'verb', 3121, 1),
    (1, 'falls', 'falls', NULL, 3122, 1),
    (1, 'pic', 'pic', NULL, 3123, 1),
    (1, 'aids', 'aids', NULL, 3124, 1),
    (1, 'opinions', 'opinions', NULL, 3125, 1),
    (1, 'promote', 'promote', NULL, 3126, 1),
    (1, 'stated', 'stated', 'verb', 3127, 1),
    (1, 'stats', 'stats', NULL, 3128, 1),
    (1, 'hawaii', 'hawaii', NULL, 3129, 1),
    (1, 'professionals', 'professionals', NULL, 3130, 1),
    (1, 'appears', 'appears', NULL, 3131, 1),
    (1, 'flag', 'flag', NULL, 3132, 1),
    (1, 'covers', 'covers', NULL, 3133, 1),
    (1, 'advantage', 'advantage', NULL, 3134, 1),
    (1, 'designs', 'designs', NULL, 3135, 1),
    (1, 'maintain', 'maintain', NULL, 3136, 1),
    (1, 'tourism', 'tourism', NULL, 3137, 1),
    (1, 'priority', 'priority', 'noun', 3138, 1),
    (1, 'newsletters', 'newsletters', NULL, 3139, 1),
    (1, 'adults', 'adults', NULL, 3140, 1),
    (1, 'clips', 'clips', NULL, 3141, 1),
    (1, 'savings', 'savings', NULL, 3142, 1),
    (1, 'graphic', 'graphic', NULL, 3143, 1),
    (1, 'atom', 'atom', NULL, 3144, 1),
    (1, 'payments', 'payments', NULL, 3145, 1),
    (1, 'estimated', 'estimated', 'verb', 3146, 1),
    (1, 'binding', 'binding', 'verb', 3147, 1),
    (1, 'brief', 'brief', NULL, 3148, 1),
    (1, 'winning', 'winning', 'verb', 3149, 1),
    (1, 'anonymous', 'anonymous', 'adj', 3150, 1),
    (1, 'iron', 'iron', NULL, 3151, 1),
    (1, 'script', 'script', NULL, 3152, 1),
    (1, 'served', 'served', 'verb', 3153, 1),
    (1, 'miscellaneous', 'miscellaneous', 'adj', 3154, 1),
    (1, 'void', 'void', NULL, 3155, 1),
    (1, 'dining', 'dining', 'verb', 3156, 1),
    (1, 'alert', 'alert', NULL, 3157, 1),
    (1, 'integration', 'integration', 'noun', 3158, 1),
    (1, 'atlanta', 'atlanta', NULL, 3159, 1),
    (1, 'dakota', 'dakota', NULL, 3160, 1),
    (1, 'tag', 'tag', NULL, 3161, 1),
    (1, 'mix', 'mix', NULL, 3162, 1),
    (1, 'framework', 'framework', NULL, 3163, 1),
    (1, 'disk', 'disk', NULL, 3164, 1),
    (1, 'installed', 'installed', 'verb', 3165, 1),
    (1, 'vhs', 'vhs', NULL, 3166, 1),
    (1, 'credits', 'credits', NULL, 3167, 1),
    (1, 'criteria', 'criteria', NULL, 3168, 1),
    (1, 'pubmed', 'pubmed', 'verb', 3169, 1),
    (1, 'massachusetts', 'massachusetts', NULL, 3170, 1),
    (1, 'diego', 'diego', NULL, 3171, 1),
    (1, 'hong', 'hong', NULL, 3172, 1),
    (1, 'vice', 'vice', NULL, 3173, 1),
    (1, 'associate', 'associate', NULL, 3174, 1),
    (1, 'behavior', 'behavior', NULL, 3175, 1),
    (1, 'enlarge', 'enlarge', NULL, 3176, 1),
    (1, 'frequently', 'frequently', 'adv', 3177, 1),
    (1, 'revenue', 'revenue', NULL, 3178, 1),
    (1, 'measure', 'measure', NULL, 3179, 1),
    (1, 'votes', 'votes', NULL, 3180, 1),
    (1, 'discussions', 'discussions', NULL, 3181, 1),
    (1, 'gain', 'gain', NULL, 3182, 1),
    (1, 'festival', 'festival', 'adj', 3183, 1),
    (1, 'laboratory', 'laboratory', NULL, 3184, 1),
    (1, 'flights', 'flights', NULL, 3185, 1),
    (1, 'experts', 'experts', NULL, 3186, 1),
    (1, 'signs', 'signs', NULL, 3187, 1),
    (1, 'lack', 'lack', NULL, 3188, 1),
    (1, 'depth', 'depth', NULL, 3189, 1),
    (1, 'iowa', 'iowa', NULL, 3190, 1),
    (1, 'logged', 'logged', 'verb', 3191, 1),
    (1, 'laptop', 'laptop', NULL, 3192, 1),
    (1, 'vintage', 'vintage', NULL, 3193, 1),
    (1, 'explore', 'explore', NULL, 3194, 1),
    (1, 'maryland', 'maryland', NULL, 3195, 1),
    (1, 'spa', 'spa', NULL, 3196, 1),
    (1, 'concept', 'concept', NULL, 3197, 1),
    (1, 'eligible', 'eligible', 'adj', 3198, 1),
    (1, 'checkout', 'checkout', NULL, 3199, 1),
    (1, 'handling', 'handling', 'verb', 3200, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'origin', 'origin', NULL, 3201, 1),
    (1, 'gaming', 'gaming', 'verb', 3202, 1),
    (1, 'feeds', 'feeds', NULL, 3203, 1),
    (1, 'billion', 'billion', NULL, 3204, 1),
    (1, 'destination', 'destination', 'noun', 3205, 1),
    (1, 'scotland', 'scotland', NULL, 3206, 1),
    (1, 'intelligence', 'intelligence', 'noun', 3207, 1),
    (1, 'dallas', 'dallas', NULL, 3208, 1),
    (1, 'con', 'con', NULL, 3209, 1),
    (1, 'ups', 'ups', NULL, 3210, 1),
    (1, 'nations', 'nations', NULL, 3211, 1),
    (1, 'route', 'route', NULL, 3212, 1),
    (1, 'specifications', 'specifications', NULL, 3213, 1),
    (1, 'tripadvisor', 'tripadvisor', NULL, 3214, 1),
    (1, 'alaska', 'alaska', NULL, 3215, 1),
    (1, 'zoom', 'zoom', NULL, 3216, 1),
    (1, 'residential', 'residential', 'adj', 3217, 1),
    (1, 'anime', 'anime', NULL, 3218, 1),
    (1, 'decisions', 'decisions', NULL, 3219, 1),
    (1, 'industries', 'industries', NULL, 3220, 1),
    (1, 'protocol', 'protocol', NULL, 3221, 1),
    (1, 'query', 'query', NULL, 3222, 1),
    (1, 'clip', 'clip', NULL, 3223, 1),
    (1, 'partnership', 'partnership', NULL, 3224, 1),
    (1, 'editorial', 'editorial', 'adj', 3225, 1),
    (1, 'expression', 'expression', 'noun', 3226, 1),
    (1, 'equity', 'equity', 'noun', 3227, 1),
    (1, 'provisions', 'provisions', NULL, 3228, 1),
    (1, 'wire', 'wire', NULL, 3229, 1),
    (1, 'principles', 'principles', NULL, 3230, 1),
    (1, 'suggestions', 'suggestions', NULL, 3231, 1),
    (1, 'rural', 'rural', 'adj', 3232, 1),
    (1, 'shared', 'shared', 'verb', 3233, 1),
    (1, 'replacement', 'replacement', 'noun', 3234, 1),
    (1, 'strategic', 'strategic', NULL, 3235, 1),
    (1, 'spam', 'spam', NULL, 3236, 1),
    (1, 'economics', 'economics', NULL, 3237, 1),
    (1, 'acid', 'acid', NULL, 3238, 1),
    (1, 'bytes', 'bytes', NULL, 3239, 1),
    (1, 'cent', 'cent', NULL, 3240, 1),
    (1, 'compatible', 'compatible', 'adj', 3241, 1),
    (1, 'height', 'height', NULL, 3242, 1),
    (1, 'null', 'null', NULL, 3243, 1),
    (1, 'zero', 'zero', NULL, 3244, 1),
    (1, 'speaker', 'speaker', NULL, 3245, 1),
    (1, 'filed', 'filed', 'verb', 3246, 1),
    (1, 'netherlands', 'netherlands', NULL, 3247, 1),
    (1, 'obtain', 'obtain', NULL, 3248, 1),
    (1, 'consulting', 'consulting', 'verb', 3249, 1),
    (1, 'recreation', 'recreation', 'noun', 3250, 1),
    (1, 'offices', 'offices', NULL, 3251, 1),
    (1, 'designer', 'designer', NULL, 3252, 1),
    (1, 'managed', 'managed', 'verb', 3253, 1),
    (1, 'korea', 'korea', NULL, 3254, 1),
    (1, 'banks', 'banks', NULL, 3255, 1),
    (1, 'participants', 'participants', NULL, 3256, 1),
    (1, 'leads', 'leads', NULL, 3257, 1),
    (1, 'negative', 'negative', 'adj', 3258, 1),
    (1, 'austin', 'austin', NULL, 3259, 1),
    (1, 'favorites', 'favorites', NULL, 3260, 1),
    (1, 'toronto', 'toronto', NULL, 3261, 1),
    (1, 'theater', 'theater', NULL, 3262, 1),
    (1, 'springs', 'springs', NULL, 3263, 1),
    (1, 'missouri', 'missouri', NULL, 3264, 1),
    (1, 'andrew', 'andrew', NULL, 3265, 1),
    (1, 'var', 'var', NULL, 3266, 1),
    (1, 'perform', 'perform', NULL, 3267, 1),
    (1, 'healthy', 'healthy', NULL, 3268, 1),
    (1, 'translation', 'translation', 'noun', 3269, 1),
    (1, 'estimates', 'estimates', NULL, 3270, 1),
    (1, 'font', 'font', NULL, 3271, 1),
    (1, 'assets', 'assets', NULL, 3272, 1),
    (1, 'injury', 'injury', NULL, 3273, 1),
    (1, 'joseph', 'joseph', NULL, 3274, 1),
    (1, 'ministry', 'ministry', NULL, 3275, 1),
    (1, 'drivers', 'drivers', NULL, 3276, 1),
    (1, 'figures', 'figures', NULL, 3277, 1),
    (1, 'protected', 'protected', 'verb', 3278, 1),
    (1, 'proposal', 'proposal', 'adj', 3279, 1),
    (1, 'sharing', 'sharing', 'verb', 3280, 1),
    (1, 'philadelphia', 'philadelphia', NULL, 3281, 1),
    (1, 'portal', 'portal', 'adj', 3282, 1),
    (1, 'beta', 'beta', NULL, 3283, 1),
    (1, 'fail', 'fail', NULL, 3284, 1),
    (1, 'gratis', 'gratis', NULL, 3285, 1),
    (1, 'banking', 'banking', 'verb', 3286, 1),
    (1, 'officials', 'officials', NULL, 3287, 1),
    (1, 'toward', 'toward', NULL, 3288, 1),
    (1, 'slightly', 'slightly', 'adv', 3289, 1),
    (1, 'assist', 'assist', NULL, 3290, 1),
    (1, 'conduct', 'conduct', NULL, 3291, 1),
    (1, 'contained', 'contained', 'verb', 3292, 1),
    (1, 'lingerie', 'lingerie', NULL, 3293, 1),
    (1, 'legislation', 'legislation', 'noun', 3294, 1),
    (1, 'parameters', 'parameters', NULL, 3295, 1),
    (1, 'jazz', 'jazz', NULL, 3296, 1),
    (1, 'serving', 'serving', 'verb', 3297, 1),
    (1, 'bags', 'bags', NULL, 3298, 1),
    (1, 'profiles', 'profiles', NULL, 3299, 1),
    (1, 'miami', 'miami', NULL, 3300, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'comics', 'comics', NULL, 3301, 1),
    (1, 'houses', 'houses', NULL, 3302, 1),
    (1, 'postal', 'postal', 'adj', 3303, 1),
    (1, 'relationships', 'relationships', NULL, 3304, 1),
    (1, 'tennessee', 'tennessee', NULL, 3305, 1),
    (1, 'controls', 'controls', NULL, 3306, 1),
    (1, 'combined', 'combined', 'verb', 3307, 1),
    (1, 'ultimate', 'ultimate', NULL, 3308, 1),
    (1, 'wales', 'wales', NULL, 3309, 1),
    (1, 'representative', 'representative', 'adj', 3310, 1),
    (1, 'frequency', 'frequency', NULL, 3311, 1),
    (1, 'introduced', 'introduced', 'verb', 3312, 1),
    (1, 'minor', 'minor', NULL, 3313, 1),
    (1, 'departments', 'departments', NULL, 3314, 1),
    (1, 'residents', 'residents', NULL, 3315, 1),
    (1, 'noted', 'noted', 'verb', 3316, 1),
    (1, 'displayed', 'displayed', 'verb', 3317, 1),
    (1, 'reduced', 'reduced', 'verb', 3318, 1),
    (1, 'physics', 'physics', NULL, 3319, 1),
    (1, 'rare', 'rare', NULL, 3320, 1),
    (1, 'performed', 'performed', 'verb', 3321, 1),
    (1, 'extreme', 'extreme', NULL, 3322, 1),
    (1, 'samples', 'samples', NULL, 3323, 1),
    (1, 'davis', 'davis', NULL, 3324, 1),
    (1, 'bars', 'bars', NULL, 3325, 1),
    (1, 'reviewed', 'reviewed', 'verb', 3326, 1),
    (1, 'row', 'row', NULL, 3327, 1),
    (1, 'forecast', 'forecast', NULL, 3328, 1),
    (1, 'removed', 'removed', 'verb', 3329, 1),
    (1, 'helps', 'helps', NULL, 3330, 1),
    (1, 'singles', 'singles', NULL, 3331, 1),
    (1, 'administrator', 'administrator', NULL, 3332, 1),
    (1, 'cycle', 'cycle', NULL, 3333, 1),
    (1, 'amounts', 'amounts', NULL, 3334, 1),
    (1, 'contain', 'contain', NULL, 3335, 1),
    (1, 'accuracy', 'accuracy', NULL, 3336, 1),
    (1, 'dual', 'dual', 'adj', 3337, 1),
    (1, 'usd', 'usd', NULL, 3338, 1),
    (1, 'pharmacy', 'pharmacy', NULL, 3339, 1),
    (1, 'brazil', 'brazil', NULL, 3340, 1),
    (1, 'creation', 'creation', 'noun', 3341, 1),
    (1, 'static', 'static', NULL, 3342, 1),
    (1, 'hunter', 'hunter', NULL, 3343, 1),
    (1, 'addresses', 'addresses', NULL, 3344, 1),
    (1, 'crystal', 'crystal', 'adj', 3345, 1),
    (1, 'writer', 'writer', NULL, 3346, 1),
    (1, 'chairman', 'chairman', NULL, 3347, 1),
    (1, 'violence', 'violence', 'noun', 3348, 1),
    (1, 'fans', 'fans', NULL, 3349, 1),
    (1, 'oklahoma', 'oklahoma', NULL, 3350, 1),
    (1, 'speakers', 'speakers', NULL, 3351, 1),
    (1, 'academy', 'academy', NULL, 3352, 1),
    (1, 'dynamic', 'dynamic', NULL, 3353, 1),
    (1, 'gender', 'gender', NULL, 3354, 1),
    (1, 'permanent', 'permanent', NULL, 3355, 1),
    (1, 'agriculture', 'agriculture', NULL, 3356, 1),
    (1, 'dell', 'dell', NULL, 3357, 1),
    (1, 'cleaning', 'cleaning', 'verb', 3358, 1),
    (1, 'constitutes', 'constitutes', NULL, 3359, 1),
    (1, 'portfolio', 'portfolio', NULL, 3360, 1),
    (1, 'practical', 'practical', 'adj', 3361, 1),
    (1, 'delivered', 'delivered', 'verb', 3362, 1),
    (1, 'collectibles', 'collectibles', NULL, 3363, 1),
    (1, 'infrastructure', 'infrastructure', NULL, 3364, 1),
    (1, 'exclusive', 'exclusive', 'adj', 3365, 1),
    (1, 'concerns', 'concerns', NULL, 3366, 1),
    (1, 'vendor', 'vendor', NULL, 3367, 1),
    (1, 'originally', 'originally', 'adv', 3368, 1),
    (1, 'intel', 'intel', NULL, 3369, 1),
    (1, 'utilities', 'utilities', NULL, 3370, 1),
    (1, 'philosophy', 'philosophy', NULL, 3371, 1),
    (1, 'regulation', 'regulation', 'noun', 3372, 1),
    (1, 'reduction', 'reduction', 'noun', 3373, 1),
    (1, 'aim', 'aim', NULL, 3374, 1),
    (1, 'bids', 'bids', NULL, 3375, 1),
    (1, 'referred', 'referred', 'verb', 3376, 1),
    (1, 'supports', 'supports', NULL, 3377, 1),
    (1, 'nutrition', 'nutrition', 'noun', 3378, 1),
    (1, 'recording', 'recording', 'verb', 3379, 1),
    (1, 'regions', 'regions', NULL, 3380, 1),
    (1, 'junior', 'junior', NULL, 3381, 1),
    (1, 'toll', 'toll', NULL, 3382, 1),
    (1, 'les', 'les', NULL, 3383, 1),
    (1, 'cape', 'cape', NULL, 3384, 1),
    (1, 'ann', 'ann', NULL, 3385, 1),
    (1, 'tip', 'tip', NULL, 3386, 1),
    (1, 'secondary', 'secondary', NULL, 3387, 1),
    (1, 'announced', 'announced', 'verb', 3388, 1),
    (1, 'prevention', 'prevention', 'noun', 3389, 1),
    (1, 'ski', 'ski', NULL, 3390, 1),
    (1, 'soccer', 'soccer', NULL, 3391, 1),
    (1, 'math', 'math', NULL, 3392, 1),
    (1, 'import', 'import', NULL, 3393, 1),
    (1, 'posting', 'posting', 'verb', 3394, 1),
    (1, 'presence', 'presence', 'noun', 3395, 1),
    (1, 'instant', 'instant', NULL, 3396, 1),
    (1, 'automatic', 'automatic', NULL, 3397, 1),
    (1, 'healthcare', 'healthcare', NULL, 3398, 1),
    (1, 'viewing', 'viewing', 'verb', 3399, 1),
    (1, 'maintained', 'maintained', 'verb', 3400, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'increasing', 'increasing', 'verb', 3401, 1),
    (1, 'majority', 'majority', 'noun', 3402, 1),
    (1, 'connected', 'connected', 'verb', 3403, 1),
    (1, 'directors', 'directors', NULL, 3404, 1),
    (1, 'aspects', 'aspects', NULL, 3405, 1),
    (1, 'austria', 'austria', NULL, 3406, 1),
    (1, 'participation', 'participation', 'noun', 3407, 1),
    (1, 'scheme', 'scheme', NULL, 3408, 1),
    (1, 'utility', 'utility', 'noun', 3409, 1),
    (1, 'preview', 'preview', NULL, 3410, 1),
    (1, 'manner', 'manner', NULL, 3411, 1),
    (1, 'matrix', 'matrix', NULL, 3412, 1),
    (1, 'containing', 'containing', 'verb', 3413, 1),
    (1, 'combination', 'combination', 'noun', 3414, 1),
    (1, 'devel', 'devel', NULL, 3415, 1),
    (1, 'amendment', 'amendment', 'noun', 3416, 1),
    (1, 'despite', 'despite', NULL, 3417, 1),
    (1, 'guaranteed', 'guaranteed', 'verb', 3418, 1),
    (1, 'turkey', 'turkey', NULL, 3419, 1),
    (1, 'libraries', 'libraries', NULL, 3420, 1),
    (1, 'distributed', 'distributed', 'verb', 3421, 1),
    (1, 'degrees', 'degrees', NULL, 3422, 1),
    (1, 'singapore', 'singapore', NULL, 3423, 1),
    (1, 'enterprises', 'enterprises', NULL, 3424, 1),
    (1, 'delta', 'delta', NULL, 3425, 1),
    (1, 'seeking', 'seeking', 'verb', 3426, 1),
    (1, 'inches', 'inches', NULL, 3427, 1),
    (1, 'phoenix', 'phoenix', NULL, 3428, 1),
    (1, 'convention', 'convention', 'noun', 3429, 1),
    (1, 'shares', 'shares', NULL, 3430, 1),
    (1, 'principal', 'principal', 'adj', 3431, 1),
    (1, 'comfort', 'comfort', NULL, 3432, 1),
    (1, 'colors', 'colors', NULL, 3433, 1),
    (1, 'wars', 'wars', NULL, 3434, 1),
    (1, 'cisco', 'cisco', NULL, 3435, 1),
    (1, 'ordering', 'ordering', 'verb', 3436, 1),
    (1, 'alpha', 'alpha', NULL, 3437, 1),
    (1, 'appeal', 'appeal', 'adj', 3438, 1),
    (1, 'cruise', 'cruise', NULL, 3439, 1),
    (1, 'bonus', 'bonus', NULL, 3440, 1),
    (1, 'certification', 'certification', 'noun', 3441, 1),
    (1, 'previously', 'previously', 'adv', 3442, 1),
    (1, 'bookmark', 'bookmark', NULL, 3443, 1),
    (1, 'buildings', 'buildings', NULL, 3444, 1),
    (1, 'specials', 'specials', NULL, 3445, 1),
    (1, 'disney', 'disney', NULL, 3446, 1),
    (1, 'household', 'household', NULL, 3447, 1),
    (1, 'batteries', 'batteries', NULL, 3448, 1),
    (1, 'adobe', 'adobe', NULL, 3449, 1),
    (1, 'smoking', 'smoking', 'verb', 3450, 1),
    (1, 'bbc', 'bbc', NULL, 3451, 1),
    (1, 'becomes', 'becomes', NULL, 3452, 1),
    (1, 'drives', 'drives', NULL, 3453, 1),
    (1, 'alabama', 'alabama', NULL, 3454, 1),
    (1, 'improved', 'improved', 'verb', 3455, 1),
    (1, 'avg', 'avg', NULL, 3456, 1),
    (1, 'achieve', 'achieve', NULL, 3457, 1),
    (1, 'positions', 'positions', NULL, 3458, 1),
    (1, 'subscription', 'subscription', 'noun', 3459, 1),
    (1, 'dealer', 'dealer', NULL, 3460, 1),
    (1, 'contemporary', 'contemporary', NULL, 3461, 1),
    (1, 'utah', 'utah', NULL, 3462, 1),
    (1, 'nearby', 'nearby', NULL, 3463, 1),
    (1, 'rom', 'rom', NULL, 3464, 1),
    (1, 'carried', 'carried', 'verb', 3465, 1),
    (1, 'exposure', 'exposure', NULL, 3466, 1),
    (1, 'panasonic', 'panasonic', NULL, 3467, 1),
    (1, 'permalink', 'permalink', NULL, 3468, 1),
    (1, 'signature', 'signature', NULL, 3469, 1),
    (1, 'gambling', 'gambling', 'verb', 3470, 1),
    (1, 'refer', 'refer', NULL, 3471, 1),
    (1, 'miller', 'miller', NULL, 3472, 1),
    (1, 'provision', 'provision', 'noun', 3473, 1),
    (1, 'outdoors', 'outdoors', NULL, 3474, 1),
    (1, 'luxury', 'luxury', NULL, 3475, 1),
    (1, 'babes', 'babes', NULL, 3476, 1),
    (1, 'frames', 'frames', NULL, 3477, 1),
    (1, 'newspaper', 'newspaper', NULL, 3478, 1),
    (1, 'toy', 'toy', NULL, 3479, 1),
    (1, 'circuit', 'circuit', NULL, 3480, 1),
    (1, 'layer', 'layer', NULL, 3481, 1),
    (1, 'printed', 'printed', 'verb', 3482, 1),
    (1, 'removal', 'removal', 'adj', 3483, 1),
    (1, 'src', 'src', NULL, 3484, 1),
    (1, 'liability', 'liability', 'noun', 3485, 1),
    (1, 'trademark', 'trademark', NULL, 3486, 1),
    (1, 'hip', 'hip', NULL, 3487, 1),
    (1, 'printers', 'printers', NULL, 3488, 1),
    (1, 'faqs', 'faqs', NULL, 3489, 1),
    (1, 'adding', 'adding', 'verb', 3490, 1),
    (1, 'kentucky', 'kentucky', NULL, 3491, 1),
    (1, 'mostly', 'mostly', 'adv', 3492, 1),
    (1, 'taylor', 'taylor', NULL, 3493, 1),
    (1, 'trackback', 'trackback', NULL, 3494, 1),
    (1, 'prints', 'prints', NULL, 3495, 1),
    (1, 'factory', 'factory', NULL, 3496, 1),
    (1, 'interior', 'interior', NULL, 3497, 1),
    (1, 'revised', 'revised', 'verb', 3498, 1),
    (1, 'americans', 'americans', NULL, 3499, 1),
    (1, 'optical', 'optical', 'adj', 3500, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'promotion', 'promotion', 'noun', 3501, 1),
    (1, 'relative', 'relative', 'adj', 3502, 1),
    (1, 'dot', 'dot', NULL, 3503, 1),
    (1, 'hiv', 'hiv', NULL, 3504, 1),
    (1, 'identity', 'identity', 'noun', 3505, 1),
    (1, 'suites', 'suites', NULL, 3506, 1),
    (1, 'conversion', 'conversion', 'noun', 3507, 1),
    (1, 'reasonable', 'reasonable', 'adj', 3508, 1),
    (1, 'victoria', 'victoria', NULL, 3509, 1),
    (1, 'serial', 'serial', 'adj', 3510, 1),
    (1, 'relief', 'relief', NULL, 3511, 1),
    (1, 'revision', 'revision', 'noun', 3512, 1),
    (1, 'broadband', 'broadband', NULL, 3513, 1),
    (1, 'influence', 'influence', 'noun', 3514, 1),
    (1, 'ratio', 'ratio', NULL, 3515, 1),
    (1, 'pda', 'pda', NULL, 3516, 1),
    (1, 'importance', 'importance', 'noun', 3517, 1),
    (1, 'dsl', 'dsl', NULL, 3518, 1),
    (1, 'webmaster', 'webmaster', NULL, 3519, 1),
    (1, 'copies', 'copies', NULL, 3520, 1),
    (1, 'recipe', 'recipe', NULL, 3521, 1),
    (1, 'zum', 'zum', NULL, 3522, 1),
    (1, 'permit', 'permit', NULL, 3523, 1),
    (1, 'diff', 'diff', NULL, 3524, 1),
    (1, 'tennis', 'tennis', NULL, 3525, 1),
    (1, 'bass', 'bass', NULL, 3526, 1),
    (1, 'prescription', 'prescription', 'noun', 3527, 1),
    (1, 'instance', 'instance', 'noun', 3528, 1),
    (1, 'pets', 'pets', NULL, 3529, 1),
    (1, 'licensed', 'licensed', 'verb', 3530, 1),
    (1, 'orlando', 'orlando', NULL, 3531, 1),
    (1, 'specifically', 'specifically', 'adv', 3532, 1),
    (1, 'bureau', 'bureau', NULL, 3533, 1),
    (1, 'maine', 'maine', NULL, 3534, 1),
    (1, 'represent', 'represent', NULL, 3535, 1),
    (1, 'conservation', 'conservation', 'noun', 3536, 1),
    (1, 'ideal', 'ideal', 'adj', 3537, 1),
    (1, 'specs', 'specs', NULL, 3538, 1),
    (1, 'recorded', 'recorded', 'verb', 3539, 1),
    (1, 'parks', 'parks', NULL, 3540, 1),
    (1, 'lawyers', 'lawyers', NULL, 3541, 1),
    (1, 'sydney', 'sydney', NULL, 3542, 1),
    (1, 'stress', 'stress', NULL, 3543, 1),
    (1, 'trends', 'trends', NULL, 3544, 1),
    (1, 'discover', 'discover', NULL, 3545, 1),
    (1, 'patterns', 'patterns', NULL, 3546, 1),
    (1, 'boxes', 'boxes', NULL, 3547, 1),
    (1, 'louisiana', 'louisiana', NULL, 3548, 1),
    (1, 'hills', 'hills', NULL, 3549, 1),
    (1, 'javascript', 'javascript', NULL, 3550, 1),
    (1, 'fourth', 'fourth', NULL, 3551, 1),
    (1, 'advisor', 'advisor', NULL, 3552, 1),
    (1, 'marketplace', 'marketplace', NULL, 3553, 1),
    (1, 'wilson', 'wilson', NULL, 3554, 1),
    (1, 'evolution', 'evolution', 'noun', 3555, 1),
    (1, 'irish', 'irish', 'adj', 3556, 1),
    (1, 'certificates', 'certificates', NULL, 3557, 1),
    (1, 'objectives', 'objectives', NULL, 3558, 1),
    (1, 'stations', 'stations', NULL, 3559, 1),
    (1, 'suggested', 'suggested', 'verb', 3560, 1),
    (1, 'gps', 'gps', NULL, 3561, 1),
    (1, 'remains', 'remains', NULL, 3562, 1),
    (1, 'acc', 'acc', NULL, 3563, 1),
    (1, 'firms', 'firms', NULL, 3564, 1),
    (1, 'euro', 'euro', NULL, 3565, 1),
    (1, 'operator', 'operator', NULL, 3566, 1),
    (1, 'structures', 'structures', NULL, 3567, 1),
    (1, 'generic', 'generic', NULL, 3568, 1),
    (1, 'encyclopedia', 'encyclopedia', NULL, 3569, 1),
    (1, 'usage', 'usage', NULL, 3570, 1),
    (1, 'cap', 'cap', NULL, 3571, 1),
    (1, 'ink', 'ink', NULL, 3572, 1),
    (1, 'charts', 'charts', NULL, 3573, 1),
    (1, 'continuing', 'continuing', 'verb', 3574, 1),
    (1, 'mixed', 'mixed', 'verb', 3575, 1),
    (1, 'census', 'census', NULL, 3576, 1),
    (1, 'interracial', 'interracial', 'adj', 3577, 1),
    (1, 'peak', 'peak', NULL, 3578, 1),
    (1, 'competitive', 'competitive', 'adj', 3579, 1),
    (1, 'wheel', 'wheel', NULL, 3580, 1),
    (1, 'transit', 'transit', NULL, 3581, 1),
    (1, 'suppliers', 'suppliers', NULL, 3582, 1),
    (1, 'salt', 'salt', NULL, 3583, 1),
    (1, 'compact', 'compact', NULL, 3584, 1),
    (1, 'poetry', 'poetry', NULL, 3585, 1),
    (1, 'tracking', 'tracking', 'verb', 3586, 1),
    (1, 'preparation', 'preparation', 'noun', 3587, 1),
    (1, 'attempt', 'attempt', NULL, 3588, 1),
    (1, 'receiving', 'receiving', 'verb', 3589, 1),
    (1, 'matches', 'matches', NULL, 3590, 1),
    (1, 'accordance', 'accordance', 'noun', 3591, 1),
    (1, 'width', 'width', NULL, 3592, 1),
    (1, 'engines', 'engines', NULL, 3593, 1),
    (1, 'array', 'array', NULL, 3594, 1),
    (1, 'discussed', 'discussed', 'verb', 3595, 1),
    (1, 'accurate', 'accurate', NULL, 3596, 1),
    (1, 'stephen', 'stephen', NULL, 3597, 1),
    (1, 'elizabeth', 'elizabeth', NULL, 3598, 1),
    (1, 'climate', 'climate', NULL, 3599, 1),
    (1, 'reservations', 'reservations', NULL, 3600, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'pin', 'pin', NULL, 3601, 1),
    (1, 'playstation', 'playstation', 'noun', 3602, 1),
    (1, 'alcohol', 'alcohol', NULL, 3603, 1),
    (1, 'greek', 'greek', NULL, 3604, 1),
    (1, 'instruction', 'instruction', 'noun', 3605, 1),
    (1, 'managing', 'managing', 'verb', 3606, 1),
    (1, 'annotation', 'annotation', 'noun', 3607, 1),
    (1, 'raw', 'raw', NULL, 3608, 1),
    (1, 'differences', 'differences', NULL, 3609, 1),
    (1, 'smaller', 'smaller', NULL, 3610, 1),
    (1, 'newest', 'newest', NULL, 3611, 1),
    (1, 'establish', 'establish', 'adj', 3612, 1),
    (1, 'gnu', 'gnu', NULL, 3613, 1),
    (1, 'expressed', 'expressed', 'verb', 3614, 1),
    (1, 'extent', 'extent', NULL, 3615, 1),
    (1, 'sharp', 'sharp', NULL, 3616, 1),
    (1, 'lesbians', 'lesbians', NULL, 3617, 1),
    (1, 'lane', 'lane', NULL, 3618, 1),
    (1, 'paragraph', 'paragraph', NULL, 3619, 1),
    (1, 'mathematics', 'mathematics', NULL, 3620, 1),
    (1, 'aol', 'aol', NULL, 3621, 1),
    (1, 'compensation', 'compensation', 'noun', 3622, 1),
    (1, 'export', 'export', NULL, 3623, 1),
    (1, 'managers', 'managers', NULL, 3624, 1),
    (1, 'aircraft', 'aircraft', NULL, 3625, 1),
    (1, 'modules', 'modules', NULL, 3626, 1),
    (1, 'sweden', 'sweden', NULL, 3627, 1),
    (1, 'conflict', 'conflict', NULL, 3628, 1),
    (1, 'conducted', 'conducted', 'verb', 3629, 1),
    (1, 'versions', 'versions', NULL, 3630, 1),
    (1, 'employer', 'employer', NULL, 3631, 1),
    (1, 'occur', 'occur', NULL, 3632, 1),
    (1, 'percentage', 'percentage', NULL, 3633, 1),
    (1, 'mississippi', 'mississippi', NULL, 3634, 1),
    (1, 'describe', 'describe', NULL, 3635, 1),
    (1, 'concern', 'concern', NULL, 3636, 1),
    (1, 'backup', 'backup', NULL, 3637, 1),
    (1, 'requested', 'requested', 'verb', 3638, 1),
    (1, 'citizens', 'citizens', NULL, 3639, 1),
    (1, 'connecticut', 'connecticut', NULL, 3640, 1),
    (1, 'heritage', 'heritage', NULL, 3641, 1),
    (1, 'personals', 'personals', NULL, 3642, 1),
    (1, 'immediate', 'immediate', NULL, 3643, 1),
    (1, 'agricultural', 'agricultural', 'adj', 3644, 1),
    (1, 'expand', 'expand', NULL, 3645, 1),
    (1, 'supporting', 'supporting', 'verb', 3646, 1),
    (1, 'assigned', 'assigned', 'verb', 3647, 1),
    (1, 'jordan', 'jordan', NULL, 3648, 1),
    (1, 'collections', 'collections', NULL, 3649, 1),
    (1, 'ages', 'ages', NULL, 3650, 1),
    (1, 'participate', 'participate', NULL, 3651, 1),
    (1, 'plug', 'plug', NULL, 3652, 1),
    (1, 'specialist', 'specialist', NULL, 3653, 1),
    (1, 'affect', 'affect', NULL, 3654, 1),
    (1, 'virgin', 'virgin', NULL, 3655, 1),
    (1, 'experienced', 'experienced', 'verb', 3656, 1),
    (1, 'raised', 'raised', 'verb', 3657, 1),
    (1, 'institution', 'institution', 'noun', 3658, 1),
    (1, 'directed', 'directed', 'verb', 3659, 1),
    (1, 'dealers', 'dealers', NULL, 3660, 1),
    (1, 'searching', 'searching', 'verb', 3661, 1),
    (1, 'sporting', 'sporting', 'verb', 3662, 1),
    (1, 'perl', 'perl', NULL, 3663, 1),
    (1, 'affected', 'affected', 'verb', 3664, 1),
    (1, 'lib', 'lib', NULL, 3665, 1),
    (1, 'plate', 'plate', NULL, 3666, 1),
    (1, 'expenses', 'expenses', NULL, 3667, 1),
    (1, 'indicate', 'indicate', NULL, 3668, 1),
    (1, 'blonde', 'blonde', NULL, 3669, 1),
    (1, 'proceedings', 'proceedings', NULL, 3670, 1),
    (1, 'transmission', 'transmission', 'noun', 3671, 1),
    (1, 'anderson', 'anderson', NULL, 3672, 1),
    (1, 'utc', 'utc', NULL, 3673, 1),
    (1, 'characteristics', 'characteristics', NULL, 3674, 1),
    (1, 'der', 'der', NULL, 3675, 1),
    (1, 'organic', 'organic', NULL, 3676, 1),
    (1, 'seek', 'seek', NULL, 3677, 1),
    (1, 'experiences', 'experiences', NULL, 3678, 1),
    (1, 'albums', 'albums', NULL, 3679, 1),
    (1, 'cheats', 'cheats', NULL, 3680, 1),
    (1, 'extremely', 'extremely', 'adv', 3681, 1),
    (1, 'verzeichnis', 'verzeichnis', NULL, 3682, 1),
    (1, 'contracts', 'contracts', NULL, 3683, 1),
    (1, 'hosted', 'hosted', 'verb', 3684, 1),
    (1, 'diseases', 'diseases', NULL, 3685, 1),
    (1, 'concerning', 'concerning', 'verb', 3686, 1),
    (1, 'developers', 'developers', NULL, 3687, 1),
    (1, 'equivalent', 'equivalent', NULL, 3688, 1),
    (1, 'chemistry', 'chemistry', NULL, 3689, 1),
    (1, 'neighborhood', 'neighborhood', NULL, 3690, 1),
    (1, 'nevada', 'nevada', NULL, 3691, 1),
    (1, 'kits', 'kits', NULL, 3692, 1),
    (1, 'thailand', 'thailand', NULL, 3693, 1),
    (1, 'variables', 'variables', NULL, 3694, 1),
    (1, 'agenda', 'agenda', NULL, 3695, 1),
    (1, 'tracks', 'tracks', NULL, 3696, 1),
    (1, 'advisory', 'advisory', NULL, 3697, 1),
    (1, 'cam', 'cam', NULL, 3698, 1),
    (1, 'curriculum', 'curriculum', NULL, 3699, 1),
    (1, 'logic', 'logic', NULL, 3700, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'template', 'template', NULL, 3701, 1),
    (1, 'circle', 'circle', NULL, 3702, 1),
    (1, 'soil', 'soil', NULL, 3703, 1),
    (1, 'grants', 'grants', NULL, 3704, 1),
    (1, 'psychology', 'psychology', NULL, 3705, 1),
    (1, 'responses', 'responses', NULL, 3706, 1),
    (1, 'atlantic', 'atlantic', NULL, 3707, 1),
    (1, 'circumstances', 'circumstances', NULL, 3708, 1),
    (1, 'edward', 'edward', NULL, 3709, 1),
    (1, 'investor', 'investor', NULL, 3710, 1),
    (1, 'identification', 'identification', 'noun', 3711, 1),
    (1, 'ram', 'ram', NULL, 3712, 1),
    (1, 'wildlife', 'wildlife', NULL, 3713, 1),
    (1, 'appliances', 'appliances', NULL, 3714, 1),
    (1, 'elementary', 'elementary', NULL, 3715, 1),
    (1, 'cooking', 'cooking', 'verb', 3716, 1),
    (1, 'sponsors', 'sponsors', NULL, 3717, 1),
    (1, 'fox', 'fox', NULL, 3718, 1),
    (1, 'unlimited', 'unlimited', 'verb', 3719, 1),
    (1, 'respond', 'respond', NULL, 3720, 1),
    (1, 'sizes', 'sizes', NULL, 3721, 1),
    (1, 'plain', 'plain', NULL, 3722, 1),
    (1, 'exit', 'exit', NULL, 3723, 1),
    (1, 'entered', 'entered', 'verb', 3724, 1),
    (1, 'iran', 'iran', NULL, 3725, 1),
    (1, 'launch', 'launch', NULL, 3726, 1),
    (1, 'wave', 'wave', NULL, 3727, 1),
    (1, 'checking', 'checking', 'verb', 3728, 1),
    (1, 'costa', 'costa', NULL, 3729, 1),
    (1, 'belgium', 'belgium', NULL, 3730, 1),
    (1, 'printable', 'printable', 'adj', 3731, 1),
    (1, 'acts', 'acts', NULL, 3732, 1),
    (1, 'guidance', 'guidance', 'noun', 3733, 1),
    (1, 'mesh', 'mesh', NULL, 3734, 1),
    (1, 'trail', 'trail', NULL, 3735, 1),
    (1, 'enforcement', 'enforcement', 'noun', 3736, 1),
    (1, 'symbol', 'symbol', NULL, 3737, 1),
    (1, 'crafts', 'crafts', NULL, 3738, 1),
    (1, 'highway', 'highway', NULL, 3739, 1),
    (1, 'hardcover', 'hardcover', NULL, 3740, 1),
    (1, 'observed', 'observed', 'verb', 3741, 1),
    (1, 'dean', 'dean', NULL, 3742, 1),
    (1, 'setup', 'setup', NULL, 3743, 1),
    (1, 'poll', 'poll', NULL, 3744, 1),
    (1, 'booking', 'booking', 'verb', 3745, 1),
    (1, 'glossary', 'glossary', NULL, 3746, 1),
    (1, 'fiscal', 'fiscal', 'adj', 3747, 1),
    (1, 'celebrity', 'celebrity', 'noun', 3748, 1),
    (1, 'styles', 'styles', NULL, 3749, 1),
    (1, 'denver', 'denver', NULL, 3750, 1),
    (1, 'unix', 'unix', NULL, 3751, 1),
    (1, 'bond', 'bond', NULL, 3752, 1),
    (1, 'channels', 'channels', NULL, 3753, 1),
    (1, 'ericsson', 'ericsson', NULL, 3754, 1),
    (1, 'appendix', 'appendix', NULL, 3755, 1),
    (1, 'notify', 'notify', NULL, 3756, 1),
    (1, 'blues', 'blues', NULL, 3757, 1),
    (1, 'chocolate', 'chocolate', NULL, 3758, 1),
    (1, 'pub', 'pub', NULL, 3759, 1),
    (1, 'portion', 'portion', 'noun', 3760, 1),
    (1, 'scope', 'scope', NULL, 3761, 1),
    (1, 'hampshire', 'hampshire', NULL, 3762, 1),
    (1, 'supplier', 'supplier', NULL, 3763, 1),
    (1, 'cables', 'cables', NULL, 3764, 1),
    (1, 'cotton', 'cotton', NULL, 3765, 1),
    (1, 'bluetooth', 'bluetooth', NULL, 3766, 1),
    (1, 'controlled', 'controlled', 'verb', 3767, 1),
    (1, 'requirement', 'requirement', 'noun', 3768, 1),
    (1, 'authorities', 'authorities', NULL, 3769, 1),
    (1, 'biology', 'biology', NULL, 3770, 1),
    (1, 'dental', 'dental', 'adj', 3771, 1),
    (1, 'border', 'border', NULL, 3772, 1),
    (1, 'debate', 'debate', NULL, 3773, 1),
    (1, 'representatives', 'representatives', NULL, 3774, 1),
    (1, 'pregnancy', 'pregnancy', NULL, 3775, 1),
    (1, 'causes', 'causes', NULL, 3776, 1),
    (1, 'arkansas', 'arkansas', NULL, 3777, 1),
    (1, 'biography', 'biography', NULL, 3778, 1),
    (1, 'leisure', 'leisure', NULL, 3779, 1),
    (1, 'attractions', 'attractions', NULL, 3780, 1),
    (1, 'transactions', 'transactions', NULL, 3781, 1),
    (1, 'notebook', 'notebook', NULL, 3782, 1),
    (1, 'explorer', 'explorer', NULL, 3783, 1),
    (1, 'historic', 'historic', NULL, 3784, 1),
    (1, 'attached', 'attached', 'verb', 3785, 1),
    (1, 'disabled', 'disabled', 'verb', 3786, 1),
    (1, 'authorized', 'authorized', 'verb', 3787, 1),
    (1, 'upcoming', 'upcoming', 'verb', 3788, 1),
    (1, 'britain', 'britain', NULL, 3789, 1),
    (1, 'concert', 'concert', NULL, 3790, 1),
    (1, 'retirement', 'retirement', 'noun', 3791, 1),
    (1, 'scores', 'scores', NULL, 3792, 1),
    (1, 'financing', 'financing', 'verb', 3793, 1),
    (1, 'efficiency', 'efficiency', NULL, 3794, 1),
    (1, 'comedy', 'comedy', NULL, 3795, 1),
    (1, 'adopted', 'adopted', 'verb', 3796, 1),
    (1, 'efficient', 'efficient', NULL, 3797, 1),
    (1, 'weblog', 'weblog', NULL, 3798, 1),
    (1, 'linear', 'linear', NULL, 3799, 1),
    (1, 'commitment', 'commitment', 'noun', 3800, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'specialty', 'specialty', NULL, 3801, 1),
    (1, 'bears', 'bears', NULL, 3802, 1),
    (1, 'jean', 'jean', NULL, 3803, 1),
    (1, 'hop', 'hop', NULL, 3804, 1),
    (1, 'carrier', 'carrier', NULL, 3805, 1),
    (1, 'edited', 'edited', 'verb', 3806, 1),
    (1, 'constant', 'constant', NULL, 3807, 1),
    (1, 'visa', 'visa', NULL, 3808, 1),
    (1, 'jewish', 'jewish', 'adj', 3809, 1),
    (1, 'meter', 'meter', NULL, 3810, 1),
    (1, 'linked', 'linked', 'verb', 3811, 1),
    (1, 'portland', 'portland', NULL, 3812, 1),
    (1, 'interviews', 'interviews', NULL, 3813, 1),
    (1, 'concepts', 'concepts', NULL, 3814, 1),
    (1, 'reflect', 'reflect', NULL, 3815, 1),
    (1, 'pure', 'pure', NULL, 3816, 1),
    (1, 'lessons', 'lessons', NULL, 3817, 1),
    (1, 'fruit', 'fruit', NULL, 3818, 1),
    (1, 'begins', 'begins', NULL, 3819, 1),
    (1, 'qualified', 'qualified', 'verb', 3820, 1),
    (1, 'reform', 'reform', NULL, 3821, 1),
    (1, 'lens', 'lens', NULL, 3822, 1),
    (1, 'alerts', 'alerts', NULL, 3823, 1),
    (1, 'treated', 'treated', 'verb', 3824, 1),
    (1, 'discovery', 'discovery', NULL, 3825, 1),
    (1, 'mysql', 'mysql', NULL, 3826, 1),
    (1, 'classified', 'classified', 'verb', 3827, 1),
    (1, 'relating', 'relating', 'verb', 3828, 1),
    (1, 'confidence', 'confidence', 'noun', 3829, 1),
    (1, 'alliance', 'alliance', 'noun', 3830, 1),
    (1, 'confirm', 'confirm', NULL, 3831, 1),
    (1, 'lewis', 'lewis', NULL, 3832, 1),
    (1, 'howard', 'howard', NULL, 3833, 1),
    (1, 'offline', 'offline', NULL, 3834, 1),
    (1, 'engineer', 'engineer', NULL, 3835, 1),
    (1, 'lifestyle', 'lifestyle', NULL, 3836, 1),
    (1, 'consistent', 'consistent', NULL, 3837, 1),
    (1, 'replace', 'replace', NULL, 3838, 1),
    (1, 'clearance', 'clearance', 'noun', 3839, 1),
    (1, 'connections', 'connections', NULL, 3840, 1),
    (1, 'inventory', 'inventory', NULL, 3841, 1),
    (1, 'converter', 'converter', NULL, 3842, 1),
    (1, 'organisation', 'organisation', 'noun', 3843, 1),
    (1, 'checks', 'checks', NULL, 3844, 1),
    (1, 'becoming', 'becoming', 'verb', 3845, 1),
    (1, 'safari', 'safari', NULL, 3846, 1),
    (1, 'objective', 'objective', 'adj', 3847, 1),
    (1, 'indicated', 'indicated', 'verb', 3848, 1),
    (1, 'securities', 'securities', NULL, 3849, 1),
    (1, 'allen', 'allen', NULL, 3850, 1),
    (1, 'pdt', 'pdt', NULL, 3851, 1),
    (1, 'relation', 'relation', 'noun', 3852, 1),
    (1, 'enabled', 'enabled', 'verb', 3853, 1),
    (1, 'genre', 'genre', NULL, 3854, 1),
    (1, 'slide', 'slide', NULL, 3855, 1),
    (1, 'montana', 'montana', NULL, 3856, 1),
    (1, 'volunteer', 'volunteer', NULL, 3857, 1),
    (1, 'tested', 'tested', 'verb', 3858, 1),
    (1, 'rear', 'rear', NULL, 3859, 1),
    (1, 'democratic', 'democratic', NULL, 3860, 1),
    (1, 'enhance', 'enhance', 'noun', 3861, 1),
    (1, 'switzerland', 'switzerland', NULL, 3862, 1),
    (1, 'exact', 'exact', NULL, 3863, 1),
    (1, 'bound', 'bound', NULL, 3864, 1),
    (1, 'parameter', 'parameter', NULL, 3865, 1),
    (1, 'adapter', 'adapter', NULL, 3866, 1),
    (1, 'processor', 'processor', NULL, 3867, 1),
    (1, 'node', 'node', NULL, 3868, 1),
    (1, 'formal', 'formal', 'adj', 3869, 1),
    (1, 'dimensions', 'dimensions', NULL, 3870, 1),
    (1, 'contribute', 'contribute', NULL, 3871, 1),
    (1, 'hockey', 'hockey', NULL, 3872, 1),
    (1, 'micro', 'micro', NULL, 3873, 1),
    (1, 'colleges', 'colleges', NULL, 3874, 1),
    (1, 'laptops', 'laptops', NULL, 3875, 1),
    (1, 'mile', 'mile', NULL, 3876, 1),
    (1, 'challenges', 'challenges', NULL, 3877, 1),
    (1, 'editors', 'editors', NULL, 3878, 1),
    (1, 'mens', 'mens', NULL, 3879, 1),
    (1, 'threads', 'threads', NULL, 3880, 1),
    (1, 'bowl', 'bowl', NULL, 3881, 1),
    (1, 'supreme', 'supreme', NULL, 3882, 1),
    (1, 'recognition', 'recognition', 'noun', 3883, 1),
    (1, 'presents', 'presents', NULL, 3884, 1),
    (1, 'ref', 'ref', NULL, 3885, 1),
    (1, 'tank', 'tank', NULL, 3886, 1),
    (1, 'submission', 'submission', 'noun', 3887, 1),
    (1, 'dolls', 'dolls', NULL, 3888, 1),
    (1, 'estimate', 'estimate', NULL, 3889, 1),
    (1, 'encourage', 'encourage', NULL, 3890, 1),
    (1, 'navy', 'navy', NULL, 3891, 1),
    (1, 'regulatory', 'regulatory', NULL, 3892, 1),
    (1, 'inspection', 'inspection', 'noun', 3893, 1),
    (1, 'consumers', 'consumers', NULL, 3894, 1),
    (1, 'cancel', 'cancel', NULL, 3895, 1),
    (1, 'limits', 'limits', NULL, 3896, 1),
    (1, 'territory', 'territory', NULL, 3897, 1),
    (1, 'transaction', 'transaction', 'noun', 3898, 1),
    (1, 'manchester', 'manchester', NULL, 3899, 1),
    (1, 'delay', 'delay', NULL, 3900, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'pilot', 'pilot', NULL, 3901, 1),
    (1, 'outlet', 'outlet', NULL, 3902, 1),
    (1, 'contributions', 'contributions', NULL, 3903, 1),
    (1, 'continuous', 'continuous', 'adj', 3904, 1),
    (1, 'czech', 'czech', NULL, 3905, 1),
    (1, 'resulting', 'resulting', 'verb', 3906, 1),
    (1, 'cambridge', 'cambridge', NULL, 3907, 1),
    (1, 'initiative', 'initiative', 'adj', 3908, 1),
    (1, 'novel', 'novel', NULL, 3909, 1),
    (1, 'pan', 'pan', NULL, 3910, 1),
    (1, 'execution', 'execution', 'noun', 3911, 1),
    (1, 'disability', 'disability', 'noun', 3912, 1),
    (1, 'increases', 'increases', NULL, 3913, 1),
    (1, 'ultra', 'ultra', NULL, 3914, 1),
    (1, 'winner', 'winner', NULL, 3915, 1),
    (1, 'idaho', 'idaho', NULL, 3916, 1),
    (1, 'contractor', 'contractor', NULL, 3917, 1),
    (1, 'episode', 'episode', NULL, 3918, 1),
    (1, 'examination', 'examination', 'noun', 3919, 1),
    (1, 'potter', 'potter', NULL, 3920, 1),
    (1, 'dish', 'dish', 'adj', 3921, 1),
    (1, 'bulletin', 'bulletin', NULL, 3922, 1),
    (1, 'indicates', 'indicates', NULL, 3923, 1),
    (1, 'modify', 'modify', NULL, 3924, 1),
    (1, 'oxford', 'oxford', NULL, 3925, 1),
    (1, 'epinions', 'epinions', NULL, 3926, 1),
    (1, 'committed', 'committed', 'verb', 3927, 1),
    (1, 'extensive', 'extensive', 'adj', 3928, 1),
    (1, 'affordable', 'affordable', 'adj', 3929, 1),
    (1, 'candidate', 'candidate', NULL, 3930, 1),
    (1, 'databases', 'databases', NULL, 3931, 1),
    (1, 'patent', 'patent', NULL, 3932, 1),
    (1, 'slot', 'slot', NULL, 3933, 1),
    (1, 'psp', 'psp', NULL, 3934, 1),
    (1, 'outstanding', 'outstanding', 'verb', 3935, 1),
    (1, 'perspective', 'perspective', 'adj', 3936, 1),
    (1, 'lodge', 'lodge', NULL, 3937, 1),
    (1, 'messenger', 'messenger', NULL, 3938, 1),
    (1, 'mirror', 'mirror', NULL, 3939, 1),
    (1, 'tournament', 'tournament', 'noun', 3940, 1),
    (1, 'consideration', 'consideration', 'noun', 3941, 1),
    (1, 'discounts', 'discounts', NULL, 3942, 1),
    (1, 'sterling', 'sterling', 'verb', 3943, 1),
    (1, 'sessions', 'sessions', NULL, 3944, 1),
    (1, 'kernel', 'kernel', NULL, 3945, 1),
    (1, 'stocks', 'stocks', NULL, 3946, 1),
    (1, 'buyers', 'buyers', NULL, 3947, 1),
    (1, 'journals', 'journals', NULL, 3948, 1),
    (1, 'gray', 'gray', NULL, 3949, 1),
    (1, 'catalogue', 'catalogue', NULL, 3950, 1),
    (1, 'jennifer', 'jennifer', NULL, 3951, 1),
    (1, 'antonio', 'antonio', NULL, 3952, 1),
    (1, 'charged', 'charged', 'verb', 3953, 1),
    (1, 'broad', 'broad', NULL, 3954, 1),
    (1, 'taiwan', 'taiwan', NULL, 3955, 1),
    (1, 'und', 'und', NULL, 3956, 1),
    (1, 'chosen', 'chosen', NULL, 3957, 1),
    (1, 'demo', 'demo', NULL, 3958, 1),
    (1, 'greece', 'greece', NULL, 3959, 1),
    (1, 'swiss', 'swiss', NULL, 3960, 1),
    (1, 'clark', 'clark', NULL, 3961, 1),
    (1, 'terminal', 'terminal', 'adj', 3962, 1),
    (1, 'publishers', 'publishers', NULL, 3963, 1),
    (1, 'behalf', 'behalf', NULL, 3964, 1),
    (1, 'caribbean', 'caribbean', NULL, 3965, 1),
    (1, 'liquid', 'liquid', NULL, 3966, 1),
    (1, 'rice', 'rice', NULL, 3967, 1),
    (1, 'nebraska', 'nebraska', NULL, 3968, 1),
    (1, 'loop', 'loop', NULL, 3969, 1),
    (1, 'salary', 'salary', NULL, 3970, 1),
    (1, 'reservation', 'reservation', 'noun', 3971, 1),
    (1, 'foods', 'foods', NULL, 3972, 1),
    (1, 'gourmet', 'gourmet', NULL, 3973, 1),
    (1, 'properly', 'properly', 'adv', 3974, 1),
    (1, 'orleans', 'orleans', NULL, 3975, 1),
    (1, 'nfl', 'nfl', NULL, 3976, 1),
    (1, 'remaining', 'remaining', 'verb', 3977, 1),
    (1, 'empire', 'empire', NULL, 3978, 1),
    (1, 'resume', 'resume', NULL, 3979, 1),
    (1, 'twenty', 'twenty', NULL, 3980, 1),
    (1, 'newly', 'newly', 'adv', 3981, 1),
    (1, 'avatar', 'avatar', NULL, 3982, 1),
    (1, 'gary', 'gary', NULL, 3983, 1),
    (1, 'depending', 'depending', 'verb', 3984, 1),
    (1, 'illegal', 'illegal', 'adj', 3985, 1),
    (1, 'expansion', 'expansion', 'noun', 3986, 1),
    (1, 'vary', 'vary', NULL, 3987, 1),
    (1, 'hundreds', 'hundreds', NULL, 3988, 1),
    (1, 'arab', 'arab', NULL, 3989, 1),
    (1, 'lincoln', 'lincoln', NULL, 3990, 1),
    (1, 'premier', 'premier', NULL, 3991, 1),
    (1, 'purchased', 'purchased', 'verb', 3992, 1),
    (1, 'consent', 'consent', NULL, 3993, 1),
    (1, 'drama', 'drama', NULL, 3994, 1),
    (1, 'visiting', 'visiting', 'verb', 3995, 1),
    (1, 'performing', 'performing', 'verb', 3996, 1),
    (1, 'downtown', 'downtown', NULL, 3997, 1),
    (1, 'keyboard', 'keyboard', NULL, 3998, 1),
    (1, 'contest', 'contest', NULL, 3999, 1),
    (1, 'collected', 'collected', 'verb', 4000, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'bands', 'bands', NULL, 4001, 1),
    (1, 'boot', 'boot', NULL, 4002, 1),
    (1, 'suitable', 'suitable', 'adj', 4003, 1),
    (1, 'millions', 'millions', NULL, 4004, 1),
    (1, 'audit', 'audit', NULL, 4005, 1),
    (1, 'chamber', 'chamber', NULL, 4006, 1),
    (1, 'guinea', 'guinea', NULL, 4007, 1),
    (1, 'findings', 'findings', NULL, 4008, 1),
    (1, 'muscle', 'muscle', NULL, 4009, 1),
    (1, 'featuring', 'featuring', 'verb', 4010, 1),
    (1, 'iso', 'iso', NULL, 4011, 1),
    (1, 'implement', 'implement', 'noun', 4012, 1),
    (1, 'clicking', 'clicking', 'verb', 4013, 1),
    (1, 'scheduled', 'scheduled', 'verb', 4014, 1),
    (1, 'polls', 'polls', NULL, 4015, 1),
    (1, 'typical', 'typical', 'adj', 4016, 1),
    (1, 'tower', 'tower', NULL, 4017, 1),
    (1, 'sum', 'sum', NULL, 4018, 1),
    (1, 'misc', 'misc', NULL, 4019, 1),
    (1, 'calculator', 'calculator', NULL, 4020, 1),
    (1, 'significantly', 'significantly', 'adv', 4021, 1),
    (1, 'temporary', 'temporary', NULL, 4022, 1),
    (1, 'attend', 'attend', NULL, 4023, 1),
    (1, 'sufficient', 'sufficient', NULL, 4024, 1),
    (1, 'holdem', 'holdem', NULL, 4025, 1),
    (1, 'shell', 'shell', NULL, 4026, 1),
    (1, 'province', 'province', NULL, 4027, 1),
    (1, 'catholic', 'catholic', NULL, 4028, 1),
    (1, 'oak', 'oak', NULL, 4029, 1),
    (1, 'vat', 'vat', NULL, 4030, 1),
    (1, 'awareness', 'awareness', 'noun', 4031, 1),
    (1, 'vancouver', 'vancouver', NULL, 4032, 1),
    (1, 'governor', 'governor', NULL, 4033, 1),
    (1, 'contribution', 'contribution', 'noun', 4034, 1),
    (1, 'measurement', 'measurement', 'noun', 4035, 1),
    (1, 'swimming', 'swimming', 'verb', 4036, 1),
    (1, 'spyware', 'spyware', NULL, 4037, 1),
    (1, 'formula', 'formula', NULL, 4038, 1),
    (1, 'constitution', 'constitution', 'noun', 4039, 1),
    (1, 'packaging', 'packaging', 'verb', 4040, 1),
    (1, 'solar', 'solar', NULL, 4041, 1),
    (1, 'jose', 'jose', NULL, 4042, 1),
    (1, 'pakistan', 'pakistan', NULL, 4043, 1),
    (1, 'reliable', 'reliable', 'adj', 4044, 1),
    (1, 'consultation', 'consultation', 'noun', 4045, 1),
    (1, 'northwest', 'northwest', NULL, 4046, 1),
    (1, 'earn', 'earn', NULL, 4047, 1),
    (1, 'finder', 'finder', NULL, 4048, 1),
    (1, 'unable', 'unable', 'adj', 4049, 1),
    (1, 'periods', 'periods', NULL, 4050, 1),
    (1, 'classroom', 'classroom', NULL, 4051, 1),
    (1, 'tasks', 'tasks', NULL, 4052, 1),
    (1, 'democracy', 'democracy', NULL, 4053, 1),
    (1, 'attacks', 'attacks', NULL, 4054, 1),
    (1, 'wallpaper', 'wallpaper', NULL, 4055, 1),
    (1, 'merchandise', 'merchandise', NULL, 4056, 1),
    (1, 'const', 'const', NULL, 4057, 1),
    (1, 'resistance', 'resistance', 'noun', 4058, 1),
    (1, 'symptoms', 'symptoms', NULL, 4059, 1),
    (1, 'resorts', 'resorts', NULL, 4060, 1),
    (1, 'memorial', 'memorial', 'adj', 4061, 1),
    (1, 'visitor', 'visitor', NULL, 4062, 1),
    (1, 'twin', 'twin', NULL, 4063, 1),
    (1, 'forth', 'forth', NULL, 4064, 1),
    (1, 'insert', 'insert', NULL, 4065, 1),
    (1, 'baltimore', 'baltimore', NULL, 4066, 1),
    (1, 'gateway', 'gateway', NULL, 4067, 1),
    (1, 'dont', 'dont', NULL, 4068, 1),
    (1, 'alumni', 'alumni', NULL, 4069, 1),
    (1, 'drawing', 'drawing', 'verb', 4070, 1),
    (1, 'candidates', 'candidates', NULL, 4071, 1),
    (1, 'charlotte', 'charlotte', NULL, 4072, 1),
    (1, 'biological', 'biological', 'adj', 4073, 1),
    (1, 'transition', 'transition', 'noun', 4074, 1),
    (1, 'preferences', 'preferences', NULL, 4075, 1),
    (1, 'spy', 'spy', NULL, 4076, 1),
    (1, 'romance', 'romance', 'noun', 4077, 1),
    (1, 'instrument', 'instrument', 'noun', 4078, 1),
    (1, 'bruce', 'bruce', NULL, 4079, 1),
    (1, 'themes', 'themes', NULL, 4080, 1),
    (1, 'bits', 'bits', NULL, 4081, 1),
    (1, 'classification', 'classification', 'noun', 4082, 1),
    (1, 'focused', 'focused', 'verb', 4083, 1),
    (1, 'egypt', 'egypt', NULL, 4084, 1),
    (1, 'physician', 'physician', NULL, 4085, 1),
    (1, 'hollywood', 'hollywood', NULL, 4086, 1),
    (1, 'bargain', 'bargain', NULL, 4087, 1),
    (1, 'wikipedia', 'wikipedia', NULL, 4088, 1),
    (1, 'cellular', 'cellular', NULL, 4089, 1),
    (1, 'norway', 'norway', NULL, 4090, 1),
    (1, 'vermont', 'vermont', NULL, 4091, 1),
    (1, 'blocks', 'blocks', NULL, 4092, 1),
    (1, 'normally', 'normally', 'adv', 4093, 1),
    (1, 'spiritual', 'spiritual', 'adj', 4094, 1),
    (1, 'hunting', 'hunting', 'verb', 4095, 1),
    (1, 'diabetes', 'diabetes', NULL, 4096, 1),
    (1, 'shift', 'shift', NULL, 4097, 1),
    (1, 'chip', 'chip', NULL, 4098, 1),
    (1, 'res', 'res', NULL, 4099, 1),
    (1, 'photographs', 'photographs', NULL, 4100, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'cutting', 'cutting', 'verb', 4101, 1),
    (1, 'wow', 'wow', NULL, 4102, 1),
    (1, 'writers', 'writers', NULL, 4103, 1),
    (1, 'marks', 'marks', NULL, 4104, 1),
    (1, 'flexible', 'flexible', 'adj', 4105, 1),
    (1, 'mapping', 'mapping', 'verb', 4106, 1),
    (1, 'numerous', 'numerous', 'adj', 4107, 1),
    (1, 'relatively', 'relatively', 'adv', 4108, 1),
    (1, 'satisfaction', 'satisfaction', 'noun', 4109, 1),
    (1, 'represents', 'represents', NULL, 4110, 1),
    (1, 'char', 'char', NULL, 4111, 1),
    (1, 'indexed', 'indexed', 'verb', 4112, 1),
    (1, 'pittsburgh', 'pittsburgh', NULL, 4113, 1),
    (1, 'superior', 'superior', NULL, 4114, 1),
    (1, 'preferred', 'preferred', 'verb', 4115, 1),
    (1, 'cartoon', 'cartoon', NULL, 4116, 1),
    (1, 'shots', 'shots', NULL, 4117, 1),
    (1, 'intellectual', 'intellectual', 'adj', 4118, 1),
    (1, 'moore', 'moore', NULL, 4119, 1),
    (1, 'granted', 'granted', 'verb', 4120, 1),
    (1, 'choices', 'choices', NULL, 4121, 1),
    (1, 'carbon', 'carbon', NULL, 4122, 1),
    (1, 'spending', 'spending', 'verb', 4123, 1),
    (1, 'magnetic', 'magnetic', NULL, 4124, 1),
    (1, 'interaction', 'interaction', 'noun', 4125, 1),
    (1, 'effectively', 'effectively', 'adv', 4126, 1),
    (1, 'registry', 'registry', NULL, 4127, 1),
    (1, 'crisis', 'crisis', NULL, 4128, 1),
    (1, 'outlook', 'outlook', NULL, 4129, 1),
    (1, 'massive', 'massive', 'adj', 4130, 1),
    (1, 'denmark', 'denmark', NULL, 4131, 1),
    (1, 'employed', 'employed', 'verb', 4132, 1),
    (1, 'header', 'header', NULL, 4133, 1),
    (1, 'poverty', 'poverty', NULL, 4134, 1),
    (1, 'formed', 'formed', 'verb', 4135, 1),
    (1, 'piano', 'piano', NULL, 4136, 1),
    (1, 'echo', 'echo', NULL, 4137, 1),
    (1, 'que', 'que', NULL, 4138, 1),
    (1, 'grid', 'grid', NULL, 4139, 1),
    (1, 'sheets', 'sheets', NULL, 4140, 1),
    (1, 'patrick', 'patrick', NULL, 4141, 1),
    (1, 'experimental', 'experimental', 'adj', 4142, 1),
    (1, 'puerto', 'puerto', NULL, 4143, 1),
    (1, 'revolution', 'revolution', 'noun', 4144, 1),
    (1, 'consolidation', 'consolidation', 'noun', 4145, 1),
    (1, 'displays', 'displays', NULL, 4146, 1),
    (1, 'plasma', 'plasma', NULL, 4147, 1),
    (1, 'allowing', 'allowing', 'verb', 4148, 1),
    (1, 'earnings', 'earnings', NULL, 4149, 1),
    (1, 'voip', 'voip', NULL, 4150, 1),
    (1, 'mystery', 'mystery', NULL, 4151, 1),
    (1, 'landscape', 'landscape', NULL, 4152, 1),
    (1, 'dependent', 'dependent', NULL, 4153, 1),
    (1, 'mechanical', 'mechanical', 'adj', 4154, 1),
    (1, 'delaware', 'delaware', NULL, 4155, 1),
    (1, 'bidding', 'bidding', 'verb', 4156, 1),
    (1, 'consultants', 'consultants', NULL, 4157, 1),
    (1, 'risks', 'risks', NULL, 4158, 1),
    (1, 'banner', 'banner', NULL, 4159, 1),
    (1, 'applicant', 'applicant', NULL, 4160, 1),
    (1, 'charter', 'charter', NULL, 4161, 1),
    (1, 'fig', 'fig', NULL, 4162, 1),
    (1, 'barbara', 'barbara', NULL, 4163, 1),
    (1, 'cooperation', 'cooperation', 'noun', 4164, 1),
    (1, 'counties', 'counties', NULL, 4165, 1),
    (1, 'acquisition', 'acquisition', 'noun', 4166, 1),
    (1, 'ports', 'ports', NULL, 4167, 1),
    (1, 'implemented', 'implemented', 'verb', 4168, 1),
    (1, 'directories', 'directories', NULL, 4169, 1),
    (1, 'recognized', 'recognized', 'verb', 4170, 1),
    (1, 'blogger', 'blogger', NULL, 4171, 1),
    (1, 'notification', 'notification', 'noun', 4172, 1),
    (1, 'licensing', 'licensing', 'verb', 4173, 1),
    (1, 'stands', 'stands', NULL, 4174, 1),
    (1, 'occurred', 'occurred', 'verb', 4175, 1),
    (1, 'textbooks', 'textbooks', NULL, 4176, 1),
    (1, 'rapid', 'rapid', NULL, 4177, 1),
    (1, 'hairy', 'hairy', NULL, 4178, 1),
    (1, 'diversity', 'diversity', 'noun', 4179, 1),
    (1, 'cleveland', 'cleveland', NULL, 4180, 1),
    (1, 'reverse', 'reverse', NULL, 4181, 1),
    (1, 'deposit', 'deposit', NULL, 4182, 1),
    (1, 'seminar', 'seminar', NULL, 4183, 1),
    (1, 'investments', 'investments', NULL, 4184, 1),
    (1, 'latina', 'latina', NULL, 4185, 1),
    (1, 'nasa', 'nasa', NULL, 4186, 1),
    (1, 'wheels', 'wheels', NULL, 4187, 1),
    (1, 'specify', 'specify', NULL, 4188, 1),
    (1, 'accessibility', 'accessibility', 'noun', 4189, 1),
    (1, 'dutch', 'dutch', NULL, 4190, 1),
    (1, 'sensitive', 'sensitive', 'adj', 4191, 1),
    (1, 'templates', 'templates', NULL, 4192, 1),
    (1, 'formats', 'formats', NULL, 4193, 1),
    (1, 'tab', 'tab', NULL, 4194, 1),
    (1, 'boots', 'boots', NULL, 4195, 1),
    (1, 'holds', 'holds', NULL, 4196, 1),
    (1, 'router', 'router', NULL, 4197, 1),
    (1, 'concrete', 'concrete', NULL, 4198, 1),
    (1, 'editing', 'editing', 'verb', 4199, 1),
    (1, 'poland', 'poland', NULL, 4200, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'folder', 'folder', NULL, 4201, 1),
    (1, 'womens', 'womens', NULL, 4202, 1),
    (1, 'completion', 'completion', 'noun', 4203, 1),
    (1, 'upload', 'upload', NULL, 4204, 1),
    (1, 'pulse', 'pulse', NULL, 4205, 1),
    (1, 'universities', 'universities', NULL, 4206, 1),
    (1, 'technique', 'technique', NULL, 4207, 1),
    (1, 'contractors', 'contractors', NULL, 4208, 1),
    (1, 'voting', 'voting', 'verb', 4209, 1),
    (1, 'courts', 'courts', NULL, 4210, 1),
    (1, 'notices', 'notices', NULL, 4211, 1),
    (1, 'subscriptions', 'subscriptions', NULL, 4212, 1),
    (1, 'calculate', 'calculate', NULL, 4213, 1),
    (1, 'detroit', 'detroit', NULL, 4214, 1),
    (1, 'alexander', 'alexander', NULL, 4215, 1),
    (1, 'broadcast', 'broadcast', NULL, 4216, 1),
    (1, 'converted', 'converted', 'verb', 4217, 1),
    (1, 'metro', 'metro', NULL, 4218, 1),
    (1, 'toshiba', 'toshiba', NULL, 4219, 1),
    (1, 'anniversary', 'anniversary', NULL, 4220, 1),
    (1, 'improvements', 'improvements', NULL, 4221, 1),
    (1, 'strip', 'strip', NULL, 4222, 1),
    (1, 'specification', 'specification', 'noun', 4223, 1),
    (1, 'pearl', 'pearl', NULL, 4224, 1),
    (1, 'accessible', 'accessible', 'adj', 4225, 1),
    (1, 'accessory', 'accessory', NULL, 4226, 1),
    (1, 'resident', 'resident', NULL, 4227, 1),
    (1, 'plot', 'plot', NULL, 4228, 1),
    (1, 'qty', 'qty', NULL, 4229, 1),
    (1, 'airline', 'airline', NULL, 4230, 1),
    (1, 'typically', 'typically', 'adv', 4231, 1),
    (1, 'representation', 'representation', 'noun', 4232, 1),
    (1, 'regard', 'regard', NULL, 4233, 1),
    (1, 'pump', 'pump', NULL, 4234, 1),
    (1, 'exists', 'exists', NULL, 4235, 1),
    (1, 'arrangements', 'arrangements', NULL, 4236, 1),
    (1, 'smooth', 'smooth', NULL, 4237, 1),
    (1, 'conferences', 'conferences', NULL, 4238, 1),
    (1, 'uniprotkb', 'uniprotkb', NULL, 4239, 1),
    (1, 'consumption', 'consumption', 'noun', 4240, 1),
    (1, 'birmingham', 'birmingham', NULL, 4241, 1),
    (1, 'flashing', 'flashing', 'verb', 4242, 1),
    (1, 'narrow', 'narrow', NULL, 4243, 1),
    (1, 'threat', 'threat', NULL, 4244, 1),
    (1, 'surveys', 'surveys', NULL, 4245, 1),
    (1, 'consultant', 'consultant', NULL, 4246, 1),
    (1, 'controller', 'controller', NULL, 4247, 1),
    (1, 'ownership', 'ownership', NULL, 4248, 1),
    (1, 'committees', 'committees', NULL, 4249, 1),
    (1, 'legislative', 'legislative', 'adj', 4250, 1),
    (1, 'researchers', 'researchers', NULL, 4251, 1),
    (1, 'vietnam', 'vietnam', NULL, 4252, 1),
    (1, 'trailer', 'trailer', NULL, 4253, 1),
    (1, 'anne', 'anne', NULL, 4254, 1),
    (1, 'gardens', 'gardens', NULL, 4255, 1),
    (1, 'malaysia', 'malaysia', NULL, 4256, 1),
    (1, 'unsubscribe', 'unsubscribe', NULL, 4257, 1),
    (1, 'antique', 'antique', NULL, 4258, 1),
    (1, 'labels', 'labels', NULL, 4259, 1),
    (1, 'bio', 'bio', NULL, 4260, 1),
    (1, 'molecular', 'molecular', NULL, 4261, 1),
    (1, 'stored', 'stored', 'verb', 4262, 1),
    (1, 'exam', 'exam', NULL, 4263, 1),
    (1, 'logos', 'logos', NULL, 4264, 1),
    (1, 'residence', 'residence', 'noun', 4265, 1),
    (1, 'attorneys', 'attorneys', NULL, 4266, 1),
    (1, 'antiques', 'antiques', NULL, 4267, 1),
    (1, 'density', 'density', 'noun', 4268, 1),
    (1, 'operators', 'operators', NULL, 4269, 1),
    (1, 'sustainable', 'sustainable', 'adj', 4270, 1),
    (1, 'philippines', 'philippines', NULL, 4271, 1),
    (1, 'statistical', 'statistical', 'adj', 4272, 1),
    (1, 'beds', 'beds', NULL, 4273, 1),
    (1, 'innovation', 'innovation', 'noun', 4274, 1),
    (1, 'pcs', 'pcs', NULL, 4275, 1),
    (1, 'employers', 'employers', NULL, 4276, 1),
    (1, 'grey', 'grey', NULL, 4277, 1),
    (1, 'parallel', 'parallel', NULL, 4278, 1),
    (1, 'honda', 'honda', NULL, 4279, 1),
    (1, 'amended', 'amended', 'verb', 4280, 1),
    (1, 'operate', 'operate', NULL, 4281, 1),
    (1, 'bills', 'bills', NULL, 4282, 1),
    (1, 'bold', 'bold', NULL, 4283, 1),
    (1, 'stable', 'stable', 'adj', 4284, 1),
    (1, 'opera', 'opera', NULL, 4285, 1),
    (1, 'definitions', 'definitions', NULL, 4286, 1),
    (1, 'von', 'von', NULL, 4287, 1),
    (1, 'cinema', 'cinema', NULL, 4288, 1),
    (1, 'asset', 'asset', NULL, 4289, 1),
    (1, 'scan', 'scan', NULL, 4290, 1),
    (1, 'elections', 'elections', NULL, 4291, 1),
    (1, 'reaction', 'reaction', 'noun', 4292, 1),
    (1, 'blank', 'blank', NULL, 4293, 1),
    (1, 'enhanced', 'enhanced', 'verb', 4294, 1),
    (1, 'entitled', 'entitled', 'verb', 4295, 1),
    (1, 'severe', 'severe', NULL, 4296, 1),
    (1, 'generate', 'generate', NULL, 4297, 1),
    (1, 'stainless', 'stainless', 'adj', 4298, 1),
    (1, 'newspapers', 'newspapers', NULL, 4299, 1),
    (1, 'hospitals', 'hospitals', NULL, 4300, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'deluxe', 'deluxe', NULL, 4301, 1),
    (1, 'humor', 'humor', NULL, 4302, 1),
    (1, 'aged', 'aged', NULL, 4303, 1),
    (1, 'monitors', 'monitors', NULL, 4304, 1),
    (1, 'exception', 'exception', 'noun', 4305, 1),
    (1, 'duration', 'duration', 'noun', 4306, 1),
    (1, 'bulk', 'bulk', NULL, 4307, 1),
    (1, 'successfully', 'successfully', 'adv', 4308, 1),
    (1, 'indonesia', 'indonesia', NULL, 4309, 1),
    (1, 'pursuant', 'pursuant', NULL, 4310, 1),
    (1, 'sci', 'sci', NULL, 4311, 1),
    (1, 'fabric', 'fabric', NULL, 4312, 1),
    (1, 'edt', 'edt', NULL, 4313, 1),
    (1, 'visits', 'visits', NULL, 4314, 1),
    (1, 'primarily', 'primarily', 'adv', 4315, 1),
    (1, 'domains', 'domains', NULL, 4316, 1),
    (1, 'capabilities', 'capabilities', NULL, 4317, 1),
    (1, 'pmid', 'pmid', NULL, 4318, 1),
    (1, 'contrast', 'contrast', NULL, 4319, 1),
    (1, 'recommendation', 'recommendation', 'noun', 4320, 1),
    (1, 'recruitment', 'recruitment', 'noun', 4321, 1),
    (1, 'sin', 'sin', NULL, 4322, 1),
    (1, 'berlin', 'berlin', NULL, 4323, 1),
    (1, 'organized', 'organized', 'verb', 4324, 1),
    (1, 'para', 'para', NULL, 4325, 1),
    (1, 'siemens', 'siemens', NULL, 4326, 1),
    (1, 'adoption', 'adoption', 'noun', 4327, 1),
    (1, 'improving', 'improving', 'verb', 4328, 1),
    (1, 'capture', 'capture', NULL, 4329, 1),
    (1, 'buffalo', 'buffalo', NULL, 4330, 1),
    (1, 'organisations', 'organisations', NULL, 4331, 1),
    (1, 'explained', 'explained', 'verb', 4332, 1),
    (1, 'seed', 'seed', NULL, 4333, 1),
    (1, 'programmes', 'programmes', NULL, 4334, 1),
    (1, 'desire', 'desire', NULL, 4335, 1),
    (1, 'expertise', 'expertise', NULL, 4336, 1),
    (1, 'mechanism', 'mechanism', NULL, 4337, 1),
    (1, 'camping', 'camping', 'verb', 4338, 1),
    (1, 'jewellery', 'jewellery', NULL, 4339, 1),
    (1, 'meets', 'meets', NULL, 4340, 1),
    (1, 'welfare', 'welfare', NULL, 4341, 1),
    (1, 'peer', 'peer', NULL, 4342, 1),
    (1, 'marked', 'marked', 'verb', 4343, 1),
    (1, 'driven', 'driven', NULL, 4344, 1),
    (1, 'measured', 'measured', 'verb', 4345, 1),
    (1, 'medline', 'medline', NULL, 4346, 1),
    (1, 'agreements', 'agreements', NULL, 4347, 1),
    (1, 'considering', 'considering', 'verb', 4348, 1),
    (1, 'innovative', 'innovative', 'adj', 4349, 1),
    (1, 'marshall', 'marshall', NULL, 4350, 1),
    (1, 'massage', 'massage', NULL, 4351, 1),
    (1, 'rubber', 'rubber', NULL, 4352, 1),
    (1, 'conclusion', 'conclusion', 'noun', 4353, 1),
    (1, 'closing', 'closing', 'verb', 4354, 1),
    (1, 'tampa', 'tampa', NULL, 4355, 1),
    (1, 'legend', 'legend', NULL, 4356, 1),
    (1, 'susan', 'susan', NULL, 4357, 1),
    (1, 'ing', 'ing', NULL, 4358, 1),
    (1, 'adams', 'adams', NULL, 4359, 1),
    (1, 'python', 'python', NULL, 4360, 1),
    (1, 'bang', 'bang', NULL, 4361, 1),
    (1, 'villa', 'villa', NULL, 4362, 1),
    (1, 'bone', 'bone', NULL, 4363, 1),
    (1, 'columns', 'columns', NULL, 4364, 1),
    (1, 'disorders', 'disorders', NULL, 4365, 1),
    (1, 'bugs', 'bugs', NULL, 4366, 1),
    (1, 'collaboration', 'collaboration', 'noun', 4367, 1),
    (1, 'hamilton', 'hamilton', NULL, 4368, 1),
    (1, 'detection', 'detection', 'noun', 4369, 1),
    (1, 'ftp', 'ftp', NULL, 4370, 1),
    (1, 'cookies', 'cookies', NULL, 4371, 1),
    (1, 'inner', 'inner', NULL, 4372, 1),
    (1, 'formation', 'formation', 'noun', 4373, 1),
    (1, 'tutorial', 'tutorial', 'adj', 4374, 1),
    (1, 'med', 'med', NULL, 4375, 1),
    (1, 'engineers', 'engineers', NULL, 4376, 1),
    (1, 'entity', 'entity', 'noun', 4377, 1),
    (1, 'cruises', 'cruises', NULL, 4378, 1),
    (1, 'holder', 'holder', NULL, 4379, 1),
    (1, 'proposals', 'proposals', NULL, 4380, 1),
    (1, 'moderator', 'moderator', NULL, 4381, 1),
    (1, 'tutorials', 'tutorials', NULL, 4382, 1),
    (1, 'settlement', 'settlement', 'noun', 4383, 1),
    (1, 'portugal', 'portugal', 'adj', 4384, 1),
    (1, 'lawrence', 'lawrence', 'noun', 4385, 1),
    (1, 'roman', 'roman', NULL, 4386, 1),
    (1, 'duties', 'duties', NULL, 4387, 1),
    (1, 'valuable', 'valuable', 'adj', 4388, 1),
    (1, 'tone', 'tone', NULL, 4389, 1),
    (1, 'collectables', 'collectables', NULL, 4390, 1),
    (1, 'ethics', 'ethics', NULL, 4391, 1),
    (1, 'dragon', 'dragon', NULL, 4392, 1),
    (1, 'heating', 'heating', 'verb', 4393, 1),
    (1, 'wing', 'wing', NULL, 4394, 1),
    (1, 'governments', 'governments', NULL, 4395, 1),
    (1, 'purchasing', 'purchasing', 'verb', 4396, 1),
    (1, 'scripts', 'scripts', NULL, 4397, 1),
    (1, 'abc', 'abc', NULL, 4398, 1),
    (1, 'stereo', 'stereo', NULL, 4399, 1),
    (1, 'appointed', 'appointed', 'verb', 4400, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'dealing', 'dealing', 'verb', 4401, 1),
    (1, 'commit', 'commit', NULL, 4402, 1),
    (1, 'operational', 'operational', 'adj', 4403, 1),
    (1, 'rail', 'rail', NULL, 4404, 1),
    (1, 'airlines', 'airlines', NULL, 4405, 1),
    (1, 'liberal', 'liberal', 'adj', 4406, 1),
    (1, 'livecam', 'livecam', NULL, 4407, 1),
    (1, 'jay', 'jay', NULL, 4408, 1),
    (1, 'trips', 'trips', NULL, 4409, 1),
    (1, 'gap', 'gap', NULL, 4410, 1),
    (1, 'sides', 'sides', NULL, 4411, 1),
    (1, 'tube', 'tube', NULL, 4412, 1),
    (1, 'corresponding', 'corresponding', 'verb', 4413, 1),
    (1, 'descriptions', 'descriptions', NULL, 4414, 1),
    (1, 'cache', 'cache', NULL, 4415, 1),
    (1, 'belt', 'belt', NULL, 4416, 1),
    (1, 'jacket', 'jacket', NULL, 4417, 1),
    (1, 'determination', 'determination', 'noun', 4418, 1),
    (1, 'animation', 'animation', 'noun', 4419, 1),
    (1, 'oracle', 'oracle', NULL, 4420, 1),
    (1, 'matthew', 'matthew', NULL, 4421, 1),
    (1, 'lease', 'lease', NULL, 4422, 1),
    (1, 'productions', 'productions', NULL, 4423, 1),
    (1, 'aviation', 'aviation', 'noun', 4424, 1),
    (1, 'hobbies', 'hobbies', NULL, 4425, 1),
    (1, 'excess', 'excess', NULL, 4426, 1),
    (1, 'disaster', 'disaster', NULL, 4427, 1),
    (1, 'console', 'console', NULL, 4428, 1),
    (1, 'commands', 'commands', NULL, 4429, 1),
    (1, 'telecommunications', 'telecommunications', NULL, 4430, 1),
    (1, 'instructor', 'instructor', NULL, 4431, 1),
    (1, 'achieved', 'achieved', 'verb', 4432, 1),
    (1, 'injuries', 'injuries', NULL, 4433, 1),
    (1, 'shipped', 'shipped', 'verb', 4434, 1),
    (1, 'seats', 'seats', NULL, 4435, 1),
    (1, 'approaches', 'approaches', NULL, 4436, 1),
    (1, 'biz', 'biz', NULL, 4437, 1),
    (1, 'voltage', 'voltage', NULL, 4438, 1),
    (1, 'anthony', 'anthony', NULL, 4439, 1),
    (1, 'nintendo', 'nintendo', NULL, 4440, 1),
    (1, 'loading', 'loading', 'verb', 4441, 1),
    (1, 'stamps', 'stamps', NULL, 4442, 1),
    (1, 'appeared', 'appeared', 'verb', 4443, 1),
    (1, 'franklin', 'franklin', NULL, 4444, 1),
    (1, 'angle', 'angle', NULL, 4445, 1),
    (1, 'rob', 'rob', NULL, 4446, 1),
    (1, 'vinyl', 'vinyl', NULL, 4447, 1),
    (1, 'highlights', 'highlights', NULL, 4448, 1),
    (1, 'mining', 'mining', 'verb', 4449, 1),
    (1, 'designers', 'designers', NULL, 4450, 1),
    (1, 'melbourne', 'melbourne', NULL, 4451, 1),
    (1, 'ongoing', 'ongoing', 'verb', 4452, 1),
    (1, 'imaging', 'imaging', 'verb', 4453, 1),
    (1, 'betting', 'betting', 'verb', 4454, 1),
    (1, 'scientists', 'scientists', NULL, 4455, 1),
    (1, 'liberty', 'liberty', NULL, 4456, 1),
    (1, 'wyoming', 'wyoming', 'verb', 4457, 1),
    (1, 'blackjack', 'blackjack', NULL, 4458, 1),
    (1, 'argentina', 'argentina', NULL, 4459, 1),
    (1, 'era', 'era', NULL, 4460, 1),
    (1, 'convert', 'convert', NULL, 4461, 1),
    (1, 'possibility', 'possibility', 'noun', 4462, 1),
    (1, 'analyst', 'analyst', NULL, 4463, 1),
    (1, 'commissioner', 'commissioner', NULL, 4464, 1),
    (1, 'garage', 'garage', NULL, 4465, 1),
    (1, 'reliability', 'reliability', 'noun', 4466, 1),
    (1, 'thongs', 'thongs', NULL, 4467, 1),
    (1, 'gcc', 'gcc', NULL, 4468, 1),
    (1, 'respectively', 'respectively', 'adv', 4469, 1),
    (1, 'volunteers', 'volunteers', NULL, 4470, 1),
    (1, 'attachment', 'attachment', 'noun', 4471, 1),
    (1, 'ringtone', 'ringtone', NULL, 4472, 1),
    (1, 'finland', 'finland', NULL, 4473, 1),
    (1, 'morgan', 'morgan', NULL, 4474, 1),
    (1, 'derived', 'derived', 'verb', 4475, 1),
    (1, 'oriented', 'oriented', 'verb', 4476, 1),
    (1, 'eagle', 'eagle', NULL, 4477, 1),
    (1, 'desktops', 'desktops', NULL, 4478, 1),
    (1, 'columbus', 'columbus', NULL, 4479, 1),
    (1, 'prayer', 'prayer', NULL, 4480, 1),
    (1, 'appointment', 'appointment', 'noun', 4481, 1),
    (1, 'workshops', 'workshops', NULL, 4482, 1),
    (1, 'hurricane', 'hurricane', NULL, 4483, 1),
    (1, 'postage', 'postage', NULL, 4484, 1),
    (1, 'producer', 'producer', NULL, 4485, 1),
    (1, 'represented', 'represented', 'verb', 4486, 1),
    (1, 'mortgages', 'mortgages', NULL, 4487, 1),
    (1, 'dial', 'dial', 'adj', 4488, 1),
    (1, 'responsibilities', 'responsibilities', NULL, 4489, 1),
    (1, 'comic', 'comic', NULL, 4490, 1),
    (1, 'jet', 'jet', NULL, 4491, 1),
    (1, 'productivity', 'productivity', 'noun', 4492, 1),
    (1, 'investors', 'investors', NULL, 4493, 1),
    (1, 'crown', 'crown', NULL, 4494, 1),
    (1, 'par', 'par', NULL, 4495, 1),
    (1, 'underground', 'underground', NULL, 4496, 1),
    (1, 'diagnosis', 'diagnosis', NULL, 4497, 1),
    (1, 'maker', 'maker', NULL, 4498, 1),
    (1, 'crack', 'crack', NULL, 4499, 1),
    (1, 'principle', 'principle', NULL, 4500, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'picks', 'picks', NULL, 4501, 1),
    (1, 'vacations', 'vacations', NULL, 4502, 1),
    (1, 'semester', 'semester', NULL, 4503, 1),
    (1, 'calculated', 'calculated', 'verb', 4504, 1),
    (1, 'fetish', 'fetish', 'adj', 4505, 1),
    (1, 'applies', 'applies', NULL, 4506, 1),
    (1, 'casinos', 'casinos', NULL, 4507, 1),
    (1, 'appearance', 'appearance', 'noun', 4508, 1),
    (1, 'apache', 'apache', NULL, 4509, 1),
    (1, 'filters', 'filters', NULL, 4510, 1),
    (1, 'incorporated', 'incorporated', 'verb', 4511, 1),
    (1, 'craft', 'craft', NULL, 4512, 1),
    (1, 'notebooks', 'notebooks', NULL, 4513, 1),
    (1, 'lounge', 'lounge', NULL, 4514, 1),
    (1, 'algorithm', 'algorithm', NULL, 4515, 1),
    (1, 'semi', 'semi', NULL, 4516, 1),
    (1, 'coins', 'coins', NULL, 4517, 1),
    (1, 'gross', 'gross', NULL, 4518, 1),
    (1, 'strongly', 'strongly', 'adv', 4519, 1),
    (1, 'cafe', 'cafe', NULL, 4520, 1),
    (1, 'valentine', 'valentine', NULL, 4521, 1),
    (1, 'hilton', 'hilton', NULL, 4522, 1),
    (1, 'ken', 'ken', NULL, 4523, 1),
    (1, 'proteins', 'proteins', NULL, 4524, 1),
    (1, 'horror', 'horror', NULL, 4525, 1),
    (1, 'exp', 'exp', NULL, 4526, 1),
    (1, 'capable', 'capable', 'adj', 4527, 1),
    (1, 'douglas', 'douglas', NULL, 4528, 1),
    (1, 'debian', 'debian', NULL, 4529, 1),
    (1, 'involving', 'involving', 'verb', 4530, 1),
    (1, 'pen', 'pen', NULL, 4531, 1),
    (1, 'investing', 'investing', 'verb', 4532, 1),
    (1, 'christopher', 'christopher', NULL, 4533, 1),
    (1, 'admission', 'admission', 'noun', 4534, 1),
    (1, 'epson', 'epson', NULL, 4535, 1),
    (1, 'shoe', 'shoe', NULL, 4536, 1),
    (1, 'elected', 'elected', 'verb', 4537, 1),
    (1, 'carrying', 'carrying', 'verb', 4538, 1),
    (1, 'victory', 'victory', NULL, 4539, 1),
    (1, 'sand', 'sand', NULL, 4540, 1),
    (1, 'madison', 'madison', NULL, 4541, 1),
    (1, 'terrorism', 'terrorism', NULL, 4542, 1),
    (1, 'editions', 'editions', NULL, 4543, 1),
    (1, 'cpu', 'cpu', NULL, 4544, 1),
    (1, 'mainly', 'mainly', 'adv', 4545, 1),
    (1, 'ethnic', 'ethnic', NULL, 4546, 1),
    (1, 'parliament', 'parliament', 'noun', 4547, 1),
    (1, 'actor', 'actor', NULL, 4548, 1),
    (1, 'seal', 'seal', 'adj', 4549, 1),
    (1, 'situations', 'situations', NULL, 4550, 1),
    (1, 'fifth', 'fifth', NULL, 4551, 1),
    (1, 'allocated', 'allocated', 'verb', 4552, 1),
    (1, 'citizen', 'citizen', NULL, 4553, 1),
    (1, 'vertical', 'vertical', 'adj', 4554, 1),
    (1, 'corrections', 'corrections', NULL, 4555, 1),
    (1, 'structural', 'structural', 'adj', 4556, 1),
    (1, 'municipal', 'municipal', 'adj', 4557, 1),
    (1, 'describes', 'describes', NULL, 4558, 1),
    (1, 'prize', 'prize', NULL, 4559, 1),
    (1, 'occurs', 'occurs', NULL, 4560, 1),
    (1, 'jon', 'jon', NULL, 4561, 1),
    (1, 'absolute', 'absolute', NULL, 4562, 1),
    (1, 'disabilities', 'disabilities', NULL, 4563, 1),
    (1, 'consists', 'consists', NULL, 4564, 1),
    (1, 'anytime', 'anytime', NULL, 4565, 1),
    (1, 'substance', 'substance', 'noun', 4566, 1),
    (1, 'prohibited', 'prohibited', 'verb', 4567, 1),
    (1, 'addressed', 'addressed', 'verb', 4568, 1),
    (1, 'pipe', 'pipe', NULL, 4569, 1),
    (1, 'guardian', 'guardian', NULL, 4570, 1),
    (1, 'lecture', 'lecture', NULL, 4571, 1),
    (1, 'simulation', 'simulation', 'noun', 4572, 1),
    (1, 'layout', 'layout', NULL, 4573, 1),
    (1, 'initiatives', 'initiatives', NULL, 4574, 1),
    (1, 'concentration', 'concentration', 'noun', 4575, 1),
    (1, 'classics', 'classics', NULL, 4576, 1),
    (1, 'lbs', 'lbs', NULL, 4577, 1),
    (1, 'interpretation', 'interpretation', 'noun', 4578, 1),
    (1, 'lol', 'lol', NULL, 4579, 1),
    (1, 'deck', 'deck', NULL, 4580, 1),
    (1, 'wayne', 'wayne', NULL, 4581, 1),
    (1, 'donate', 'donate', NULL, 4582, 1),
    (1, 'bankruptcy', 'bankruptcy', NULL, 4583, 1),
    (1, 'worker', 'worker', NULL, 4584, 1),
    (1, 'optimization', 'optimization', 'noun', 4585, 1),
    (1, 'substances', 'substances', NULL, 4586, 1),
    (1, 'wings', 'wings', NULL, 4587, 1),
    (1, 'breaks', 'breaks', NULL, 4588, 1),
    (1, 'genetic', 'genetic', NULL, 4589, 1),
    (1, 'restrictions', 'restrictions', NULL, 4590, 1),
    (1, 'participating', 'participating', 'verb', 4591, 1),
    (1, 'waters', 'waters', NULL, 4592, 1),
    (1, 'thin', 'thin', NULL, 4593, 1),
    (1, 'exhibition', 'exhibition', 'noun', 4594, 1),
    (1, 'ridge', 'ridge', NULL, 4595, 1),
    (1, 'cabinet', 'cabinet', NULL, 4596, 1),
    (1, 'modem', 'modem', NULL, 4597, 1),
    (1, 'harris', 'harris', NULL, 4598, 1),
    (1, 'mph', 'mph', NULL, 4599, 1),
    (1, 'dose', 'dose', NULL, 4600, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'evaluate', 'evaluate', NULL, 4601, 1),
    (1, 'tiffany', 'tiffany', NULL, 4602, 1),
    (1, 'tropical', 'tropical', 'adj', 4603, 1),
    (1, 'collect', 'collect', NULL, 4604, 1),
    (1, 'composition', 'composition', 'noun', 4605, 1),
    (1, 'toyota', 'toyota', NULL, 4606, 1),
    (1, 'nationwide', 'nationwide', NULL, 4607, 1),
    (1, 'vector', 'vector', NULL, 4608, 1),
    (1, 'shaved', 'shaved', 'verb', 4609, 1),
    (1, 'buffer', 'buffer', NULL, 4610, 1),
    (1, 'purple', 'purple', NULL, 4611, 1),
    (1, 'existence', 'existence', 'noun', 4612, 1),
    (1, 'commentary', 'commentary', NULL, 4613, 1),
    (1, 'limousines', 'limousines', NULL, 4614, 1),
    (1, 'developments', 'developments', NULL, 4615, 1),
    (1, 'def', 'def', NULL, 4616, 1),
    (1, 'immigration', 'immigration', 'noun', 4617, 1),
    (1, 'destinations', 'destinations', NULL, 4618, 1),
    (1, 'lets', 'lets', NULL, 4619, 1),
    (1, 'mutual', 'mutual', 'adj', 4620, 1),
    (1, 'pipeline', 'pipeline', NULL, 4621, 1),
    (1, 'necessarily', 'necessarily', 'adv', 4622, 1),
    (1, 'syntax', 'syntax', NULL, 4623, 1),
    (1, 'attribute', 'attribute', NULL, 4624, 1),
    (1, 'skill', 'skill', NULL, 4625, 1),
    (1, 'chairs', 'chairs', NULL, 4626, 1),
    (1, 'everyday', 'everyday', NULL, 4627, 1),
    (1, 'surrounding', 'surrounding', 'verb', 4628, 1),
    (1, 'mountains', 'mountains', NULL, 4629, 1),
    (1, 'moves', 'moves', NULL, 4630, 1),
    (1, 'popularity', 'popularity', 'noun', 4631, 1),
    (1, 'inquiry', 'inquiry', NULL, 4632, 1),
    (1, 'ethernet', 'ethernet', NULL, 4633, 1),
    (1, 'exhibit', 'exhibit', NULL, 4634, 1),
    (1, 'trend', 'trend', NULL, 4635, 1),
    (1, 'sierra', 'sierra', NULL, 4636, 1),
    (1, 'visible', 'visible', 'adj', 4637, 1),
    (1, 'cats', 'cats', NULL, 4638, 1),
    (1, 'desert', 'desert', NULL, 4639, 1),
    (1, 'postposted', 'postposted', 'verb', 4640, 1),
    (1, 'oldest', 'oldest', NULL, 4641, 1),
    (1, 'rhode', 'rhode', NULL, 4642, 1),
    (1, 'nba', 'nba', NULL, 4643, 1),
    (1, 'coordinator', 'coordinator', NULL, 4644, 1),
    (1, 'mercury', 'mercury', NULL, 4645, 1),
    (1, 'steven', 'steven', NULL, 4646, 1),
    (1, 'handbook', 'handbook', NULL, 4647, 1),
    (1, 'greg', 'greg', NULL, 4648, 1),
    (1, 'navigate', 'navigate', NULL, 4649, 1),
    (1, 'summit', 'summit', NULL, 4650, 1),
    (1, 'epa', 'epa', NULL, 4651, 1),
    (1, 'spaces', 'spaces', NULL, 4652, 1),
    (1, 'fundamental', 'fundamental', 'adj', 4653, 1),
    (1, 'coupons', 'coupons', NULL, 4654, 1),
    (1, 'somewhat', 'somewhat', NULL, 4655, 1),
    (1, 'receiver', 'receiver', NULL, 4656, 1),
    (1, 'substantial', 'substantial', 'adj', 4657, 1),
    (1, 'progressive', 'progressive', 'adj', 4658, 1),
    (1, 'cialis', 'cialis', NULL, 4659, 1),
    (1, 'boats', 'boats', NULL, 4660, 1),
    (1, 'glance', 'glance', 'noun', 4661, 1),
    (1, 'scottish', 'scottish', 'adj', 4662, 1),
    (1, 'championship', 'championship', NULL, 4663, 1),
    (1, 'arcade', 'arcade', NULL, 4664, 1),
    (1, 'richmond', 'richmond', NULL, 4665, 1),
    (1, 'sacramento', 'sacramento', NULL, 4666, 1),
    (1, 'ron', 'ron', NULL, 4667, 1),
    (1, 'russell', 'russell', NULL, 4668, 1),
    (1, 'fiber', 'fiber', NULL, 4669, 1),
    (1, 'depression', 'depression', 'noun', 4670, 1),
    (1, 'graph', 'graph', NULL, 4671, 1),
    (1, 'covering', 'covering', 'verb', 4672, 1),
    (1, 'platinum', 'platinum', NULL, 4673, 1),
    (1, 'judgment', 'judgment', 'noun', 4674, 1),
    (1, 'bedrooms', 'bedrooms', NULL, 4675, 1),
    (1, 'talks', 'talks', NULL, 4676, 1),
    (1, 'filing', 'filing', 'verb', 4677, 1),
    (1, 'foster', 'foster', NULL, 4678, 1),
    (1, 'modeling', 'modeling', 'verb', 4679, 1),
    (1, 'passing', 'passing', 'verb', 4680, 1),
    (1, 'awarded', 'awarded', 'verb', 4681, 1),
    (1, 'testimonials', 'testimonials', NULL, 4682, 1),
    (1, 'trials', 'trials', NULL, 4683, 1),
    (1, 'tissue', 'tissue', NULL, 4684, 1),
    (1, 'memorabilia', 'memorabilia', NULL, 4685, 1),
    (1, 'clinton', 'clinton', NULL, 4686, 1),
    (1, 'masters', 'masters', NULL, 4687, 1),
    (1, 'bonds', 'bonds', NULL, 4688, 1),
    (1, 'cartridge', 'cartridge', NULL, 4689, 1),
    (1, 'alberta', 'alberta', NULL, 4690, 1),
    (1, 'explanation', 'explanation', 'noun', 4691, 1),
    (1, 'folk', 'folk', NULL, 4692, 1),
    (1, 'commons', 'commons', NULL, 4693, 1),
    (1, 'cincinnati', 'cincinnati', NULL, 4694, 1),
    (1, 'subsection', 'subsection', 'noun', 4695, 1),
    (1, 'fraud', 'fraud', NULL, 4696, 1),
    (1, 'electricity', 'electricity', 'noun', 4697, 1),
    (1, 'permitted', 'permitted', 'verb', 4698, 1),
    (1, 'spectrum', 'spectrum', NULL, 4699, 1),
    (1, 'arrival', 'arrival', 'adj', 4700, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'pottery', 'pottery', NULL, 4701, 1),
    (1, 'emphasis', 'emphasis', NULL, 4702, 1),
    (1, 'aspect', 'aspect', NULL, 4703, 1),
    (1, 'workplace', 'workplace', NULL, 4704, 1),
    (1, 'mexican', 'mexican', NULL, 4705, 1),
    (1, 'confirmed', 'confirmed', 'verb', 4706, 1),
    (1, 'counts', 'counts', NULL, 4707, 1),
    (1, 'priced', 'priced', 'verb', 4708, 1),
    (1, 'wallpapers', 'wallpapers', NULL, 4709, 1),
    (1, 'hist', 'hist', NULL, 4710, 1),
    (1, 'desired', 'desired', 'verb', 4711, 1),
    (1, 'inter', 'inter', NULL, 4712, 1),
    (1, 'assumes', 'assumes', NULL, 4713, 1),
    (1, 'heights', 'heights', NULL, 4714, 1),
    (1, 'shadow', 'shadow', NULL, 4715, 1),
    (1, 'riding', 'riding', 'verb', 4716, 1),
    (1, 'infection', 'infection', 'noun', 4717, 1),
    (1, 'firefox', 'firefox', NULL, 4718, 1),
    (1, 'expense', 'expense', NULL, 4719, 1),
    (1, 'grove', 'grove', NULL, 4720, 1),
    (1, 'eligibility', 'eligibility', 'noun', 4721, 1),
    (1, 'venture', 'venture', NULL, 4722, 1),
    (1, 'clinic', 'clinic', NULL, 4723, 1),
    (1, 'korean', 'korean', NULL, 4724, 1),
    (1, 'healing', 'healing', 'verb', 4725, 1),
    (1, 'mall', 'mall', NULL, 4726, 1),
    (1, 'entering', 'entering', 'verb', 4727, 1),
    (1, 'packet', 'packet', NULL, 4728, 1),
    (1, 'spray', 'spray', NULL, 4729, 1),
    (1, 'studios', 'studios', NULL, 4730, 1),
    (1, 'involvement', 'involvement', 'noun', 4731, 1),
    (1, 'buttons', 'buttons', NULL, 4732, 1),
    (1, 'placement', 'placement', 'noun', 4733, 1),
    (1, 'observations', 'observations', NULL, 4734, 1),
    (1, 'funded', 'funded', 'verb', 4735, 1),
    (1, 'thompson', 'thompson', NULL, 4736, 1),
    (1, 'winners', 'winners', NULL, 4737, 1),
    (1, 'extend', 'extend', NULL, 4738, 1),
    (1, 'roads', 'roads', NULL, 4739, 1),
    (1, 'subsequent', 'subsequent', NULL, 4740, 1),
    (1, 'pat', 'pat', NULL, 4741, 1),
    (1, 'dublin', 'dublin', NULL, 4742, 1),
    (1, 'rolling', 'rolling', 'verb', 4743, 1),
    (1, 'motorcycle', 'motorcycle', NULL, 4744, 1),
    (1, 'yard', 'yard', NULL, 4745, 1),
    (1, 'disclosure', 'disclosure', NULL, 4746, 1),
    (1, 'establishment', 'establishment', 'noun', 4747, 1),
    (1, 'nelson', 'nelson', NULL, 4748, 1),
    (1, 'creates', 'creates', NULL, 4749, 1),
    (1, 'faces', 'faces', NULL, 4750, 1),
    (1, 'tourist', 'tourist', NULL, 4751, 1),
    (1, 'sean', 'sean', NULL, 4752, 1),
    (1, 'adequate', 'adequate', NULL, 4753, 1),
    (1, 'senator', 'senator', NULL, 4754, 1),
    (1, 'yield', 'yield', NULL, 4755, 1),
    (1, 'presentations', 'presentations', NULL, 4756, 1),
    (1, 'grades', 'grades', NULL, 4757, 1),
    (1, 'cartoons', 'cartoons', NULL, 4758, 1),
    (1, 'pour', 'pour', NULL, 4759, 1),
    (1, 'digest', 'digest', NULL, 4760, 1),
    (1, 'reg', 'reg', NULL, 4761, 1),
    (1, 'lodging', 'lodging', 'verb', 4762, 1),
    (1, 'tion', 'tion', 'noun', 4763, 1),
    (1, 'dust', 'dust', NULL, 4764, 1),
    (1, 'hence', 'hence', 'noun', 4765, 1),
    (1, 'wiki', 'wiki', NULL, 4766, 1),
    (1, 'entirely', 'entirely', 'adv', 4767, 1),
    (1, 'replaced', 'replaced', 'verb', 4768, 1),
    (1, 'radar', 'radar', NULL, 4769, 1),
    (1, 'rescue', 'rescue', NULL, 4770, 1),
    (1, 'undergraduate', 'undergraduate', NULL, 4771, 1),
    (1, 'losses', 'losses', NULL, 4772, 1),
    (1, 'combat', 'combat', NULL, 4773, 1),
    (1, 'reducing', 'reducing', 'verb', 4774, 1),
    (1, 'occupation', 'occupation', 'noun', 4775, 1),
    (1, 'lakes', 'lakes', NULL, 4776, 1),
    (1, 'donations', 'donations', NULL, 4777, 1),
    (1, 'associations', 'associations', NULL, 4778, 1),
    (1, 'citysearch', 'citysearch', NULL, 4779, 1),
    (1, 'closely', 'closely', 'adv', 4780, 1),
    (1, 'radiation', 'radiation', 'noun', 4781, 1),
    (1, 'diary', 'diary', NULL, 4782, 1),
    (1, 'kings', 'kings', NULL, 4783, 1),
    (1, 'kent', 'kent', NULL, 4784, 1),
    (1, 'adds', 'adds', NULL, 4785, 1),
    (1, 'nsw', 'nsw', NULL, 4786, 1),
    (1, 'ear', 'ear', NULL, 4787, 1),
    (1, 'flags', 'flags', NULL, 4788, 1),
    (1, 'pci', 'pci', NULL, 4789, 1),
    (1, 'baker', 'baker', NULL, 4790, 1),
    (1, 'launched', 'launched', 'verb', 4791, 1),
    (1, 'elsewhere', 'elsewhere', NULL, 4792, 1),
    (1, 'pollution', 'pollution', 'noun', 4793, 1),
    (1, 'conservative', 'conservative', 'adj', 4794, 1),
    (1, 'guestbook', 'guestbook', NULL, 4795, 1),
    (1, 'shock', 'shock', NULL, 4796, 1),
    (1, 'effectiveness', 'effectiveness', 'noun', 4797, 1),
    (1, 'abroad', 'abroad', NULL, 4798, 1),
    (1, 'ebony', 'ebony', NULL, 4799, 1),
    (1, 'ward', 'ward', NULL, 4800, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'drawn', 'drawn', NULL, 4801, 1),
    (1, 'arthur', 'arthur', NULL, 4802, 1),
    (1, 'ian', 'ian', NULL, 4803, 1),
    (1, 'visited', 'visited', 'verb', 4804, 1),
    (1, 'walker', 'walker', NULL, 4805, 1),
    (1, 'demonstrate', 'demonstrate', NULL, 4806, 1),
    (1, 'atmosphere', 'atmosphere', NULL, 4807, 1),
    (1, 'suggests', 'suggests', NULL, 4808, 1),
    (1, 'beast', 'beast', NULL, 4809, 1),
    (1, 'operated', 'operated', 'verb', 4810, 1),
    (1, 'experiment', 'experiment', 'noun', 4811, 1),
    (1, 'targets', 'targets', NULL, 4812, 1),
    (1, 'overseas', 'overseas', NULL, 4813, 1),
    (1, 'purchases', 'purchases', NULL, 4814, 1),
    (1, 'dodge', 'dodge', NULL, 4815, 1),
    (1, 'counsel', 'counsel', NULL, 4816, 1),
    (1, 'federation', 'federation', 'noun', 4817, 1),
    (1, 'pizza', 'pizza', NULL, 4818, 1),
    (1, 'yards', 'yards', NULL, 4819, 1),
    (1, 'assignment', 'assignment', 'noun', 4820, 1),
    (1, 'chemicals', 'chemicals', NULL, 4821, 1),
    (1, 'gordon', 'gordon', NULL, 4822, 1),
    (1, 'mod', 'mod', NULL, 4823, 1),
    (1, 'farmers', 'farmers', NULL, 4824, 1),
    (1, 'queries', 'queries', NULL, 4825, 1),
    (1, 'bmw', 'bmw', NULL, 4826, 1),
    (1, 'ukraine', 'ukraine', NULL, 4827, 1),
    (1, 'absence', 'absence', 'noun', 4828, 1),
    (1, 'nearest', 'nearest', NULL, 4829, 1),
    (1, 'cluster', 'cluster', NULL, 4830, 1),
    (1, 'vendors', 'vendors', NULL, 4831, 1),
    (1, 'whereas', 'whereas', NULL, 4832, 1),
    (1, 'yoga', 'yoga', NULL, 4833, 1),
    (1, 'serves', 'serves', NULL, 4834, 1),
    (1, 'lamp', 'lamp', NULL, 4835, 1),
    (1, 'rico', 'rico', NULL, 4836, 1),
    (1, 'partial', 'partial', 'adj', 4837, 1),
    (1, 'shoppers', 'shoppers', NULL, 4838, 1),
    (1, 'phil', 'phil', NULL, 4839, 1),
    (1, 'couples', 'couples', NULL, 4840, 1),
    (1, 'nashville', 'nashville', NULL, 4841, 1),
    (1, 'ranking', 'ranking', 'verb', 4842, 1),
    (1, 'jokes', 'jokes', NULL, 4843, 1),
    (1, 'cst', 'cst', NULL, 4844, 1),
    (1, 'ceo', 'ceo', NULL, 4845, 1),
    (1, 'simpson', 'simpson', NULL, 4846, 1),
    (1, 'twiki', 'twiki', NULL, 4847, 1),
    (1, 'sublime', 'sublime', NULL, 4848, 1),
    (1, 'counseling', 'counseling', 'verb', 4849, 1),
    (1, 'palace', 'palace', NULL, 4850, 1),
    (1, 'acceptable', 'acceptable', 'adj', 4851, 1),
    (1, 'satisfied', 'satisfied', 'verb', 4852, 1),
    (1, 'wins', 'wins', NULL, 4853, 1),
    (1, 'measurements', 'measurements', NULL, 4854, 1),
    (1, 'verify', 'verify', NULL, 4855, 1),
    (1, 'globe', 'globe', NULL, 4856, 1),
    (1, 'trusted', 'trusted', 'verb', 4857, 1),
    (1, 'copper', 'copper', NULL, 4858, 1),
    (1, 'milwaukee', 'milwaukee', NULL, 4859, 1),
    (1, 'rack', 'rack', NULL, 4860, 1),
    (1, 'medication', 'medication', 'noun', 4861, 1),
    (1, 'warehouse', 'warehouse', NULL, 4862, 1),
    (1, 'shareware', 'shareware', NULL, 4863, 1),
    (1, 'rep', 'rep', NULL, 4864, 1),
    (1, 'dicke', 'dicke', NULL, 4865, 1),
    (1, 'kerry', 'kerry', NULL, 4866, 1),
    (1, 'receipt', 'receipt', NULL, 4867, 1),
    (1, 'ordinary', 'ordinary', NULL, 4868, 1),
    (1, 'violation', 'violation', 'noun', 4869, 1),
    (1, 'configure', 'configure', NULL, 4870, 1),
    (1, 'stability', 'stability', 'noun', 4871, 1),
    (1, 'mit', 'mit', NULL, 4872, 1),
    (1, 'applying', 'applying', 'verb', 4873, 1),
    (1, 'southwest', 'southwest', NULL, 4874, 1),
    (1, 'pride', 'pride', NULL, 4875, 1),
    (1, 'institutional', 'institutional', 'adj', 4876, 1),
    (1, 'expectations', 'expectations', NULL, 4877, 1),
    (1, 'independence', 'independence', 'noun', 4878, 1),
    (1, 'reporter', 'reporter', NULL, 4879, 1),
    (1, 'metabolism', 'metabolism', NULL, 4880, 1),
    (1, 'keith', 'keith', NULL, 4881, 1),
    (1, 'champion', 'champion', NULL, 4882, 1),
    (1, 'cloudy', 'cloudy', NULL, 4883, 1),
    (1, 'linda', 'linda', NULL, 4884, 1),
    (1, 'ross', 'ross', NULL, 4885, 1),
    (1, 'chile', 'chile', NULL, 4886, 1),
    (1, 'solo', 'solo', NULL, 4887, 1),
    (1, 'sentence', 'sentence', 'noun', 4888, 1),
    (1, 'ignore', 'ignore', NULL, 4889, 1),
    (1, 'uniform', 'uniform', NULL, 4890, 1),
    (1, 'excellence', 'excellence', 'noun', 4891, 1),
    (1, 'wealth', 'wealth', NULL, 4892, 1),
    (1, 'tall', 'tall', NULL, 4893, 1),
    (1, 'vacuum', 'vacuum', NULL, 4894, 1),
    (1, 'attributes', 'attributes', NULL, 4895, 1),
    (1, 'brass', 'brass', NULL, 4896, 1),
    (1, 'writes', 'writes', NULL, 4897, 1),
    (1, 'plaza', 'plaza', NULL, 4898, 1),
    (1, 'pdas', 'pdas', NULL, 4899, 1),
    (1, 'outcomes', 'outcomes', NULL, 4900, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'survival', 'survival', 'adj', 4901, 1),
    (1, 'quest', 'quest', NULL, 4902, 1),
    (1, 'publish', 'publish', 'adj', 4903, 1),
    (1, 'sri', 'sri', NULL, 4904, 1),
    (1, 'screening', 'screening', 'verb', 4905, 1),
    (1, 'toe', 'toe', NULL, 4906, 1),
    (1, 'thumbnail', 'thumbnail', NULL, 4907, 1),
    (1, 'trans', 'trans', NULL, 4908, 1),
    (1, 'jonathan', 'jonathan', NULL, 4909, 1),
    (1, 'nova', 'nova', NULL, 4910, 1),
    (1, 'lifetime', 'lifetime', NULL, 4911, 1),
    (1, 'api', 'api', NULL, 4912, 1),
    (1, 'pioneer', 'pioneer', NULL, 4913, 1),
    (1, 'booty', 'booty', NULL, 4914, 1),
    (1, 'acrobat', 'acrobat', NULL, 4915, 1),
    (1, 'plates', 'plates', NULL, 4916, 1),
    (1, 'acres', 'acres', NULL, 4917, 1),
    (1, 'venue', 'venue', NULL, 4918, 1),
    (1, 'athletic', 'athletic', NULL, 4919, 1),
    (1, 'thermal', 'thermal', 'adj', 4920, 1),
    (1, 'essays', 'essays', NULL, 4921, 1),
    (1, 'vital', 'vital', 'adj', 4922, 1),
    (1, 'fairly', 'fairly', 'adv', 4923, 1),
    (1, 'coastal', 'coastal', 'adj', 4924, 1),
    (1, 'config', 'config', NULL, 4925, 1),
    (1, 'charity', 'charity', 'noun', 4926, 1),
    (1, 'intelligent', 'intelligent', NULL, 4927, 1),
    (1, 'edinburgh', 'edinburgh', NULL, 4928, 1),
    (1, 'excel', 'excel', NULL, 4929, 1),
    (1, 'modes', 'modes', NULL, 4930, 1),
    (1, 'obligation', 'obligation', 'noun', 4931, 1),
    (1, 'campbell', 'campbell', NULL, 4932, 1),
    (1, 'harbor', 'harbor', NULL, 4933, 1),
    (1, 'hungary', 'hungary', NULL, 4934, 1),
    (1, 'traveler', 'traveler', NULL, 4935, 1),
    (1, 'urw', 'urw', NULL, 4936, 1),
    (1, 'segment', 'segment', 'noun', 4937, 1),
    (1, 'regardless', 'regardless', 'adj', 4938, 1),
    (1, 'lan', 'lan', NULL, 4939, 1),
    (1, 'puzzle', 'puzzle', NULL, 4940, 1),
    (1, 'rising', 'rising', 'verb', 4941, 1),
    (1, 'aluminum', 'aluminum', NULL, 4942, 1),
    (1, 'wells', 'wells', NULL, 4943, 1),
    (1, 'wishlist', 'wishlist', NULL, 4944, 1),
    (1, 'insight', 'insight', NULL, 4945, 1),
    (1, 'sms', 'sms', NULL, 4946, 1),
    (1, 'restricted', 'restricted', 'verb', 4947, 1),
    (1, 'republican', 'republican', NULL, 4948, 1),
    (1, 'latter', 'latter', NULL, 4949, 1),
    (1, 'merchants', 'merchants', NULL, 4950, 1),
    (1, 'thick', 'thick', NULL, 4951, 1),
    (1, 'trailers', 'trailers', NULL, 4952, 1),
    (1, 'syndrome', 'syndrome', NULL, 4953, 1),
    (1, 'philips', 'philips', NULL, 4954, 1),
    (1, 'attendance', 'attendance', 'noun', 4955, 1),
    (1, 'penalty', 'penalty', NULL, 4956, 1),
    (1, 'drum', 'drum', NULL, 4957, 1),
    (1, 'enables', 'enables', NULL, 4958, 1),
    (1, 'nec', 'nec', NULL, 4959, 1),
    (1, 'iraqi', 'iraqi', NULL, 4960, 1),
    (1, 'builder', 'builder', NULL, 4961, 1),
    (1, 'vista', 'vista', NULL, 4962, 1),
    (1, 'jessica', 'jessica', NULL, 4963, 1),
    (1, 'chips', 'chips', NULL, 4964, 1),
    (1, 'terry', 'terry', NULL, 4965, 1),
    (1, 'flood', 'flood', NULL, 4966, 1),
    (1, 'foto', 'foto', NULL, 4967, 1),
    (1, 'ease', 'ease', NULL, 4968, 1),
    (1, 'arguments', 'arguments', NULL, 4969, 1),
    (1, 'amsterdam', 'amsterdam', NULL, 4970, 1),
    (1, 'arena', 'arena', NULL, 4971, 1),
    (1, 'adventures', 'adventures', NULL, 4972, 1),
    (1, 'pupils', 'pupils', NULL, 4973, 1),
    (1, 'stewart', 'stewart', NULL, 4974, 1),
    (1, 'announcement', 'announcement', 'noun', 4975, 1),
    (1, 'tabs', 'tabs', NULL, 4976, 1),
    (1, 'outcome', 'outcome', NULL, 4977, 1),
    (1, 'expanded', 'expanded', 'verb', 4978, 1),
    (1, 'casual', 'casual', 'adj', 4979, 1),
    (1, 'polish', 'polish', 'adj', 4980, 1),
    (1, 'extras', 'extras', NULL, 4981, 1),
    (1, 'centres', 'centres', NULL, 4982, 1),
    (1, 'clause', 'clause', NULL, 4983, 1),
    (1, 'lands', 'lands', NULL, 4984, 1),
    (1, 'troops', 'troops', NULL, 4985, 1),
    (1, 'indoor', 'indoor', NULL, 4986, 1),
    (1, 'bulgaria', 'bulgaria', NULL, 4987, 1),
    (1, 'armed', 'armed', 'verb', 4988, 1),
    (1, 'broker', 'broker', NULL, 4989, 1),
    (1, 'charger', 'charger', NULL, 4990, 1),
    (1, 'regularly', 'regularly', 'adv', 4991, 1),
    (1, 'pine', 'pine', NULL, 4992, 1),
    (1, 'cooling', 'cooling', 'verb', 4993, 1),
    (1, 'tend', 'tend', NULL, 4994, 1),
    (1, 'gulf', 'gulf', NULL, 4995, 1),
    (1, 'rick', 'rick', NULL, 4996, 1),
    (1, 'trucks', 'trucks', NULL, 4997, 1),
    (1, 'mechanisms', 'mechanisms', NULL, 4998, 1),
    (1, 'shopper', 'shopper', NULL, 4999, 1),
    (1, 'tokyo', 'tokyo', NULL, 5000, 1);

-- Fill rank when the lexeme already exists (thematic overlap)
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2001),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'a';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2002),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'i';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2003),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'web';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2004),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'online';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2005),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'services';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2006),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'click';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2007),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'email';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2008),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'products';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2009),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'product';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2010),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'policy';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2011),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'available';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2012),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'copyright';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2013),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'software';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2014),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'info';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2015),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'links';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2016),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'review';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2017),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'privacy';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2018),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'items';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2019),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'user';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2020),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'january';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2021),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mail';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2022),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'reviews';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2023),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'management';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2024),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'item';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2025),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'international';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2026),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'comments';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2027),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'development';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2028),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'terms';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2029),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'hotels';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2030),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'education';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2031),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'design';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2032),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'posted';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2033),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'internet';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2034),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'dvd';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2035),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'shipping';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2036),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'reserved';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2037),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'forum';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2038),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'prices';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2039),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'website';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2040),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'index';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2041),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'link';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2042),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'technology';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2043),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pages';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2044),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'version';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2045),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'section';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2046),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sports';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2047),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'related';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2048),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'county';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2049),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'network';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2050),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'systems';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2051),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'download';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2052),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'resources';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2053),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'current';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2054),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'posts';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2055),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'media';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2056),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'guide';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2057),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'directory';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2058),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'text';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2059),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'rating';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2060),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'rate';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2061),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'usa';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2062),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'shopping';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2063),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sites';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2064),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'digital';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2065),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'profile';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2066),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'previous';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2067),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'events';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2068),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'image';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2069),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'title';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2070),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'description';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2071),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'non';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2072),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'quality';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2073),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'listing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2074),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'content';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2075),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'tools';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2076),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'reply';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2077),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'customer';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2078),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'december';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2079),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'compare';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2080),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'include';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2081),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'value';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2082),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'article';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2083),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'provide';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2084),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'source';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2085),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'author';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2086),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sale';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2087),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'print';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2088),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'canada';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2089),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'teen';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2090),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'stock';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2091),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'categories';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2092),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'advanced';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2093),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sales';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2094),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'estate';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2095),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'conditions';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2096),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'select';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2097),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'windows';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2098),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'thread';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2099),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'category';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2100),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'gallery';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2101),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'register';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2102),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'june';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2103),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'october';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2104),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'november';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2105),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'library';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2106),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'series';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2107),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'features';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2108),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'industry';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2109),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'provided';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2110),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'required';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2111),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'accessories';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2112),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'forums';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2113),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'march';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2114),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'september';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2115),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'july';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2116),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'server';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2117),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'application';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2118),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cart';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2119),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'articles';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2120),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'feedback';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2121),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'issues';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2122),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'april';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2123),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'users';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2124),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'topic';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2125),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'comment';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2126),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'financial';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2127),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'standard';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2128),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'tax';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2129),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'below';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2130),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mobile';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2131),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'blog';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2132),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'payment';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2133),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'equipment';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2134),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'login';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2135),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'programs';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2136),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'offers';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2137),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'recent';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2138),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'stores';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2139),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'performance';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2140),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'august';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2141),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'quote';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2142),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'options';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2143),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'rates';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2144),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'activities';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2145),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'additional';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2146),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'password';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2147),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'latest';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2148),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'texas';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2149),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'poker';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2150),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'status';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2151),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'browse';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2152),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'range';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2153),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'seller';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2154),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'february';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2155),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'result';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2156),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'audio';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2157),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'groups';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2158),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'files';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2159),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'analysis';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2160),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'fax';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2161),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'areas';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2162),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'committee';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2163),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'washington';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2164),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'id';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2165),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'california';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2166),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'similar';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2167),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'schools';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2168),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'added';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2169),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'reference';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2170),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'companies';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2171),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'listed';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2172),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'learning';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2173),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'delivery';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2174),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'net';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2175),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'popular';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2176),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'term';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2177),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'computers';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2178),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'journal';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2179),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'reports';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2180),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'central';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2181),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'images';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2182),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'self';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2183),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'council';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2184),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'includes';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2185),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'australia';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2186),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'discussion';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2187),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'archive';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2188),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'entertainment';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2189),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'agreement';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2190),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'format';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2191),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'log';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2192),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'faq';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2193),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'edition';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2194),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'messages';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2195),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'marketing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2196),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'updated';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2197),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'association';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2198),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'provides';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2199),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'studies';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2200),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'specific';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2201),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'collection';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2202),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'arts';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2203),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'display';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2204),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'limited';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2205),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'powered';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2206),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'solutions';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2207),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'daily';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2208),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'electronics';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2209),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'database';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2210),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'official';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2211),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'average';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2212),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'technical';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2213),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pro';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2214),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'region';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2215),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'direct';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2216),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'microsoft';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2217),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'conference';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2218),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'environment';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2219),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'district';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2220),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'calendar';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2221),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'costs';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2222),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'update';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2223),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'downloads';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2224),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'resource';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2225),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'applications';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2226),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'document';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2227),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'material';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2228),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'federal';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2229),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'hosting';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2230),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'adult';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2231),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'centre';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2232),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'requirements';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2233),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'via';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2234),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'finance';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2235),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'gifts';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2236),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'topics';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2237),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'individual';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2238),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'tips';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2239),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'auto';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2240),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'edit';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2241),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'videos';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2242),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'percent';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2243),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'function';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2244),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'global';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2245),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'tech';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2246),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'economic';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2247),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'projects';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2248),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'lyrics';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2249),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'subscribe';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2250),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'submit';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2251),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'germany';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2252),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'included';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2253),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'deals';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2254),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'various';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2255),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'linux';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2256),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'production';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2257),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'commercial';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2258),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'advertising';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2259),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'treatment';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2260),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'newsletter';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2261),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'archives';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2262),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'magazine';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2263),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'error';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2264),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'currently';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2265),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'construction';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2266),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'toys';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2267),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'registered';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2268),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'golf';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2269),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'receive';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2270),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'domain';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2271),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'methods';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2272),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'chapter';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2273),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'protection';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2274),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'policies';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2275),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'loan';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2276),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'wide';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2277),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'india';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2278),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'listings';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2279),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'models';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2280),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'engineering';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2281),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'florida';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2282),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'wireless';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2283),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'license';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2284),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'annual';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2285),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'published';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2286),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'basic';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2287),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sony';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2288),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'corporate';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2289),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'google';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2290),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'method';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2291),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'purchase';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2292),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'customers';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2293),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'active';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2294),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'response';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2295),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'hardware';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2296),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'materials';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2297),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'holiday';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2298),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'chat';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2299),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'designed';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2300),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'countries';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2301),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'brand';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2302),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'discount';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2303),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'effects';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2304),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'standards';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2305),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'yellow';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2306),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'increase';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2307),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'advertise';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2308),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'kingdom';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2309),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'environmental';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2310),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'storage';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2311),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'japan';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2312),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'loans';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2313),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'entry';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2314),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'availability';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2315),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'africa';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2316),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'summary';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2317),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'growth';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2318),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'notes';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2319),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'agency';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2320),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'monday';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2321),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'european';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2322),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'activity';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2323),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pics';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2324),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'western';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2325),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'income';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2326),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'employment';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2327),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'overall';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2328),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'bay';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2329),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'commission';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2330),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ad';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2331),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'package';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2332),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'contents';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2333),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'players';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2334),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'port';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2335),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'album';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2336),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'regional';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2337),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'supplies';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2338),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'administration';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2339),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'institute';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2340),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'views';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2341),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'screen';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2342),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'exchange';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2343),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'types';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2344),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sponsored';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2345),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'electronic';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2346),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'benefits';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2347),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'apply';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2348),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'printer';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2349),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'effective';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2350),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'organization';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2351),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'effect';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2352),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'eur';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2353),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'selection';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2354),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'casino';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2355),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'menu';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2356),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'volume';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2357),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mortgage';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2358),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'corporation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2359),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'solution';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2360),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mature';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2361),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'role';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2362),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'addition';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2363),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'supply';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2364),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'usr';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2365),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'executive';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2366),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'union';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2367),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'jewelry';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2368),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'clothing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2369),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mon';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2370),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'homepage';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2371),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'skills';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2372),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'bush';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2373),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'islands';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2374),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'rental';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2375),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'teens';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2376),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pre';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2377),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sat';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2378),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'facilities';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2379),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'zip';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2380),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'bid';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2381),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sellers';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2382),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cable';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2383),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'opportunities';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2384),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'values';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2385),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'division';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2386),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'tuesday';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2387),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'object';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2388),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'lesbian';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2389),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'appropriate';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2390),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'logo';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2391),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'length';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2392),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'score';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2393),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'statistics';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2394),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'returns';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2395),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'capital';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2396),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sample';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2397),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'investment';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2398),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'shown';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2399),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'culture';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2400),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'flash';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2401),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'registration';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2402),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'fri';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2403),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'thursday';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2404),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'courses';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2405),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'consumer';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2406),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'furniture';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2407),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'levels';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2408),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'channel';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2409),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mode';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2410),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'phones';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2411),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'wednesday';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2412),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'structure';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2413),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'fund';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2414),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'degree';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2415),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'button';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2416),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'releases';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2417),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'wed';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2418),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'homes';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2419),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'custom';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2420),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'virginia';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2421),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'located';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2422),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'multiple';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2423),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'asian';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2424),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'distribution';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2425),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'editor';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2426),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'inn';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2427),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'industrial';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2428),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cause';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2429),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'potential';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2430),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cnet';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2431),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ltd';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2432),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'los';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2433),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'featured';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2434),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'rooms';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2435),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'inc';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2436),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'communications';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2437),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'associated';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2438),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'primary';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2439),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'tool';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2440),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'browser';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2441),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'foundation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2442),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'friendly';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2443),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'schedule';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2444),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'documents';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2445),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'communication';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2446),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'feature';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2447),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'independent';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2448),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'approach';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2449),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cameras';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2450),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'physical';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2451),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'operating';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2452),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'maps';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2453),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ratings';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2454),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'chicago';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2455),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'forms';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2456),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'tue';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2457),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'developed';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2458),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'unique';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2459),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'survey';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2460),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'prior';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2461),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sport';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2462),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sources';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2463),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mexico';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2464),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'population';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2465),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'regular';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2466),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'secure';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2467),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'navigation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2468),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'operations';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2469),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'therefore';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2470),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'christian';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2471),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'option';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2472),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'valley';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2473),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'thu';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2474),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'rentals';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2475),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'publications';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2476),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'worldwide';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2477),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'improve';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2478),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'publisher';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2479),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'larger';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2480),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'anti';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2481),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'networks';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2482),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'nokia';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2483),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'impact';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2484),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'transfer';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2485),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'introduction';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2486),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'tel';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2487),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'carolina';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2488),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'properties';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2489),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'overview';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2490),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'accommodation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2491),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'owners';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2492),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'disease';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2493),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'italy';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2494),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'kit';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2495),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'classic';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2496),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'basis';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2497),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cities';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2498),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'express';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2499),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'award';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2500),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'assessment';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2501),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ensure';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2502),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'thus';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2503),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'interface';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2504),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'partners';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2505),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'budget';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2506),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'rated';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2507),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'guides';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2508),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'maximum';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2509),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'existing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2510),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'selected';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2511),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'amazon';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2512),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'patients';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2513),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'restaurants';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2514),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'locations';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2515),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'significant';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2516),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'lists';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2517),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'technologies';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2518),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'retail';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2519),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'useful';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2520),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'directly';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2521),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'manufacturer';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2522),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'est';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2523),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'providing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2524),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mac';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2525),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'housing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2526),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'iii';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2527),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'gmt';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2528),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'catalog';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2529),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'searches';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2530),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'authority';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2531),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'considered';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2532),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'traffic';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2533),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'programme';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2534),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'joined';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2535),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'input';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2536),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'strategy';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2537),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'valid';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2538),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'bin';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2539),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'modern';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2540),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'senior';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2541),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ireland';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2542),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'teaching';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2543),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'testing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2544),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'units';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2545),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'canadian';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2546),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'enterprise';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2547),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ships';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2548),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'educational';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2549),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'leading';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2550),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'metal';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2551),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'fitness';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2552),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'asia';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2553),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'abstract';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2554),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'uses';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2555),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'output';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2556),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'funds';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2557),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'greater';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2558),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'develop';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2559),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'employees';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2560),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'artists';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2561),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'alternative';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2562),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'processing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2563),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'resolution';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2564),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'java';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2565),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'publication';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2566),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'relations';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2567),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'contains';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2568),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'session';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2569),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'multi';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2570),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'photography';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2571),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'republic';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2572),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'fees';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2573),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'components';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2574),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'vacation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2575),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'academic';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2576),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'assistance';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2577),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'completed';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2578),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'graphics';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2579),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'indian';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2580),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'prev';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2581),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ads';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2582),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'grade';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2583),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pacific';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2584),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'organizations';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2585),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'filter';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2586),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mailing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2587),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'vehicle';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2588),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'int';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2589),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'northern';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2590),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'panel';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2591),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'proposed';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2592),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'default';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2593),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'require';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2594),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'iraq';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2595),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'outdoor';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2596),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'allows';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2597),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'protein';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2598),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'reported';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2599),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'transportation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2600),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mini';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2601),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'politics';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2602),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'disclaimer';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2603),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'authors';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2604),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'boards';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2605),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'faculty';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2606),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'parties';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2607),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'membership';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2608),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'string';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2609),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'modified';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2610),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'released';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2611),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'internal';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2612),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'goods';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2613),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'recommended';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2614),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'detailed';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2615),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'approved';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2616),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'background';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2617),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'usb';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2618),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'maintenance';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2619),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ability';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2620),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'functions';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2621),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'brands';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2622),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'trademarks';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2623),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'phentermine';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2624),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'spain';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2625),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'southern';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2626),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'etc';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2627),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'battery';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2628),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'youth';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2629),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'submitted';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2630),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'boston';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2631),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'debt';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2632),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'keywords';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2633),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'medium';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2634),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'television';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2635),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'core';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2636),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'purposes';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2637),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'throughout';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2638),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sets';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2639),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'wood';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2640),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'msn';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2641),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'defined';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2642),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'awards';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2643),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'fee';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2644),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'studio';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2645),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'reader';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2646),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'virtual';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2647),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'device';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2648),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'established';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2649),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'las';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2650),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'remote';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2651),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'programming';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2652),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'external';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2653),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'apple';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2654),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'regarding';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2655),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'instructions';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2656),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'min';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2657),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'offered';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2658),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'remove';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2659),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'aid';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2660),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'surface';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2661),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'minimum';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2662),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'visual';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2663),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'host';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2664),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'variety';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2665),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'teachers';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2666),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'isbn';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2667),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'manual';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2668),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'subjects';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2669),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'agents';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2670),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'increased';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2671),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'repair';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2672),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'civil';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2673),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'steel';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2674),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'understanding';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2675),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'songs';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2676),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'associates';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2677),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'updates';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2678),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'desktop';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2679),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'classes';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2680),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ohio';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2681),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sector';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2682),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'capacity';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2683),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'requires';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2684),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'jersey';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2685),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'fully';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2686),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'electric';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2687),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'instruments';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2688),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'quotes';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2689),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'businesses';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2690),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'unknown';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2691),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'specified';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2692),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pst';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2693),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'procedures';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2694),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'workers';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2695),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'georgia';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2696),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'traditional';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2697),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'campus';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2698),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'creative';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2699),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'coast';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2700),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'benefit';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2701),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'progress';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2702),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'funding';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2703),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'devices';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2704),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sub';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2705),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'fiction';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2706),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'watches';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2707),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'careers';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2708),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'museum';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2709),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'transport';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2710),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'blogs';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2711),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'evaluation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2712),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'accepted';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2713),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'former';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2714),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'implementation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2715),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'hits';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2716),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'zone';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2717),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'complex';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2718),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'galleries';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2719),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'references';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2720),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'presented';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2721),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'flow';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2722),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'agencies';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2723),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'literature';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2724),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'respective';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2725),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'parent';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2726),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'michigan';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2727),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'columbia';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2728),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'setting';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2729),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'scale';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2730),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'economy';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2731),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'highest';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2732),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'helpful';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2733),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'monthly';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2734),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'critical';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2735),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'frame';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2736),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'musical';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2737),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'definition';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2738),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'angeles';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2739),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'networking';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2740),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'australian';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2741),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'employee';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2742),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'magazines';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2743),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'packages';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2744),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'detail';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2745),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'francisco';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2746),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'laws';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2747),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pet';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2748),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'individuals';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2749),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'colorado';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2750),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'switch';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2751),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'largest';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2752),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'african';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2753),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'titles';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2754),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'relevant';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2755),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'guidelines';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2756),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'connect';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2757),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'bible';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2758),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'dev';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2759),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'basket';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2760),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'applied';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2761),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'weekly';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2762),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'vol';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2763),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'installation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2764),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'described';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2765),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'demand';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2766),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'suite';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2767),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'vegas';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2768),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'advance';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2769),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'skip';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2770),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'diet';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2771),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'auction';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2772),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'gear';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2773),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'nation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2774),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sheet';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2775),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'firm';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2776),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'illinois';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2777),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'regulations';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2778),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'elements';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2779),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'species';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2780),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cells';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2781),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'module';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2782),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'resort';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2783),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'facility';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2784),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'random';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2785),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pricing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2786),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'dvds';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2787),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'certificate';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2788),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'motion';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2789),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'fashion';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2790),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'directions';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2791),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'visitors';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2792),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'documentation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2793),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'monitor';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2794),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'trading';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2795),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'coverage';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2796),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'vision';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2797),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ending';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2798),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'clients';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2799),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'actions';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2800),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'automotive';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2801),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'goal';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2802),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'successful';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2803),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'communities';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2804),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'clinical';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2805),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sciences';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2806),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'markets';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2807),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'lowest';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2808),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'highly';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2809),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'publishing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2810),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'appear';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2811),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'developing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2812),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'currency';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2813),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'leather';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2814),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'determine';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2815),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'temperature';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2816),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'palm';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2817),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'announcements';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2818),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'actual';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2819),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'historical';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2820),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'commerce';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2821),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ringtones';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2822),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'persons';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2823),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'scientific';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2824),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'satellite';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2825),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'tests';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2826),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'accounts';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2827),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'amateur';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2828),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'xbox';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2829),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'particularly';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2830),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'factors';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2831),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'settings';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2832),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'buyer';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2833),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cultural';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2834),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'oral';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2835),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ford';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2836),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'poster';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2837),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'edge';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2838),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'functional';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2839),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'root';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2840),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'holidays';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2841),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pink';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2842),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'zealand';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2843),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'balance';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2844),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'monitoring';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2845),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'graduate';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2846),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'replies';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2847),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'architecture';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2848),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'initial';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2849),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'label';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2850),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'llc';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2851),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sec';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2852),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'recommend';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2853),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'canon';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2854),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'league';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2855),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'provider';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2856),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'optional';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2857),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'dictionary';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2858),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'accounting';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2859),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'manufacturing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2860),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sections';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2861),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'fishing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2862),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'effort';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2863),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'phase';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2864),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'fields';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2865),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'fantasy';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2866),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'motor';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2867),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'context';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2868),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'install';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2869),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'apparel';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2870),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'generally';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2871),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'continued';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2872),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mass';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2873),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'breast';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2874),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'techniques';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2875),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ibm';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2876),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'johnson';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2877),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'websites';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2878),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'religion';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2879),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'claim';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2880),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'patch';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2881),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'measures';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2882),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'generation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2883),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'kansas';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2884),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'chemical';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2885),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'task';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2886),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'reduce';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2887),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'component';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2888),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'enable';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2889),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'exercise';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2890),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'bug';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2891),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mid';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2892),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'guarantee';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2893),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'diamond';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2894),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'israel';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2895),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'processes';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2896),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'servers';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2897),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'meetings';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2898),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'jones';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2899),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'arizona';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2900),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'keyword';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2901),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'interests';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2902),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'congress';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2903),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'fuel';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2904),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'username';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2905),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'produced';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2906),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'italian';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2907),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'paperback';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2908),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'classifieds';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2909),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'supported';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2910),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'saint';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2911),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'argument';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2912),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'creating';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2913),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'joint';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2914),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'premium';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2915),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'providers';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2916),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'characters';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2917),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'upgrade';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2918),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'factor';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2919),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'stream';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2920),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'apartments';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2921),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'eastern';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2922),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'auctions';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2923),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'therapy';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2924),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'entries';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2925),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'dates';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2926),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'generated';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2927),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'upper';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2928),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'administrative';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2929),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'prime';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2930),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'samsung';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2931),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'limit';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2932),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'louis';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2933),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'steps';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2934),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'errors';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2935),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'shops';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2936),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'del';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2937),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'efforts';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2938),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'informed';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2939),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'creek';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2940),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'quantity';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2941),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'urban';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2942),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'practices';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2943),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sorted';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2944),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'reporting';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2945),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'essential';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2946),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'tours';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2947),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'platform';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2948),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'load';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2949),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'affiliate';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2950),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'labor';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2951),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'admin';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2952),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'nursing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2953),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'machines';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2954),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'designated';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2955),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'tags';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2956),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'recovery';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2957),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'integrated';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2958),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'configuration';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2959),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'merchant';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2960),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'comprehensive';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2961),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'expert';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2962),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'universal';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2963),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'solid';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2964),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cds';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2965),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'presentation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2966),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'languages';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2967),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'orange';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2968),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'compliance';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2969),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'vehicles';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2970),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'prevent';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2971),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'theme';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2972),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'campaign';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2973),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'marine';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2974),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'improvement';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2975),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'guitar';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2976),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pennsylvania';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2977),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'examples';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2978),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ipod';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2979),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'claims';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2980),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'motorola';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2981),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'acceptance';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2982),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'strategies';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2983),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'affairs';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2984),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'intended';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2985),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'goals';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2986),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'hire';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2987),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'election';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2988),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'branch';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2989),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'charges';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2990),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'affiliates';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2991),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mount';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2992),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'latin';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2993),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'multimedia';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2994),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'certified';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2995),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'rank';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2996),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'computing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2997),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'oregon';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2998),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'element';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 2999),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'virus';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3000),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'abuse';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3001),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'interactive';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3002),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'requests';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3003),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'separate';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3004),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'quarter';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3005),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'procedure';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3006),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'leadership';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3007),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'tables';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3008),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'define';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3009),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'racing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3010),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'religious';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3011),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'facts';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3012),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'kong';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3013),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'column';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3014),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'plants';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3015),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'chain';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3016),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'developer';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3017),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'identify';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3018),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'avenue';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3019),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'approximately';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3020),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'domestic';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3021),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sitemap';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3022),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'recommendations';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3023),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'houston';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3024),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'comparison';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3025),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mental';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3026),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'viewed';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3027),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'extended';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3028),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sequence';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3029),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'inch';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3030),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'centers';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3031),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'reserve';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3032),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'recipes';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3033),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cvs';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3034),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'gamma';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3035),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'plastic';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3036),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'produce';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3037),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'placed';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3038),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'counter';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3039),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'failure';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3040),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'follows';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3041),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'dollar';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3042),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ontario';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3043),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'automatically';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3044),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'des';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3045),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'minnesota';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3046),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'films';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3047),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'native';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3048),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'williams';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3049),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'movement';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3050),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'printing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3051),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'baseball';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3052),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'owned';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3053),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'approval';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3054),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'draft';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3055),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'chart';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3056),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'contacts';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3057),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'readers';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3058),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'clubs';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3059),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'lcd';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3060),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'jackson';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3061),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'equal';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3062),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'adventure';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3063),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'matching';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3064),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'offering';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3065),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'shirts';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3066),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'profit';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3067),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'leaders';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3068),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'posters';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3069),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'institutions';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3070),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'variable';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3071),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ave';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3072),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'advertisement';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3073),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'parking';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3074),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'headlines';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3075),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'compared';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3076),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'determined';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3077),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'wholesale';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3078),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'workshop';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3079),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'russia';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3080),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'codes';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3081),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'kinds';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3082),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'extension';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3083),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'seattle';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3084),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'statements';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3085),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'golden';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3086),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'teams';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3087),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'fort';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3088),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'lighting';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3089),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'senate';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3090),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'gene';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3091),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'portable';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3092),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'electrical';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3093),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'applicable';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3094),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'disc';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3095),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pattern';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3096),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'theatre';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3097),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'laser';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3098),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'manufacturers';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3099),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sponsor';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3100),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'classical';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3101),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'icon';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3102),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'warranty';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3103),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'dedicated';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3104),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'indiana';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3105),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'basketball';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3106),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'objects';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3107),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'delete';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3108),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'assembly';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3109),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'nuclear';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3110),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'taxes';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3111),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mouse';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3112),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'issued';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3113),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sexual';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3114),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'wisconsin';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3115),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'obtained';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3116),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'false';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3117),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cast';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3118),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'flower';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3119),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'personnel';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3120),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'supplied';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3121),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'identified';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3122),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'falls';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3123),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pic';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3124),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'aids';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3125),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'opinions';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3126),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'promote';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3127),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'stated';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3128),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'stats';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3129),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'hawaii';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3130),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'professionals';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3131),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'appears';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3132),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'flag';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3133),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'covers';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3134),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'advantage';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3135),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'designs';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3136),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'maintain';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3137),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'tourism';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3138),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'priority';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3139),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'newsletters';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3140),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'adults';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3141),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'clips';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3142),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'savings';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3143),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'graphic';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3144),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'atom';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3145),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'payments';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3146),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'estimated';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3147),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'binding';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3148),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'brief';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3149),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'winning';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3150),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'anonymous';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3151),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'iron';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3152),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'script';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3153),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'served';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3154),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'miscellaneous';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3155),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'void';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3156),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'dining';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3157),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'alert';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3158),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'integration';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3159),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'atlanta';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3160),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'dakota';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3161),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'tag';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3162),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mix';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3163),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'framework';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3164),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'disk';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3165),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'installed';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3166),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'vhs';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3167),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'credits';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3168),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'criteria';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3169),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pubmed';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3170),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'massachusetts';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3171),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'diego';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3172),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'hong';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3173),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'vice';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3174),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'associate';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3175),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'behavior';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3176),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'enlarge';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3177),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'frequently';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3178),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'revenue';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3179),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'measure';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3180),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'votes';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3181),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'discussions';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3182),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'gain';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3183),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'festival';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3184),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'laboratory';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3185),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'flights';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3186),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'experts';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3187),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'signs';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3188),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'lack';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3189),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'depth';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3190),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'iowa';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3191),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'logged';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3192),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'laptop';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3193),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'vintage';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3194),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'explore';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3195),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'maryland';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3196),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'spa';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3197),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'concept';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3198),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'eligible';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3199),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'checkout';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3200),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'handling';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3201),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'origin';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3202),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'gaming';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3203),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'feeds';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3204),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'billion';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3205),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'destination';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3206),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'scotland';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3207),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'intelligence';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3208),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'dallas';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3209),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'con';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3210),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ups';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3211),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'nations';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3212),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'route';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3213),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'specifications';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3214),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'tripadvisor';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3215),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'alaska';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3216),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'zoom';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3217),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'residential';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3218),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'anime';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3219),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'decisions';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3220),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'industries';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3221),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'protocol';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3222),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'query';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3223),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'clip';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3224),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'partnership';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3225),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'editorial';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3226),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'expression';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3227),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'equity';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3228),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'provisions';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3229),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'wire';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3230),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'principles';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3231),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'suggestions';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3232),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'rural';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3233),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'shared';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3234),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'replacement';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3235),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'strategic';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3236),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'spam';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3237),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'economics';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3238),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'acid';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3239),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'bytes';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3240),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cent';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3241),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'compatible';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3242),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'height';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3243),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'null';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3244),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'zero';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3245),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'speaker';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3246),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'filed';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3247),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'netherlands';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3248),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'obtain';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3249),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'consulting';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3250),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'recreation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3251),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'offices';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3252),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'designer';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3253),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'managed';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3254),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'korea';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3255),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'banks';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3256),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'participants';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3257),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'leads';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3258),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'negative';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3259),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'austin';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3260),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'favorites';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3261),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'toronto';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3262),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'theater';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3263),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'springs';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3264),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'missouri';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3265),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'andrew';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3266),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'var';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3267),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'perform';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3268),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'healthy';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3269),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'translation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3270),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'estimates';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3271),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'font';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3272),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'assets';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3273),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'injury';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3274),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'joseph';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3275),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ministry';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3276),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'drivers';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3277),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'figures';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3278),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'protected';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3279),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'proposal';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3280),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sharing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3281),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'philadelphia';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3282),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'portal';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3283),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'beta';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3284),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'fail';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3285),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'gratis';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3286),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'banking';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3287),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'officials';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3288),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'toward';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3289),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'slightly';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3290),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'assist';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3291),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'conduct';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3292),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'contained';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3293),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'lingerie';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3294),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'legislation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3295),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'parameters';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3296),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'jazz';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3297),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'serving';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3298),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'bags';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3299),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'profiles';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3300),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'miami';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3301),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'comics';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3302),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'houses';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3303),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'postal';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3304),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'relationships';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3305),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'tennessee';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3306),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'controls';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3307),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'combined';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3308),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ultimate';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3309),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'wales';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3310),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'representative';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3311),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'frequency';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3312),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'introduced';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3313),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'minor';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3314),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'departments';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3315),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'residents';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3316),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'noted';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3317),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'displayed';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3318),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'reduced';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3319),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'physics';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3320),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'rare';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3321),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'performed';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3322),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'extreme';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3323),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'samples';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3324),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'davis';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3325),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'bars';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3326),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'reviewed';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3327),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'row';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3328),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'forecast';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3329),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'removed';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3330),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'helps';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3331),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'singles';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3332),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'administrator';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3333),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cycle';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3334),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'amounts';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3335),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'contain';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3336),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'accuracy';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3337),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'dual';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3338),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'usd';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3339),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pharmacy';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3340),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'brazil';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3341),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'creation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3342),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'static';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3343),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'hunter';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3344),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'addresses';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3345),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'crystal';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3346),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'writer';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3347),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'chairman';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3348),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'violence';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3349),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'fans';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3350),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'oklahoma';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3351),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'speakers';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3352),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'academy';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3353),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'dynamic';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3354),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'gender';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3355),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'permanent';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3356),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'agriculture';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3357),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'dell';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3358),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cleaning';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3359),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'constitutes';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3360),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'portfolio';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3361),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'practical';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3362),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'delivered';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3363),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'collectibles';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3364),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'infrastructure';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3365),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'exclusive';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3366),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'concerns';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3367),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'vendor';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3368),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'originally';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3369),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'intel';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3370),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'utilities';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3371),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'philosophy';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3372),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'regulation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3373),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'reduction';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3374),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'aim';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3375),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'bids';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3376),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'referred';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3377),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'supports';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3378),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'nutrition';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3379),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'recording';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3380),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'regions';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3381),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'junior';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3382),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'toll';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3383),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'les';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3384),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cape';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3385),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ann';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3386),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'tip';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3387),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'secondary';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3388),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'announced';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3389),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'prevention';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3390),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ski';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3391),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'soccer';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3392),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'math';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3393),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'import';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3394),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'posting';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3395),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'presence';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3396),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'instant';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3397),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'automatic';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3398),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'healthcare';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3399),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'viewing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3400),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'maintained';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3401),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'increasing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3402),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'majority';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3403),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'connected';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3404),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'directors';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3405),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'aspects';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3406),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'austria';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3407),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'participation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3408),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'scheme';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3409),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'utility';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3410),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'preview';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3411),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'manner';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3412),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'matrix';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3413),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'containing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3414),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'combination';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3415),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'devel';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3416),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'amendment';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3417),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'despite';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3418),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'guaranteed';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3419),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'turkey';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3420),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'libraries';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3421),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'distributed';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3422),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'degrees';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3423),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'singapore';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3424),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'enterprises';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3425),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'delta';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3426),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'seeking';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3427),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'inches';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3428),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'phoenix';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3429),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'convention';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3430),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'shares';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3431),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'principal';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3432),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'comfort';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3433),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'colors';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3434),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'wars';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3435),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cisco';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3436),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ordering';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3437),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'alpha';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3438),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'appeal';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3439),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cruise';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3440),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'bonus';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3441),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'certification';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3442),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'previously';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3443),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'bookmark';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3444),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'buildings';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3445),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'specials';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3446),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'disney';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3447),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'household';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3448),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'batteries';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3449),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'adobe';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3450),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'smoking';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3451),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'bbc';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3452),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'becomes';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3453),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'drives';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3454),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'alabama';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3455),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'improved';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3456),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'avg';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3457),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'achieve';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3458),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'positions';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3459),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'subscription';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3460),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'dealer';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3461),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'contemporary';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3462),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'utah';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3463),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'nearby';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3464),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'rom';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3465),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'carried';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3466),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'exposure';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3467),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'panasonic';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3468),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'permalink';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3469),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'signature';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3470),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'gambling';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3471),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'refer';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3472),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'miller';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3473),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'provision';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3474),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'outdoors';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3475),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'luxury';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3476),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'babes';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3477),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'frames';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3478),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'newspaper';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3479),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'toy';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3480),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'circuit';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3481),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'layer';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3482),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'printed';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3483),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'removal';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3484),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'src';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3485),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'liability';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3486),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'trademark';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3487),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'hip';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3488),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'printers';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3489),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'faqs';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3490),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'adding';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3491),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'kentucky';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3492),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mostly';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3493),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'taylor';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3494),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'trackback';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3495),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'prints';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3496),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'factory';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3497),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'interior';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3498),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'revised';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3499),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'americans';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3500),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'optical';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3501),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'promotion';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3502),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'relative';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3503),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'dot';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3504),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'hiv';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3505),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'identity';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3506),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'suites';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3507),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'conversion';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3508),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'reasonable';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3509),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'victoria';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3510),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'serial';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3511),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'relief';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3512),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'revision';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3513),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'broadband';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3514),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'influence';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3515),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ratio';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3516),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pda';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3517),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'importance';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3518),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'dsl';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3519),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'webmaster';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3520),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'copies';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3521),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'recipe';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3522),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'zum';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3523),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'permit';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3524),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'diff';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3525),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'tennis';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3526),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'bass';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3527),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'prescription';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3528),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'instance';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3529),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pets';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3530),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'licensed';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3531),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'orlando';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3532),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'specifically';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3533),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'bureau';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3534),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'maine';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3535),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'represent';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3536),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'conservation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3537),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ideal';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3538),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'specs';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3539),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'recorded';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3540),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'parks';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3541),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'lawyers';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3542),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sydney';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3543),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'stress';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3544),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'trends';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3545),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'discover';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3546),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'patterns';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3547),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'boxes';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3548),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'louisiana';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3549),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'hills';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3550),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'javascript';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3551),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'fourth';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3552),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'advisor';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3553),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'marketplace';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3554),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'wilson';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3555),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'evolution';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3556),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'irish';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3557),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'certificates';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3558),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'objectives';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3559),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'stations';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3560),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'suggested';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3561),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'gps';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3562),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'remains';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3563),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'acc';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3564),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'firms';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3565),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'euro';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3566),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'operator';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3567),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'structures';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3568),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'generic';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3569),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'encyclopedia';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3570),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'usage';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3571),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cap';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3572),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ink';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3573),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'charts';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3574),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'continuing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3575),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mixed';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3576),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'census';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3577),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'interracial';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3578),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'peak';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3579),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'competitive';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3580),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'wheel';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3581),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'transit';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3582),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'suppliers';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3583),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'salt';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3584),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'compact';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3585),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'poetry';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3586),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'tracking';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3587),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'preparation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3588),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'attempt';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3589),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'receiving';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3590),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'matches';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3591),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'accordance';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3592),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'width';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3593),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'engines';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3594),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'array';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3595),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'discussed';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3596),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'accurate';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3597),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'stephen';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3598),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'elizabeth';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3599),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'climate';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3600),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'reservations';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3601),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pin';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3602),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'playstation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3603),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'alcohol';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3604),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'greek';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3605),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'instruction';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3606),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'managing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3607),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'annotation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3608),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'raw';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3609),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'differences';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3610),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'smaller';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3611),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'newest';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3612),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'establish';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3613),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'gnu';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3614),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'expressed';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3615),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'extent';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3616),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sharp';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3617),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'lesbians';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3618),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'lane';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3619),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'paragraph';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3620),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mathematics';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3621),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'aol';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3622),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'compensation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3623),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'export';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3624),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'managers';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3625),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'aircraft';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3626),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'modules';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3627),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sweden';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3628),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'conflict';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3629),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'conducted';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3630),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'versions';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3631),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'employer';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3632),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'occur';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3633),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'percentage';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3634),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mississippi';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3635),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'describe';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3636),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'concern';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3637),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'backup';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3638),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'requested';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3639),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'citizens';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3640),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'connecticut';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3641),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'heritage';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3642),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'personals';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3643),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'immediate';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3644),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'agricultural';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3645),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'expand';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3646),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'supporting';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3647),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'assigned';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3648),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'jordan';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3649),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'collections';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3650),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ages';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3651),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'participate';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3652),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'plug';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3653),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'specialist';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3654),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'affect';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3655),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'virgin';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3656),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'experienced';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3657),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'raised';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3658),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'institution';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3659),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'directed';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3660),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'dealers';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3661),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'searching';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3662),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sporting';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3663),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'perl';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3664),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'affected';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3665),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'lib';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3666),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'plate';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3667),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'expenses';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3668),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'indicate';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3669),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'blonde';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3670),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'proceedings';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3671),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'transmission';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3672),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'anderson';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3673),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'utc';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3674),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'characteristics';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3675),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'der';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3676),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'organic';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3677),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'seek';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3678),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'experiences';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3679),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'albums';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3680),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cheats';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3681),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'extremely';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3682),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'verzeichnis';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3683),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'contracts';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3684),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'hosted';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3685),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'diseases';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3686),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'concerning';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3687),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'developers';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3688),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'equivalent';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3689),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'chemistry';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3690),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'neighborhood';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3691),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'nevada';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3692),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'kits';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3693),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'thailand';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3694),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'variables';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3695),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'agenda';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3696),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'tracks';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3697),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'advisory';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3698),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cam';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3699),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'curriculum';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3700),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'logic';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3701),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'template';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3702),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'circle';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3703),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'soil';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3704),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'grants';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3705),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'psychology';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3706),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'responses';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3707),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'atlantic';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3708),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'circumstances';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3709),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'edward';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3710),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'investor';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3711),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'identification';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3712),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ram';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3713),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'wildlife';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3714),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'appliances';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3715),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'elementary';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3716),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cooking';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3717),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sponsors';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3718),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'fox';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3719),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'unlimited';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3720),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'respond';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3721),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sizes';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3722),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'plain';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3723),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'exit';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3724),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'entered';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3725),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'iran';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3726),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'launch';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3727),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'wave';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3728),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'checking';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3729),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'costa';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3730),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'belgium';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3731),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'printable';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3732),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'acts';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3733),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'guidance';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3734),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mesh';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3735),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'trail';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3736),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'enforcement';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3737),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'symbol';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3738),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'crafts';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3739),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'highway';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3740),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'hardcover';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3741),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'observed';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3742),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'dean';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3743),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'setup';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3744),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'poll';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3745),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'booking';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3746),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'glossary';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3747),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'fiscal';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3748),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'celebrity';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3749),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'styles';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3750),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'denver';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3751),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'unix';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3752),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'bond';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3753),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'channels';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3754),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ericsson';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3755),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'appendix';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3756),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'notify';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3757),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'blues';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3758),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'chocolate';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3759),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pub';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3760),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'portion';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3761),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'scope';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3762),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'hampshire';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3763),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'supplier';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3764),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cables';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3765),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cotton';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3766),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'bluetooth';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3767),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'controlled';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3768),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'requirement';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3769),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'authorities';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3770),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'biology';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3771),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'dental';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3772),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'border';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3773),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'debate';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3774),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'representatives';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3775),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pregnancy';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3776),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'causes';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3777),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'arkansas';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3778),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'biography';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3779),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'leisure';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3780),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'attractions';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3781),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'transactions';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3782),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'notebook';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3783),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'explorer';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3784),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'historic';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3785),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'attached';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3786),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'disabled';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3787),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'authorized';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3788),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'upcoming';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3789),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'britain';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3790),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'concert';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3791),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'retirement';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3792),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'scores';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3793),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'financing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3794),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'efficiency';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3795),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'comedy';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3796),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'adopted';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3797),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'efficient';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3798),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'weblog';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3799),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'linear';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3800),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'commitment';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3801),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'specialty';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3802),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'bears';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3803),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'jean';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3804),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'hop';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3805),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'carrier';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3806),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'edited';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3807),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'constant';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3808),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'visa';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3809),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'jewish';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3810),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'meter';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3811),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'linked';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3812),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'portland';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3813),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'interviews';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3814),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'concepts';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3815),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'reflect';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3816),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pure';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3817),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'lessons';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3818),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'fruit';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3819),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'begins';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3820),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'qualified';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3821),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'reform';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3822),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'lens';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3823),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'alerts';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3824),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'treated';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3825),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'discovery';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3826),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mysql';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3827),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'classified';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3828),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'relating';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3829),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'confidence';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3830),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'alliance';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3831),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'confirm';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3832),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'lewis';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3833),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'howard';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3834),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'offline';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3835),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'engineer';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3836),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'lifestyle';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3837),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'consistent';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3838),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'replace';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3839),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'clearance';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3840),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'connections';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3841),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'inventory';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3842),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'converter';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3843),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'organisation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3844),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'checks';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3845),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'becoming';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3846),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'safari';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3847),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'objective';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3848),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'indicated';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3849),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'securities';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3850),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'allen';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3851),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pdt';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3852),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'relation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3853),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'enabled';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3854),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'genre';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3855),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'slide';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3856),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'montana';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3857),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'volunteer';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3858),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'tested';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3859),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'rear';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3860),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'democratic';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3861),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'enhance';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3862),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'switzerland';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3863),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'exact';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3864),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'bound';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3865),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'parameter';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3866),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'adapter';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3867),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'processor';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3868),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'node';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3869),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'formal';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3870),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'dimensions';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3871),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'contribute';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3872),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'hockey';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3873),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'micro';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3874),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'colleges';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3875),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'laptops';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3876),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mile';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3877),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'challenges';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3878),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'editors';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3879),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mens';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3880),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'threads';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3881),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'bowl';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3882),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'supreme';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3883),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'recognition';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3884),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'presents';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3885),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ref';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3886),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'tank';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3887),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'submission';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3888),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'dolls';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3889),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'estimate';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3890),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'encourage';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3891),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'navy';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3892),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'regulatory';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3893),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'inspection';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3894),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'consumers';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3895),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cancel';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3896),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'limits';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3897),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'territory';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3898),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'transaction';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3899),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'manchester';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3900),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'delay';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3901),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pilot';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3902),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'outlet';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3903),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'contributions';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3904),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'continuous';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3905),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'czech';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3906),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'resulting';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3907),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cambridge';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3908),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'initiative';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3909),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'novel';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3910),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pan';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3911),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'execution';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3912),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'disability';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3913),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'increases';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3914),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ultra';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3915),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'winner';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3916),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'idaho';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3917),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'contractor';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3918),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'episode';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3919),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'examination';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3920),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'potter';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3921),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'dish';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3922),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'bulletin';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3923),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'indicates';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3924),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'modify';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3925),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'oxford';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3926),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'epinions';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3927),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'committed';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3928),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'extensive';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3929),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'affordable';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3930),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'candidate';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3931),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'databases';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3932),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'patent';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3933),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'slot';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3934),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'psp';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3935),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'outstanding';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3936),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'perspective';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3937),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'lodge';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3938),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'messenger';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3939),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mirror';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3940),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'tournament';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3941),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'consideration';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3942),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'discounts';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3943),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sterling';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3944),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sessions';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3945),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'kernel';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3946),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'stocks';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3947),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'buyers';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3948),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'journals';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3949),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'gray';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3950),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'catalogue';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3951),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'jennifer';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3952),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'antonio';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3953),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'charged';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3954),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'broad';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3955),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'taiwan';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3956),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'und';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3957),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'chosen';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3958),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'demo';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3959),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'greece';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3960),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'swiss';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3961),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'clark';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3962),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'terminal';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3963),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'publishers';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3964),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'behalf';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3965),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'caribbean';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3966),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'liquid';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3967),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'rice';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3968),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'nebraska';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3969),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'loop';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3970),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'salary';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3971),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'reservation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3972),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'foods';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3973),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'gourmet';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3974),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'properly';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3975),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'orleans';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3976),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'nfl';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3977),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'remaining';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3978),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'empire';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3979),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'resume';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3980),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'twenty';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3981),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'newly';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3982),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'avatar';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3983),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'gary';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3984),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'depending';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3985),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'illegal';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3986),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'expansion';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3987),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'vary';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3988),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'hundreds';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3989),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'arab';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3990),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'lincoln';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3991),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'premier';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3992),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'purchased';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3993),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'consent';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3994),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'drama';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3995),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'visiting';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3996),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'performing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3997),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'downtown';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3998),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'keyboard';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 3999),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'contest';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4000),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'collected';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4001),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'bands';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4002),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'boot';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4003),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'suitable';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4004),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'millions';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4005),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'audit';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4006),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'chamber';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4007),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'guinea';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4008),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'findings';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4009),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'muscle';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4010),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'featuring';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4011),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'iso';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4012),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'implement';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4013),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'clicking';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4014),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'scheduled';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4015),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'polls';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4016),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'typical';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4017),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'tower';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4018),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sum';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4019),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'misc';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4020),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'calculator';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4021),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'significantly';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4022),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'temporary';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4023),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'attend';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4024),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sufficient';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4025),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'holdem';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4026),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'shell';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4027),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'province';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4028),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'catholic';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4029),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'oak';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4030),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'vat';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4031),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'awareness';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4032),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'vancouver';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4033),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'governor';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4034),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'contribution';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4035),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'measurement';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4036),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'swimming';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4037),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'spyware';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4038),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'formula';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4039),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'constitution';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4040),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'packaging';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4041),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'solar';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4042),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'jose';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4043),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pakistan';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4044),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'reliable';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4045),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'consultation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4046),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'northwest';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4047),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'earn';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4048),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'finder';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4049),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'unable';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4050),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'periods';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4051),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'classroom';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4052),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'tasks';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4053),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'democracy';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4054),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'attacks';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4055),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'wallpaper';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4056),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'merchandise';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4057),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'const';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4058),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'resistance';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4059),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'symptoms';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4060),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'resorts';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4061),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'memorial';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4062),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'visitor';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4063),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'twin';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4064),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'forth';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4065),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'insert';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4066),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'baltimore';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4067),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'gateway';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4068),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'dont';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4069),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'alumni';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4070),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'drawing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4071),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'candidates';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4072),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'charlotte';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4073),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'biological';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4074),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'transition';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4075),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'preferences';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4076),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'spy';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4077),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'romance';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4078),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'instrument';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4079),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'bruce';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4080),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'themes';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4081),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'bits';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4082),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'classification';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4083),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'focused';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4084),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'egypt';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4085),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'physician';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4086),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'hollywood';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4087),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'bargain';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4088),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'wikipedia';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4089),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cellular';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4090),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'norway';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4091),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'vermont';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4092),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'blocks';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4093),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'normally';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4094),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'spiritual';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4095),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'hunting';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4096),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'diabetes';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4097),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'shift';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4098),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'chip';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4099),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'res';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4100),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'photographs';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4101),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cutting';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4102),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'wow';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4103),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'writers';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4104),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'marks';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4105),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'flexible';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4106),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mapping';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4107),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'numerous';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4108),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'relatively';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4109),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'satisfaction';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4110),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'represents';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4111),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'char';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4112),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'indexed';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4113),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pittsburgh';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4114),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'superior';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4115),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'preferred';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4116),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cartoon';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4117),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'shots';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4118),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'intellectual';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4119),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'moore';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4120),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'granted';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4121),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'choices';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4122),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'carbon';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4123),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'spending';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4124),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'magnetic';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4125),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'interaction';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4126),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'effectively';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4127),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'registry';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4128),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'crisis';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4129),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'outlook';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4130),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'massive';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4131),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'denmark';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4132),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'employed';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4133),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'header';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4134),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'poverty';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4135),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'formed';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4136),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'piano';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4137),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'echo';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4138),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'que';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4139),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'grid';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4140),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sheets';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4141),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'patrick';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4142),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'experimental';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4143),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'puerto';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4144),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'revolution';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4145),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'consolidation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4146),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'displays';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4147),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'plasma';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4148),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'allowing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4149),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'earnings';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4150),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'voip';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4151),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mystery';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4152),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'landscape';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4153),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'dependent';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4154),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mechanical';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4155),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'delaware';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4156),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'bidding';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4157),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'consultants';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4158),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'risks';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4159),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'banner';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4160),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'applicant';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4161),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'charter';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4162),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'fig';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4163),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'barbara';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4164),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cooperation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4165),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'counties';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4166),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'acquisition';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4167),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ports';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4168),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'implemented';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4169),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'directories';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4170),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'recognized';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4171),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'blogger';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4172),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'notification';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4173),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'licensing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4174),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'stands';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4175),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'occurred';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4176),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'textbooks';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4177),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'rapid';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4178),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'hairy';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4179),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'diversity';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4180),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cleveland';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4181),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'reverse';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4182),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'deposit';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4183),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'seminar';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4184),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'investments';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4185),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'latina';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4186),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'nasa';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4187),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'wheels';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4188),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'specify';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4189),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'accessibility';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4190),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'dutch';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4191),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sensitive';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4192),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'templates';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4193),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'formats';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4194),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'tab';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4195),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'boots';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4196),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'holds';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4197),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'router';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4198),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'concrete';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4199),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'editing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4200),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'poland';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4201),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'folder';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4202),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'womens';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4203),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'completion';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4204),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'upload';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4205),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pulse';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4206),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'universities';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4207),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'technique';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4208),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'contractors';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4209),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'voting';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4210),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'courts';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4211),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'notices';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4212),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'subscriptions';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4213),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'calculate';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4214),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'detroit';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4215),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'alexander';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4216),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'broadcast';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4217),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'converted';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4218),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'metro';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4219),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'toshiba';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4220),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'anniversary';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4221),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'improvements';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4222),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'strip';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4223),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'specification';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4224),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pearl';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4225),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'accessible';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4226),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'accessory';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4227),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'resident';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4228),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'plot';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4229),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'qty';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4230),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'airline';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4231),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'typically';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4232),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'representation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4233),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'regard';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4234),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pump';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4235),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'exists';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4236),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'arrangements';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4237),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'smooth';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4238),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'conferences';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4239),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'uniprotkb';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4240),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'consumption';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4241),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'birmingham';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4242),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'flashing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4243),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'narrow';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4244),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'threat';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4245),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'surveys';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4246),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'consultant';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4247),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'controller';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4248),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ownership';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4249),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'committees';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4250),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'legislative';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4251),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'researchers';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4252),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'vietnam';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4253),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'trailer';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4254),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'anne';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4255),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'gardens';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4256),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'malaysia';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4257),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'unsubscribe';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4258),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'antique';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4259),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'labels';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4260),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'bio';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4261),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'molecular';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4262),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'stored';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4263),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'exam';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4264),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'logos';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4265),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'residence';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4266),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'attorneys';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4267),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'antiques';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4268),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'density';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4269),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'operators';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4270),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sustainable';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4271),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'philippines';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4272),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'statistical';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4273),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'beds';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4274),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'innovation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4275),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pcs';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4276),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'employers';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4277),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'grey';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4278),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'parallel';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4279),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'honda';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4280),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'amended';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4281),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'operate';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4282),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'bills';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4283),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'bold';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4284),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'stable';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4285),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'opera';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4286),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'definitions';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4287),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'von';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4288),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cinema';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4289),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'asset';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4290),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'scan';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4291),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'elections';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4292),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'reaction';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4293),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'blank';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4294),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'enhanced';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4295),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'entitled';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4296),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'severe';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4297),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'generate';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4298),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'stainless';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4299),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'newspapers';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4300),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'hospitals';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4301),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'deluxe';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4302),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'humor';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4303),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'aged';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4304),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'monitors';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4305),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'exception';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4306),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'duration';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4307),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'bulk';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4308),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'successfully';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4309),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'indonesia';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4310),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pursuant';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4311),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sci';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4312),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'fabric';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4313),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'edt';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4314),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'visits';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4315),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'primarily';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4316),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'domains';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4317),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'capabilities';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4318),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pmid';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4319),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'contrast';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4320),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'recommendation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4321),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'recruitment';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4322),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sin';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4323),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'berlin';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4324),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'organized';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4325),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'para';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4326),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'siemens';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4327),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'adoption';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4328),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'improving';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4329),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'capture';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4330),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'buffalo';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4331),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'organisations';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4332),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'explained';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4333),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'seed';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4334),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'programmes';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4335),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'desire';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4336),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'expertise';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4337),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mechanism';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4338),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'camping';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4339),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'jewellery';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4340),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'meets';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4341),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'welfare';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4342),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'peer';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4343),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'marked';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4344),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'driven';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4345),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'measured';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4346),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'medline';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4347),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'agreements';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4348),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'considering';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4349),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'innovative';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4350),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'marshall';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4351),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'massage';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4352),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'rubber';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4353),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'conclusion';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4354),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'closing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4355),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'tampa';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4356),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'legend';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4357),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'susan';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4358),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4359),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'adams';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4360),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'python';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4361),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'bang';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4362),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'villa';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4363),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'bone';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4364),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'columns';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4365),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'disorders';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4366),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'bugs';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4367),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'collaboration';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4368),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'hamilton';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4369),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'detection';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4370),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ftp';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4371),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cookies';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4372),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'inner';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4373),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'formation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4374),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'tutorial';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4375),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'med';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4376),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'engineers';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4377),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'entity';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4378),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cruises';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4379),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'holder';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4380),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'proposals';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4381),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'moderator';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4382),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'tutorials';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4383),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'settlement';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4384),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'portugal';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4385),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'lawrence';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4386),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'roman';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4387),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'duties';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4388),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'valuable';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4389),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'tone';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4390),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'collectables';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4391),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ethics';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4392),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'dragon';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4393),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'heating';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4394),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'wing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4395),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'governments';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4396),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'purchasing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4397),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'scripts';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4398),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'abc';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4399),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'stereo';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4400),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'appointed';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4401),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'dealing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4402),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'commit';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4403),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'operational';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4404),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'rail';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4405),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'airlines';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4406),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'liberal';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4407),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'livecam';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4408),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'jay';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4409),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'trips';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4410),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'gap';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4411),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sides';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4412),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'tube';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4413),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'corresponding';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4414),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'descriptions';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4415),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cache';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4416),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'belt';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4417),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'jacket';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4418),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'determination';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4419),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'animation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4420),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'oracle';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4421),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'matthew';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4422),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'lease';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4423),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'productions';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4424),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'aviation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4425),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'hobbies';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4426),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'excess';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4427),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'disaster';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4428),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'console';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4429),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'commands';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4430),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'telecommunications';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4431),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'instructor';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4432),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'achieved';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4433),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'injuries';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4434),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'shipped';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4435),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'seats';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4436),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'approaches';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4437),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'biz';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4438),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'voltage';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4439),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'anthony';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4440),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'nintendo';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4441),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'loading';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4442),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'stamps';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4443),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'appeared';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4444),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'franklin';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4445),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'angle';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4446),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'rob';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4447),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'vinyl';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4448),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'highlights';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4449),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mining';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4450),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'designers';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4451),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'melbourne';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4452),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ongoing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4453),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'imaging';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4454),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'betting';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4455),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'scientists';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4456),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'liberty';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4457),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'wyoming';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4458),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'blackjack';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4459),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'argentina';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4460),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'era';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4461),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'convert';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4462),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'possibility';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4463),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'analyst';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4464),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'commissioner';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4465),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'garage';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4466),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'reliability';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4467),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'thongs';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4468),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'gcc';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4469),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'respectively';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4470),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'volunteers';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4471),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'attachment';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4472),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ringtone';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4473),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'finland';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4474),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'morgan';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4475),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'derived';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4476),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'oriented';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4477),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'eagle';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4478),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'desktops';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4479),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'columbus';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4480),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'prayer';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4481),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'appointment';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4482),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'workshops';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4483),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'hurricane';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4484),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'postage';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4485),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'producer';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4486),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'represented';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4487),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mortgages';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4488),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'dial';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4489),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'responsibilities';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4490),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'comic';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4491),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'jet';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4492),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'productivity';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4493),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'investors';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4494),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'crown';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4495),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'par';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4496),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'underground';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4497),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'diagnosis';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4498),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'maker';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4499),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'crack';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4500),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'principle';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4501),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'picks';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4502),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'vacations';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4503),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'semester';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4504),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'calculated';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4505),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'fetish';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4506),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'applies';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4507),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'casinos';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4508),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'appearance';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4509),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'apache';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4510),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'filters';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4511),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'incorporated';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4512),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'craft';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4513),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'notebooks';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4514),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'lounge';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4515),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'algorithm';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4516),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'semi';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4517),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'coins';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4518),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'gross';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4519),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'strongly';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4520),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cafe';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4521),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'valentine';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4522),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'hilton';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4523),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ken';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4524),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'proteins';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4525),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'horror';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4526),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'exp';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4527),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'capable';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4528),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'douglas';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4529),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'debian';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4530),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'involving';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4531),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pen';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4532),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'investing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4533),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'christopher';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4534),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'admission';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4535),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'epson';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4536),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'shoe';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4537),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'elected';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4538),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'carrying';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4539),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'victory';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4540),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sand';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4541),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'madison';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4542),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'terrorism';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4543),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'editions';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4544),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cpu';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4545),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mainly';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4546),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ethnic';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4547),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'parliament';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4548),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'actor';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4549),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'seal';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4550),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'situations';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4551),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'fifth';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4552),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'allocated';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4553),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'citizen';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4554),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'vertical';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4555),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'corrections';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4556),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'structural';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4557),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'municipal';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4558),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'describes';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4559),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'prize';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4560),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'occurs';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4561),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'jon';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4562),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'absolute';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4563),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'disabilities';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4564),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'consists';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4565),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'anytime';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4566),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'substance';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4567),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'prohibited';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4568),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'addressed';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4569),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pipe';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4570),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'guardian';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4571),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'lecture';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4572),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'simulation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4573),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'layout';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4574),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'initiatives';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4575),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'concentration';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4576),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'classics';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4577),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'lbs';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4578),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'interpretation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4579),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'lol';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4580),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'deck';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4581),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'wayne';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4582),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'donate';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4583),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'bankruptcy';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4584),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'worker';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4585),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'optimization';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4586),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'substances';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4587),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'wings';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4588),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'breaks';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4589),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'genetic';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4590),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'restrictions';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4591),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'participating';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4592),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'waters';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4593),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'thin';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4594),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'exhibition';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4595),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ridge';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4596),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cabinet';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4597),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'modem';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4598),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'harris';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4599),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mph';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4600),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'dose';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4601),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'evaluate';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4602),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'tiffany';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4603),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'tropical';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4604),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'collect';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4605),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'composition';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4606),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'toyota';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4607),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'nationwide';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4608),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'vector';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4609),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'shaved';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4610),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'buffer';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4611),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'purple';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4612),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'existence';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4613),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'commentary';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4614),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'limousines';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4615),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'developments';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4616),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'def';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4617),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'immigration';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4618),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'destinations';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4619),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'lets';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4620),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mutual';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4621),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pipeline';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4622),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'necessarily';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4623),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'syntax';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4624),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'attribute';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4625),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'skill';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4626),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'chairs';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4627),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'everyday';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4628),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'surrounding';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4629),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mountains';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4630),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'moves';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4631),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'popularity';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4632),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'inquiry';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4633),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ethernet';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4634),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'exhibit';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4635),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'trend';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4636),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sierra';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4637),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'visible';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4638),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cats';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4639),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'desert';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4640),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'postposted';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4641),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'oldest';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4642),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'rhode';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4643),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'nba';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4644),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'coordinator';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4645),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mercury';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4646),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'steven';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4647),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'handbook';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4648),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'greg';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4649),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'navigate';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4650),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'summit';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4651),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'epa';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4652),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'spaces';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4653),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'fundamental';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4654),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'coupons';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4655),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'somewhat';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4656),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'receiver';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4657),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'substantial';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4658),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'progressive';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4659),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cialis';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4660),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'boats';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4661),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'glance';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4662),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'scottish';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4663),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'championship';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4664),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'arcade';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4665),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'richmond';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4666),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sacramento';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4667),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ron';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4668),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'russell';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4669),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'fiber';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4670),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'depression';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4671),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'graph';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4672),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'covering';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4673),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'platinum';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4674),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'judgment';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4675),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'bedrooms';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4676),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'talks';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4677),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'filing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4678),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'foster';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4679),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'modeling';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4680),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'passing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4681),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'awarded';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4682),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'testimonials';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4683),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'trials';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4684),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'tissue';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4685),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'memorabilia';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4686),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'clinton';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4687),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'masters';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4688),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'bonds';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4689),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cartridge';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4690),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'alberta';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4691),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'explanation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4692),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'folk';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4693),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'commons';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4694),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cincinnati';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4695),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'subsection';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4696),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'fraud';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4697),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'electricity';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4698),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'permitted';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4699),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'spectrum';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4700),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'arrival';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4701),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pottery';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4702),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'emphasis';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4703),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'aspect';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4704),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'workplace';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4705),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mexican';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4706),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'confirmed';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4707),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'counts';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4708),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'priced';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4709),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'wallpapers';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4710),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'hist';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4711),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'desired';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4712),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'inter';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4713),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'assumes';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4714),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'heights';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4715),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'shadow';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4716),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'riding';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4717),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'infection';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4718),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'firefox';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4719),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'expense';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4720),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'grove';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4721),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'eligibility';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4722),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'venture';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4723),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'clinic';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4724),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'korean';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4725),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'healing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4726),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mall';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4727),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'entering';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4728),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'packet';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4729),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'spray';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4730),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'studios';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4731),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'involvement';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4732),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'buttons';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4733),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'placement';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4734),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'observations';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4735),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'funded';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4736),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'thompson';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4737),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'winners';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4738),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'extend';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4739),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'roads';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4740),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'subsequent';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4741),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pat';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4742),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'dublin';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4743),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'rolling';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4744),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'motorcycle';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4745),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'yard';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4746),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'disclosure';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4747),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'establishment';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4748),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'nelson';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4749),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'creates';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4750),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'faces';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4751),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'tourist';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4752),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sean';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4753),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'adequate';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4754),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'senator';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4755),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'yield';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4756),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'presentations';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4757),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'grades';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4758),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cartoons';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4759),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pour';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4760),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'digest';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4761),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'reg';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4762),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'lodging';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4763),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'tion';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4764),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'dust';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4765),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'hence';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4766),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'wiki';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4767),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'entirely';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4768),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'replaced';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4769),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'radar';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4770),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'rescue';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4771),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'undergraduate';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4772),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'losses';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4773),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'combat';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4774),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'reducing';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4775),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'occupation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4776),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'lakes';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4777),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'donations';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4778),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'associations';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4779),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'citysearch';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4780),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'closely';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4781),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'radiation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4782),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'diary';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4783),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'kings';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4784),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'kent';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4785),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'adds';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4786),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'nsw';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4787),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ear';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4788),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'flags';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4789),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pci';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4790),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'baker';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4791),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'launched';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4792),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'elsewhere';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4793),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pollution';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4794),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'conservative';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4795),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'guestbook';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4796),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'shock';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4797),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'effectiveness';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4798),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'abroad';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4799),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ebony';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4800),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ward';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4801),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'drawn';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4802),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'arthur';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4803),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ian';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4804),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'visited';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4805),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'walker';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4806),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'demonstrate';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4807),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'atmosphere';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4808),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'suggests';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4809),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'beast';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4810),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'operated';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4811),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'experiment';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4812),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'targets';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4813),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'overseas';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4814),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'purchases';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4815),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'dodge';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4816),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'counsel';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4817),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'federation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4818),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pizza';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4819),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'yards';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4820),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'assignment';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4821),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'chemicals';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4822),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'gordon';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4823),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mod';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4824),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'farmers';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4825),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'queries';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4826),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'bmw';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4827),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ukraine';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4828),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'absence';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4829),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'nearest';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4830),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cluster';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4831),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'vendors';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4832),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'whereas';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4833),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'yoga';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4834),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'serves';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4835),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'lamp';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4836),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'rico';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4837),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'partial';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4838),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'shoppers';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4839),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'phil';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4840),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'couples';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4841),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'nashville';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4842),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ranking';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4843),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'jokes';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4844),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cst';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4845),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ceo';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4846),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'simpson';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4847),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'twiki';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4848),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sublime';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4849),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'counseling';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4850),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'palace';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4851),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'acceptable';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4852),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'satisfied';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4853),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'wins';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4854),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'measurements';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4855),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'verify';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4856),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'globe';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4857),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'trusted';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4858),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'copper';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4859),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'milwaukee';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4860),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'rack';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4861),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'medication';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4862),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'warehouse';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4863),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'shareware';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4864),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'rep';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4865),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'dicke';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4866),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'kerry';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4867),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'receipt';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4868),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ordinary';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4869),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'violation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4870),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'configure';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4871),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'stability';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4872),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mit';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4873),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'applying';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4874),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'southwest';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4875),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pride';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4876),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'institutional';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4877),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'expectations';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4878),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'independence';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4879),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'reporter';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4880),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'metabolism';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4881),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'keith';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4882),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'champion';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4883),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cloudy';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4884),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'linda';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4885),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ross';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4886),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'chile';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4887),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'solo';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4888),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sentence';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4889),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ignore';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4890),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'uniform';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4891),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'excellence';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4892),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'wealth';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4893),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'tall';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4894),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'vacuum';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4895),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'attributes';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4896),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'brass';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4897),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'writes';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4898),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'plaza';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4899),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pdas';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4900),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'outcomes';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4901),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'survival';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4902),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'quest';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4903),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'publish';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4904),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sri';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4905),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'screening';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4906),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'toe';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4907),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'thumbnail';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4908),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'trans';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4909),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'jonathan';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4910),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'nova';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4911),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'lifetime';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4912),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'api';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4913),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pioneer';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4914),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'booty';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4915),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'acrobat';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4916),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'plates';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4917),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'acres';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4918),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'venue';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4919),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'athletic';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4920),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'thermal';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4921),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'essays';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4922),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'vital';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4923),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'fairly';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4924),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'coastal';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4925),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'config';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4926),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'charity';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4927),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'intelligent';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4928),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'edinburgh';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4929),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'excel';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4930),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'modes';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4931),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'obligation';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4932),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'campbell';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4933),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'harbor';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4934),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'hungary';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4935),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'traveler';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4936),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'urw';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4937),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'segment';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4938),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'regardless';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4939),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'lan';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4940),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'puzzle';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4941),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'rising';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4942),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'aluminum';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4943),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'wells';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4944),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'wishlist';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4945),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'insight';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4946),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'sms';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4947),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'restricted';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4948),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'republican';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4949),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'latter';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4950),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'merchants';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4951),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'thick';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4952),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'trailers';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4953),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'syndrome';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4954),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'philips';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4955),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'attendance';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4956),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'penalty';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4957),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'drum';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4958),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'enables';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4959),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'nec';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4960),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'iraqi';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4961),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'builder';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4962),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'vista';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4963),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'jessica';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4964),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'chips';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4965),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'terry';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4966),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'flood';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4967),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'foto';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4968),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'ease';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4969),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'arguments';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4970),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'amsterdam';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4971),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'arena';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4972),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'adventures';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4973),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pupils';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4974),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'stewart';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4975),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'announcement';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4976),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'tabs';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4977),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'outcome';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4978),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'expanded';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4979),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'casual';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4980),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'polish';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4981),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'extras';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4982),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'centres';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4983),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'clause';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4984),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'lands';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4985),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'troops';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4986),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'indoor';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4987),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'bulgaria';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4988),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'armed';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4989),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'broker';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4990),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'charger';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4991),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'regularly';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4992),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'pine';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4993),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'cooling';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4994),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'tend';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4995),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'gulf';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4996),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'rick';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4997),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'trucks';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4998),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'mechanisms';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 4999),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'shopper';
UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, 5000),
    updated_at = unixepoch()
WHERE language_id = 1 AND normalized_text = 'tokyo';

INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, COALESCE(l.frequency_rank, 0)
FROM collection c
JOIN lexeme l ON l.language_id = 1
WHERE c.name = 'Top 5000 Words'
  AND l.normalized_text IN ('a', 'i', 'web', 'online', 'services', 'click', 'email', 'products', 'product', 'policy', 'available', 'copyright', 'software', 'info', 'links', 'review', 'privacy', 'items', 'user', 'january', 'mail', 'reviews', 'management', 'item', 'international', 'comments', 'development', 'terms', 'hotels', 'education', 'design', 'posted', 'internet', 'dvd', 'shipping', 'reserved', 'forum', 'prices', 'website', 'index', 'link', 'technology', 'pages', 'version', 'section', 'sports', 'related', 'county', 'network', 'systems', 'download', 'resources', 'current', 'posts', 'media', 'guide', 'directory', 'text', 'rating', 'rate', 'usa', 'shopping', 'sites', 'digital', 'profile', 'previous', 'events', 'image', 'title', 'description', 'non', 'quality', 'listing', 'content', 'tools', 'reply', 'customer', 'december', 'compare', 'include', 'value', 'article', 'provide', 'source', 'author', 'sale', 'print', 'canada', 'teen', 'stock', 'categories', 'advanced', 'sales', 'estate', 'conditions', 'select', 'windows', 'thread', 'category', 'gallery', 'register', 'june', 'october', 'november', 'library', 'series', 'features', 'industry', 'provided', 'required', 'accessories', 'forums', 'march', 'september', 'july', 'server', 'application', 'cart', 'articles', 'feedback', 'issues', 'april', 'users', 'topic', 'comment', 'financial', 'standard', 'tax', 'below', 'mobile', 'blog', 'payment', 'equipment', 'login', 'programs', 'offers', 'recent', 'stores', 'performance', 'august', 'quote', 'options', 'rates', 'activities', 'additional', 'password', 'latest', 'texas', 'poker', 'status', 'browse', 'range', 'seller', 'february', 'result', 'audio', 'groups', 'files', 'analysis', 'fax', 'areas', 'committee', 'washington', 'id', 'california', 'similar', 'schools', 'added', 'reference', 'companies', 'listed', 'learning', 'delivery', 'net', 'popular', 'term', 'computers', 'journal', 'reports', 'central', 'images', 'self', 'council', 'includes', 'australia', 'discussion', 'archive', 'entertainment', 'agreement', 'format', 'log', 'faq', 'edition', 'messages', 'marketing', 'updated', 'association', 'provides', 'studies', 'specific', 'collection', 'arts', 'display', 'limited', 'powered', 'solutions', 'daily', 'electronics', 'database', 'official', 'average', 'technical', 'pro', 'region', 'direct', 'microsoft', 'conference', 'environment', 'district', 'calendar', 'costs', 'update', 'downloads', 'resource', 'applications', 'document', 'material', 'federal', 'hosting', 'adult', 'centre', 'requirements', 'via', 'finance', 'gifts', 'topics', 'individual', 'tips', 'auto', 'edit', 'videos', 'percent', 'function', 'global', 'tech', 'economic', 'projects', 'lyrics', 'subscribe', 'submit', 'germany', 'included', 'deals', 'various', 'linux', 'production', 'commercial', 'advertising', 'treatment', 'newsletter', 'archives', 'magazine', 'error', 'currently', 'construction', 'toys', 'registered', 'golf', 'receive', 'domain', 'methods', 'chapter', 'protection', 'policies', 'loan', 'wide', 'india', 'listings', 'models', 'engineering', 'florida', 'wireless', 'license', 'annual', 'published', 'basic', 'sony', 'corporate', 'google', 'method', 'purchase', 'customers', 'active', 'response', 'hardware', 'materials', 'holiday', 'chat', 'designed', 'countries', 'brand', 'discount', 'effects', 'standards', 'yellow', 'increase', 'advertise', 'kingdom', 'environmental', 'storage', 'japan', 'loans', 'entry', 'availability', 'africa', 'summary', 'growth', 'notes', 'agency', 'monday', 'european', 'activity', 'pics', 'western', 'income', 'employment', 'overall', 'bay', 'commission', 'ad', 'package', 'contents', 'players', 'port', 'album', 'regional', 'supplies', 'administration', 'institute', 'views', 'screen', 'exchange', 'types', 'sponsored', 'electronic', 'benefits', 'apply', 'printer', 'effective', 'organization', 'effect', 'eur', 'selection', 'casino', 'menu', 'volume', 'mortgage', 'corporation', 'solution', 'mature', 'role', 'addition', 'supply', 'usr', 'executive', 'union', 'jewelry', 'clothing', 'mon', 'homepage', 'skills', 'bush', 'islands', 'rental', 'teens', 'pre', 'sat', 'facilities', 'zip', 'bid', 'sellers', 'cable', 'opportunities', 'values', 'division', 'tuesday', 'object', 'lesbian', 'appropriate', 'logo', 'length', 'score', 'statistics', 'returns', 'capital', 'sample', 'investment', 'shown', 'culture', 'flash');

INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, COALESCE(l.frequency_rank, 0)
FROM collection c
JOIN lexeme l ON l.language_id = 1
WHERE c.name = 'Top 5000 Words'
  AND l.normalized_text IN ('registration', 'fri', 'thursday', 'courses', 'consumer', 'furniture', 'levels', 'channel', 'mode', 'phones', 'wednesday', 'structure', 'fund', 'degree', 'button', 'releases', 'wed', 'homes', 'custom', 'virginia', 'located', 'multiple', 'asian', 'distribution', 'editor', 'inn', 'industrial', 'cause', 'potential', 'cnet', 'ltd', 'los', 'featured', 'rooms', 'inc', 'communications', 'associated', 'primary', 'tool', 'browser', 'foundation', 'friendly', 'schedule', 'documents', 'communication', 'feature', 'independent', 'approach', 'cameras', 'physical', 'operating', 'maps', 'ratings', 'chicago', 'forms', 'tue', 'developed', 'unique', 'survey', 'prior', 'sport', 'sources', 'mexico', 'population', 'regular', 'secure', 'navigation', 'operations', 'therefore', 'christian', 'option', 'valley', 'thu', 'rentals', 'publications', 'worldwide', 'improve', 'publisher', 'larger', 'anti', 'networks', 'nokia', 'impact', 'transfer', 'introduction', 'tel', 'carolina', 'properties', 'overview', 'accommodation', 'owners', 'disease', 'italy', 'kit', 'classic', 'basis', 'cities', 'express', 'award', 'assessment', 'ensure', 'thus', 'interface', 'partners', 'budget', 'rated', 'guides', 'maximum', 'existing', 'selected', 'amazon', 'patients', 'restaurants', 'locations', 'significant', 'lists', 'technologies', 'retail', 'useful', 'directly', 'manufacturer', 'est', 'providing', 'mac', 'housing', 'iii', 'gmt', 'catalog', 'searches', 'authority', 'considered', 'traffic', 'programme', 'joined', 'input', 'strategy', 'valid', 'bin', 'modern', 'senior', 'ireland', 'teaching', 'testing', 'units', 'canadian', 'enterprise', 'ships', 'educational', 'leading', 'metal', 'fitness', 'asia', 'abstract', 'uses', 'output', 'funds', 'greater', 'develop', 'employees', 'artists', 'alternative', 'processing', 'resolution', 'java', 'publication', 'relations', 'contains', 'session', 'multi', 'photography', 'republic', 'fees', 'components', 'vacation', 'academic', 'assistance', 'completed', 'graphics', 'indian', 'prev', 'ads', 'grade', 'pacific', 'organizations', 'filter', 'mailing', 'vehicle', 'int', 'northern', 'panel', 'proposed', 'default', 'require', 'iraq', 'outdoor', 'allows', 'protein', 'reported', 'transportation', 'mini', 'politics', 'disclaimer', 'authors', 'boards', 'faculty', 'parties', 'membership', 'string', 'modified', 'released', 'internal', 'goods', 'recommended', 'detailed', 'approved', 'background', 'usb', 'maintenance', 'ability', 'functions', 'brands', 'trademarks', 'phentermine', 'spain', 'southern', 'etc', 'battery', 'youth', 'submitted', 'boston', 'debt', 'keywords', 'medium', 'television', 'core', 'purposes', 'throughout', 'sets', 'wood', 'msn', 'defined', 'awards', 'fee', 'studio', 'reader', 'virtual', 'device', 'established', 'las', 'remote', 'programming', 'external', 'apple', 'regarding', 'instructions', 'min', 'offered', 'remove', 'aid', 'surface', 'minimum', 'visual', 'host', 'variety', 'teachers', 'isbn', 'manual', 'subjects', 'agents', 'increased', 'repair', 'civil', 'steel', 'understanding', 'songs', 'associates', 'updates', 'desktop', 'classes', 'ohio', 'sector', 'capacity', 'requires', 'jersey', 'fully', 'electric', 'instruments', 'quotes', 'businesses', 'unknown', 'specified', 'pst', 'procedures', 'workers', 'georgia', 'traditional', 'campus', 'creative', 'coast', 'benefit', 'progress', 'funding', 'devices', 'sub', 'fiction', 'watches', 'careers', 'museum', 'transport', 'blogs', 'evaluation', 'accepted', 'former', 'implementation', 'hits', 'zone', 'complex', 'galleries', 'references', 'presented', 'flow', 'agencies', 'literature', 'respective', 'parent', 'michigan', 'columbia', 'setting', 'scale', 'economy', 'highest', 'helpful', 'monthly', 'critical', 'frame', 'musical', 'definition', 'angeles', 'networking', 'australian', 'employee', 'magazines', 'packages', 'detail', 'francisco', 'laws', 'pet', 'individuals', 'colorado', 'switch', 'largest', 'african', 'titles', 'relevant', 'guidelines', 'connect', 'bible', 'dev', 'basket', 'applied', 'weekly', 'vol', 'installation', 'described', 'demand', 'suite', 'vegas', 'advance', 'skip', 'diet', 'auction', 'gear', 'nation', 'sheet', 'firm', 'illinois', 'regulations', 'elements', 'species', 'cells', 'module', 'resort', 'facility', 'random', 'pricing', 'dvds', 'certificate', 'motion', 'fashion', 'directions', 'visitors', 'documentation', 'monitor', 'trading', 'coverage', 'vision', 'ending', 'clients', 'actions', 'automotive');

INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, COALESCE(l.frequency_rank, 0)
FROM collection c
JOIN lexeme l ON l.language_id = 1
WHERE c.name = 'Top 5000 Words'
  AND l.normalized_text IN ('goal', 'successful', 'communities', 'clinical', 'sciences', 'markets', 'lowest', 'highly', 'publishing', 'appear', 'developing', 'currency', 'leather', 'determine', 'temperature', 'palm', 'announcements', 'actual', 'historical', 'commerce', 'ringtones', 'persons', 'scientific', 'satellite', 'tests', 'accounts', 'amateur', 'xbox', 'particularly', 'factors', 'settings', 'buyer', 'cultural', 'oral', 'ford', 'poster', 'edge', 'functional', 'root', 'holidays', 'pink', 'zealand', 'balance', 'monitoring', 'graduate', 'replies', 'architecture', 'initial', 'label', 'llc', 'sec', 'recommend', 'canon', 'league', 'provider', 'optional', 'dictionary', 'accounting', 'manufacturing', 'sections', 'fishing', 'effort', 'phase', 'fields', 'fantasy', 'motor', 'context', 'install', 'apparel', 'generally', 'continued', 'mass', 'breast', 'techniques', 'ibm', 'johnson', 'websites', 'religion', 'claim', 'patch', 'measures', 'generation', 'kansas', 'chemical', 'task', 'reduce', 'component', 'enable', 'exercise', 'bug', 'mid', 'guarantee', 'diamond', 'israel', 'processes', 'servers', 'meetings', 'jones', 'arizona', 'keyword', 'interests', 'congress', 'fuel', 'username', 'produced', 'italian', 'paperback', 'classifieds', 'supported', 'saint', 'argument', 'creating', 'joint', 'premium', 'providers', 'characters', 'upgrade', 'factor', 'stream', 'apartments', 'eastern', 'auctions', 'therapy', 'entries', 'dates', 'generated', 'upper', 'administrative', 'prime', 'samsung', 'limit', 'louis', 'steps', 'errors', 'shops', 'del', 'efforts', 'informed', 'creek', 'quantity', 'urban', 'practices', 'sorted', 'reporting', 'essential', 'tours', 'platform', 'load', 'affiliate', 'labor', 'admin', 'nursing', 'machines', 'designated', 'tags', 'recovery', 'integrated', 'configuration', 'merchant', 'comprehensive', 'expert', 'universal', 'solid', 'cds', 'presentation', 'languages', 'orange', 'compliance', 'vehicles', 'prevent', 'theme', 'campaign', 'marine', 'improvement', 'guitar', 'pennsylvania', 'examples', 'ipod', 'claims', 'motorola', 'acceptance', 'strategies', 'affairs', 'intended', 'goals', 'hire', 'election', 'branch', 'charges', 'affiliates', 'mount', 'latin', 'multimedia', 'certified', 'rank', 'computing', 'oregon', 'element', 'virus', 'abuse', 'interactive', 'requests', 'separate', 'quarter', 'procedure', 'leadership', 'tables', 'define', 'racing', 'religious', 'facts', 'kong', 'column', 'plants', 'chain', 'developer', 'identify', 'avenue', 'approximately', 'domestic', 'sitemap', 'recommendations', 'houston', 'comparison', 'mental', 'viewed', 'extended', 'sequence', 'inch', 'centers', 'reserve', 'recipes', 'cvs', 'gamma', 'plastic', 'produce', 'placed', 'counter', 'failure', 'follows', 'dollar', 'ontario', 'automatically', 'des', 'minnesota', 'films', 'native', 'williams', 'movement', 'printing', 'baseball', 'owned', 'approval', 'draft', 'chart', 'contacts', 'readers', 'clubs', 'lcd', 'jackson', 'equal', 'adventure', 'matching', 'offering', 'shirts', 'profit', 'leaders', 'posters', 'institutions', 'variable', 'ave', 'advertisement', 'parking', 'headlines', 'compared', 'determined', 'wholesale', 'workshop', 'russia', 'codes', 'kinds', 'extension', 'seattle', 'statements', 'golden', 'teams', 'fort', 'lighting', 'senate', 'gene', 'portable', 'electrical', 'applicable', 'disc', 'pattern', 'theatre', 'laser', 'manufacturers', 'sponsor', 'classical', 'icon', 'warranty', 'dedicated', 'indiana', 'basketball', 'objects', 'delete', 'assembly', 'nuclear', 'taxes', 'mouse', 'issued', 'sexual', 'wisconsin', 'obtained', 'false', 'cast', 'flower', 'personnel', 'supplied', 'identified', 'falls', 'pic', 'aids', 'opinions', 'promote', 'stated', 'stats', 'hawaii', 'professionals', 'appears', 'flag', 'covers', 'advantage', 'designs', 'maintain', 'tourism', 'priority', 'newsletters', 'adults', 'clips', 'savings', 'graphic', 'atom', 'payments', 'estimated', 'binding', 'brief', 'winning', 'anonymous', 'iron', 'script', 'served', 'miscellaneous', 'void', 'dining', 'alert', 'integration', 'atlanta', 'dakota', 'tag', 'mix', 'framework', 'disk', 'installed', 'vhs', 'credits', 'criteria', 'pubmed', 'massachusetts', 'diego', 'hong', 'vice', 'associate', 'behavior', 'enlarge', 'frequently', 'revenue', 'measure', 'votes', 'discussions', 'gain', 'festival', 'laboratory', 'flights', 'experts', 'signs', 'lack', 'depth', 'iowa', 'logged', 'laptop', 'vintage', 'explore', 'maryland', 'spa', 'concept', 'eligible', 'checkout', 'handling');

INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, COALESCE(l.frequency_rank, 0)
FROM collection c
JOIN lexeme l ON l.language_id = 1
WHERE c.name = 'Top 5000 Words'
  AND l.normalized_text IN ('origin', 'gaming', 'feeds', 'billion', 'destination', 'scotland', 'intelligence', 'dallas', 'con', 'ups', 'nations', 'route', 'specifications', 'tripadvisor', 'alaska', 'zoom', 'residential', 'anime', 'decisions', 'industries', 'protocol', 'query', 'clip', 'partnership', 'editorial', 'expression', 'equity', 'provisions', 'wire', 'principles', 'suggestions', 'rural', 'shared', 'replacement', 'strategic', 'spam', 'economics', 'acid', 'bytes', 'cent', 'compatible', 'height', 'null', 'zero', 'speaker', 'filed', 'netherlands', 'obtain', 'consulting', 'recreation', 'offices', 'designer', 'managed', 'korea', 'banks', 'participants', 'leads', 'negative', 'austin', 'favorites', 'toronto', 'theater', 'springs', 'missouri', 'andrew', 'var', 'perform', 'healthy', 'translation', 'estimates', 'font', 'assets', 'injury', 'joseph', 'ministry', 'drivers', 'figures', 'protected', 'proposal', 'sharing', 'philadelphia', 'portal', 'beta', 'fail', 'gratis', 'banking', 'officials', 'toward', 'slightly', 'assist', 'conduct', 'contained', 'lingerie', 'legislation', 'parameters', 'jazz', 'serving', 'bags', 'profiles', 'miami', 'comics', 'houses', 'postal', 'relationships', 'tennessee', 'controls', 'combined', 'ultimate', 'wales', 'representative', 'frequency', 'introduced', 'minor', 'departments', 'residents', 'noted', 'displayed', 'reduced', 'physics', 'rare', 'performed', 'extreme', 'samples', 'davis', 'bars', 'reviewed', 'row', 'forecast', 'removed', 'helps', 'singles', 'administrator', 'cycle', 'amounts', 'contain', 'accuracy', 'dual', 'usd', 'pharmacy', 'brazil', 'creation', 'static', 'hunter', 'addresses', 'crystal', 'writer', 'chairman', 'violence', 'fans', 'oklahoma', 'speakers', 'academy', 'dynamic', 'gender', 'permanent', 'agriculture', 'dell', 'cleaning', 'constitutes', 'portfolio', 'practical', 'delivered', 'collectibles', 'infrastructure', 'exclusive', 'concerns', 'vendor', 'originally', 'intel', 'utilities', 'philosophy', 'regulation', 'reduction', 'aim', 'bids', 'referred', 'supports', 'nutrition', 'recording', 'regions', 'junior', 'toll', 'les', 'cape', 'ann', 'tip', 'secondary', 'announced', 'prevention', 'ski', 'soccer', 'math', 'import', 'posting', 'presence', 'instant', 'automatic', 'healthcare', 'viewing', 'maintained', 'increasing', 'majority', 'connected', 'directors', 'aspects', 'austria', 'participation', 'scheme', 'utility', 'preview', 'manner', 'matrix', 'containing', 'combination', 'devel', 'amendment', 'despite', 'guaranteed', 'turkey', 'libraries', 'distributed', 'degrees', 'singapore', 'enterprises', 'delta', 'seeking', 'inches', 'phoenix', 'convention', 'shares', 'principal', 'comfort', 'colors', 'wars', 'cisco', 'ordering', 'alpha', 'appeal', 'cruise', 'bonus', 'certification', 'previously', 'bookmark', 'buildings', 'specials', 'disney', 'household', 'batteries', 'adobe', 'smoking', 'bbc', 'becomes', 'drives', 'alabama', 'improved', 'avg', 'achieve', 'positions', 'subscription', 'dealer', 'contemporary', 'utah', 'nearby', 'rom', 'carried', 'exposure', 'panasonic', 'permalink', 'signature', 'gambling', 'refer', 'miller', 'provision', 'outdoors', 'luxury', 'babes', 'frames', 'newspaper', 'toy', 'circuit', 'layer', 'printed', 'removal', 'src', 'liability', 'trademark', 'hip', 'printers', 'faqs', 'adding', 'kentucky', 'mostly', 'taylor', 'trackback', 'prints', 'factory', 'interior', 'revised', 'americans', 'optical', 'promotion', 'relative', 'dot', 'hiv', 'identity', 'suites', 'conversion', 'reasonable', 'victoria', 'serial', 'relief', 'revision', 'broadband', 'influence', 'ratio', 'pda', 'importance', 'dsl', 'webmaster', 'copies', 'recipe', 'zum', 'permit', 'diff', 'tennis', 'bass', 'prescription', 'instance', 'pets', 'licensed', 'orlando', 'specifically', 'bureau', 'maine', 'represent', 'conservation', 'ideal', 'specs', 'recorded', 'parks', 'lawyers', 'sydney', 'stress', 'trends', 'discover', 'patterns', 'boxes', 'louisiana', 'hills', 'javascript', 'fourth', 'advisor', 'marketplace', 'wilson', 'evolution', 'irish', 'certificates', 'objectives', 'stations', 'suggested', 'gps', 'remains', 'acc', 'firms', 'euro', 'operator', 'structures', 'generic', 'encyclopedia', 'usage', 'cap', 'ink', 'charts', 'continuing', 'mixed', 'census', 'interracial', 'peak', 'competitive', 'wheel', 'transit', 'suppliers', 'salt', 'compact', 'poetry', 'tracking', 'preparation', 'attempt', 'receiving', 'matches', 'accordance', 'width', 'engines', 'array', 'discussed', 'accurate', 'stephen', 'elizabeth', 'climate', 'reservations');

INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, COALESCE(l.frequency_rank, 0)
FROM collection c
JOIN lexeme l ON l.language_id = 1
WHERE c.name = 'Top 5000 Words'
  AND l.normalized_text IN ('pin', 'playstation', 'alcohol', 'greek', 'instruction', 'managing', 'annotation', 'raw', 'differences', 'smaller', 'newest', 'establish', 'gnu', 'expressed', 'extent', 'sharp', 'lesbians', 'lane', 'paragraph', 'mathematics', 'aol', 'compensation', 'export', 'managers', 'aircraft', 'modules', 'sweden', 'conflict', 'conducted', 'versions', 'employer', 'occur', 'percentage', 'mississippi', 'describe', 'concern', 'backup', 'requested', 'citizens', 'connecticut', 'heritage', 'personals', 'immediate', 'agricultural', 'expand', 'supporting', 'assigned', 'jordan', 'collections', 'ages', 'participate', 'plug', 'specialist', 'affect', 'virgin', 'experienced', 'raised', 'institution', 'directed', 'dealers', 'searching', 'sporting', 'perl', 'affected', 'lib', 'plate', 'expenses', 'indicate', 'blonde', 'proceedings', 'transmission', 'anderson', 'utc', 'characteristics', 'der', 'organic', 'seek', 'experiences', 'albums', 'cheats', 'extremely', 'verzeichnis', 'contracts', 'hosted', 'diseases', 'concerning', 'developers', 'equivalent', 'chemistry', 'neighborhood', 'nevada', 'kits', 'thailand', 'variables', 'agenda', 'tracks', 'advisory', 'cam', 'curriculum', 'logic', 'template', 'circle', 'soil', 'grants', 'psychology', 'responses', 'atlantic', 'circumstances', 'edward', 'investor', 'identification', 'ram', 'wildlife', 'appliances', 'elementary', 'cooking', 'sponsors', 'fox', 'unlimited', 'respond', 'sizes', 'plain', 'exit', 'entered', 'iran', 'launch', 'wave', 'checking', 'costa', 'belgium', 'printable', 'acts', 'guidance', 'mesh', 'trail', 'enforcement', 'symbol', 'crafts', 'highway', 'hardcover', 'observed', 'dean', 'setup', 'poll', 'booking', 'glossary', 'fiscal', 'celebrity', 'styles', 'denver', 'unix', 'bond', 'channels', 'ericsson', 'appendix', 'notify', 'blues', 'chocolate', 'pub', 'portion', 'scope', 'hampshire', 'supplier', 'cables', 'cotton', 'bluetooth', 'controlled', 'requirement', 'authorities', 'biology', 'dental', 'border', 'debate', 'representatives', 'pregnancy', 'causes', 'arkansas', 'biography', 'leisure', 'attractions', 'transactions', 'notebook', 'explorer', 'historic', 'attached', 'disabled', 'authorized', 'upcoming', 'britain', 'concert', 'retirement', 'scores', 'financing', 'efficiency', 'comedy', 'adopted', 'efficient', 'weblog', 'linear', 'commitment', 'specialty', 'bears', 'jean', 'hop', 'carrier', 'edited', 'constant', 'visa', 'jewish', 'meter', 'linked', 'portland', 'interviews', 'concepts', 'reflect', 'pure', 'lessons', 'fruit', 'begins', 'qualified', 'reform', 'lens', 'alerts', 'treated', 'discovery', 'mysql', 'classified', 'relating', 'confidence', 'alliance', 'confirm', 'lewis', 'howard', 'offline', 'engineer', 'lifestyle', 'consistent', 'replace', 'clearance', 'connections', 'inventory', 'converter', 'organisation', 'checks', 'becoming', 'safari', 'objective', 'indicated', 'securities', 'allen', 'pdt', 'relation', 'enabled', 'genre', 'slide', 'montana', 'volunteer', 'tested', 'rear', 'democratic', 'enhance', 'switzerland', 'exact', 'bound', 'parameter', 'adapter', 'processor', 'node', 'formal', 'dimensions', 'contribute', 'hockey', 'micro', 'colleges', 'laptops', 'mile', 'challenges', 'editors', 'mens', 'threads', 'bowl', 'supreme', 'recognition', 'presents', 'ref', 'tank', 'submission', 'dolls', 'estimate', 'encourage', 'navy', 'regulatory', 'inspection', 'consumers', 'cancel', 'limits', 'territory', 'transaction', 'manchester', 'delay', 'pilot', 'outlet', 'contributions', 'continuous', 'czech', 'resulting', 'cambridge', 'initiative', 'novel', 'pan', 'execution', 'disability', 'increases', 'ultra', 'winner', 'idaho', 'contractor', 'episode', 'examination', 'potter', 'dish', 'bulletin', 'indicates', 'modify', 'oxford', 'epinions', 'committed', 'extensive', 'affordable', 'candidate', 'databases', 'patent', 'slot', 'psp', 'outstanding', 'perspective', 'lodge', 'messenger', 'mirror', 'tournament', 'consideration', 'discounts', 'sterling', 'sessions', 'kernel', 'stocks', 'buyers', 'journals', 'gray', 'catalogue', 'jennifer', 'antonio', 'charged', 'broad', 'taiwan', 'und', 'chosen', 'demo', 'greece', 'swiss', 'clark', 'terminal', 'publishers', 'behalf', 'caribbean', 'liquid', 'rice', 'nebraska', 'loop', 'salary', 'reservation', 'foods', 'gourmet', 'properly', 'orleans', 'nfl', 'remaining', 'empire', 'resume', 'twenty', 'newly', 'avatar', 'gary', 'depending', 'illegal', 'expansion', 'vary', 'hundreds', 'arab', 'lincoln', 'premier', 'purchased', 'consent', 'drama', 'visiting', 'performing', 'downtown', 'keyboard', 'contest', 'collected');

INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, COALESCE(l.frequency_rank, 0)
FROM collection c
JOIN lexeme l ON l.language_id = 1
WHERE c.name = 'Top 5000 Words'
  AND l.normalized_text IN ('bands', 'boot', 'suitable', 'millions', 'audit', 'chamber', 'guinea', 'findings', 'muscle', 'featuring', 'iso', 'implement', 'clicking', 'scheduled', 'polls', 'typical', 'tower', 'sum', 'misc', 'calculator', 'significantly', 'temporary', 'attend', 'sufficient', 'holdem', 'shell', 'province', 'catholic', 'oak', 'vat', 'awareness', 'vancouver', 'governor', 'contribution', 'measurement', 'swimming', 'spyware', 'formula', 'constitution', 'packaging', 'solar', 'jose', 'pakistan', 'reliable', 'consultation', 'northwest', 'earn', 'finder', 'unable', 'periods', 'classroom', 'tasks', 'democracy', 'attacks', 'wallpaper', 'merchandise', 'const', 'resistance', 'symptoms', 'resorts', 'memorial', 'visitor', 'twin', 'forth', 'insert', 'baltimore', 'gateway', 'dont', 'alumni', 'drawing', 'candidates', 'charlotte', 'biological', 'transition', 'preferences', 'spy', 'romance', 'instrument', 'bruce', 'themes', 'bits', 'classification', 'focused', 'egypt', 'physician', 'hollywood', 'bargain', 'wikipedia', 'cellular', 'norway', 'vermont', 'blocks', 'normally', 'spiritual', 'hunting', 'diabetes', 'shift', 'chip', 'res', 'photographs', 'cutting', 'wow', 'writers', 'marks', 'flexible', 'mapping', 'numerous', 'relatively', 'satisfaction', 'represents', 'char', 'indexed', 'pittsburgh', 'superior', 'preferred', 'cartoon', 'shots', 'intellectual', 'moore', 'granted', 'choices', 'carbon', 'spending', 'magnetic', 'interaction', 'effectively', 'registry', 'crisis', 'outlook', 'massive', 'denmark', 'employed', 'header', 'poverty', 'formed', 'piano', 'echo', 'que', 'grid', 'sheets', 'patrick', 'experimental', 'puerto', 'revolution', 'consolidation', 'displays', 'plasma', 'allowing', 'earnings', 'voip', 'mystery', 'landscape', 'dependent', 'mechanical', 'delaware', 'bidding', 'consultants', 'risks', 'banner', 'applicant', 'charter', 'fig', 'barbara', 'cooperation', 'counties', 'acquisition', 'ports', 'implemented', 'directories', 'recognized', 'blogger', 'notification', 'licensing', 'stands', 'occurred', 'textbooks', 'rapid', 'hairy', 'diversity', 'cleveland', 'reverse', 'deposit', 'seminar', 'investments', 'latina', 'nasa', 'wheels', 'specify', 'accessibility', 'dutch', 'sensitive', 'templates', 'formats', 'tab', 'boots', 'holds', 'router', 'concrete', 'editing', 'poland', 'folder', 'womens', 'completion', 'upload', 'pulse', 'universities', 'technique', 'contractors', 'voting', 'courts', 'notices', 'subscriptions', 'calculate', 'detroit', 'alexander', 'broadcast', 'converted', 'metro', 'toshiba', 'anniversary', 'improvements', 'strip', 'specification', 'pearl', 'accessible', 'accessory', 'resident', 'plot', 'qty', 'airline', 'typically', 'representation', 'regard', 'pump', 'exists', 'arrangements', 'smooth', 'conferences', 'uniprotkb', 'consumption', 'birmingham', 'flashing', 'narrow', 'threat', 'surveys', 'consultant', 'controller', 'ownership', 'committees', 'legislative', 'researchers', 'vietnam', 'trailer', 'anne', 'gardens', 'malaysia', 'unsubscribe', 'antique', 'labels', 'bio', 'molecular', 'stored', 'exam', 'logos', 'residence', 'attorneys', 'antiques', 'density', 'operators', 'sustainable', 'philippines', 'statistical', 'beds', 'innovation', 'pcs', 'employers', 'grey', 'parallel', 'honda', 'amended', 'operate', 'bills', 'bold', 'stable', 'opera', 'definitions', 'von', 'cinema', 'asset', 'scan', 'elections', 'reaction', 'blank', 'enhanced', 'entitled', 'severe', 'generate', 'stainless', 'newspapers', 'hospitals', 'deluxe', 'humor', 'aged', 'monitors', 'exception', 'duration', 'bulk', 'successfully', 'indonesia', 'pursuant', 'sci', 'fabric', 'edt', 'visits', 'primarily', 'domains', 'capabilities', 'pmid', 'contrast', 'recommendation', 'recruitment', 'sin', 'berlin', 'organized', 'para', 'siemens', 'adoption', 'improving', 'capture', 'buffalo', 'organisations', 'explained', 'seed', 'programmes', 'desire', 'expertise', 'mechanism', 'camping', 'jewellery', 'meets', 'welfare', 'peer', 'marked', 'driven', 'measured', 'medline', 'agreements', 'considering', 'innovative', 'marshall', 'massage', 'rubber', 'conclusion', 'closing', 'tampa', 'legend', 'susan', 'ing', 'adams', 'python', 'bang', 'villa', 'bone', 'columns', 'disorders', 'bugs', 'collaboration', 'hamilton', 'detection', 'ftp', 'cookies', 'inner', 'formation', 'tutorial', 'med', 'engineers', 'entity', 'cruises', 'holder', 'proposals', 'moderator', 'tutorials', 'settlement', 'portugal', 'lawrence', 'roman', 'duties', 'valuable', 'tone', 'collectables', 'ethics', 'dragon', 'heating', 'wing', 'governments', 'purchasing', 'scripts', 'abc', 'stereo', 'appointed');

INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, COALESCE(l.frequency_rank, 0)
FROM collection c
JOIN lexeme l ON l.language_id = 1
WHERE c.name = 'Top 5000 Words'
  AND l.normalized_text IN ('dealing', 'commit', 'operational', 'rail', 'airlines', 'liberal', 'livecam', 'jay', 'trips', 'gap', 'sides', 'tube', 'corresponding', 'descriptions', 'cache', 'belt', 'jacket', 'determination', 'animation', 'oracle', 'matthew', 'lease', 'productions', 'aviation', 'hobbies', 'excess', 'disaster', 'console', 'commands', 'telecommunications', 'instructor', 'achieved', 'injuries', 'shipped', 'seats', 'approaches', 'biz', 'voltage', 'anthony', 'nintendo', 'loading', 'stamps', 'appeared', 'franklin', 'angle', 'rob', 'vinyl', 'highlights', 'mining', 'designers', 'melbourne', 'ongoing', 'imaging', 'betting', 'scientists', 'liberty', 'wyoming', 'blackjack', 'argentina', 'era', 'convert', 'possibility', 'analyst', 'commissioner', 'garage', 'reliability', 'thongs', 'gcc', 'respectively', 'volunteers', 'attachment', 'ringtone', 'finland', 'morgan', 'derived', 'oriented', 'eagle', 'desktops', 'columbus', 'prayer', 'appointment', 'workshops', 'hurricane', 'postage', 'producer', 'represented', 'mortgages', 'dial', 'responsibilities', 'comic', 'jet', 'productivity', 'investors', 'crown', 'par', 'underground', 'diagnosis', 'maker', 'crack', 'principle', 'picks', 'vacations', 'semester', 'calculated', 'fetish', 'applies', 'casinos', 'appearance', 'apache', 'filters', 'incorporated', 'craft', 'notebooks', 'lounge', 'algorithm', 'semi', 'coins', 'gross', 'strongly', 'cafe', 'valentine', 'hilton', 'ken', 'proteins', 'horror', 'exp', 'capable', 'douglas', 'debian', 'involving', 'pen', 'investing', 'christopher', 'admission', 'epson', 'shoe', 'elected', 'carrying', 'victory', 'sand', 'madison', 'terrorism', 'editions', 'cpu', 'mainly', 'ethnic', 'parliament', 'actor', 'seal', 'situations', 'fifth', 'allocated', 'citizen', 'vertical', 'corrections', 'structural', 'municipal', 'describes', 'prize', 'occurs', 'jon', 'absolute', 'disabilities', 'consists', 'anytime', 'substance', 'prohibited', 'addressed', 'pipe', 'guardian', 'lecture', 'simulation', 'layout', 'initiatives', 'concentration', 'classics', 'lbs', 'interpretation', 'lol', 'deck', 'wayne', 'donate', 'bankruptcy', 'worker', 'optimization', 'substances', 'wings', 'breaks', 'genetic', 'restrictions', 'participating', 'waters', 'thin', 'exhibition', 'ridge', 'cabinet', 'modem', 'harris', 'mph', 'dose', 'evaluate', 'tiffany', 'tropical', 'collect', 'composition', 'toyota', 'nationwide', 'vector', 'shaved', 'buffer', 'purple', 'existence', 'commentary', 'limousines', 'developments', 'def', 'immigration', 'destinations', 'lets', 'mutual', 'pipeline', 'necessarily', 'syntax', 'attribute', 'skill', 'chairs', 'everyday', 'surrounding', 'mountains', 'moves', 'popularity', 'inquiry', 'ethernet', 'exhibit', 'trend', 'sierra', 'visible', 'cats', 'desert', 'postposted', 'oldest', 'rhode', 'nba', 'coordinator', 'mercury', 'steven', 'handbook', 'greg', 'navigate', 'summit', 'epa', 'spaces', 'fundamental', 'coupons', 'somewhat', 'receiver', 'substantial', 'progressive', 'cialis', 'boats', 'glance', 'scottish', 'championship', 'arcade', 'richmond', 'sacramento', 'ron', 'russell', 'fiber', 'depression', 'graph', 'covering', 'platinum', 'judgment', 'bedrooms', 'talks', 'filing', 'foster', 'modeling', 'passing', 'awarded', 'testimonials', 'trials', 'tissue', 'memorabilia', 'clinton', 'masters', 'bonds', 'cartridge', 'alberta', 'explanation', 'folk', 'commons', 'cincinnati', 'subsection', 'fraud', 'electricity', 'permitted', 'spectrum', 'arrival', 'pottery', 'emphasis', 'aspect', 'workplace', 'mexican', 'confirmed', 'counts', 'priced', 'wallpapers', 'hist', 'desired', 'inter', 'assumes', 'heights', 'shadow', 'riding', 'infection', 'firefox', 'expense', 'grove', 'eligibility', 'venture', 'clinic', 'korean', 'healing', 'mall', 'entering', 'packet', 'spray', 'studios', 'involvement', 'buttons', 'placement', 'observations', 'funded', 'thompson', 'winners', 'extend', 'roads', 'subsequent', 'pat', 'dublin', 'rolling', 'motorcycle', 'yard', 'disclosure', 'establishment', 'nelson', 'creates', 'faces', 'tourist', 'sean', 'adequate', 'senator', 'yield', 'presentations', 'grades', 'cartoons', 'pour', 'digest', 'reg', 'lodging', 'tion', 'dust', 'hence', 'wiki', 'entirely', 'replaced', 'radar', 'rescue', 'undergraduate', 'losses', 'combat', 'reducing', 'occupation', 'lakes', 'donations', 'associations', 'citysearch', 'closely', 'radiation', 'diary', 'kings', 'kent', 'adds', 'nsw', 'ear', 'flags', 'pci', 'baker', 'launched', 'elsewhere', 'pollution', 'conservative', 'guestbook', 'shock', 'effectiveness', 'abroad', 'ebony', 'ward');

INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, COALESCE(l.frequency_rank, 0)
FROM collection c
JOIN lexeme l ON l.language_id = 1
WHERE c.name = 'Top 5000 Words'
  AND l.normalized_text IN ('drawn', 'arthur', 'ian', 'visited', 'walker', 'demonstrate', 'atmosphere', 'suggests', 'beast', 'operated', 'experiment', 'targets', 'overseas', 'purchases', 'dodge', 'counsel', 'federation', 'pizza', 'yards', 'assignment', 'chemicals', 'gordon', 'mod', 'farmers', 'queries', 'bmw', 'ukraine', 'absence', 'nearest', 'cluster', 'vendors', 'whereas', 'yoga', 'serves', 'lamp', 'rico', 'partial', 'shoppers', 'phil', 'couples', 'nashville', 'ranking', 'jokes', 'cst', 'ceo', 'simpson', 'twiki', 'sublime', 'counseling', 'palace', 'acceptable', 'satisfied', 'wins', 'measurements', 'verify', 'globe', 'trusted', 'copper', 'milwaukee', 'rack', 'medication', 'warehouse', 'shareware', 'rep', 'dicke', 'kerry', 'receipt', 'ordinary', 'violation', 'configure', 'stability', 'mit', 'applying', 'southwest', 'pride', 'institutional', 'expectations', 'independence', 'reporter', 'metabolism', 'keith', 'champion', 'cloudy', 'linda', 'ross', 'chile', 'solo', 'sentence', 'ignore', 'uniform', 'excellence', 'wealth', 'tall', 'vacuum', 'attributes', 'brass', 'writes', 'plaza', 'pdas', 'outcomes', 'survival', 'quest', 'publish', 'sri', 'screening', 'toe', 'thumbnail', 'trans', 'jonathan', 'nova', 'lifetime', 'api', 'pioneer', 'booty', 'acrobat', 'plates', 'acres', 'venue', 'athletic', 'thermal', 'essays', 'vital', 'fairly', 'coastal', 'config', 'charity', 'intelligent', 'edinburgh', 'excel', 'modes', 'obligation', 'campbell', 'harbor', 'hungary', 'traveler', 'urw', 'segment', 'regardless', 'lan', 'puzzle', 'rising', 'aluminum', 'wells', 'wishlist', 'insight', 'sms', 'restricted', 'republican', 'latter', 'merchants', 'thick', 'trailers', 'syndrome', 'philips', 'attendance', 'penalty', 'drum', 'enables', 'nec', 'iraqi', 'builder', 'vista', 'jessica', 'chips', 'terry', 'flood', 'foto', 'ease', 'arguments', 'amsterdam', 'arena', 'adventures', 'pupils', 'stewart', 'announcement', 'tabs', 'outcome', 'expanded', 'casual', 'polish', 'extras', 'centres', 'clause', 'lands', 'troops', 'indoor', 'bulgaria', 'armed', 'broker', 'charger', 'regularly', 'pine', 'cooling', 'tend', 'gulf', 'rick', 'trucks', 'mechanisms', 'shopper', 'tokyo');

-- Default visual mnemonic fields so every English lexeme can resolve an image
UPDATE lexeme
SET visual_photo_query = COALESCE(NULLIF(TRIM(visual_photo_query), ''), text),
    visual_association = COALESCE(
        NULLIF(TRIM(visual_association), ''),
        'A clear everyday scene that shows what "' || text || '" means'
    ),
    visual_image_prompt = COALESCE(
        NULLIF(TRIM(visual_image_prompt), ''),
        'Educational illustration of the meaning of "' || text || '". Show the meaning as a clear everyday situation with people (or animal characters) acting it out. Simple composition, 1–3 characters, clean expressive educational illustration style. No text, no captions, no labels.'
    ),
    visual_memory_hook = COALESCE(NULLIF(TRIM(visual_memory_hook), ''), text),
    visual_sense = COALESCE(NULLIF(TRIM(visual_sense), ''), text)
WHERE language_id = 1 AND deleted_at IS NULL;

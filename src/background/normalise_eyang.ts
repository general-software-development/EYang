import * as parse_search_query from "../shared/parse_url/parse_search_query.js";
import bangs from "../shared/bangs.json" with { type: 'json' };

export function eyang_search(url: URL): string[] {
    if (typeof url !== 'string' && url.protocol === "eyang:") {
        return [url.toString()];
    }

    let query = parse_search_query.Auto(url);
    if (query === undefined)
        return;
    let results = []
    console.log(`Got query: ${query}`)

    function __strip_bang(q: string, bang: string) {
        q = q.startsWith(bang)
                ? q.substring(bang.length)
                : q.endsWith(bang)
                    ? q.substring(0, q.length - bang.length)
                    : q;
        q = q.trim();
        return q;
    }

    let _final_query = query;

    let yang_found = true;

    while (yang_found) {
        yang_found = false;

        if (_final_query?.startsWith("!google") || _final_query?.endsWith("!google")) {
            yang_found = true;
            _final_query = __strip_bang(_final_query, "!google");
        }

        for (const bang of bangs) {
            if (_final_query?.startsWith(`!${bang["t"]}`) || _final_query?.endsWith(`!${bang["t"]}`)) {
                yang_found = true;
                _final_query = __strip_bang(_final_query, `!${bang["t"]}`);
            }
            if (bang["ts"]) {
                for (const ts of bang["ts"]) {
                    if (_final_query?.startsWith(`!${ts}`) || _final_query?.endsWith(`!${ts}`)) {
                        yang_found = true;
                        _final_query = __strip_bang(_final_query, `!${ts}`);
                    }
                }
            }
        }
    }

    yang_found = true;

    while (yang_found) {
        yang_found = false;

        if (query?.startsWith("!google") || query?.endsWith("!google")) {
            yang_found = true;
            results.push(
                `eyang://search.google/${_final_query}`
            );
            query = __strip_bang(query, "!google");
        }

        for (const bang of bangs) {
            if (query?.startsWith(`!${bang["t"]}`) || query?.endsWith(`!${bang["t"]}`)) {
                yang_found = true;
                results.push(
                    String(bang["u"]).replaceAll("{{{s}}}", _final_query)
                );
                query = __strip_bang(query, `!${bang["t"]}`);
            }
            if (bang["ts"]) {
                for (const ts of bang["ts"]) {
                    if (query?.startsWith(`!${ts}`) || query?.endsWith(`!${ts}`)) {
                        yang_found = true;
                        results.push(
                            String(bang["u"]).replaceAll("{{{s}}}", _final_query)
                        );
                        query = __strip_bang(query, `!${ts}`);
                    }
                }
            }
        }
    }

    return results;
}

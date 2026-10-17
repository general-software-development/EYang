import * as parse_search_query from "../shared/parse_url/parse_search_query.js";
import * as deduce_redirects from "./deduce_redirect.js";
import * as normalise_eyang from "./normalise_eyang.js";

function resolveURL(input: string) {
    const url = new URL(input);

    if (url.protocol !== "eyang:") {
        return null;
    }

    const host = url.hostname;
    const path = url.pathname.slice(1);

    switch (host) {
        case "google":
            return `https://www.google.com/search?q=${encodeURIComponent(decodeURIComponent(path))}&source=chrome.ob&ie=UTF-8`;

        default:
            return null;
    }
}

async function sendToast(tabID: number, dest: string, msg: string) {
    const key = `toast:${tabID}`;

    await chrome.storage.session.set({
        [key]: {
            dest,
            msg
        }
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type !== "eyang:getToast") return;

    const tabID = sender.tab?.id;
    if (tabID === undefined || sender.frameId !== 0) return;

    const key = `toast:${tabID}`;

    (async () => {
        const data = await chrome.storage.session.get(key);
        const toast: Record<string, any> | undefined = data[key] as Record<string, any> | undefined;

        if (!toast || toast.dest !== sender.url) {
            sendResponse(null);
            return;
        }

        await chrome.storage.session.remove(key);
        sendResponse(toast.msg);
    })().catch(() => sendResponse(null));

    return true;
});

chrome.omnibox.onInputEntered.addListener(async (text, disposition) => {
    const input = text.startsWith("eyang://")
        ? text
        : `eyang://${text}`;

    const target = resolveURL(input);

    if (!target) {
        return;
    }

    async function __inner(tabID: number) {
        await sendToast(tabID, target !== null ? target : "",
            `<b>Redirected using Eyang!</b><br/>\n<small>From ${text} to ${target}</small>`
        );
    }

    switch (disposition) {
        case "currentTab": {
            const [tab] = await chrome.tabs.query({
                active: true,
                currentWindow: true
            });
            if (tab?.id === undefined) return;
            await __inner(tab.id);
            chrome.tabs.update({ url: target });
            break;
        }

        case "newForegroundTab": {
            const tab = await chrome.tabs.create({ active: true }); // create it first to make sure the content script doesnt initialise before redirecting
            if (tab.id === undefined) return;
            await __inner(tab.id);
            await chrome.tabs.update(tab.id, {
                url: target
            });
            break;
        }

        case "newBackgroundTab":
            const tab = await chrome.tabs.create({ active: false }); // create it first to make sure the content script doesnt initialise before redirecting
            if (tab.id === undefined) return;
            await __inner(tab.id);
            chrome.tabs.update(tab.id, {
                url: target
            });
            break;
    }
});

chrome.webNavigation.onBeforeNavigate.addListener(
    (details) => {
        // Only intercept main-frame navigations.
        if (details.frameId !== 0) return;

        const url = new URL(details.url);

        const queries = normalise_eyang.eyang_search(url);
        if (queries.length <= 0)
            return;
        const query = queries[0] as string;

        const customURL = new URL(query);

        try {
            const p = deduce_redirects.targetPath(customURL);
            async function _inner() {
                await sendToast(
                    details.tabId,
                    p.toString(),
                    `<b>Redirected using Eyang!</b><br/>\n<small>From ${query} to ${p.toString()}</small>`
                );
                await chrome.tabs.update(details.tabId, {
                    url: p.toString()
                });
            }
            void _inner();
        } catch { };

        try {
            for (let i = 1; i < queries.length; i++) {
                const p = deduce_redirects.targetPath(new URL(queries[i] as string));
                async function _inner() {
                    const tab = await chrome.tabs.create({ active: false }); // create it first to make sure the content script doesnt initialise before redirecting
                    if (tab.id === undefined) return;
                    await sendToast(
                        tab.id,
                        p.toString(),
                        `<b>Redirected using Eyang!</b><br/>\n<small>From ${query} to ${p.toString()}</small>`
                    );
                    await chrome.tabs.update(tab.id, {
                        url: p.toString()
                    });
                }
                void _inner();
            }
        } catch { };
    },
    {
        url: [
            { hostEquals: "www.google.com", pathEquals: "/search" }
        ]
    }
);

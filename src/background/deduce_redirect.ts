export function targetPath(url: URL): URL {
    if (url.protocol !== "eyang:")
        return url;
    switch (url.hostname) {
        case "search.google":
            const search = decodeURIComponent(url.pathname.slice(1));
            const destination = new URL(
                "https://www.google.com/search"
            );
            destination.searchParams.set("q", search);
            destination.searchParams.set("source", "chrome.ob");
            destination.searchParams.set("ie", "UTF-8");
            return destination;
    }
    throw new Error("UNSUPPORTED");
}

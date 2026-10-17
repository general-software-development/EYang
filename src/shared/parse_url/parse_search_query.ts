export function Google(url: URL): string | undefined {
    if (url.hostname !== "www.google.com") throw new Error("Wrong function called!!");
    if (url.pathname !== "/search") return;

    const query = url.searchParams.get("q") as string;

    return query;
}

export function Auto(url: URL): string | undefined {
    if (url.hostname === "www.google.com")
        return Google(url);
}

function showToast(message: string): void {
    const toast = document.createElement("div");

    toast.innerHTML = message;

    Object.assign(toast.style, {
        position: "fixed",
        top: "20px",
        left: "20px",
        padding: "12px 20px",
        background: "#20212477",
        color: "#ffffff",
        borderRadius: "8px",
        fontFamily: "system-ui, sans-serif",
        fontSize: "16px",
        zIndex: "2147483647",
        boxShadow: "0 4px 12px rgba(0,0,0,0.25)"
    });

    document.documentElement.appendChild(toast);

    setTimeout(() => toast.remove(), 7500);
}

chrome.runtime.sendMessage(
    { type: "eyang:getToast" },
    (message: string | null) => {
        if (chrome.runtime.lastError) return;
        if (message) showToast(message);
    }
);

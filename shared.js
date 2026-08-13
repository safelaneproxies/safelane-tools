(function () {
  const cfg = window.SAFELANE || {};
  const discordOk = cfg.discord && !String(cfg.discord).includes("REPLACE");
  const githubOk = cfg.github && !String(cfg.github).includes("REPLACE");

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.entries(attrs).forEach(([k, v]) => {
        if (k === "className") node.className = v;
        else if (k === "text") node.textContent = v;
        else node.setAttribute(k, v);
      });
    }
    (children || []).forEach((c) => {
      if (c == null) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  function renderFooter(target) {
    if (!target) return;
    target.appendChild(
      el("p", null, [
        el("strong", { text: "Safe Lane" }),
        " runs dedicated UK 4G lines on real USB dongles + SIMs (O2 / giffgaff exits), not datacentre pools.",
      ])
    );

    const row = el("div", { className: "cta-row" });
    if (cfg.whop) {
      row.appendChild(el("a", { className: "btn", href: cfg.whop, target: "_blank", rel: "noopener" }, ["UK 4G proxies"]));
    }
    if (discordOk) {
      row.appendChild(el("a", { className: "btn secondary", href: cfg.discord, target: "_blank", rel: "noopener" }, ["Discord"]));
    }
    target.appendChild(row);

    if (githubOk) {
      target.appendChild(
        el("p", { className: "disclosure" }, [
          "Open source: ",
          el("a", { href: cfg.github, target: "_blank", rel: "noopener", text: cfg.github.replace(/^https?:\/\//, "") }),
          ". Lookups use public IP APIs in your browser only.",
        ])
      );
    }
  }

  renderFooter(document.getElementById("footer"));
})();

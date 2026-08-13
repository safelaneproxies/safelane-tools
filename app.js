(function () {
  // Client-side hints only. Not a legal ASN registry.
  // Mobile = cellular. Fixed = cable/DSL/fibre ISP (not 4G).

  const UK_MOBILE = [
    { asn: 12576, name: "O2 / Telefonica UK" },
    { asn: 60339, name: "Hutchison 3G UK (Three)" },
    { asn: 132869, name: "Three UK related" },
    { asn: 25135, name: "Vodafone UK" },
    { asn: 5378, name: "Vodafone UK / Cable & Wireless" },
  ];

  const UK_FIXED = [
    { asn: 5089, name: "Virgin Media (cable broadband)" },
    { asn: 2856, name: "BT" },
    { asn: 5607, name: "Sky UK" },
    { asn: 6871, name: "Plusnet" },
    { asn: 13037, name: "Zen Internet" },
    { asn: 8586, name: "TalkTalk" },
    { asn: 9105, name: "Tiscali / TalkTalk related" },
    { asn: 206509, name: "Virgin Media Business (often fixed)" },
  ];

  const MOBILE_RE =
    /\b(o2\b|telefonica|giffgaff|everything everywhere|\bee limited\b|vodafone|hutchison|three\.co|3uk|tesco mobile|lebara|lycamobile|mobile network|cellular)\b/i;

  const FIXED_RE =
    /\b(virgin media|virginmedia|bt\.com|british telecom|\bsky broadband\b|plusnet|talktalk|zen internet|cable communications)\b/i;

  const HOSTING_RE =
    /\b(amazon|aws|ec2|google|gcp|microsoft|azure|digitalocean|linode|akamai|cloudflare|ovh|hetzner|vultr|contabo|leaseweb|choopa|softlayer|ibm cloud|oracle cloud|scaleway|m247|psychz|quadranet|colocrossing|hostinger|hosting|datacenter|data center|server|vps|cdn)\b/i;

  const ipEl = document.getElementById("ip");
  const out = document.getElementById("out");
  const err = document.getElementById("err");
  const checkBtn = document.getElementById("check");
  const mineBtn = document.getElementById("mine");

  function showErr(msg) {
    err.textContent = msg || "";
    err.classList.toggle("hidden", !msg);
  }

  function validIp(s) {
    const v4 = /^(?:\d{1,3}\.){3}\d{1,3}$/;
    const v6 = /^[0-9a-f:]+$/i;
    if (v4.test(s)) {
      return s.split(".").every((p) => Number(p) >= 0 && Number(p) <= 255);
    }
    return v6.test(s) && s.includes(":");
  }

  function classify(data) {
    const asn = data.connection && data.connection.asn != null ? Number(data.connection.asn) : null;
    const org = ((data.connection && data.connection.org) || "").trim();
    const isp = ((data.connection && data.connection.isp) || "").trim();
    const blob = `${org} ${isp}`;
    const hostingFlag = !!(data.security && data.security.hosting);
    const knownMobile = UK_MOBILE.find((x) => x.asn === asn);
    const knownFixed = UK_FIXED.find((x) => x.asn === asn);

    let kind = "unclear";
    let title = "Unclear. Dig a little more";
    let detail = [
      "ASN/org is not a clear mobile carrier, fixed ISP, or obvious hosting.",
      "Confirm this is the real exit through the proxy.",
    ];

    // Hosting first, then fixed ISP, then mobile.
    // Virgin Media etc must never be labelled mobile.
    if (hostingFlag || HOSTING_RE.test(blob)) {
      kind = "datacentre";
      title = "Looks like datacentre / hosting";
      detail = [
        "Org/ISP matches cloud or hosting, or the API marks hosting.",
        "Sites often treat this differently from real UK mobile exits.",
      ];
    } else if (knownFixed || FIXED_RE.test(blob)) {
      kind = "broadband";
      title = "Looks like fixed ISP / broadband";
      detail = knownFixed
        ? [
            "Matches a known UK fixed ISP ASN (" + knownFixed.name + ").",
            "Cable/DSL/fibre home or business line, not cellular 4G.",
          ]
        : [
            "Org/ISP name looks like fixed broadband, not a mobile carrier.",
            "Dedicated UK 4G exits should look like O2/giffgaff/Three, not Virgin cable.",
          ];
    } else if (knownMobile || MOBILE_RE.test(blob)) {
      kind = "mobile";
      title = "Looks like mobile / carrier";
      detail = knownMobile
        ? [
            "Matches a known UK mobile carrier ASN hint (" + knownMobile.name + ").",
            "Dedicated UK 4G lines should look like this class of exit, not OVH/AWS.",
          ]
        : [
            "Org/ISP name looks cellular / mobile carrier.",
            "Dedicated UK 4G (O2/giffgaff-class) should read like this, not a cloud ASN.",
          ];
    }

    return { kind, title, detail, asn, org, isp, country: data.country, country_code: data.country_code };
  }

  function render(ip, data) {
    const c = classify(data);
    out.className = `result ${c.kind}`;
    out.innerHTML = "";
    const tag = document.createElement("div");
    tag.className = "tag";
    tag.textContent =
      c.kind === "mobile"
        ? "Mobile / carrier"
        : c.kind === "datacentre"
          ? "Datacentre / hosting"
          : c.kind === "broadband"
            ? "Fixed ISP / broadband"
            : "Unclear";
    const h = document.createElement("h2");
    h.textContent = c.title;
    const p = document.createElement("p");
    p.className = "result-copy";
    p.innerHTML = c.detail.map((line) => escapeHtml(line)).join("<br />");
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.innerHTML = [
      `<div>IP: ${escapeHtml(ip)}</div>`,
      `<div>Country: ${escapeHtml(c.country || "?")}${c.country_code ? " (" + escapeHtml(c.country_code) + ")" : ""}</div>`,
      `<div>ASN: ${c.asn != null ? "AS" + c.asn : "?"}</div>`,
      `<div>Org: ${escapeHtml(c.org || "?")}</div>`,
      `<div>ISP: ${escapeHtml(c.isp || "?")}</div>`,
    ].join("");
    const note = document.createElement("p");
    note.className = "hint";
    note.innerHTML =
      "Dedicated UK 4G exits look like O2/giffgaff/Three mobile, not Virgin cable or a cloud ASN.<br />Entry IPs on a VPS are not what sites see.";
    out.append(tag, h, p, meta, note);
    out.classList.remove("hidden");
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function lookup(ip) {
    showErr("");
    out.classList.add("hidden");
    checkBtn.disabled = true;
    mineBtn.disabled = true;
    try {
      const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`);
      if (!res.ok) throw new Error("Lookup failed (" + res.status + ")");
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Lookup failed for that IP");
      render(data.ip || ip, data);
    } catch (e) {
      showErr(e.message || "Lookup failed");
    } finally {
      checkBtn.disabled = false;
      mineBtn.disabled = false;
    }
  }

  checkBtn.addEventListener("click", () => {
    const ip = ipEl.value.trim();
    if (!ip || !validIp(ip)) {
      showErr("Enter a valid IPv4 or IPv6 address.");
      return;
    }
    lookup(ip);
  });

  ipEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") checkBtn.click();
  });

  mineBtn.addEventListener("click", async () => {
    showErr("");
    out.classList.add("hidden");
    checkBtn.disabled = true;
    mineBtn.disabled = true;
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      if (!res.ok) throw new Error("Could not fetch your public IP");
      const { ip } = await res.json();
      ipEl.value = ip;
      await lookup(ip);
    } catch (e) {
      showErr(e.message || "Could not detect your IP");
      checkBtn.disabled = false;
      mineBtn.disabled = false;
    }
  });
})();

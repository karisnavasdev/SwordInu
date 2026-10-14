const menuBtn = document.getElementById("menu-btn");
const navLinks = document.getElementById("nav-links");

menuBtn.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", String(open));
  menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
});

navLinks.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    navLinks.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.setAttribute("aria-label", "Open menu");
  }
});

const note = document.getElementById("net-note");

function statusFor(button) {
  if (button.dataset.status) {
    const el = document.getElementById(button.dataset.status);
    if (el) return el;
  }
  return note;
}

function markCopied(button, text) {
  const previous = button.textContent;
  const status = statusFor(button);
  button.textContent = "Copied";
  if (status) status.textContent = "Copied";
  setTimeout(() => {
    button.textContent = previous;
    if (status && status !== note) status.textContent = "";
  }, 1400);
}

function copyWithFallback(text) {
  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.top = "0";
  field.style.left = "0";
  field.style.width = "2em";
  field.style.height = "2em";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.focus();
  field.select();
  field.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch (err) {
    ok = false;
  }
  field.remove();
  return ok;
}

async function copyText(text, button) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      markCopied(button, text);
      return;
    }
  } catch (err) {
    /* try the older copy path */
  }
  if (copyWithFallback(text)) {
    markCopied(button, text);
    return;
  }
  const code = button.parentElement && button.parentElement.querySelector("code");
  if (code) {
    const range = document.createRange();
    range.selectNodeContents(code);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
  const status = statusFor(button);
  if (status) status.textContent = "Highlighted";
}

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", () => copyText(button.dataset.copy, button));
});

const CHAIN = {
  chainId: "0x1237",
  chainName: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://rpc.mainnet.chain.robinhood.com"],
  blockExplorerUrls: ["https://robinhoodchain.blockscout.com"]
};

document.getElementById("add-chain").addEventListener("click", async () => {
  const provider = window.ethereum;
  if (!provider) {
    await copyText(CHAIN.rpcUrls[0], document.getElementById("add-chain"));
    note.textContent = "No wallet found in this browser. The RPC is copied — add Robinhood Chain in your wallet with chain ID 4663.";
    return;
  }
  try {
    await provider.request({ method: "wallet_addEthereumChain", params: [CHAIN] });
    note.textContent = "Robinhood Chain was sent to your wallet.";
  } catch (err) {
    note.textContent = "The wallet did not add the network. You can still add it by hand with chain ID 4663.";
  }
});

const loader = document.getElementById("loader");
const loaderVideo = document.getElementById("loader-video");
const loaderSound = document.getElementById("loader-sound");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function closeLoader() {
  if (!loader || loader.classList.contains("is-done")) return;
  loader.classList.add("is-done");
  document.body.classList.remove("is-loading");
  if (loaderVideo) loaderVideo.pause();
  setTimeout(() => loader.remove(), 650);
}

if (loader && loaderVideo) {
  if (reduceMotion) {
    closeLoader();
  } else {
    loaderVideo.addEventListener("ended", closeLoader);
    loaderVideo.addEventListener("error", closeLoader);
    document.getElementById("loader-skip").addEventListener("click", closeLoader);
    loaderSound.addEventListener("click", () => {
      loaderVideo.muted = !loaderVideo.muted;
      loaderSound.textContent = loaderVideo.muted ? "Sound" : "Mute";
      loaderSound.setAttribute("aria-pressed", String(!loaderVideo.muted));
      if (loaderVideo.paused) loaderVideo.play().catch(() => {});
    });
    loaderVideo.play().catch(() => {
      loaderVideo.muted = true;
      loaderVideo.play().catch(closeLoader);
    });
  }
}

const sparkCanvas = document.getElementById("sparks");

if (sparkCanvas && !reduceMotion) {
  const ctx = sparkCanvas.getContext("2d");
  const sparks = [];
  let lastX = 0;
  let lastY = 0;

  function fitSparks() {
    sparkCanvas.width = window.innerWidth;
    sparkCanvas.height = window.innerHeight;
  }
  fitSparks();
  window.addEventListener("resize", fitSparks);

  window.addEventListener("mousemove", (event) => {
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    if (dx * dx + dy * dy < 36) return;
    lastX = event.clientX;
    lastY = event.clientY;
    for (let i = 0; i < 4; i += 1) {
      sparks.push({
        x: event.clientX,
        y: event.clientY,
        vx: (Math.random() - 0.5) * 1.8,
        vy: -Math.random() * 1.7 - 0.3,
        life: 1,
        size: Math.random() * 2.4 + 0.8,
        gold: Math.random() > 0.35
      });
    }
  });

  function drawSpark(spark) {
    ctx.save();
    ctx.translate(spark.x, spark.y);
    ctx.rotate(spark.life * 2);
    ctx.globalAlpha = Math.max(spark.life, 0);
    ctx.fillStyle = spark.gold ? "#f6e2a6" : "#fff8df";
    ctx.shadowColor = "#e7c36a";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    for (let i = 0; i < 4; i += 1) {
      ctx.lineTo(0, -spark.size);
      ctx.rotate(Math.PI / 4);
      ctx.lineTo(0, -spark.size * 0.35);
      ctx.rotate(Math.PI / 4);
    }
    ctx.fill();
    ctx.restore();
  }

  function tick() {
    ctx.clearRect(0, 0, sparkCanvas.width, sparkCanvas.height);
    for (let i = sparks.length - 1; i >= 0; i -= 1) {
      const spark = sparks[i];
      spark.x += spark.vx;
      spark.y += spark.vy;
      spark.vy += 0.02;
      spark.life -= 0.02;
      if (spark.life <= 0) {
        sparks.splice(i, 1);
        continue;
      }
      drawSpark(spark);
    }
    requestAnimationFrame(tick);
  }
  tick();
}

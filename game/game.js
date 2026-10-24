(function () {
  "use strict";

  var canvas = document.getElementById("game");
  var ctx = canvas.getContext("2d", { alpha: false });
  var scoreEl = document.getElementById("score");
  var bestEl = document.getElementById("best");
  var overlay = document.getElementById("overlay");
  var overlayEyebrow = document.getElementById("overlay-eyebrow");
  var overlayTitle = document.getElementById("overlay-title");
  var overlayCopy = document.getElementById("overlay-copy");
  var startBtn = document.getElementById("start-btn");
  var touchPad = document.getElementById("touch-pad");

  var STORAGE_KEY = "orange-square-best";
  var PLAYER_SIZE = 28;
  var BASE_SPEED = 220;

  var state = {
    running: false,
    over: false,
    score: 0,
    best: loadBest(),
    time: 0,
    w: 720,
    h: 960,
    dpr: 1,
    player: { x: 360, y: 480, pulse: 0 },
    sparks: [],
    shards: [],
    particles: [],
    keys: Object.create(null),
    pad: Object.create(null),
    pointer: { active: false, x: 0, y: 0 },
    spawnSparkAt: 0.6,
    spawnShardAt: 1.4,
    lastTs: 0,
  };

  bestEl.textContent = String(state.best);

  function loadBest() {
    try {
      var v = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
      return isFinite(v) && v > 0 ? v : 0;
    } catch (e) {
      return 0;
    }
  }

  function saveBest(n) {
    try {
      localStorage.setItem(STORAGE_KEY, String(n));
    } catch (e) {
      /* private mode / blocked storage */
    }
  }

  function resize() {
    var wrap = canvas.parentElement;
    var cssW = Math.max(1, wrap.clientWidth);
    var cssH = Math.max(1, wrap.clientHeight);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    state.dpr = dpr;
    state.w = cssW;
    state.h = cssH;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    state.player.x = clamp(state.player.x, PLAYER_SIZE, cssW - PLAYER_SIZE);
    state.player.y = clamp(state.player.y, PLAYER_SIZE, cssH - PLAYER_SIZE);
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function resetRun() {
    state.score = 0;
    state.time = 0;
    state.over = false;
    state.sparks = [];
    state.shards = [];
    state.particles = [];
    state.spawnSparkAt = 0.4;
    state.spawnShardAt = 1.2;
    state.player.x = state.w * 0.5;
    state.player.y = state.h * 0.55;
    state.player.pulse = 0;
    scoreEl.textContent = "0";
    for (var i = 0; i < 3; i++) spawnSpark(true);
  }

  function startGame() {
    resetRun();
    state.running = true;
    overlay.classList.add("is-hidden");
    state.lastTs = 0;
  }

  function endGame() {
    state.running = false;
    state.over = true;
    if (state.score > state.best) {
      state.best = state.score;
      bestEl.textContent = String(state.best);
      saveBest(state.best);
    }
    overlayEyebrow.textContent = "Game over";
    overlayTitle.textContent = "Orange Square";
    overlayCopy.textContent =
      "You scored " + state.score + ". Best: " + state.best + ". One more run?";
    startBtn.textContent = "Play again";
    overlay.classList.remove("is-hidden");
    burst(state.player.x, state.player.y, "#ff6a1a", 18);
  }

  function spawnSpark(quiet) {
    var margin = 40;
    state.sparks.push({
      x: rand(margin, state.w - margin),
      y: rand(margin, state.h - margin),
      r: rand(5, 8),
      phase: rand(0, Math.PI * 2),
      life: quiet ? 1 : 0,
    });
  }

  function spawnShard() {
    var edge = Math.floor(Math.random() * 4);
    var size = rand(18, 36);
    var speed = rand(70, 120) + Math.min(state.time * 4, 160);
    var x, y, vx, vy;
    if (edge === 0) {
      x = rand(0, state.w);
      y = -size;
      vx = rand(-40, 40);
      vy = speed;
    } else if (edge === 1) {
      x = state.w + size;
      y = rand(0, state.h);
      vx = -speed;
      vy = rand(-40, 40);
    } else if (edge === 2) {
      x = rand(0, state.w);
      y = state.h + size;
      vx = rand(-40, 40);
      vy = -speed;
    } else {
      x = -size;
      y = rand(0, state.h);
      vx = speed;
      vy = rand(-40, 40);
    }
    state.shards.push({
      x: x,
      y: y,
      w: size,
      h: size * rand(0.7, 1.3),
      vx: vx,
      vy: vy,
      rot: rand(0, Math.PI),
      spin: rand(-1.2, 1.2),
    });
  }

  function burst(x, y, color, n) {
    for (var i = 0; i < n; i++) {
      var a = rand(0, Math.PI * 2);
      var sp = rand(40, 180);
      state.particles.push({
        x: x,
        y: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: rand(0.35, 0.7),
        max: 0.7,
        color: color,
        size: rand(2, 5),
      });
    }
  }

  function inputVector() {
    var ix = 0;
    var iy = 0;
    if (state.keys.ArrowLeft || state.keys.a || state.keys.A || state.pad.left) ix -= 1;
    if (state.keys.ArrowRight || state.keys.d || state.keys.D || state.pad.right) ix += 1;
    if (state.keys.ArrowUp || state.keys.w || state.keys.W || state.pad.up) iy -= 1;
    if (state.keys.ArrowDown || state.keys.s || state.keys.S || state.pad.down) iy += 1;

    if (state.pointer.active) {
      var dx = state.pointer.x - state.player.x;
      var dy = state.pointer.y - state.player.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 8) {
        ix += dx / dist;
        iy += dy / dist;
      }
    }

    var len = Math.sqrt(ix * ix + iy * iy);
    if (len > 1) {
      ix /= len;
      iy /= len;
    }
    return { x: ix, y: iy };
  }

  function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function update(dt) {
    state.time += dt;
    state.player.pulse += dt;

    var move = inputVector();
    var speed = BASE_SPEED + Math.min(state.time * 3, 80);
    state.player.x = clamp(
      state.player.x + move.x * speed * dt,
      PLAYER_SIZE * 0.5,
      state.w - PLAYER_SIZE * 0.5
    );
    state.player.y = clamp(
      state.player.y + move.y * speed * dt,
      PLAYER_SIZE * 0.5,
      state.h - PLAYER_SIZE * 0.5
    );

    if (state.time >= state.spawnSparkAt) {
      state.spawnSparkAt = state.time + rand(0.7, 1.3);
      if (state.sparks.length < 6) spawnSpark(false);
    }
    if (state.time >= state.spawnShardAt) {
      var pace = Math.max(0.35, 1.35 - state.time * 0.02);
      state.spawnShardAt = state.time + rand(pace * 0.7, pace * 1.2);
      spawnShard();
      if (state.time > 20 && Math.random() < 0.35) spawnShard();
    }

    var px = state.player.x - PLAYER_SIZE * 0.5;
    var py = state.player.y - PLAYER_SIZE * 0.5;

    var si;
    for (si = state.sparks.length - 1; si >= 0; si--) {
      var spark = state.sparks[si];
      spark.phase += dt * 3;
      if (spark.life < 1) spark.life = Math.min(1, spark.life + dt * 3);
      var sr = spark.r + 4;
      if (
        aabb(
          px,
          py,
          PLAYER_SIZE,
          PLAYER_SIZE,
          spark.x - sr,
          spark.y - sr,
          sr * 2,
          sr * 2
        )
      ) {
        state.score += 10;
        scoreEl.textContent = String(state.score);
        burst(spark.x, spark.y, "#ffd28a", 10);
        state.sparks.splice(si, 1);
      }
    }

    for (si = state.shards.length - 1; si >= 0; si--) {
      var shard = state.shards[si];
      shard.x += shard.vx * dt;
      shard.y += shard.vy * dt;
      shard.rot += shard.spin * dt;
      var pad = 60;
      if (
        shard.x < -pad ||
        shard.x > state.w + pad ||
        shard.y < -pad ||
        shard.y > state.h + pad
      ) {
        state.shards.splice(si, 1);
        continue;
      }
      if (
        aabb(
          px + 3,
          py + 3,
          PLAYER_SIZE - 6,
          PLAYER_SIZE - 6,
          shard.x - shard.w * 0.5,
          shard.y - shard.h * 0.5,
          shard.w,
          shard.h
        )
      ) {
        endGame();
        return;
      }
    }

    // survival drip
    state.score += Math.floor(dt * 2);
    if (Math.floor(state.time * 2) !== Math.floor((state.time - dt) * 2)) {
      scoreEl.textContent = String(state.score);
    }

    for (si = state.particles.length - 1; si >= 0; si--) {
      var p = state.particles[si];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      if (p.life <= 0) state.particles.splice(si, 1);
    }
  }

  function drawBackground() {
    var g = ctx.createLinearGradient(0, 0, 0, state.h);
    g.addColorStop(0, "#121a16");
    g.addColorStop(0.55, "#0b100e");
    g.addColorStop(1, "#070a08");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, state.w, state.h);

    var glow = ctx.createRadialGradient(
      state.w * 0.5,
      state.h * 0.2,
      10,
      state.w * 0.5,
      state.h * 0.25,
      state.w * 0.55
    );
    glow.addColorStop(0, "rgba(255, 106, 26, 0.12)");
    glow.addColorStop(1, "rgba(255, 106, 26, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, state.w, state.h);

    // soft grid atmosphere
    ctx.save();
    ctx.strokeStyle = "rgba(61, 107, 90, 0.08)";
    ctx.lineWidth = 1;
    var step = 48;
    var offset = (state.time * 12) % step;
    var gx, gy;
    for (gx = -step; gx < state.w + step; gx += step) {
      ctx.beginPath();
      ctx.moveTo(gx + offset * 0.3, 0);
      ctx.lineTo(gx - offset * 0.2, state.h);
      ctx.stroke();
    }
    for (gy = -step; gy < state.h + step; gy += step) {
      ctx.beginPath();
      ctx.moveTo(0, gy + offset);
      ctx.lineTo(state.w, gy + offset * 0.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  function draw() {
    drawBackground();

    var i;
    for (i = 0; i < state.sparks.length; i++) {
      var spark = state.sparks[i];
      var twinkle = 0.75 + Math.sin(spark.phase) * 0.25;
      var alpha = spark.life * twinkle;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#ffd28a";
      ctx.shadowColor = "rgba(255, 210, 138, 0.8)";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, spark.r * twinkle, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (i = 0; i < state.shards.length; i++) {
      var shard = state.shards[i];
      ctx.save();
      ctx.translate(shard.x, shard.y);
      ctx.rotate(shard.rot);
      ctx.fillStyle = "#24352e";
      ctx.strokeStyle = "rgba(154, 171, 162, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.fillRect(-shard.w * 0.5, -shard.h * 0.5, shard.w, shard.h);
      ctx.strokeRect(-shard.w * 0.5, -shard.h * 0.5, shard.w, shard.h);
      ctx.restore();
    }

    for (i = 0; i < state.particles.length; i++) {
      var p = state.particles[i];
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      ctx.globalAlpha = 1;
    }

    var pulse = 1 + Math.sin(state.player.pulse * 4) * 0.04;
    var size = PLAYER_SIZE * pulse;
    var px = state.player.x - size * 0.5;
    var py = state.player.y - size * 0.5;

    ctx.save();
    ctx.shadowColor = "rgba(255, 106, 26, 0.65)";
    ctx.shadowBlur = 18;
    var grad = ctx.createLinearGradient(px, py, px + size, py + size);
    grad.addColorStop(0, "#ff8f45");
    grad.addColorStop(0.55, "#ff6a1a");
    grad.addColorStop(1, "#c44a0c");
    ctx.fillStyle = grad;
    ctx.fillRect(px, py, size, size);
    ctx.restore();

    ctx.strokeStyle = "rgba(255, 220, 180, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px + 0.75, py + 0.75, size - 1.5, size - 1.5);
  }

  function loop(ts) {
    if (!state.lastTs) state.lastTs = ts;
    var dt = Math.min(0.033, (ts - state.lastTs) / 1000);
    state.lastTs = ts;
    if (state.running) update(dt);
    else if (state.particles.length) {
      for (var i = state.particles.length - 1; i >= 0; i--) {
        var p = state.particles[i];
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.life <= 0) state.particles.splice(i, 1);
      }
    }
    draw();
    window.requestAnimationFrame(loop);
  }

  function canvasPoint(evt) {
    var rect = canvas.getBoundingClientRect();
    var clientX, clientY;
    if (evt.touches && evt.touches.length) {
      clientX = evt.touches[0].clientX;
      clientY = evt.touches[0].clientY;
    } else if (evt.changedTouches && evt.changedTouches.length) {
      clientX = evt.changedTouches[0].clientX;
      clientY = evt.changedTouches[0].clientY;
    } else {
      clientX = evt.clientX;
      clientY = evt.clientY;
    }
    return {
      x: ((clientX - rect.left) / rect.width) * state.w,
      y: ((clientY - rect.top) / rect.height) * state.h,
    };
  }

  function onPointerDown(evt) {
    if (!state.running) return;
    if (evt.cancelable) evt.preventDefault();
    var pt = canvasPoint(evt);
    state.pointer.active = true;
    state.pointer.x = pt.x;
    state.pointer.y = pt.y;
  }

  function onPointerMove(evt) {
    if (!state.pointer.active) return;
    if (evt.cancelable) evt.preventDefault();
    var pt = canvasPoint(evt);
    state.pointer.x = pt.x;
    state.pointer.y = pt.y;
  }

  function onPointerUp(evt) {
    if (evt && evt.cancelable) evt.preventDefault();
    state.pointer.active = false;
  }

  canvas.addEventListener("mousedown", onPointerDown);
  window.addEventListener("mousemove", onPointerMove);
  window.addEventListener("mouseup", onPointerUp);

  canvas.addEventListener("touchstart", onPointerDown, { passive: false });
  canvas.addEventListener("touchmove", onPointerMove, { passive: false });
  canvas.addEventListener("touchend", onPointerUp, { passive: false });
  canvas.addEventListener("touchcancel", onPointerUp, { passive: false });

  // Pointer Events when available (Safari 13+)
  if (window.PointerEvent) {
    canvas.addEventListener("pointerdown", function (evt) {
      if (evt.pointerType === "mouse" && evt.button !== 0) return;
      onPointerDown(evt);
      try {
        canvas.setPointerCapture(evt.pointerId);
      } catch (e) {
        /* ignore */
      }
    });
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
  }

  window.addEventListener("keydown", function (evt) {
    state.keys[evt.key] = true;
    if (
      ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].indexOf(evt.key) !==
      -1
    ) {
      evt.preventDefault();
    }
    if (!state.running && (evt.key === "Enter" || evt.key === " ")) {
      startGame();
    }
  });

  window.addEventListener("keyup", function (evt) {
    state.keys[evt.key] = false;
  });

  function bindPad() {
    var buttons = touchPad.querySelectorAll("[data-dir]");
    function setDir(dir, on) {
      state.pad[dir] = on;
      var btn = touchPad.querySelector('[data-dir="' + dir + '"]');
      if (btn) {
        if (on) btn.classList.add("is-active");
        else btn.classList.remove("is-active");
      }
    }
    for (var i = 0; i < buttons.length; i++) {
      (function (btn) {
        var dir = btn.getAttribute("data-dir");
        btn.addEventListener("touchstart", function (e) {
          e.preventDefault();
          setDir(dir, true);
        }, { passive: false });
        btn.addEventListener("touchend", function (e) {
          e.preventDefault();
          setDir(dir, false);
        }, { passive: false });
        btn.addEventListener("touchcancel", function () {
          setDir(dir, false);
        });
        btn.addEventListener("mousedown", function (e) {
          e.preventDefault();
          setDir(dir, true);
        });
        btn.addEventListener("mouseup", function () {
          setDir(dir, false);
        });
        btn.addEventListener("mouseleave", function () {
          setDir(dir, false);
        });
      })(buttons[i]);
    }
  }

  startBtn.addEventListener("click", function () {
    startGame();
  });

  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", function () {
    window.setTimeout(resize, 100);
  });

  bindPad();
  resize();
  draw();
  window.requestAnimationFrame(loop);
})();

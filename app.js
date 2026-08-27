/* ---------------------------------------------------------------
   Logic ของแบบประเมิน: เก็บคำตอบ -> คำนวณสี -> ส่งขึ้น Supabase
   --------------------------------------------------------------- */

(function () {
  "use strict";

  var CFG = window.APP_CONFIG || {};
  var QUESTIONS = window.QUESTIONS;
  var PROFILES = window.PROFILES;
  var COLOR_ORDER = window.COLOR_ORDER;
  var CHOICE_KEYS = window.CHOICE_KEYS;

  var state = {
    profile: null,      // ข้อมูลผู้ทำแบบประเมิน
    answers: {},        // { "1": "ก", ... }
    index: 0,           // ข้อที่กำลังทำ (0-based)
    startedAt: null,
  };

  var el = function (id) { return document.getElementById(id); };

  // ---------- Supabase ----------

  var sb = null;
  function isConfigured() {
    return CFG.SUPABASE_URL &&
      CFG.SUPABASE_URL.indexOf("YOUR-PROJECT-REF") === -1 &&
      CFG.SUPABASE_ANON_KEY &&
      CFG.SUPABASE_ANON_KEY.indexOf("YOUR-ANON") === -1;
  }
  function getClient() {
    if (!sb && isConfigured() && window.supabase) {
      sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
    }
    return sb;
  }

  // ---------- การให้คะแนน ----------

  function score(answers) {
    var s = { red: 0, blue: 0, yellow: 0, green: 0 };
    QUESTIONS.forEach(function (q) {
      var pick = answers[String(q.no)];
      if (pick && q.options[pick]) s[q.options[pick].color] += 1;
    });
    return s;
  }

  function ranked(s) {
    return COLOR_ORDER.slice().sort(function (a, b) {
      if (s[b] !== s[a]) return s[b] - s[a];
      return COLOR_ORDER.indexOf(a) - COLOR_ORDER.indexOf(b);
    });
  }

  // ---------- หน้าจอ ----------

  function show(screen) {
    ["screen-intro", "screen-quiz", "screen-result"].forEach(function (id) {
      el(id).classList.toggle("hidden", id !== screen);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ---------- หน้าแรก ----------

  function initIntro() {
    if (CFG.FORM_TITLE) {
      el("app-title").textContent = CFG.FORM_TITLE;
      document.title = CFG.FORM_TITLE;
    }
    if (CFG.ORG_NAME) el("org-name").textContent = CFG.ORG_NAME;

    if (CFG.REQUIRE_EMAIL) {
      el("email-req").classList.remove("hidden");
      el("f-email").required = true;
    }

    if (CFG.ASK_POSITION) {
      el("position-field").classList.remove("hidden");
      el("f-position").required = true;

      if (Array.isArray(CFG.POSITIONS) && CFG.POSITIONS.length) {
        var sel = document.createElement("select");
        sel.id = "f-position";
        sel.required = true;
        sel.innerHTML = '<option value="">-- เลือกตำแหน่ง --</option>' +
          CFG.POSITIONS.map(function (p) {
            return '<option value="' + escapeHtml(p) + '">' + escapeHtml(p) + "</option>";
          }).join("");
        var old = el("f-position");
        old.parentNode.replaceChild(sel, old);
      }
    }

    if (!isConfigured()) {
      el("config-warning").classList.remove("hidden");
    }

    el("intro-form").addEventListener("submit", function (e) {
      e.preventDefault();
      state.profile = {
        full_name: el("f-name").value.trim(),
        nickname: el("f-nickname").value.trim(),
        position: CFG.ASK_POSITION ? el("f-position").value.trim() : null,
        email: el("f-email").value.trim(),
        phone: el("f-phone").value.trim(),
      };
      state.startedAt = Date.now();
      state.index = 0;
      state.answers = {};
      show("screen-quiz");
      renderQuestion();
    });
  }

  // ---------- คำถาม ----------

  function renderQuestion() {
    var q = QUESTIONS[state.index];
    var total = QUESTIONS.length;

    el("progress-fill").style.width = ((state.index) / total * 100) + "%";
    el("progress-label").textContent = "ข้อ " + (state.index + 1) + " จาก " + total;
    el("q-num").textContent = q.no;

    var box = el("options");
    box.innerHTML = "";
    CHOICE_KEYS.forEach(function (k) {
      var opt = q.options[k];
      if (!opt) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "opt" + (state.answers[String(q.no)] === k ? " selected" : "");
      btn.innerHTML = '<span class="key">' + k + "</span><span>" + escapeHtml(opt.text) + "</span>";
      btn.addEventListener("click", function () { choose(k); });
      box.appendChild(btn);
    });

    el("btn-back").classList.toggle("hidden", state.index === 0);
  }

  function choose(k) {
    var q = QUESTIONS[state.index];
    state.answers[String(q.no)] = k;

    Array.prototype.forEach.call(el("options").children, function (c) {
      c.classList.toggle("selected", c.querySelector(".key").textContent === k);
    });

    setTimeout(function () {
      if (state.index < QUESTIONS.length - 1) {
        state.index += 1;
        renderQuestion();
      } else {
        finish();
      }
    }, 220);
  }

  function back() {
    if (state.index > 0) {
      state.index -= 1;
      renderQuestion();
    }
  }

  // ---------- สรุปผล + บันทึก ----------

  function finish() {
    var s = score(state.answers);
    var order = ranked(s);
    var payload = Object.assign({}, state.profile, {
      answers: state.answers,
      scores: s,
      primary_color: order[0],
      secondary_color: order[1],
      duration_seconds: Math.round((Date.now() - state.startedAt) / 1000),
      user_agent: navigator.userAgent,
    });

    // "full" = เห็นทั้งหมด | "color" = บอกแค่สี | "none"/false = ไม่บอกสี
    var mode = CFG.SHOW_RESULT_TO_CANDIDATE;
    if (mode === true) mode = "full";
    if (mode === false) mode = "none";

    if (mode === "none") renderThanks();
    else if (mode === "color") renderColorOnly(order);
    else renderResult(s, order);
    show("screen-result");
    save(payload);
  }

  function save(payload) {
    var box = el("save-status");
    var client = getClient();

    if (!client) {
      box.className = "status warn";
      box.textContent = "โหมดทดสอบ: ยังไม่ได้ตั้งค่า Supabase จึงยังไม่ได้บันทึกผลลงฐานข้อมูล";
      return;
    }

    box.className = "status warn";
    box.textContent = "กำลังบันทึกผล...";

    client.from("assessment_responses").insert([payload]).then(function (res) {
      if (res.error) {
        box.className = "status err";
        box.textContent = "บันทึกไม่สำเร็จ: " + res.error.message + " (กรุณาแจ้งเจ้าหน้าที่ หรือบันทึกหน้าจอนี้ไว้)";
        console.error(res.error);
      } else {
        box.className = "status ok";
        box.textContent = "บันทึกผลเรียบร้อยแล้ว ขอบคุณที่สละเวลาทำแบบประเมิน";
      }
    });
  }

  // ซ่อนผลลัพธ์จากผู้สมัคร (ใช้เมื่อต้องการให้ HR ดูผลเท่านั้น)
  function renderThanks() {
    var hero = el("hero");
    hero.style.background = "linear-gradient(135deg, #f79ea8 0%, #f2894f 100%)";
    el("hero-kicker").textContent = "ส่งแบบประเมินเรียบร้อย";
    el("hero-title").textContent = "ขอบคุณที่สละเวลา 🙏";
    el("hero-tag").textContent = "ทีมงานจะนำข้อมูลไปใช้ประกอบการสัมภาษณ์ต่อไป";

    el("thanks-name").textContent = state.profile.full_name +
      (state.profile.position ? " · " + state.profile.position : "");

    el("result-detail").classList.add("hidden");
    el("thanks-note").classList.remove("hidden");
  }

  // บอกแค่ว่าได้สีอะไร ไม่แสดงคะแนนหรือคำอธิบายใด ๆ
  function renderColorOnly(order) {
    var p = PROFILES[order[0]];
    var hero = el("hero");
    hero.style.background =
      "linear-gradient(135deg, " + p.hex + " 0%, " + shade(p.hex, -18) + " 100%)";
    el("hero-kicker").textContent = "บุคลิกภาพเด่นของคุณคือ";
    el("hero-title").textContent = p.name;
    el("hero-tag").classList.add("hidden");   // ไม่บอกชื่อบุคลิก บอกแค่ชื่อสี

    el("thanks-name").textContent = state.profile.full_name +
      (state.profile.position ? " · " + state.profile.position : "");

    el("result-detail").classList.add("hidden");
    el("thanks-note").classList.remove("hidden");
  }

  function renderResult(s, order) {
    var p = PROFILES[order[0]];
    var second = PROFILES[order[1]];

    var hero = el("hero");
    hero.style.background = "linear-gradient(135deg, " + p.hex + " 0%, " + shade(p.hex, -18) + " 100%)";
    el("hero-kicker").textContent = "บุคลิกภาพเด่นของคุณคือ";
    el("hero-title").textContent = p.name + " · " + p.title;
    el("hero-tag").textContent = p.tagline;

    // แถบคะแนน
    var bars = el("bars");
    bars.innerHTML = "";
    order.forEach(function (c) {
      var prof = PROFILES[c];
      var pct = (s[c] / QUESTIONS.length) * 100;
      var row = document.createElement("div");
      row.className = "bar-row";
      row.innerHTML =
        '<div class="bar-name">' + prof.name + "</div>" +
        '<div class="bar-track"><div class="bar-fill" style="width:' + pct + "%;background:" + prof.hex + '"></div></div>' +
        '<div class="bar-val">' + s[c] + "</div>";
      bars.appendChild(row);
    });

    el("res-summary").textContent = p.summary;
    fillList("res-strengths", p.strengths);
    fillList("res-watchouts", p.watchouts);
    el("res-workstyle").textContent = p.workStyle;
    el("res-roles").textContent = p.fitRoles;

    var blend = el("res-blend");
    if (s[order[1]] > 0 && s[order[1]] >= s[order[0]] - 1) {
      blend.classList.remove("hidden");
      el("res-blend-text").textContent =
        "คุณมีบุคลิก " + second.name + " (" + second.title + ") เป็นสีรองที่ใกล้เคียงกันมาก — " +
        "แปลว่าคุณปรับสไตล์ระหว่าง “" + p.tagline + "” และ “" + second.tagline + "” ได้ตามสถานการณ์";
    } else {
      blend.classList.add("hidden");
    }

    el("res-name").textContent = state.profile.full_name +
      (state.profile.position ? " · " + state.profile.position : "");
  }

  function fillList(id, items) {
    var ul = el(id);
    ul.innerHTML = "";
    items.forEach(function (t) {
      var li = document.createElement("li");
      li.textContent = t;
      ul.appendChild(li);
    });
  }

  // ---------- utils ----------

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function shade(hex, percent) {
    var n = parseInt(hex.slice(1), 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    var f = function (v) { return Math.max(0, Math.min(255, Math.round(v + (v * percent / 100)))); };
    return "#" + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1);
  }

  // ---------- start ----------

  document.addEventListener("DOMContentLoaded", function () {
    initIntro();
    el("btn-back").addEventListener("click", back);
    el("btn-print").addEventListener("click", function () { window.print(); });
    el("btn-restart").addEventListener("click", function () { location.reload(); });
  });
})();

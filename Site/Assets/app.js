(function () {
  "use strict";

  var data = window.SOC_DATA;
  if (!data || !Array.isArray(data.stages)) {
    return;
  }

  var stages = data.stages;
  var repo = data.repo;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var phaseLabels = {
    web: "Web foothold",
    cred: "Credential access and movement",
    domain: "Domain takeover",
    impact: "Collection and impact"
  };

  var header = document.getElementById("site-header");
  var progress = document.getElementById("scroll-progress");
  var navToggle = document.getElementById("nav-toggle");
  var grid = document.getElementById("stage-grid");
  var filterCount = document.getElementById("filter-count");
  var coverageBody = document.getElementById("coverage-body");
  var dialog = document.getElementById("stage-dialog");
  var dialogNumber = document.getElementById("dialog-number");
  var dialogPhase = document.getElementById("dialog-phase");
  var dialogTitle = document.getElementById("dialog-title");
  var dialogTags = document.getElementById("dialog-tags");
  var dialogPlain = document.getElementById("dialog-plain");
  var dialogAttacker = document.getElementById("dialog-attacker");
  var dialogDefender = document.getElementById("dialog-defender");
  var dialogEvidence = document.getElementById("dialog-evidence");
  var dialogGap = document.getElementById("dialog-gap");
  var dialogTelemetry = document.getElementById("dialog-telemetry");
  var dialogLinks = document.getElementById("dialog-links");
  var dialogPosition = document.getElementById("dialog-position");
  var dialogPrev = document.getElementById("dialog-prev");
  var dialogNext = document.getElementById("dialog-next");
  var currentIndex = 0;

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    if (typeof text === "string") {
      node.textContent = text;
    }
    return node;
  }

  function arrowIcon() {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.setAttribute("fill", "none");
    svg.setAttribute("aria-hidden", "true");
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M3 8h10M9 4l4 4-4 4");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "1.5");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svg.appendChild(path);
    return svg;
  }

  function statusChip(text) {
    return element("span", "status-chip", text);
  }

  function updateScrollState() {
    var scrollTop = window.scrollY || document.documentElement.scrollTop;
    var height = document.documentElement.scrollHeight - window.innerHeight;
    var ratio = height > 0 ? Math.min(scrollTop / height, 1) : 0;
    if (progress) {
      progress.style.width = (ratio * 100).toFixed(2) + "%";
    }
    if (header) {
      header.classList.toggle("is-scrolled", scrollTop > 8);
    }
  }

  var scrollQueued = false;
  window.addEventListener("scroll", function () {
    if (scrollQueued) {
      return;
    }
    scrollQueued = true;
    window.requestAnimationFrame(function () {
      updateScrollState();
      scrollQueued = false;
    });
  }, { passive: true });
  updateScrollState();

  if (navToggle) {
    navToggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
  }

  document.querySelectorAll(".nav-menu a").forEach(function (link) {
    link.addEventListener("click", function () {
      document.body.classList.remove("nav-open");
      if (navToggle) {
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && document.body.classList.contains("nav-open")) {
      document.body.classList.remove("nav-open");
      if (navToggle) {
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.focus();
      }
    }
  });

  var desktopQuery = window.matchMedia("(min-width: 861px)");
  function closeMobileNav(event) {
    if (event.matches) {
      document.body.classList.remove("nav-open");
      if (navToggle) {
        navToggle.setAttribute("aria-expanded", "false");
      }
    }
  }
  if (desktopQuery.addEventListener) {
    desktopQuery.addEventListener("change", closeMobileNav);
  }

  function renderStageCards() {
    if (!grid) {
      return;
    }
    stages.forEach(function (stage, index) {
      var card = element("article", "stage-card");
      card.dataset.phase = stage.phase;
      card.dataset.stage = stage.id;
      card.setAttribute("data-reveal", "");
      card.style.setProperty("--reveal-delay", Math.min(index * 35, 420) + "ms");

      var button = element("button", "stage-card__button");
      button.type = "button";
      button.dataset.stageIndex = String(index);
      button.setAttribute("aria-haspopup", "dialog");
      button.setAttribute("aria-controls", "stage-dialog");
      button.setAttribute("aria-label", "Stage " + stage.id + ": " + stage.title + ". Open details.");

      var top = element("div", "stage-card__top");
      top.appendChild(element("span", "stage-card__number", stage.id));
      top.appendChild(statusChip(stage.status));

      var title = element("span", "stage-card__title", stage.title);
      var plain = element("span", "stage-card__plain", stage.plain);
      var meta = element("div", "stage-card__meta");
      meta.appendChild(element("span", "stage-card__tag", stage.techniqueId));
      meta.appendChild(element("span", "stage-card__tag", stage.tactic));
      meta.appendChild(element("span", "stage-card__tag", stage.caseLabel));

      var open = element("span", "stage-card__open", "Open stage");
      open.appendChild(arrowIcon());

      button.appendChild(top);
      button.appendChild(title);
      button.appendChild(plain);
      button.appendChild(meta);
      button.appendChild(open);
      card.appendChild(button);
      grid.appendChild(card);
    });
  }

  function renderCoverage() {
    if (!coverageBody) {
      return;
    }
    stages.forEach(function (stage) {
      var row = document.createElement("tr");
      var idCell = element("td", "", stage.id);
      var titleCell = element("td", "", stage.title);
      var telemetryCell = element("td", "", stage.telemetry);
      var lookCell = element("td", "", stage.defender);
      var gapCell = element("td");
      gapCell.appendChild(element("span", "gap-code", stage.gap));
      var statusCell = element("td");
      statusCell.appendChild(statusChip(stage.status));

      row.appendChild(idCell);
      row.appendChild(titleCell);
      row.appendChild(telemetryCell);
      row.appendChild(lookCell);
      row.appendChild(gapCell);
      row.appendChild(statusCell);
      coverageBody.appendChild(row);
    });
  }

  function buildDialogTag(text, extraClass) {
    var tag = element("span", "dialog-tag" + (extraClass ? " " + extraClass : ""), text);
    dialogTags.appendChild(tag);
  }

  function addDialogLink(label, path) {
    var link = document.createElement("a");
    link.className = "dialog-link";
    link.href = repo + "/" + path;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.appendChild(document.createTextNode(label));
    link.appendChild(document.createTextNode(" ↗"));
    dialogLinks.appendChild(link);
  }

  function fillDialog(index) {
    var stage = stages[index];
    if (!stage) {
      return;
    }
    currentIndex = index;
    dialogNumber.textContent = stage.id;
    dialogPhase.textContent = phaseLabels[stage.phase] || stage.phase;
    dialogTitle.textContent = stage.title;
    dialogPlain.textContent = stage.plain;
    dialogAttacker.textContent = stage.attacker;
    dialogDefender.textContent = stage.defender;
    dialogEvidence.textContent = stage.evidence;
    dialogGap.textContent = stage.gap + " is reserved for this stage. Confirm the rule, the telemetry, and the evidence after execution.";
    dialogTelemetry.textContent = stage.telemetry;
    dialogPosition.textContent = "Stage " + (index + 1) + " of " + stages.length;

    dialogTags.replaceChildren();
    buildDialogTag(phaseLabels[stage.phase] || stage.phase, "dialog-tag--phase");
    buildDialogTag(stage.techniqueId);
    buildDialogTag(stage.tactic);
    buildDialogTag(stage.caseLabel);
    buildDialogTag(stage.status);

    dialogLinks.replaceChildren();
    addDialogLink("Attack write-up", stage.attackPath);
    addDialogLink("Investigation notes", stage.investigationPath);
    addDialogLink("Case summary", "04-Investigation/Cases/" + stage.caseSlug + ".md");
    addDialogLink("Coverage matrix", "03-Detection-Engineering/coverage-matrix.md");

    dialogPrev.disabled = index === 0;
    dialogNext.disabled = index === stages.length - 1;
  }

  function openDialog(index) {
    if (!dialog) {
      return;
    }
    fillDialog(index);
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
    document.body.classList.add("dialog-open");
  }

  function closeDialog() {
    if (!dialog) {
      return;
    }
    if (typeof dialog.close === "function") {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
  }

  function initDialog() {
    if (!dialog) {
      return;
    }

    grid.addEventListener("click", function (event) {
      var button = event.target.closest(".stage-card__button");
      if (!button) {
        return;
      }
      openDialog(Number(button.dataset.stageIndex));
    });

    dialog.querySelectorAll("[data-close-dialog]").forEach(function (button) {
      button.addEventListener("click", closeDialog);
    });

    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) {
        closeDialog();
      }
    });

    dialog.addEventListener("close", function () {
      document.body.classList.remove("dialog-open");
    });

    dialogPrev.addEventListener("click", function () {
      if (currentIndex > 0) {
        fillDialog(currentIndex - 1);
      }
    });

    dialogNext.addEventListener("click", function () {
      if (currentIndex < stages.length - 1) {
        fillDialog(currentIndex + 1);
      }
    });
  }

  function initFilters() {
    var filters = Array.prototype.slice.call(document.querySelectorAll(".filter"));
    if (!filters.length || !grid) {
      return;
    }

    filters.forEach(function (button) {
      button.addEventListener("click", function () {
        var filter = button.dataset.filter;
        filters.forEach(function (item) {
          var active = item === button;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-pressed", String(active));
        });

        var shown = 0;
        Array.prototype.forEach.call(grid.children, function (card) {
          var visible = filter === "all" || card.dataset.phase === filter;
          card.classList.toggle("is-hidden", !visible);
          if (visible) {
            shown += 1;
            card.classList.remove("is-entering");
            void card.offsetWidth;
            card.classList.add("is-entering");
          }
        });

        if (filterCount) {
          filterCount.textContent = "Showing " + shown + " of " + stages.length + " stages";
        }
      });
    });
  }

  function initReveal() {
    var nodes = document.querySelectorAll("[data-reveal]");
    if (!nodes.length) {
      return;
    }
    if (reduceMotion || !("IntersectionObserver" in window)) {
      nodes.forEach(function (node) {
        node.classList.add("is-visible");
      });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -36px 0px" });
    nodes.forEach(function (node) {
      observer.observe(node);
    });
  }

  function initCounters() {
    document.querySelectorAll("[data-count]").forEach(function (counter) {
      counter.textContent = counter.dataset.count;
    });
  }

  function initSectionNav() {
    if (!("IntersectionObserver" in window)) {
      return;
    }
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav-menu > a[href^="#"]'));
    var sections = links.map(function (link) {
      return document.querySelector(link.getAttribute("href"));
    }).filter(Boolean);
    if (!sections.length) {
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          return;
        }
        links.forEach(function (link) {
          link.classList.toggle("is-active", link.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-42% 0px -52% 0px", threshold: 0 });
    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  renderStageCards();
  renderCoverage();
  initDialog();
  initFilters();
  initReveal();
  initCounters();
  initSectionNav();
})();

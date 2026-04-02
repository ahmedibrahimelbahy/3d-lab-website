document.addEventListener('DOMContentLoaded', function () {

  // ============================================================
  // FLOATING POLYGON PARTICLES — full page background
  // ============================================================
  (function initParticles() {
    var cvs = document.createElement('canvas');
    cvs.id = 'bg-particles';
    Object.assign(cvs.style, {
      position:      'fixed',
      top:           '0',
      left:          '0',
      width:         '100vw',
      height:        '100vh',
      pointerEvents: 'none',
      zIndex:        '9',
    });
    document.body.insertBefore(cvs, document.body.firstChild);

    var ctx = cvs.getContext('2d');
    var W = window.innerWidth, H = window.innerHeight;
    cvs.width = W; cvs.height = H;

    window.addEventListener('resize', function () {
      W = cvs.width  = window.innerWidth;
      H = cvs.height = window.innerHeight;
    }, { passive: true });

    // Blue / cyan / indigo palette
    var palette = [
      [37,  99, 235],
      [96, 165, 250],
      [99, 102, 241],
      [14, 165, 233],
      [147,197, 253],
    ];

    var shapes = [];
    var N = 42;
    for (var i = 0; i < N; i++) {
      var c = palette[Math.floor(Math.random() * palette.length)];
      shapes.push({
        x:    Math.random() * W,
        y:    Math.random() * H,
        r:    5 + Math.random() * 18,
        sides:[3, 4, 4, 6][Math.floor(Math.random() * 4)],
        rot:  Math.random() * Math.PI * 2,
        rv:   (Math.random() - 0.5) * 0.013,
        vx:   (Math.random() - 0.5) * 0.28,
        vy:   (Math.random() - 0.5) * 0.28,
        a:    0.035 + Math.random() * 0.075,
        fill: Math.random() > 0.48,
        dia:  Math.random() > 0.5,   // squares rotated 45° → diamonds
        rgb:  c,
      });
    }

    function poly(x, y, n, r, rot) {
      ctx.beginPath();
      for (var i = 0; i <= n; i++) {
        var angle = rot + (i / n) * Math.PI * 2;
        i === 0
          ? ctx.moveTo(x + Math.cos(angle) * r, y + Math.sin(angle) * r)
          : ctx.lineTo(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
      }
      ctx.closePath();
    }

    (function frame() {
      requestAnimationFrame(frame);
      ctx.clearRect(0, 0, W, H);

      for (var i = 0; i < shapes.length; i++) {
        var p = shapes[i];
        p.x += p.vx;  p.y += p.vy;  p.rot += p.rv;
        if (p.x < -55) p.x = W + 55;
        if (p.x > W+55) p.x = -55;
        if (p.y < -55) p.y = H + 55;
        if (p.y > H+55) p.y = -55;

        var rot = (p.sides === 4 && p.dia) ? p.rot + Math.PI / 4 : p.rot;
        poly(p.x, p.y, p.sides, p.r, rot);

        var rgb = p.rgb[0] + ',' + p.rgb[1] + ',' + p.rgb[2];
        ctx.strokeStyle = 'rgba(' + rgb + ',' + p.a + ')';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        if (p.fill) {
          ctx.fillStyle = 'rgba(' + rgb + ',' + (p.a * 0.2) + ')';
          ctx.fill();
        }
      }
    })();
  })();


  // ============================================================
  // THREE.JS — Futuristic Holographic Cube
  // ============================================================

  function createHoloTexture() {
    var size = 512;
    var cvs  = document.createElement('canvas');
    cvs.width = cvs.height = size;
    var ctx  = cvs.getContext('2d');

    // Nearly transparent base
    ctx.fillStyle = 'rgba(37,99,235,0.04)';
    ctx.fillRect(0, 0, size, size);

    // 4×4 grid lines
    ctx.strokeStyle = 'rgba(147,197,253,0.68)';
    ctx.lineWidth   = 1.8;
    var d = 4, cell = size / d;
    for (var i = 0; i <= d; i++) {
      ctx.beginPath(); ctx.moveTo(i * cell, 0);    ctx.lineTo(i * cell, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * cell);    ctx.lineTo(size, i * cell); ctx.stroke();
    }

    // Corner bracket accents (futuristic HUD look)
    var acc = 48;
    ctx.strokeStyle = 'rgba(96,165,250,0.92)';
    ctx.lineWidth   = 3.5;
    [[0, 0], [size, 0], [0, size], [size, size]].forEach(function (c) {
      var dx = c[0] === 0 ? 1 : -1;
      var dy = c[1] === 0 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(c[0] + dx * acc, c[1]);
      ctx.lineTo(c[0], c[1]);
      ctx.lineTo(c[0], c[1] + dy * acc);
      ctx.stroke();
    });

    return new THREE.CanvasTexture(cvs);
  }

  function initCube() {
    var canvas = document.getElementById('cube-canvas');
    if (!canvas || typeof THREE === 'undefined') return;
    var wrap = canvas.parentElement;

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    var scene  = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0.5, 7.5);

    var sz = 2.5;

    // 1. Glass / holographic faces
    var cube = new THREE.Mesh(
      new THREE.BoxGeometry(sz, sz, sz),
      new THREE.MeshPhongMaterial({
        map:         createHoloTexture(),
        transparent: true,
        opacity:     0.18,
        side:        THREE.DoubleSide,
        shininess:   220,
        specular:    new THREE.Color(0xffffff),
      })
    );
    scene.add(cube);

    // 2. Bright sharp outer edges
    var edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(sz, sz, sz)),
      new THREE.LineBasicMaterial({ color: 0x60A5FA, transparent: true, opacity: 0.95 })
    );
    scene.add(edges);

    // 3. Outer cage — slightly larger, very dim
    var cageEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(sz * 1.12, sz * 1.12, sz * 1.12)),
      new THREE.LineBasicMaterial({ color: 0x2563EB, transparent: true, opacity: 0.18 })
    );
    scene.add(cageEdges);

    // 4. Primary orbit ring
    var ring1 = new THREE.Mesh(
      new THREE.TorusGeometry(2.55, 0.018, 16, 120),
      new THREE.MeshBasicMaterial({ color: 0x60A5FA, transparent: true, opacity: 0.48 })
    );
    ring1.rotation.x = Math.PI / 3;
    scene.add(ring1);

    // 5. Secondary orbit ring (different plane)
    var ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(2.15, 0.012, 16, 120),
      new THREE.MeshBasicMaterial({ color: 0x93C5FD, transparent: true, opacity: 0.28 })
    );
    ring2.rotation.z = Math.PI / 5;
    ring2.rotation.x = Math.PI / 7;
    scene.add(ring2);

    // 6. Orbiting particles on the primary ring plane
    var dotGroup = new THREE.Group();
    for (var i = 0; i < 6; i++) {
      var a   = (i / 6) * Math.PI * 2;
      var dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.062, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0x93C5FD })
      );
      dot.position.set(Math.cos(a) * 2.55, 0, Math.sin(a) * 2.55);
      dotGroup.add(dot);
    }
    dotGroup.rotation.x = Math.PI / 3;
    scene.add(dotGroup);

    // Lighting — key + fill + top + blue accent
    scene.add(new THREE.AmbientLight(0x1e3a8a, 3.8));

    var kl = new THREE.DirectionalLight(0xffffff, 4.8);
    kl.position.set(5, 8, 5);
    scene.add(kl);

    var bl = new THREE.PointLight(0x60a5fa, 4.2, 24);
    bl.position.set(-5, 3, 4);
    scene.add(bl);

    var tl = new THREE.PointLight(0xffffff, 3.0, 18);
    tl.position.set(0, 7, 0);
    scene.add(tl);

    // Mouse parallax
    var mx = 0, my = 0, lerpX = 0, lerpY = 0;
    document.addEventListener('mousemove', function (e) {
      mx = (e.clientX / window.innerWidth  - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    function setSize() {
      var w = wrap.clientWidth, h = wrap.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    setSize();
    window.addEventListener('resize', setSize);

    var clock = new THREE.Clock();
    (function animate() {
      requestAnimationFrame(animate);
      var t = clock.getElapsedTime();

      lerpX += (my * 0.35 - lerpX) * 0.04;
      lerpY += (mx * 0.45 - lerpY) * 0.04;

      var ry = t * 0.28 + lerpY;
      var rx = 0.22 + lerpX;
      var fy = Math.sin(t * 0.72) * 0.14;

      cube.rotation.x      = rx;   cube.rotation.y      = ry;   cube.position.y      = fy;
      edges.rotation.x     = rx;   edges.rotation.y     = ry;   edges.position.y     = fy;
      cageEdges.rotation.x = rx * 0.9; cageEdges.rotation.y = ry * 0.9; cageEdges.position.y = fy;

      ring1.rotation.z  =  t * 0.5;
      ring2.rotation.z  = -t * 0.38;
      ring2.rotation.y  =  t * 0.2;
      dotGroup.rotation.z = t * 0.5;

      renderer.render(scene, camera);
    })();
  }

  initCube();


  // ============================================================
  // CURSOR TRAIL — polygon shapes that follow the mouse
  // Inspired by polygon.technology interactive feel
  // ============================================================
  (function initCursorTrail() {
    // Skip on touch/mobile devices
    if (window.matchMedia('(pointer: coarse)').matches) return;

    var clips = [
      'polygon(50% 0%, 0% 100%, 100% 100%)',                             // triangle
      'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',                    // diamond
      'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)', // hexagon
      'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',                    // square
    ];
    var colors = ['rgba(37,99,235,', 'rgba(96,165,250,', 'rgba(99,102,241,', 'rgba(14,165,233,'];

    var lastT = 0;

    document.addEventListener('mousemove', function (e) {
      var now = Date.now();
      if (now - lastT < 42) return; // throttle ~24fps
      lastT = now;

      var size = 7 + Math.random() * 9;
      var el   = document.createElement('div');

      Object.assign(el.style, {
        position:      'fixed',
        width:         size + 'px',
        height:        size + 'px',
        left:          (e.clientX - size / 2) + 'px',
        top:           (e.clientY - size / 2) + 'px',
        clipPath:      clips[Math.floor(Math.random() * clips.length)],
        background:    colors[Math.floor(Math.random() * colors.length)] + '0.62)',
        pointerEvents: 'none',
        zIndex:        '9998',
        transform:     'rotate(' + (Math.random() * 360) + 'deg)',
      });

      document.body.appendChild(el);

      if (typeof gsap !== 'undefined') {
        gsap.to(el, {
          opacity:  0,
          scale:    0,
          y:        -(12 + Math.random() * 18),
          x:        (Math.random() - 0.5) * 14,
          duration: 0.42 + Math.random() * 0.22,
          ease:     'power2.out',
          onComplete: function () { el.parentNode && el.parentNode.removeChild(el); }
        });
      } else {
        setTimeout(function () { el.parentNode && el.parentNode.removeChild(el); }, 500);
      }
    });
  })();


  // ============================================================
  // TEXT SCRAMBLE — cycles random chars before resolving
  // ============================================================
  function scrambleText(el, delay) {
    var chars  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    var original  = el.textContent.trim();
    var totalChars = original.replace(/\s/g, '').length;
    var maxIter   = totalChars * 5 + 12;
    var iterations = 0;

    setTimeout(function () {
      var interval = setInterval(function () {
        el.textContent = original.split('').map(function (ch, idx) {
          if (ch === ' ') return ' ';
          if (idx < Math.floor(iterations / 5)) return ch;
          return chars[Math.floor(Math.random() * chars.length)];
        }).join('');
        iterations++;
        if (iterations > maxIter) {
          clearInterval(interval);
          el.textContent = original;
        }
      }, 36);
    }, delay || 0);
  }

  // ============================================================
  // TYPEWRITER — types hero sub text character by character
  // ============================================================
  function typewriterEffect(el, delay) {
    var text = el.innerText || el.textContent;
    el.innerHTML = '';
    var i = 0;
    setTimeout(function () {
      var interval = setInterval(function () {
        if (i < text.length) {
          el.innerHTML += (text[i] === '\n') ? '<br>' : text[i];
          i++;
        } else {
          clearInterval(interval);
        }
      }, 22);
    }, delay || 0);
  }


  // ============================================================
  // NAV — glass effect on scroll
  // ============================================================
  var nav       = document.getElementById('nav');
  var mobileBar = document.getElementById('mobile-bar');
  window.addEventListener('scroll', function () {
    nav.classList.toggle('scrolled', window.scrollY > 30);
    if (mobileBar) {
      mobileBar.classList.toggle('visible', window.scrollY > 80);
    }
  }, { passive: true });


  // ============================================================
  // MOBILE NAV toggle
  // ============================================================
  var navToggle = document.getElementById('nav-toggle');
  var navMobile = document.getElementById('nav-mobile');
  if (navToggle && navMobile) {
    navToggle.addEventListener('click', function () {
      var open = navMobile.classList.toggle('open');
      navToggle.classList.toggle('open', open);
      navMobile.setAttribute('aria-hidden', String(!open));
    });
    navMobile.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        navMobile.classList.remove('open');
        navToggle.classList.remove('open');
        navMobile.setAttribute('aria-hidden', 'true');
      });
    });
  }


  // ============================================================
  // GSAP SCROLL ANIMATIONS
  // ============================================================
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  // Hero entrance — badge + scramble title + typewriter sub + CTAs + cube
  var heroTitleSpans = document.querySelectorAll('.hero-title span');

  // Pre-hide title spans and sub so they animate in
  gsap.set(heroTitleSpans, { opacity: 0, y: 36 });
  gsap.set('.hero-sub', { opacity: 0 });

  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from('.hero-badge', { opacity: 0, y: 18, duration: 0.6, delay: 0.15 })
    .to(heroTitleSpans, {
      opacity: 1, y: 0, stagger: 0.1, duration: 0.55,
      onStart: function () {
        // Trigger text scramble for each span with matching stagger
        heroTitleSpans.forEach(function (span, i) {
          scrambleText(span, i * 100);
        });
      }
    }, '-=0.15')
    .to('.hero-sub', {
      opacity: 1, duration: 0.01,
      onComplete: function () {
        typewriterEffect(document.querySelector('.hero-sub'), 0);
      }
    }, '-=0.1')
    .from('.hero-actions .btn', { opacity: 0, y: 16, stagger: 0.12, duration: 0.5 }, '+=0.55')
    .from('.hero-visual', { opacity: 0, scale: 0.88, duration: 0.9, ease: 'power2.out' }, '-=1.1');

  // Stats counters
  ScrollTrigger.create({
    trigger: '.stats', start: 'top 82%', once: true,
    onEnter: function () {
      document.querySelectorAll('.counter').forEach(function (el) {
        var obj = { val: 0 };
        gsap.to(obj, {
          val: parseInt(el.getAttribute('data-target'), 10),
          duration: 2, ease: 'power2.out',
          onUpdate: function () { el.textContent = Math.round(obj.val); }
        });
      });
    }
  });

  // Section headings
  gsap.utils.toArray('.section-head').forEach(function (el) {
    gsap.from(el.children, {
      scrollTrigger: { trigger: el, start: 'top 82%' },
      opacity: 0, y: 28, stagger: 0.1, duration: 0.65, ease: 'power3.out'
    });
  });

  // Services — tabs entrance
  gsap.from('.tabs-nav', {
    scrollTrigger: { trigger: '#services', start: 'top 80%' },
    opacity: 0, y: 22, duration: 0.55, ease: 'power3.out'
  });
  gsap.from('.tab-panel.active .tab-text > *', {
    scrollTrigger: { trigger: '#services', start: 'top 74%' },
    opacity: 0, y: 30, stagger: 0.1, duration: 0.65, ease: 'power3.out', delay: 0.1
  });
  gsap.from('.tab-panel.active .tab-visual', {
    scrollTrigger: { trigger: '#services', start: 'top 74%' },
    opacity: 0, scale: 0.78, duration: 0.75, ease: 'power2.out', delay: 0.25
  });

  // Why rows (alternating sides)
  document.querySelectorAll('.why-row').forEach(function (row) {
    gsap.from(row, {
      scrollTrigger: { trigger: row, start: 'top 82%' },
      opacity: 0,
      x: row.classList.contains('why-row--rev') ? 60 : -60,
      duration: 0.8, ease: 'power3.out'
    });
  });

  // How It Works
  gsap.from('.how-step', {
    scrollTrigger: { trigger: '#how', start: 'top 72%' },
    opacity: 0, y: 40, stagger: 0.18, duration: 0.7, ease: 'power3.out'
  });
  gsap.from('.how-line', {
    scrollTrigger: { trigger: '#how', start: 'top 72%' },
    scaleX: 0, transformOrigin: 'left', stagger: 0.18,
    duration: 0.55, delay: 0.3, ease: 'power2.out'
  });

  // Gallery
  gsap.from('.gal-card', {
    scrollTrigger: { trigger: '#gallery', start: 'top 74%' },
    opacity: 0, scale: 0.9, stagger: 0.08, duration: 0.6, ease: 'power3.out'
  });

  // Contact
  gsap.from('.contact-form',  {
    scrollTrigger: { trigger: '#contact', start: 'top 72%' },
    opacity: 0, x: -44, duration: 0.8, ease: 'power3.out'
  });
  gsap.from('.contact-aside', {
    scrollTrigger: { trigger: '#contact', start: 'top 72%' },
    opacity: 0, x: 44, duration: 0.8, ease: 'power3.out'
  });

  // ============================================================
  // TABS — GSAP cross-fade between service panels
  // ============================================================
  var tabBtns = document.querySelectorAll('.tab-btn');

  tabBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var tabId = btn.getAttribute('data-tab');
      var targetPanel = document.getElementById('tab-' + tabId);
      var currentPanel = document.querySelector('.tab-panel.active');

      if (!targetPanel || targetPanel === currentPanel) return;

      // Update active button
      tabBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');

      // Cross-fade panels
      gsap.to(currentPanel, {
        opacity: 0, y: 14, duration: 0.2, ease: 'power2.in',
        onComplete: function () {
          currentPanel.classList.remove('active');
          gsap.set(currentPanel, { clearProps: 'all' });

          targetPanel.classList.add('active');
          gsap.fromTo(targetPanel,
            { opacity: 0, y: -14 },
            { opacity: 1, y: 0, duration: 0.38, ease: 'power3.out' }
          );
        }
      });
    });
  });


  // Select floating label
  var sel = document.getElementById('f-service');
  if (sel) sel.addEventListener('change', function () {
    sel.classList.toggle('has-value', sel.value !== '');
  });

  // File input display
  var fi = document.getElementById('file-input');
  var fd = document.getElementById('file-name-display');
  if (fi && fd) fi.addEventListener('change', function () {
    fd.textContent = fi.files[0] ? fi.files[0].name : 'Attach File (STL, OBJ, STEP, ZIP)';
  });

});

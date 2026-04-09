(function() {
	/* Un-fix the CMS nav so the page scrolls naturally past it */
	var fixedNavs = document.querySelectorAll('.navbar-fixed-top');
	fixedNavs.forEach(function(nav) {
		nav.classList.remove('navbar-fixed-top');
		nav.style.setProperty('position', 'relative', 'important');
	});
	document.body.style.setProperty('padding-top', '0', 'important');


	/* IntersectionObserver for scroll-driven reveals */
	var revealEls = document.querySelectorAll('.fs-reveal');

	if ('IntersectionObserver' in window) {
		var revealObserver = new IntersectionObserver(function(entries) {
			entries.forEach(function(entry) {
				if (entry.isIntersecting) {
					entry.target.classList.add('fs-visible');
					revealObserver.unobserve(entry.target);
				}
			});
		}, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

		revealEls.forEach(function(el) {
			revealObserver.observe(el);
		});

		/* Draw-corner observer */
		var cornerEls = document.querySelectorAll('.fs-draw-corner');
		var cornerObserver = new IntersectionObserver(function(entries) {
			entries.forEach(function(entry) {
				if (entry.isIntersecting) {
					entry.target.classList.add('fs-visible');
					cornerObserver.unobserve(entry.target);
				}
			});
		}, { threshold: 0.25 });

		cornerEls.forEach(function(el) {
			cornerObserver.observe(el);
		});
	} else {
		revealEls.forEach(function(el) { el.classList.add('fs-visible'); });
		document.querySelectorAll('.fs-draw-corner').forEach(function(el) { el.classList.add('fs-visible'); });
	}

	/* Auto-pair sections: hero drifts solo, then stack/drift alternating */
	document.querySelectorAll('.fs-essay').forEach(function(essay) {
		var kids = Array.from(essay.children);
		for (var i = 1; i + 1 < kids.length; i += 2) {
			var group = document.createElement('div');
			group.className = 'fs-stack-group';
			essay.insertBefore(group, kids[i]);
			group.appendChild(kids[i]);
			group.appendChild(kids[i + 1]);
		}
		var topLevel = essay.children;
		for (var j = 0; j < topLevel.length; j++) {
			topLevel[j].style.zIndex = j + 1;
		}
	});

	/* Wrap fs-split in full-width white wrapper so background covers viewport */
	document.querySelectorAll('.fs-split').forEach(function(split) {
		var wrapper = document.createElement('div');
		wrapper.className = 'fs-split-wrapper';
		split.parentNode.insertBefore(wrapper, split);
		wrapper.appendChild(split);
	});

	/* Caption color: sample bottom-right of image, use dark or light text */
	function setCaptionColor(cap, img) {
		if (!cap || !img || !img.naturalWidth) return;
		try {
			var c = document.createElement('canvas');
			var w = Math.min(60, img.naturalWidth), h = Math.min(45, img.naturalHeight);
			var x = img.naturalWidth - w, y = img.naturalHeight - h;
			c.width = w; c.height = h;
			var ctx = c.getContext('2d');
			ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
			var d = ctx.getImageData(0, 0, w, h).data, lum = 0, n = 0;
			for (var i = 0; i < d.length; i += 4) lum += 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2], n++;
			var avg = n ? lum / n : 128;
			cap.style.setProperty('color', avg > 130 ? '#1a1a1a' : '#fff', 'important');
			cap.style.setProperty('text-shadow', avg > 130 ? '0 1px 2px rgba(255,255,255,0.8)' : '0 1px 4px rgba(0,0,0,0.7)', 'important');
		} catch (e) {
			cap.style.setProperty('color', '#fff', 'important');
			cap.style.setProperty('text-shadow', '0 1px 4px rgba(0,0,0,0.6)', 'important');
		}
	}
	window.addEventListener('load', function() {
		document.querySelectorAll('.fs-hero, .fs-full-image, .fs-full-image-overlay').forEach(function(s) {
			var img = s.querySelector('img');
			var cap = s.querySelector('.fs-hero-caption') || s.querySelector('figcaption');
			if (img && cap) setCaptionColor(cap, img);
		});
	});
	/* Subtle parallax on full-screen images */
	var parallaxSections = document.querySelectorAll('.fs-full-image, .fs-full-image-overlay');
	var parallaxTick = false;
	var zoomStartTimes = new Map();

	function updateParallax() {
		var now = performance.now();
		parallaxSections.forEach(function(section) {
			var rect = section.getBoundingClientRect();
			var viewH = window.innerHeight;
			if (rect.bottom < -100 || rect.top > viewH + 100) return;
			var inStack = section.parentElement && section.parentElement.classList.contains('fs-stack-group');
			var isDrift = !inStack || section.parentElement.lastElementChild === section;
			var inViewport = rect.top < viewH && rect.bottom > 0;
			var center = rect.top + rect.height / 2;
			var offset = (center - viewH / 2) * 0.08;
			var scale = 1.2;
			if (isDrift) {
				if (inViewport && !zoomStartTimes.has(section)) zoomStartTimes.set(section, now);
				var elapsed = zoomStartTimes.has(section) ? (now - zoomStartTimes.get(section)) / 1000 : 0;
				var progress = Math.min(1, elapsed / 5);
				scale = 1.2 + progress * 0.04;
			}
			var img = section.querySelector('img');
			if (img) img.style.transform = 'translateY(' + offset + 'px) scale(' + scale + ')';
		});
		parallaxTick = false;
	}

	window.addEventListener('scroll', function() {
		if (!parallaxTick) {
			requestAnimationFrame(updateParallax);
			parallaxTick = true;
		}
	}, { passive: true });
	window.addEventListener('load', updateParallax);

	/* Run parallax/zoom every frame so time-based zoom animates */
	function parallaxLoop() {
		updateParallax();
		requestAnimationFrame(parallaxLoop);
	}
	requestAnimationFrame(parallaxLoop);

	/* Progress bar */
	var progressBar = document.getElementById('fs-progress');
	var progressTick = false;

	function updateProgress() {
		if (!progressBar) return;
		var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
		var scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
		var pct = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0;
		progressBar.style.width = pct + '%';
		progressBar.setAttribute('aria-valuenow', pct);
		progressTick = false;
	}

	window.addEventListener('scroll', function() {
		if (!progressTick) {
			requestAnimationFrame(updateProgress);
			progressTick = true;
		}
	}, { passive: true });

	/* Hide scroll hints after first scroll */
	var hints = document.querySelectorAll('.fs-scroll-hint');
	var hintsHidden = false;
	window.addEventListener('scroll', function() {
		if (!hintsHidden && window.pageYOffset > 80) {
			hints.forEach(function(h) {
				h.style.transition = 'opacity 0.5s ease';
				h.style.opacity = '0';
			});
			hintsHidden = true;
		}
	}, { passive: true });

})();


/* ---- timeline/functions.js (merged bundle) ---- */

(function() {
	var tlItems = document.querySelectorAll('.tl-item');
	tlItems.forEach(function(item) {
		var card = item.querySelector('.tl-card');
		if (card && card.querySelector('img')) card.classList.add('tl-has-img');
	});
	if (tlItems.length > 1) {
		var dates = [];
		tlItems.forEach(function(item) {
			var timeEl = item.querySelector('time[datetime]');
			dates.push(timeEl ? new Date(timeEl.getAttribute('datetime')).getTime() : 0);
		});
		var gaps = [];
		for (var g = 1; g < dates.length; g++) gaps.push(Math.abs(dates[g] - dates[g - 1]));
		var minGap = Math.min.apply(null, gaps.filter(function(v) { return v > 0; })) || 1;
		var minPx = 40, maxPx = 200;
		for (var k = 1; k < tlItems.length; k++) {
			var ratio = minGap > 0 ? gaps[k - 1] / minGap : 1;
			var px = Math.min(maxPx, Math.round(minPx * ratio));
			tlItems[k].style.marginTop = px + 'px';
		}
	}
	if (tlItems.length && 'IntersectionObserver' in window && window.innerWidth > 768) {
		tlItems.forEach(function(item) { item.classList.add('tl-hidden'); });
		var tlObserver = new IntersectionObserver(function(entries) {
			entries.forEach(function(entry) {
				if (entry.isIntersecting) {
					entry.target.classList.remove('tl-hidden');
					entry.target.classList.add('tl-visible');
					tlObserver.unobserve(entry.target);
				}
			});
		}, { threshold: 0.2 });
		tlItems.forEach(function(item) { tlObserver.observe(item); });
	}

	var tlList = document.querySelector('.tl-list');
	var tlDots = document.querySelectorAll('.tl-dot');
	var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	if (tlList && window.innerWidth > 768) {
		tlList.classList.add('tl-animated');
	}

	if (tlList && window.innerWidth > 768 && !reducedMotion) {
		var tlLineTick = false;
		var lastDot = tlDots[tlDots.length - 1];
		function updateTlLine() {
			var rect = tlList.getBoundingClientRect();
			var trigger = window.innerHeight * 0.6;
			var progress = (trigger - rect.top) / rect.height;
			progress = Math.max(0, Math.min(1, progress));
			var lineY = rect.top + rect.height * progress;
			var allActive = true;
			tlDots.forEach(function(dot) {
				var dotRect = dot.getBoundingClientRect();
				if (lineY >= dotRect.top + dotRect.height / 2) {
					dot.classList.add('tl-active');
				} else {
					allActive = false;
				}
			});
			if (allActive) progress = 1;
			tlList.style.setProperty('--tl-progress', progress);
			tlLineTick = false;
		}
		window.addEventListener('scroll', function() {
			if (!tlLineTick) {
				requestAnimationFrame(updateTlLine);
				tlLineTick = true;
			}
		}, { passive: true });
		updateTlLine();
	}
})();

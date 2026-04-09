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

/*
By Okazz 2025
*/
let palette = ['#e874ae', '#51A0FF', '#f33d15', '#f0f0f0', '#EBB62A', '#4ecdc4'];
let ctx;
let centerX, centerY;
let movers = [];
let gridCount = 32;
let shapes = [];

function setup() {
	// 建立填滿視窗的畫布
	createCanvas(windowWidth, windowHeight);
	rectMode(CENTER);
	colorMode(HSB, 360, 100, 100, 100);
	ctx = drawingContext;
	centerX = width / 2;
	centerY = height / 2;
	// 使用最小邊長作為網格基準，保留原先方形視覺
	let w = min(width, height);
	createGrid(centerX, centerY, w);
	addMovers(centerX, centerY, w);

	// 綁定按鈕點擊事件
	setupModalControls();

	// 綁定「第一單元講義」點擊事件以開啟 iframe（若 DOM 存在）
	const s1 = document.getElementById('link-s1');
	if (s1) {
		const url = 'https://hackmd.io/@BAqJArQbQ7GhqcylqCAvSA/S1qFpEColg';
		s1.addEventListener('click', function (e) {
			e.preventDefault();
			openIframe(url);
		});
	}

	// 綁定 modal 的關閉與背景點擊行為
	const modal = document.getElementById('iframeModal');
	if (modal) {
		// 點擊遮罩（非 iframe-wrap）關閉
		modal.addEventListener('click', function (e) {
			if (e.target === modal) closeIframe();
		});

		const btn = document.getElementById('iframeClose');
		if (btn) btn.addEventListener('click', closeIframe);

		// 防止點擊 iframe-wrap 時冒泡至遮罩
		const wrap = modal.querySelector('.iframe-wrap');
		if (wrap) wrap.addEventListener('click', function (e) { e.stopPropagation(); });
	}
}

function windowResized() {
	// 當視窗大小改變時重新調整畫布與內容
	resizeCanvas(windowWidth, windowHeight);
	centerX = width / 2;
	centerY = height / 2;
	// 重新建立 shapes 與 movers，避免延續舊的座標
	shapes = [];
	movers = [];
	let w = min(width, height);
	createGrid(centerX, centerY, w);
	addMovers(centerX, centerY, w);
}

// 根據滑鼠位置顯示/隱藏側邊選單
function updateMenuVisibility() {
	const menu = document.getElementById('sideMenu');
	if (!menu) return;

	// 在 p5 中，mouseX 以畫布左上為 (0,0)。
	// 當滑鼠 X 座標小於等於 100 時，顯示選單。
	// 若滑鼠不在左側區域但正在懸停選單上，保持顯示，否則隱藏。
	const inLeftZone = (typeof mouseX !== 'undefined') && mouseX <= 100;

	if (inLeftZone) {
		menu.classList.add('visible');
		menu.setAttribute('aria-hidden', 'false');
	} else {
		// 若使用者仍然把滑鼠移到選單上，維持顯示
		const hovered = menu.matches(':hover');
		if (!hovered) {
			menu.classList.remove('visible');
			menu.setAttribute('aria-hidden', 'true');
		}
	}
}

function draw() {
	background('#000000');

	for (let i of movers) {
		i.run();
	}

	noStroke();
	for (let i of shapes) {
		fill('#ffffff88');
		circle(i.x, i.y, i.w);
	}

	// 更新側邊選單的顯示狀態（若存在於 DOM 中）
	updateMenuVisibility();
}

function easeInOutQuint(x) {
	return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;
}

function addMovers(x, y, w) {
	let cellW = w / gridCount;
	for (let i = 0; i < gridCount; i++) {
		for (let j = 0; j < gridCount; j++) {
			let cellX = j * cellW + cellW / 2 + x - (w / 2);
			let cellY = i * cellW + cellW / 2 + y - (w / 2);
			if (random() > 0.5) {
				movers.push(new Mover(cellX, cellY, cellW));
			}
		}
	}
}

function createGrid(x, y, w) {
	let cellW = w / gridCount;
	for (let i = 0; i < gridCount; i++) {
		for (let j = 0; j < gridCount; j++) {
			let cellX = j * cellW + cellW / 2 + x - (w / 2);
			let cellY = i * cellW + cellW / 2 + y - (w / 2);
			shapes.push({ x: cellX, y: cellY, w: cellW * 0.2 });
		}
	}
}

/*------------------------------------------------------------------------------------------*/

class Mover {
	constructor(x, y, d) {
		this.x = x;
		this.y = y;
		this.d = d;
		this.restTime = int(random(300));
		this.timings = [];
		let t = 0;
		for (let i = 0; i < 10; i++) {
			this.timings.push(t);
			t += 8;
		}

		this.curX1 = this.x;
		this.curY1 = this.y;
		this.curX2 = this.x;
		this.curY2 = this.y;

		this.init();

		this.clrs = palette.slice();
		shuffle(this.clrs, true);

		this.circleD = this.d * 0.6;
	}

	show() {
		strokeWeight(this.circleD);
		stroke(this.clrs[1]);
		line(this.curX1, this.curY1, this.curX2, this.curY2);


	}

	update() {
		if (this.timings[0] < this.timer && this.timer < this.timings[3]) {
			let nrm = norm(this.timer, this.timings[0], this.timings[3] - 1);
			this.curX1 = lerp(this.orgX, this.tgtX, easeInOutQuint(nrm));
			this.curY1 = lerp(this.orgY, this.tgtY, easeInOutQuint(nrm));
		}
		if (this.timings[1] < this.timer && this.timer < this.timings[4]) {
			let nrm = norm(this.timer, this.timings[1], this.timings[4] - 1);
			this.curX2 = lerp(this.orgX, this.tgtX, easeInOutQuint(nrm));
			this.curY2 = lerp(this.orgY, this.tgtY, easeInOutQuint(nrm));
		}
		if (this.timings[4] < this.timer) {
			this.init();
		}
		this.timer++
	}

	init() {
		this.timer = 0;
		this.orgX = this.curX1;
		this.orgY = this.curY1;
		let r = floor(random(4)) * this.d;
		do {
			this.direction = int(random(4)) * (TAU / 4);
			this.tgtX = this.orgX + r * cos(this.direction);
			this.tgtY = this.orgY + r * sin(this.direction);
		} while (
			this.tgtX < 0 || this.tgtX > width ||
			this.tgtY < 0 || this.tgtY > height
		);
		this.timer = -this.restTime;
	}

	run() {
		this.show();
		this.update();
	}
}

// --- iframe modal 控制 ---
function setupModalControls() {
	// 綁定「第一單元作品」點擊事件
	const workLink = document.getElementById('link-work');
	if (workLink) {
		const url = 'https://liny90596-lab.github.io/20251020/';
		workLink.addEventListener('click', function(e) {
			e.preventDefault();
			openIframe(url);
		});
	}

	// 綁定 modal 的關閉行為
	const modal = document.getElementById('iframeModal');
	if (modal) {
		// 點擊遮罩關閉
		modal.addEventListener('click', function(e) {
			if (e.target === modal) closeIframe();
		});

		// 點擊關閉按鈕關閉
		const btn = document.getElementById('iframeClose');
		if (btn) btn.addEventListener('click', closeIframe);

		// 防止點擊 iframe-wrap 時冒泡至遮罩
		const wrap = modal.querySelector('.iframe-wrap');
		if (wrap) wrap.addEventListener('click', function(e) {
			e.stopPropagation();
		});
	}
}

function openIframe(url) {
		const modal = document.getElementById('iframeModal');
		const frame = document.getElementById('contentFrame');
		if (!modal || !frame) return;
		frame.src = url;
		modal.classList.add('visible');
		modal.setAttribute('aria-hidden', 'false');
	}

	function closeIframe() {
		const modal = document.getElementById('iframeModal');
		const frame = document.getElementById('contentFrame');
		if (!modal || !frame) return;
		modal.classList.remove('visible');
		modal.setAttribute('aria-hidden', 'true');
		// 延遲清除 src 以確保關閉動畫看起來順暢
		setTimeout(() => { frame.src = ''; }, 250);
	}
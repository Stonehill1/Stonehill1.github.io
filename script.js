// Data
const products = {
    prefixes: [
        "Герой","Enter","Геймпад","Ангел","Яйцо","Подвесная табличка","Заяц","Ху Тао","Halloween","Панда","Трезубец","Картина","Рождество"
    ],
    particles: [
        "Смотрящий","Вишня","Нимб","Ветер","Энд","Снег","Дождь","Радуга","Адские грибочки","Зачаровальня"
    ],
    services: [
        "Снятие варна (разово)","Снятие Бана (разово)","Префикс в табе"
    ]
};

// Цены в RUB по срокам: 1 мес, 3 мес, навсегда
// Для "Оформление ника" (prefixes), "Частицы вокруг игрока" (particles) и услуги "Префикс в табе"
const pricesRub = {
    durations: ["1 мес", "3 мес", "навсегда"],
    prefixes: { "1 мес": 45, "3 мес": 120, "навсегда": 1000 },
    particles: { "1 мес": 95, "3 мес": 250, "навсегда": 1000 },
    serviceTabPrefix: { "1 мес": 65, "3 мес": 150, "навсегда": 1000 },
    servicesFixed: {
        "Снятие варна (разово)": 100,
        "Снятие Бана (разово)": 500
    }
};

const currencySelect = document.getElementById('currency-select');
const rateDisplay = document.getElementById('rate-display');
const rateLink = document.getElementById('rate-link');
const yearEl = document.getElementById('year');
const copyHint = document.getElementById('copy-hint');
const infoModal = document.getElementById('info-modal');
const infoModalClose = document.getElementById('info-modal-close');

const state = {
	currency: 'RUB', // RUB or UAH
	rubToUah: 0.45 // fallback
};

function formatPrice(valueRub) {
	if (state.currency === 'RUB') return `${valueRub} ₽`;
	const uah = Math.round(valueRub * state.rubToUah);
	return `${uah} ₴`;
}

function loadCachedRate() {
	try {
		const cached = localStorage.getItem('rubToUah');
		const ts = Number(localStorage.getItem('rubToUahTs') || 0);
		if (cached) {
			const rate = Number(cached);
			if (rate > 0) {
				state.rubToUah = rate;
				rateDisplay.textContent = `1 ₽ ≈ ${rate.toFixed(2)} ₴ (кэш)`;
				rateLink.href = '#';
				return { rate, ts };
			}
		}
	} catch {}
	return null;
}

function saveCachedRate(rate) {
	try {
		localStorage.setItem('rubToUah', String(rate));
		localStorage.setItem('rubToUahTs', String(Date.now()));
	} catch {}
}

async function fetchRateRubUah() {
	try {
		// Primary: exchangerate.host (non-.ua)
		const url = 'https://api.exchangerate.host/latest?base=RUB&symbols=UAH';
		const res = await fetch(url, { cache: 'no-store' });
		if (!res.ok) throw new Error('Primary failed');
		const data = await res.json();
		const rate = data?.rates?.UAH;
		if (typeof rate === 'number' && rate > 0) {
			state.rubToUah = rate;
			rateDisplay.textContent = `1 ₽ ≈ ${rate.toFixed(2)} ₴ (exchangerate.host)`;
			rateLink.href = 'https://exchangerate.host/#/';
			saveCachedRate(rate);
			return;
		}
		throw new Error('Primary no rate');
	} catch (e) {
		// Fallback 1: Frankfurter (ECB) — non-.ua
		try {
			const url2 = 'https://api.frankfurter.app/latest?from=RUB&to=UAH';
			const res2 = await fetch(url2, { cache: 'no-store' });
			if (!res2.ok) throw new Error('F1 failed');
			const data2 = await res2.json();
			const rate2 = data2?.rates?.UAH;
			if (typeof rate2 === 'number' && rate2 > 0) {
				state.rubToUah = rate2;
				rateDisplay.textContent = `1 ₽ ≈ ${rate2.toFixed(2)} ₴ (Frankfurter)`;
				rateLink.href = 'https://www.frankfurter.app/docs/';
				saveCachedRate(rate2);
				return;
			}
			throw new Error('F1 no rate');
		} catch {
			// Fallback 2: open.er-api.com — non-.ua
			try {
				const url3 = 'https://open.er-api.com/v6/latest/RUB';
				const res3 = await fetch(url3, { cache: 'no-store' });
				if (!res3.ok) throw new Error('F2 failed');
				const data3 = await res3.json();
				const rate3 = data3?.rates?.UAH;
				if (typeof rate3 === 'number' && rate3 > 0) {
					state.rubToUah = rate3;
					rateDisplay.textContent = `1 ₽ ≈ ${rate3.toFixed(2)} ₴ (ER-API)`;
					rateLink.href = 'https://www.exchangerate-api.com/docs/free';
					saveCachedRate(rate3);
					return;
				}
				throw new Error('F2 no rate');
			} catch {
				const cached = loadCachedRate();
				if (!cached) {
					rateDisplay.textContent = 'Курс недоступен';
					rateLink.href = '#';
				}
			}
		}
	}
}

function createCard(title, priceRub, imgPath, durationControls) {
	const card = document.createElement('div');
	card.className = 'card';
	const img = document.createElement('img');
	img.className = 'thumb';
	img.src = imgPath;
	img.loading = 'lazy';
	img.alt = title;
	const body = document.createElement('div');
	body.className = 'card-body';
	const h3 = document.createElement('h3');
	h3.className = 'title';
	h3.textContent = title;
	const priceRow = document.createElement('div');
	priceRow.className = 'price-row';
	const price = document.createElement('p');
	price.className = 'price';
	price.dataset.priceRub = String(priceRub);
	price.textContent = formatPrice(priceRub);
	priceRow.appendChild(price);
	if (durationControls) priceRow.appendChild(durationControls.controlsEl);
	const actions = document.createElement('div');
	actions.className = 'buy';
	const btn = document.createElement('button');
	btn.className = 'btn';
	btn.type = 'button';
	btn.textContent = 'Купить';
	btn.addEventListener('click', (ev) => {
		const cardEl = ev.currentTarget.closest('.card');
		const priceRubNow = Number(price.dataset.priceRub);
		const sel = cardEl.querySelector('.duration-selector select');
		const duration = sel ? sel.value : null;
		handleBuy(title, priceRubNow, duration);
	});
	actions.appendChild(btn);
	body.append(h3, priceRow, actions);
	card.append(img, body);
	return card;
}

function createDurationControls(getPriceByDurationCb, onPriceUpdate) {
    const wrapper = document.createElement('div');
    wrapper.className = 'duration-selector';
    const label = document.createElement('span');
    label.className = 'duration-label';
    label.textContent = 'Срок:';
    const select = document.createElement('select');
    pricesRub.durations.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d; opt.textContent = d; select.appendChild(opt);
    });
    wrapper.appendChild(label);
    wrapper.appendChild(select);
    const controlsEl = wrapper;
    const update = () => {
        const duration = select.value;
        const priceRub = getPriceByDurationCb(duration);
        onPriceUpdate(priceRub);
    };
    select.addEventListener('change', update);
    // init
    select.value = pricesRub.durations[0];
    setTimeout(update);
    return { controlsEl, get value() { return select.value; } };
}

function renderAll() {
	const prefixesGrid = document.getElementById('prefixes-grid');
	const particlesGrid = document.getElementById('particles-grid');
	const servicesGrid = document.getElementById('services-grid');

	prefixesGrid.innerHTML = '';
	particlesGrid.innerHTML = '';
	servicesGrid.innerHTML = '';

    products.prefixes.forEach((name, idx) => {
        const img = `assets/prefixes/${idx+1}.png`;
        const priceElUpdater = (cardEl, rub) => {
			const p = cardEl.querySelector('.price');
            p.dataset.priceRub = String(rub);
            p.textContent = formatPrice(rub);
        };
		const durationControls = createDurationControls(d => pricesRub.prefixes[d], rub => {/* noop; replaced below */});
        const card = createCard(name, pricesRub.prefixes[pricesRub.durations[0]], img, durationControls);
        // override updater now card exists
        const update = (rub) => priceElUpdater(card, rub);
	durationControls.controlsEl.querySelector('select').addEventListener('change', (e) => {
			const d = e.target.value;
			update(pricesRub.prefixes[d]);
		});
        prefixesGrid.appendChild(card);
    });
    products.particles.forEach((name, idx) => {
        const img = `assets/particles/${idx+1}.png`;
		const durationControls = createDurationControls(d => pricesRub.particles[d], () => {});
        const card = createCard(name, pricesRub.particles[pricesRub.durations[0]], img, durationControls);
	durationControls.controlsEl.querySelector('select').addEventListener('change', (e) => {
			const d = e.target.value;
			const p = card.querySelector('.price');
			p.dataset.priceRub = String(pricesRub.particles[d]);
			p.textContent = formatPrice(Number(p.dataset.priceRub));
		});
        particlesGrid.appendChild(card);
    });
    products.services.forEach((name, idx) => {
        const img = `assets/services/${idx+1}.png`;
        if (name === 'Префикс в табе') {
			const durationControls = createDurationControls(d => pricesRub.serviceTabPrefix[d], () => {});
            const card = createCard(name, pricesRub.serviceTabPrefix[pricesRub.durations[0]], img, durationControls);
			durationControls.controlsEl.querySelector('select').addEventListener('change', (e) => {
				const d = e.target.value;
				const p = card.querySelector('.price');
				p.dataset.priceRub = String(pricesRub.serviceTabPrefix[d]);
				p.textContent = formatPrice(Number(p.dataset.priceRub));
			});
            servicesGrid.appendChild(card);
        } else {
            const priceRub = pricesRub.servicesFixed[name];
			servicesGrid.appendChild(createCard(name, priceRub, img));
        }
    });
}

function updatePrices() {
	// Recompute visible prices according to currency
	document.querySelectorAll('.price').forEach(p => {
		const rub = Number(p.dataset.priceRub || 0);
		p.textContent = formatPrice(rub);
	});
}

function handleBuy(title, priceRub, duration) {
    const priceText = formatPrice(priceRub);
    const durText = duration ? `, срок: ${duration}` : '';
    const message = `Здравствуйте! Хочу купить: ${title} — ${priceText}${durText}`;
	copyToClipboard(message);
	const link = CONTACT_LINK;
	if (link) {
		window.open(link, '_blank');
	}
}

function copyToClipboard(text) {
	try {
		navigator.clipboard.writeText(text);
		showHint('Текст скопирован. Переход к продавцу...');
	} catch (e) {
		showHint('Не удалось скопировать текст');
	}
}

function showHint(text) {
	copyHint.textContent = text;
	setTimeout(() => { copyHint.textContent = ''; }, 3000);
}

// Config: set your contact link here (e.g., Telegram/Discord)
const CONTACT_LINK = 'https://t.me/Irissaynoai_bot';

// Удалена кнопка обращения: логика перенесена в кнопку "Купить"

// Currency select
currencySelect.addEventListener('change', () => {
	state.currency = currencySelect.value;
	updatePrices();
});

// Init
yearEl.textContent = new Date().getFullYear();
renderAll();
// Try show cached first for instant UI
loadCachedRate();
fetchRateRubUah().then(updatePrices);
setInterval(fetchRateRubUah, 5 * 60 * 1000);

// Modal controls
if (infoModal && infoModalClose) {
    const closeModal = () => {
        infoModal.classList.add('is-fading-out');
        setTimeout(() => {
            infoModal.classList.remove('is-open');
            infoModal.classList.remove('is-fading-out');
        }, 700);
    };
    const openModal = () => {
        infoModal.classList.add('is-open');
    };
    // Ensure it's open on load (already has is-open in HTML)
    setTimeout(() => openModal(), 10);
    infoModalClose.addEventListener('click', closeModal);
    infoModal.addEventListener('click', (e) => {
        if (e.target === infoModal) closeModal();
    });
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}


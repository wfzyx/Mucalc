var $ = function( id ) { return document.getElementById( id ); };

window.currentProvider = sessionStorage.getItem('mucalc_session_provider') || localStorage.getItem('mucalc_provider') || 'mucabrasil';

function getProvider() {
	return window.currentProvider || 'mucabrasil';
}

function initProviderSession() {
	var sessionProv = sessionStorage.getItem('mucalc_session_provider');
	if (!sessionProv) {
		openProviderOverlay();
	} else {
		window.currentProvider = sessionProv;
		updateProviderUI();
		loadBuilds(sessionProv);
	}
}

var pendingProvider = null;

function openProviderOverlay(step) {
	var overlay = document.getElementById('providerOverlay');
	if (overlay) overlay.style.display = 'flex';
	goToProviderStep(step || 1);
}

function closeProviderOverlay() {
	var overlay = document.getElementById('providerOverlay');
	if (overlay) overlay.style.display = 'none';
}

function goToProviderStep(step) {
	var s1 = document.getElementById('providerStep1');
	var s2 = document.getElementById('providerStep2');
	if (!s1 || !s2) return;
	if (step === 2) {
		s1.style.display = 'none';
		s2.style.display = 'block';
		var prov = pendingProvider || getProvider();
		var lbl = document.getElementById('lblStep2Server');
		if (lbl) {
			lbl.textContent = prov === 'muren' ? 'Land of Muren' : 'MUCABrasil';
			lbl.style.color = prov === 'muren' ? '#38bdf8' : '#ef4444';
		}
	} else {
		s1.style.display = 'block';
		s2.style.display = 'none';
	}
}

function chooseSessionProvider(prov) {
	var oldProv = getProvider();
	saveBuilds(oldProv);

	pendingProvider = prov;

	// Check if this provider already has saved builds
	var savedStr = localStorage.getItem('mucalc_builds_' + prov);
	var builds = null;
	try {
		if (savedStr) builds = JSON.parse(savedStr);
	} catch (e) {}

	if (Array.isArray(builds) && builds.length > 0) {
		// Server has saved builds: activate and load
		applySelectedProvider(prov);
		closeProviderOverlay();
		loadBuilds(prov);
	} else {
		// Server has 0 builds: transition to Step 2 so user chooses starting class!
		goToProviderStep(2);
	}
}

function selectInitialClass(classId) {
	var prov = pendingProvider || getProvider();
	applySelectedProvider(prov);
	closeProviderOverlay();

	var tabsEl = document.getElementById('tabs');
	var navEl = document.getElementById('tabNav');
	if (tabsEl) tabsEl.innerHTML = '';
	if (navEl) navEl.innerHTML = '';

	var classSelect = document.getElementById('classes');
	if (classSelect) classSelect.value = classId;

	addTab(classId);
	saveBuilds(prov);
}

function applySelectedProvider(prov) {
	window.currentProvider = prov;
	sessionStorage.setItem('mucalc_session_provider', prov);
	localStorage.setItem('mucalc_provider', prov);
	updateProviderUI();
}

function setProvider(prov) {
	chooseSessionProvider(prov);
}

function updateProviderUI() {
	var prov = getProvider();
	if (document.body) document.body.dataset.server = prov;
	if (document.documentElement) document.documentElement.dataset.server = prov;

	var lblServer = document.getElementById('lblCurrentServer');
	if (lblServer) {
		lblServer.textContent = prov === 'muren' ? 'Land of Muren' : 'MUCABrasil';
	}

	var tabs = document.getElementById('tabs');
	if (tabs) {
		var sections = tabs.getElementsByTagName('section');
		for (var i = 0; i < sections.length; i++) {
			applyProviderToTab(sections[i].id, prov);
		}
	}
}

function closeTab(tabId) {
	var tabs = $('tabs');
	if (!tabs) return;
	var sections = tabs.getElementsByTagName('section');
	if (sections.length === 0) {
		openProviderOverlay();
		return;
	}

	if (!tabId) {
		var hash = window.location.hash;
		if (hash && hash.indexOf('#tab') === 0) {
			tabId = hash.substring(1);
		} else if (sections.length > 0) {
			tabId = sections[0].id;
		}
	}

	var targetSec = document.getElementById(tabId);
	var targetLink = document.querySelector('#tabNav a[href="#' + tabId + '"]');
	if (targetSec) targetSec.remove();
	if (targetLink) targetLink.remove();

	var remaining = tabs.getElementsByTagName('section');
	if (remaining.length > 0) {
		window.location.hash = '#' + remaining[0].id;
		syncTabNav();
	} else {
		window.location.hash = '';
		openProviderOverlay(2);
	}
	saveBuilds();
}

function applyDualWieldRules(section, cls) {
	var canDualWield = (cls === 'bk' || cls === 'mg');
	var p = section.id + '_';
	var selectEl = document.getElementById(p + 'iSOffhandType');
	var titleEl = document.getElementById(p + 'lblOffhandTitle');
	var pnlShield = document.getElementById(p + 'pnlOffhandShield');
	var pnlWeap = document.getElementById(p + 'pnlOffhandWeap');

	if (!canDualWield) {
		if (selectEl) {
			selectEl.value = 'shield';
			selectEl.style.display = 'none';
		}
		if (titleEl) {
			titleEl.style.display = 'inline-block';
		}
		if (pnlShield) pnlShield.style.display = 'flex';
		if (pnlWeap) pnlWeap.style.display = 'none';
	} else {
		if (selectEl) selectEl.style.display = 'inline-block';
		if (titleEl) titleEl.style.display = 'none';
	}
}

function toggleTwoHanded(el) {
	var section = el.closest ? el.closest('section') : (function() {
		var node = el;
		while (node && node.tagName !== 'SECTION') node = node.parentNode;
		return node;
	})();
	if (!section) return;
	var p = section.id + '_';
	var slotOffhand = document.getElementById(p + 'slotOffhand');
	if (slotOffhand) {
		slotOffhand.classList.toggle('slot-disabled', el.checked);
		if (el.checked) {
			var chips = slotOffhand.querySelectorAll('input[type="checkbox"]');
			for (var i = 0; i < chips.length; i++) chips[i].checked = false;
			syncInventoryOpts(el);
		}
	}
	refresh({ target: el });
}

function toggleOffhandType(el) {
	var section = el.closest ? el.closest('section') : (function() {
		var node = el;
		while (node && node.tagName !== 'SECTION') node = node.parentNode;
		return node;
	})();
	if (!section) return;
	var p = section.id + '_';
	var mode = el.value;
	var pnlShield = document.getElementById(p + 'pnlOffhandShield');
	var pnlWeap = document.getElementById(p + 'pnlOffhandWeap');
	var icon = document.getElementById(p + 'lblOffhandIcon');

	if (pnlShield && pnlWeap) {
		if (mode === 'weapon') {
			pnlShield.style.display = 'none';
			pnlWeap.style.display = 'flex';
			if (icon) icon.textContent = '⚔️';
			var chips = pnlShield.querySelectorAll('input[type="checkbox"]');
			for (var i = 0; i < chips.length; i++) chips[i].checked = false;
			syncInventoryOpts(el);
		} else {
			pnlShield.style.display = 'flex';
			pnlWeap.style.display = 'none';
			if (icon) icon.textContent = '🛡️';
		}
	}
	refresh({ target: el });
}

function startRenameTab(tabLink) {
	if (!tabLink) return;
	var span = tabLink.querySelector('.tab-title-text');
	if (!span) return;
	var editBtn = tabLink.querySelector('.tab-rename-btn');
	var oldName = span.textContent.trim();

	if (tabLink.querySelector('.tab-rename-input')) return;

	var input = document.createElement('input');
	input.type = 'text';
	input.className = 'tab-rename-input';
	input.value = oldName;
	input.maxLength = 16;

	span.style.display = 'none';
	if (editBtn) editBtn.style.display = 'none';
	tabLink.insertBefore(input, span);
	input.focus();
	input.select();

	var finished = false;
	function finishRename() {
		if (finished) return;
		finished = true;
		var newName = input.value.trim() || oldName;
		span.textContent = newName;
		span.style.display = '';
		if (editBtn) editBtn.style.display = '';
		if (input.parentNode) input.parentNode.removeChild(input);
		saveBuilds();
	}

	input.addEventListener('blur', finishRename);
	input.addEventListener('keydown', function(e) {
		if (e.key === 'Enter') {
			input.blur();
		} else if (e.key === 'Escape') {
			input.value = oldName;
			input.blur();
		}
	});
}

function createTabNavLink(tabId, cls, labelText) {
	var a = document.createElement('a');
	a.href = '#' + tabId;
	a.className = 'tab-link-' + cls;

	var span = document.createElement('span');
	span.className = 'tab-title-text';
	span.textContent = labelText;
	a.appendChild(span);

	var editBtn = document.createElement('button');
	editBtn.type = 'button';
	editBtn.className = 'tab-rename-btn';
	editBtn.title = 'Renomear personagem';
	editBtn.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>';
	editBtn.addEventListener('click', function(e) {
		e.preventDefault();
		e.stopPropagation();
		startRenameTab(a);
	});
	a.appendChild(editBtn);

	a.addEventListener('dblclick', function(e) {
		e.preventDefault();
		startRenameTab(a);
	});

	var touchTimer = null;
	a.addEventListener('touchstart', function(e) {
		touchTimer = setTimeout(function() {
			startRenameTab(a);
		}, 500);
	}, { passive: true });
	a.addEventListener('touchend', function() {
		if (touchTimer) clearTimeout(touchTimer);
	}, { passive: true });
	a.addEventListener('touchmove', function() {
		if (touchTimer) clearTimeout(touchTimer);
	}, { passive: true });

	return a;
}

function serializeBuilds() {
	var tabs = document.getElementById('tabs');
	if (!tabs) return [];
	var sections = tabs.getElementsByTagName('section');
	var data = [];
	for (var i = 0; i < sections.length; i++) {
		var sec = sections[i];
		var tabId = sec.id;
		var cls = sec.className.trim().split(' ')[0];
		var navLink = document.querySelector('#tabNav a[href="#' + tabId + '"]');
		var tabTitle = '';
		if (navLink) {
			var span = navLink.querySelector('.tab-title-text');
			tabTitle = span ? span.textContent.trim() : navLink.textContent.trim();
		}

		var formValues = {};
		var inputs = sec.querySelectorAll('input, select');
		for (var j = 0; j < inputs.length; j++) {
			var inp = inputs[j];
			if (inp.id && inp.id.indexOf(tabId + '_') === 0) {
				var key = inp.id.substring(tabId.length + 1);
				if (inp.type === 'checkbox') {
					formValues[key] = inp.checked;
				} else {
					formValues[key] = inp.value;
				}
			}
		}

		var slotChecks = [];
		var chips = sec.querySelectorAll('.slot-opts input[type="checkbox"]');
		for (var k = 0; k < chips.length; k++) {
			slotChecks.push({
				cls: chips[k].className,
				checked: chips[k].checked
			});
		}

		data.push({
			id: tabId,
			cls: cls,
			title: tabTitle,
			values: formValues,
			slotChecks: slotChecks
		});
	}
	return data;
}

function saveBuilds(provider) {
	var prov = provider || getProvider();
	var builds = serializeBuilds();
	try {
		localStorage.setItem('mucalc_builds_' + prov, JSON.stringify(builds));
		localStorage.setItem('mucalc_active_provider', prov);
	} catch (e) {
		console.error('Failed to save builds to localStorage', e);
	}
}

function restoreTab(tabData, index) {
	var newTabID = tabData.id || ('tab' + index);
	var cls = tabData.cls || 'bk';
	var tabs = $('tabs');
	var newTab = document.createElement('section');
	newTab.id = newTabID;
	newTab.setAttribute('oninput', 'refresh(event)');
	newTab.setAttribute('onchange', 'refresh(event)');
	newTab.innerHTML = $('model').innerHTML;
	tabs.appendChild(newTab);
	newTab.classList.add(cls);

	// Prefix all IDs inside the new tab
	['div','input','select','label','span','strong'].forEach(function(tag){
		var els = newTab.getElementsByTagName(tag);
		for (var i = 0; i < els.length; i++) {
			if (els[i].id) els[i].id = newTabID + '_' + els[i].id;
		}
	});

	// Inject class-specific panels
	var p = newTabID + '_';
	switch(cls){
		case 'bk':
			$(p+'tblArma').innerHTML += $('pnlArma').innerHTML;
			$(p+'tblSpec').innerHTML += $('pnlAsa').innerHTML;
			$(p+'tblDanos').innerHTML += $('pnlDanoPhy').innerHTML;
			$(p+'tblDanos').innerHTML += $('pnlDanoCombo').innerHTML;
			$(p+'tblBuffs').innerHTML += $('pnlBuff').innerHTML;
			break;
		case 'sm':
			$(p+'tblArma').innerHTML += $('pnlStaff').innerHTML;
			$(p+'tblSpec').innerHTML += $('pnlAsa').innerHTML;
			$(p+'tblDanos').innerHTML += $('pnlDanoWiz').innerHTML;
			$(p+'tblBuffs').innerHTML += $('pnlBuff').innerHTML;
			break;
		case 'me':
			$(p+'tblArma').innerHTML += $('pnlArma').innerHTML;
			$(p+'tblSpec').innerHTML += $('pnlAsa').innerHTML;
			$(p+'tblDanos').innerHTML += $('pnlDanoPhy').innerHTML;
			$(p+'tblDanos').innerHTML += $('pnlBuffME').innerHTML;
			$(p+'tblBuffs').innerHTML += $('pnlSelf').innerHTML;
			break;
		case 'mg':
			$(p+'tblArma').innerHTML += $('pnlArma').innerHTML;
			$(p+'tblArma').innerHTML += $('pnlStaff').innerHTML;
			$(p+'tblSpec').innerHTML += $('pnlAsa').innerHTML;
			$(p+'tblDanos').innerHTML += $('pnlDanoPhy').innerHTML;
			$(p+'tblDanos').innerHTML += $('pnlDanoWiz').innerHTML;
			$(p+'tblBuffs').innerHTML += $('pnlBuff').innerHTML;
			break;
		case 'dl':
			$(p+'tblPontos').innerHTML += $('pnlLid').innerHTML;
			$(p+'tblSpec').innerHTML += $('pnlCapa').innerHTML;
			$(p+'tblArma').innerHTML += $('pnlArma').innerHTML;
			$(p+'tblDanos').innerHTML += $('pnlDanoPhy').innerHTML;
			$(p+'tblDanos').innerHTML += $('pnlDanoFB').innerHTML;
			$(p+'tblBuffs').innerHTML += $('pnlBuff').innerHTML;
			break;
	}

	// Prefix IDs injected by panels
	['input','select','strong','span','div','label'].forEach(function(tag){
		var els = newTab.getElementsByTagName(tag);
		for (var i = 0; i < els.length; i++) {
			if (els[i].id && els[i].id.indexOf(newTabID) !== 0) {
				els[i].id = newTabID + '_' + els[i].id;
			}
		}
	});

	// Apply current provider configuration
	applyProviderToTab(newTabID, getProvider());

	// Restore form values
	if (tabData.values) {
		Object.keys(tabData.values).forEach(function(key) {
			var el = document.getElementById(newTabID + '_' + key);
			if (el) {
				if (el.type === 'checkbox') {
					el.checked = !!tabData.values[key];
				} else {
					el.value = tabData.values[key];
				}
			}
		});
	}

	// Restore slot checkbox states if saved
	if (Array.isArray(tabData.slotChecks)) {
		var chips = newTab.querySelectorAll('.slot-opts input[type="checkbox"]');
		for (var k = 0; k < chips.length && k < tabData.slotChecks.length; k++) {
			chips[k].checked = !!tabData.slotChecks[k].checked;
		}
	}

	applyDualWieldRules(newTab, cls);

	// Add tab nav link
	var nav = $('tabNav');
	var classNames = {bk:'BK', sm:'SM', me:'ME', mg:'MG', dl:'DL'};
	var a = createTabNavLink(newTabID, cls, tabData.title || (classNames[cls] + ' ' + (index + 1)));
	nav.appendChild(a);

	var anyCheck = newTab.querySelector('.slot-opts input[type="checkbox"]');
	if (anyCheck) {
		syncInventoryOpts(anyCheck);
	} else {
		var initEl = document.getElementById(newTabID + '_iStr');
		if (initEl) refresh({target: initEl});
	}
}

function loadBuilds(provider) {
	var prov = provider || getProvider();
	var savedStr = localStorage.getItem('mucalc_builds_' + prov);
	var tabsEl = $('tabs');
	var navEl = $('tabNav');
	if (!tabsEl || !navEl) return;

	tabsEl.innerHTML = '';
	navEl.innerHTML = '';

	var builds = null;
	try {
		if (savedStr) builds = JSON.parse(savedStr);
	} catch (e) {
		console.error('Failed to parse saved builds', e);
	}

	if (Array.isArray(builds) && builds.length > 0) {
		for (var i = 0; i < builds.length; i++) {
			restoreTab(builds[i], i);
		}
		var firstSec = tabsEl.querySelector('section');
		if (firstSec) {
			window.location.hash = '#' + firstSec.id;
			syncTabNav();
		}
	} else {
		// 0 builds -> open provider overlay at step 2 to choose starting class
		pendingProvider = prov;
		openProviderOverlay(2);
	}
}

function applyProviderToTab(tabId, prov) {
	var isMuren = prov === 'muren';
	var p = tabId + '_';

	// Item caps: Land of Muren only accepts items up until +13
	var asaLvlEl = document.getElementById(p + 'iSLAsa');
	var capaLvlEl = document.getElementById(p + 'iSLCapa');
	if (asaLvlEl) {
		asaLvlEl.max = isMuren ? 13 : 15;
		if (isMuren && +asaLvlEl.value > 13) asaLvlEl.value = 13;
	}
	if (capaLvlEl) {
		capaLvlEl.max = isMuren ? 13 : 15;
		if (isMuren && +capaLvlEl.value > 13) capaLvlEl.value = 13;
	}

	var resetEl = document.getElementById(p + 'iResets');
	if (resetEl) {
		resetEl.max = isMuren ? 100 : 500;
		if (isMuren && +resetEl.value > 100) resetEl.value = 100;
	}
	var maxStat = isMuren ? 50000 : 32500;
	['iStr', 'iAgi', 'iVit', 'iEne'].forEach(function(s) {
		var el = document.getElementById(p + s);
		if (el) {
			el.max = maxStat;
			if (!isMuren && +el.value > 32500) el.value = 32500;
		}
	});
	var vipRow = document.getElementById(p + 'lblVip');
	if (vipRow) {
		vipRow.style.display = isMuren ? 'none' : 'inline-flex';
	}
	var realmRow = document.getElementById(p + 'pnlRealmInfo');
	if (realmRow) {
		realmRow.style.display = isMuren ? 'flex' : 'none';
	}
	var cmdEl = document.getElementById(p + 'iCmd');
	if (cmdEl) {
		if (isMuren) {
			cmdEl.disabled = false;
			cmdEl.type = 'number';
			cmdEl.min = '25';
			cmdEl.max = '50000';
			if (!cmdEl.value || +cmdEl.value === 0) cmdEl.value = 25;
		} else {
			cmdEl.disabled = true;
			cmdEl.type = 'text';
		}
	}
}

function syncInventoryOpts(el) {
	var section = el.closest ? el.closest('section') : (function() {
		var node = el;
		while (node && node.tagName !== 'SECTION') node = node.parentNode;
		return node;
	})();
	if (!section) return;
	var tabId = section.id;
	var p = tabId + '_';

	var sorteCount = section.querySelectorAll('.opt-sorte:checked').length;
	var dimCount   = section.querySelectorAll('.opt-dim:checked').length;
	var refCount   = section.querySelectorAll('.opt-ref:checked').length;
	var vCount     = section.querySelectorAll('.opt-vida:checked').length;
	var pvmCount   = section.querySelectorAll('.opt-pvm:checked').length;
	var ddiCount   = section.querySelectorAll('.opt-ddi:checked').length;

	var elSorte = document.getElementById(p + 'iSSorte');
	var elDim   = document.getElementById(p + 'iSDiminui');
	var elRef   = document.getElementById(p + 'iSRef');
	var elVida  = document.getElementById(p + 'iSVida');
	var elPvm   = document.getElementById(p + 'iSPvm');
	var elDDI   = document.getElementById(p + 'iSDDI');

	if (elSorte) elSorte.value = sorteCount;
	if (elDim) elDim.value = dimCount;
	if (elRef) elRef.value = refCount;
	if (elVida) elVida.value = vCount;
	if (elPvm) elPvm.value = pvmCount;
	if (elDDI) elDDI.value = ddiCount;

	var sSorte  = document.getElementById(p + 'sumSorte');
	var sDim    = document.getElementById(p + 'sumDim');
	var sRef    = document.getElementById(p + 'sumRef');
	var sRefPct = document.getElementById(p + 'sumRefPct');
	var sVida   = document.getElementById(p + 'sumVida');
	var sPvm    = document.getElementById(p + 'sumPvm');
	var sDDI    = document.getElementById(p + 'sumDDI');

	if (sSorte) sSorte.textContent = sorteCount;
	if (sDim) sDim.textContent = dimCount;
	if (sRef) sRef.textContent = refCount;
	if (sRefPct) sRefPct.textContent = (refCount * 5) + '%';
	if (sVida) sVida.textContent = vCount;
	if (sPvm) sPvm.textContent = pvmCount;
	if (sDDI) sDDI.textContent = ddiCount;

	// Trigger calculation refresh
	refresh({ target: elDim || elVida || el });
}

function applySetPreset(btn, preset) {
	var section = btn.closest ? btn.closest('section') : (function() {
		var node = btn;
		while (node && node.tagName !== 'SECTION') node = node.parentNode;
		return node;
	})();
	if (!section) return;
	var checkboxes = section.querySelectorAll('.slot-opt-chip input[type="checkbox"]');
	for (var i = 0; i < checkboxes.length; i++) {
		checkboxes[i].checked = (preset === 'full');
	}
	if (checkboxes.length > 0) {
		syncInventoryOpts(checkboxes[0]);
	}
}

function getMurenRoom(resets) {
	if (resets < 20) {
		return { id: 'muren', name: 'Muren', mult: 1, resetLvl: 300 };
	} else if (resets < 70) {
		return { id: 'nightmare', name: 'Nightmare', mult: 2, resetLvl: 350 };
	} else {
		return { id: 'hell', name: 'Hell', mult: 4, resetLvl: 400 };
	}
}

function calcPontosMuren(c, reset, lvl, str, agi, vit, ene, cmd, hasMarlon, questBonusPoints) {
	var basePoints = (c === 'mg' || c === 'dl') ? 7 : 5;
	var resetReward = 0;
	if (reset > 0) {
		var rawTotal = reset * (1055 - 5 * reset);
		resetReward = Math.floor((basePoints * rawTotal) / 14);
	}
	var room = getMurenRoom(reset);
	var questPerLvlBonus = hasMarlon ? 1 : 0;
	var pointsPerLvl = Math.round((basePoints + questPerLvlBonus) * room.mult);
	var levelPoints = Math.max(0, lvl - 1) * pointsPerLvl;
	var scaledQuestReward = Math.round(questBonusPoints * room.mult);
	var totalAvailable = resetReward + levelPoints + scaledQuestReward;

	var startStats = {
		bk: {str:28, agi:20, vit:25, ene:10, cmd:0},
		sm: {str:18, agi:18, vit:15, ene:30, cmd:0},
		me: {str:22, agi:25, vit:20, ene:15, cmd:0},
		mg: {str:26, agi:26, vit:26, ene:16, cmd:0},
		dl: {str:26, agi:20, vit:20, ene:15, cmd:25},
	};
	var base = startStats[c] || {str:0, agi:0, vit:0, ene:0, cmd:0};
	var spent = (str - base.str) + (agi - base.agi) + (vit - base.vit) + (ene - base.ene);
	if (c === 'dl') {
		spent += (cmd - base.cmd);
	}

	return {
		pontos: totalAvailable - spent,
		room: room,
		resetReward: resetReward,
		pointsPerLvl: pointsPerLvl
	};
}

function sanitycheck(prefix){
	var $ = function( id ) { return document.getElementById( prefix + id ); };
	var flag = true;
	var isMuren = getProvider() === 'muren';
	var maxStat = isMuren ? 50000 : 32500;
	var maxResets = isMuren ? 100 : 500;

	var checks = [
		['iStr',    0, maxStat],
		['iAgi',    0, maxStat],
		['iVit',    0, maxStat],
		['iEne',    0, maxStat],
		['iLevel',  1,   400],
		['iResets', 0, maxResets],
	];
	if (isMuren && $('iCmd')) {
		checks.push(['iCmd', 0, maxStat]);
	}
	checks.forEach(function(ck) {
		var el = $(ck[0]);
		if (!el) return;
		var v = +el.value;
		var bad = v < ck[1] || v > ck[2];
		el.classList.toggle('warn-red', bad);
		if (bad) flag = false;
	});

	return flag;
}

function bugmp(mp){
	if(mp > 65535)
		return true;
	return false;
}

function bugvelo(c, speed){
	switch(c){
		case 'sm':
		if(speed < 455)
			return 0;
		else if(speed >= 455 && speed <= 479)
			return 1;
		else if(speed >= 480 && speed <= 586)// até 617 //
			return 0;
		else if(speed >= 587 && speed <= 688)
			return 1;
		else if(speed >= 689 && speed <= 854)
			return 0;
		else if(speed >= 855 && speed <= 1006)// até 1037 //
			return 1;
		else if(speed >= 1007 && speed <= 1099)
			return 2;
		else if(speed >= 1100 && speed <= 1104)
			return 1;
		else if(speed >= 1105 && speed <= 1354)
			return 0;
		else if(speed >= 1355 && speed <= 1599)
			return 1;
		else if(speed >= 1600 && speed <= 2349)
			return 2;
		else if(speed >= 2350 && speed <= 2354)
			return 1;
		else if(speed >= 2355 && speed <= 2854)
			return 0;
		else if(speed >= 2855)
			return 1;
		break;
		case 'mg':
		if(speed <= 526)
			return 0;
		else if(speed >= 526 && speed <= 553)
			return 1;
		else if(speed >= 553 && speed <= 726)
			return 0;
		else if(speed >= 726 && speed <= 833)
			return 1;
		else if(speed >= 833 && speed <= 1040)
			return 0;
		else if(speed >= 1040 && speed <= 1400)
			return 1;
		else if(speed >= 1400 && speed <= 1706)
			return 0;
		else if(speed >= 1706 && speed <= 2033)
			return 1;
		else if(speed >= 2033)
			return 2;
		else
			return 1;
		break;
		case 'dl':
		if(speed <= 190)
			return 0;
		else if (speed == 200)
			return 1;
		else if(speed >= 210 && speed <= 270)
			return 0;
		else if(speed >= 280 && speed <= 310)
			return 1;
		else if(speed >= 320 && speed <= 390)
			return 0;
		else if(speed >= 400 && speed <= 520)
			return 1;
		else if(speed >= 530 && speed <= 640)
			return 0;
		else if(speed >= 650 && speed <= 1140)
			return 1;
		else if(speed >= 1150 && speed <= 1390)
			return 0;
		else if(speed >= 1400 && speed <= 3250)
			return 1;
		break;
	}
}

function bugcheck(c, objBug, prefix){

	var $ = function( id ) { return document.getElementById( prefix + id ); };

	var mpEl = $('oMP');
	mpEl.classList.remove('warn-yellow');
	if (bugmp(objBug.mp)) mpEl.classList.add('warn-yellow');

	var speedEl = $('oSpeed');
	speedEl.classList.remove('warn-yellow', 'warn-orange');
	switch(bugvelo(c, objBug.speed)){
		case 1: speedEl.classList.add('warn-yellow'); break;
		case 2: speedEl.classList.add('warn-orange'); break;
	}

}

function addTab(targetClassId){
	var existingSections = $('tabs').getElementsByTagName('section').length;
	if (existingSections >= 6) return;
	var newTabID = 'tab' + existingSections;
	var tabs = $('tabs');
	var newTab = document.createElement('section');
	newTab.id = newTabID;
	newTab.setAttribute('oninput', 'refresh(event)');
	newTab.setAttribute('onchange', 'refresh(event)');
	newTab.innerHTML = $('model').innerHTML;
	tabs.appendChild(newTab);

	var classSelect = $('classes');
	if (targetClassId && classSelect) {
		classSelect.value = targetClassId;
	}
	var op = classSelect.options[classSelect.selectedIndex];
	var classMap = {1:'bk', 2:'sm', 3:'me', 4:'mg', 5:'dl'};
	var cls = classMap[+op.value];
	if (!cls) { alert('Classe não implementada'); tabs.removeChild(newTab); return; }
	$(newTabID).classList.add(cls);

	// Prefix all IDs inside the new tab (divs first, then inputs/selects/labels/spans/strongs)
	['div','input','select','label','span','strong'].forEach(function(tag){
		var els = $(newTabID).getElementsByTagName(tag);
		for (var i = 0; i < els.length; i++) {
			if (els[i].id) els[i].id = newTabID + '_' + els[i].id;
		}
	});

	// Inject class-specific panels
	var p = newTabID + '_';
	switch(+op.value){
		case 1: // BK
			$(p+'tblArma').innerHTML += $('pnlArma').innerHTML;
			$(p+'tblSpec').innerHTML += $('pnlAsa').innerHTML;
			$(p+'tblDanos').innerHTML += $('pnlDanoPhy').innerHTML;
			$(p+'tblDanos').innerHTML += $('pnlDanoCombo').innerHTML;
			$(p+'tblBuffs').innerHTML += $('pnlBuff').innerHTML;
			break;
		case 2: // SM
			$(p+'tblArma').innerHTML += $('pnlStaff').innerHTML;
			$(p+'tblSpec').innerHTML += $('pnlAsa').innerHTML;
			$(p+'tblDanos').innerHTML += $('pnlDanoWiz').innerHTML;
			$(p+'tblBuffs').innerHTML += $('pnlBuff').innerHTML;
			break;
		case 3: // ME
			$(p+'tblArma').innerHTML += $('pnlArma').innerHTML;
			$(p+'tblSpec').innerHTML += $('pnlAsa').innerHTML;
			$(p+'tblDanos').innerHTML += $('pnlDanoPhy').innerHTML;
			$(p+'tblDanos').innerHTML += $('pnlBuffME').innerHTML;
			$(p+'tblBuffs').innerHTML += $('pnlSelf').innerHTML;
			break;
		case 4: // MG
			$(p+'tblArma').innerHTML += $('pnlArma').innerHTML;
			$(p+'tblArma').innerHTML += $('pnlStaff').innerHTML;
			$(p+'tblSpec').innerHTML += $('pnlAsa').innerHTML;
			$(p+'tblDanos').innerHTML += $('pnlDanoPhy').innerHTML;
			$(p+'tblDanos').innerHTML += $('pnlDanoWiz').innerHTML;
			$(p+'tblBuffs').innerHTML += $('pnlBuff').innerHTML;
			break;
		case 5: // DL
			$(p+'tblPontos').innerHTML += $('pnlLid').innerHTML;
			$(p+'tblSpec').innerHTML += $('pnlCapa').innerHTML;
			$(p+'tblArma').innerHTML += $('pnlArma').innerHTML;
			$(p+'tblDanos').innerHTML += $('pnlDanoPhy').innerHTML;
			$(p+'tblDanos').innerHTML += $('pnlDanoFB').innerHTML;
			$(p+'tblBuffs').innerHTML += $('pnlBuff').innerHTML;
			break;
	}

	// Prefix IDs injected by panels (skip already-prefixed ones)
	['input','select','strong','span','div','label'].forEach(function(tag){
		var els = $(newTabID).getElementsByTagName(tag);
		for (var i = 0; i < els.length; i++) {
			if (els[i].id && els[i].id.indexOf(newTabID) !== 0) {
				els[i].id = newTabID + '_' + els[i].id;
			}
		}
	});

	// Set class-specific starting stats
	var startStats = {
		bk: {iStr:28, iAgi:20, iVit:25, iEne:10},
		sm: {iStr:18, iAgi:18, iVit:15, iEne:30},
		me: {iStr:22, iAgi:25, iVit:20, iEne:15},
		mg: {iStr:26, iAgi:26, iVit:26, iEne:16},
		dl: {iStr:26, iAgi:20, iVit:20, iEne:15, iCmd:25},
	};
	var stats = startStats[cls];
	Object.keys(stats).forEach(function(id) {
		var el = document.getElementById(newTabID + '_' + id);
		if (el) el.value = stats[id];
	});

	// Apply current provider configuration to new tab
	applyProviderToTab(newTabID, getProvider());

	// Add tab nav link
	var nav = $('tabNav');
	var classNames = {bk:'BK', sm:'SM', me:'ME', mg:'MG', dl:'DL'};
	var a = createTabNavLink(newTabID, cls, classNames[cls] + ' ' + (existingSections + 1));
	nav.appendChild(a);

	window.location.href = '#' + newTabID;
	syncTabNav();

	// Options start disabled / unchecked
	var initEl = document.getElementById(newTabID + '_iStr');
	if (initEl) refresh({target: initEl});

	applyDualWieldRules(newTab, cls);
}

function calcSample(sample, def, absasa, pdimi, pddi, buffms, gangel){

	sample -= def;
	sample = sample * (1-absasa);

	for (var i = 0; i < pdimi; i++) {
		sample = (sample*0.96);
	}
	for (var i = 0; i < pddi; i++) {
		sample = (sample*0.93);
	}
	
	sample = sample * (1-(0.7*buffms));
	sample = sample * (1-(0.2*gangel));

	if(sample < 0) sample = 0;
	return (sample | 0);
}

function calcPontos (c, reset, vip, lvl, str, agi, vit, ene, quest3) {

	var exreset = 0;
	if (reset > 250){
		exreset = reset - 250;
		reset = 250;
	}

	var pontos = 0;
	switch(c){
		case 'mg':
		pontos = (100 + ((280+(76*vip)) * reset) + (exreset * 12) + (7 * (lvl-1)) - (str+agi+vit+ene));
		break;
		case 'dl':
		pontos = (100 + ((220+(60*vip)) * reset) + (exreset * 12) + (7 * (lvl-1)) - (str+agi+vit+ene));
		break;
		default:
		pontos = (100 + ((220+(60*vip)) * reset) + (exreset * 12) + (6 * (lvl-1)) - (str+agi+vit+ene));
		break;
	}

	pontos += quest3 + 1;

	return pontos;
}

function calcAsa(objAsa){
	var speed = 0;
	switch(objAsa.tasa){
		case 1:
		objAsa.Tiatasa = 2;
		objAsa.Tidfasa = 3;
		objAsa.Tabsasa = 2;
		objAsa.iatasa = 12;
		objAsa.idfasa = 10;
		objAsa.absasa = 12;
		speed = 15;
		break;
		case 2:
		objAsa.Tiatasa = 1;
		objAsa.Tidfasa = 2;
		objAsa.Tabsasa = 2;
		objAsa.iatasa = 32;
		objAsa.idfasa = 45;
		objAsa.absasa = 25;
		speed = 16;
		break;
	}

	if(objAsa.tasa > 0){

		objAsa.iatasa += (objAsa.Tiatasa * objAsa.lasa);
		objAsa.iatasa /= 100;

		objAsa.absasa += (objAsa.Tabsasa * objAsa.lasa);
		objAsa.absasa /= 100;
	}

	return speed;
}

function calcDef (c, agi, defbuff, objAsa, pdeze, bdef) {
	var def = 0;
	switch(c){
		case 'bk':
		def = agi/3;
		break;
		case 'sm':
		def = agi/4;
		break;
		case 'me':
		def = agi/10;
		break;
		case 'mg':
		def = agi/5;
		break;
		case 'dl':
		def = agi/7;
		break;
	}

	def += defbuff;
	def += 800; //Defesa média dos sets
	def += (objAsa.Tidfasa * objAsa.lasa);

	// All 5 pieces (4 for MG) are always assumed +16 additional defense
	var actualPdeze = (c === 'mg') ? 4 : 5;
	for (var i = 0; i < actualPdeze; i++) {
		def = (def*1.16);
	}

	def *= (1+(bdef/100));
	return (def | 0);
}

function calcHP (c, lvl, vit, pvida, buffgf) {

	var hp = 0;
	
	switch(c){
		case 'bk':
		hp = 35+(lvl-1)*2+(vit*3);
		break;
		case 'sm':
		hp = 30+(lvl-1)+(vit*2);
		break;
		case 'me':
		hp = 40+(lvl-1)+(vit*2);
		break;
		case 'mg':
		hp = 58+(lvl-1)+(vit*2);
		break;
		case 'dl':
		hp = 50+(lvl-1)*1.5+(vit*2);
		break;
	}

	for (var i = 0; i < pvida; i++) {
		hp = hp*1.04;
	}

	hp = hp * (1 + (1.30 * buffgf));

	return (hp | 0);
}

function calcMP (c, lvl, ene) {
	var mp = 0;
	switch(c){
		case 'bk':
		mp = 10+(lvl-1)*0.5+ene;
		break;
		case 'sm':
		mp = (lvl-1)*2+(ene*2);
		break;
		case 'me':
		mp = 6+(lvl*1.5)+(ene*1.5);
		break;
		case 'mg':
		mp = 8+(lvl-1)+(ene*2);
		break;
		case 'dl':
		mp = 40+(lvl-1)+(ene-15)*1.5;
		break;
	}

	return (mp | 0);
}

function calcAG(c, objAttr){
	var ag = 0;
	switch(c){
		case 'bk':
		ag = (objAttr.ene+objAttr.vit)*(0.3+objAttr.agi)*(0.2+objAttr.str)*0.15;
		break;
		case 'sm':
		ag = (objAttr.ene*0.2)+(objAttr.vit*0.3)+(objAttr.agi*0.4)+(objAttr.str*0.2);
		break;
		case 'me':
		ag = (objAttr.ene*0.2)+(objAttr.vit*0.3)+(objAttr.agi*0.2)+(objAttr.str*0.3);
		break;
		case 'mg':
		ag = (objAttr.ene*0.15)+(objAttr.vit*0.3)+(objAttr.agi*0.25)+(objAttr.str*0.2);
		break;
		case 'dl':
		ag = (objAttr.ene*0.15)+(objAttr.vit*0.1)+(objAttr.agi*0.2)+(objAttr.str*0.3)+(objAttr.cmd*0.3);
		break;
	}	
	return (ag | 0);
}

function calcSpeed (c, agi) {
	var speed = 0;
	switch(c){
		case 'bk':
		speed = agi / 15;
		break;
		case 'sm':
		speed = agi / 10;
		break;
		case 'me':
		speed = agi / 50;
		break;
		case 'mg':
		speed = agi / 15;
		break;
		case 'dl':
		speed = agi / 10;
		break;
	}	
	return (speed | 0);
}

function calcSD (objAttr, def, lvl) {
	var sd = (objAttr.str+objAttr.agi+objAttr.vit+objAttr.ene+objAttr.cmd) * 1.2 + def / 2 + lvl*lvl/ 30;
	return (sd | 0);
}

function calcWDmg(objDmg, objOpt, ene){
	objDmg.wmindmg = (ene / 9) * (1+(objOpt.pen*0.02)) * (1+(objOpt.wp*0.02)) * (1+objOpt.stfp);
	objDmg.wmindmg += objOpt.dmgbuff + (objOpt.penLvlDmg || 0);
	objDmg.wmindmg *= (1+objOpt.iatasa) * (1+(objOpt.imp*0.3));
	objDmg.wmindmg |= 0;

	objDmg.wmaxdmg = (ene / 4) * (1+(objOpt.pen*0.02)) * (1+(objOpt.wp*0.02)) * (1+objOpt.stfp);
	objDmg.wmaxdmg += objOpt.dmgbuff + (objOpt.penLvlDmg || 0);
	objDmg.wmaxdmg *= (1+objOpt.iatasa) * (1+(objOpt.imp*0.3));
	objDmg.wmaxdmg |= 0;
}

function calcPDmg(c, objDmg, objOpt, str, ene, agi){

	switch(c){
		case 'bk':
		objDmg.pmindmg = str/6;
		objDmg.pmaxdmg = str/4;
		objDmg.cbdmg = (str+agi+ene)/2;
		break;
		case 'me':
		objDmg.pmindmg = (str/14)+(agi/7);
		objDmg.pmaxdmg = (str/8)+(agi/4);
		break;
		case 'mg':
		objDmg.pmindmg = (str/6)+(ene/12);
		objDmg.pmaxdmg = (str/4)+(ene/8);
		break;
		case 'dl':
		objDmg.pmindmg = (str/7)+(ene/14);
		objDmg.pmaxdmg = (str/5)+(ene/10);
		break;
	}

	var totalWpMin = objOpt.wpmin + (objOpt.wp2min || 0);
	var totalWpMax = objOpt.wpmax + (objOpt.wp2max || 0);

	objDmg.pmindmg += totalWpMin + (objOpt.penLvlDmg || 0);
	objDmg.pmindmg *= (1+(objOpt.pen*0.02)) * (1+(objOpt.wp*0.02)) * (1+((objOpt.wp2exc||0)*0.02));
	objDmg.pmindmg += objOpt.dmgbuff;
	objDmg.pmindmg *= (1+objOpt.iatasa) * (1+(objOpt.imp*0.3));

	objDmg.pmaxdmg += totalWpMax + (objOpt.penLvlDmg || 0);
	objDmg.pmaxdmg *= (1+(objOpt.pen*0.02)) * (1+(objOpt.wp*0.02)) * (1+((objOpt.wp2exc||0)*0.02));
	objDmg.pmaxdmg += objOpt.dmgbuff;
	objDmg.pmaxdmg *= (1+objOpt.iatasa) * (1+(objOpt.imp*0.3));

	if(c == 'bk'){
		objDmg.cbdmg += totalWpMax;
		objDmg.cbdmg *= (1+(objOpt.pen*0.02)) * (1+(objOpt.wp*0.02));
		objDmg.cbdmg += objOpt.dmgbuff;
		objDmg.cbdmg *= (1+objOpt.iatasa) * (1+(objOpt.imp*0.3));
		objDmg.cbdmg |= 0;
	}

	switch(c){
		case 'bk':
		t = 200 + (ene/10);
		break;
		case 'me':
		t = 100;
		break;
		case 'mg':
		t = Math.min(200 + (2.4 * objOpt.reset), 800);
		break;
		case 'dl':
		t = 200 + (ene/20);
		break;
	}

	t /= 100;

	objDmg.pmindmg *= t;
	objDmg.pmaxdmg *= t;

	objDmg.pmindmg |= 0;
	objDmg.pmaxdmg |= 0;	
}

function calcDmg (c, objDmg, objOpt, str, agi, ene, cmd) {

	switch(c){
		case 'bk':
		calcPDmg(c, objDmg, objOpt, str, ene, agi);
		break;
		case 'sm':
		calcWDmg(objDmg, objOpt, ene);
		break;
		case 'me':
		calcPDmg(c, objDmg, objOpt, str, ene, agi);
		break;
		case 'mg':
		calcWDmg(objDmg, objOpt, ene);
		calcPDmg(c, objDmg, objOpt, str, ene, agi);
		break;
		case 'dl':
		calcPDmg(c, objDmg, objOpt, str, ene, agi);
		break;
	}

	objDmg.wexcdmg = objDmg.wmaxdmg * 1.20;
	objDmg.wexcdmg |= 0;
	objDmg.pexcdmg = objDmg.pmaxdmg * 1.20;
	objDmg.pexcdmg |= 0;

}

function calcRate(c, objRate, lvl, objAttr){
	switch(c){
		case 'bk':
		objRate.pvmdr = objAttr.agi/3;
		objRate.pvmar = ((lvl*5+(objAttr.agi*3))/2+objAttr.str/4) | 0;
		objRate.pvpdr = (lvl*2+objAttr.agi*0.5) | 0;
		objRate.pvpar = (lvl*3+objAttr.agi*4.5) | 0;
		break;
		case 'sm':
		objRate.pvmdr = objAttr.agi/3;
		objRate.pvmar = ((lvl*5+(objAttr.agi*3))/2+objAttr.str/4) | 0;
		objRate.pvpdr = (lvl*2+objAttr.agi*0.25) | 0;
		objRate.pvpar = (lvl*3+objAttr.agi*4) | 0;
		break;
		case 'me':
		objRate.pvmdr = objAttr.agi/4;
		objRate.pvmar = ((lvl*5+(objAttr.agi*3))/2+(objAttr.str/4)) | 0;
		objRate.pvpdr = (lvl*2+objAttr.agi*0.1) | 0;
		objRate.pvpar = (lvl*3+objAttr.agi*0.6) | 0;
		break;
		case 'mg':
		objRate.pvmdr = objAttr.agi/3;
		objRate.pvmar = ((lvl*5+(objAttr.agi*3))/2+(objAttr.str/4)) | 0;
		objRate.pvpdr = (lvl*2+objAttr.agi*0.25) | 0;
		objRate.pvpar = (lvl*3+objAttr.agi*3.5) | 0;
		break;
		case 'dl':
		objRate.pvmdr = objAttr.agi/7;
		objRate.pvmar = ((lvl*5+(objAttr.agi*5))/2+(objAttr.str/6)+(objAttr.cmd/10)) | 0;
		objRate.pvpdr = (lvl*2+objAttr.agi*0.5) | 0;
		objRate.pvpar = (lvl*3+objAttr.agi*4) | 0;
		break;
	}

	for (var i = 0; i < objRate.ppvm; i++) {
		objRate.pvmdr *= 1.10;
	}

	objRate.pvpdr = objRate.pvpdr + (objRate.def*0.10)

	objRate.pvpdr |= 0;
	objRate.pvmdr |= 0;
}


function refresh(e){
	var sender = e && e.target;
	if (!sender || !sender.id) return;
	var prefix = sender.id.substring(0, 5);
	var sectionEl = document.getElementById(sender.id.substring(0, 4));
	if (!sectionEl) return;
	var c = sectionEl.className.trim().split(' ')[0];
	if (!c) return;
	var $ = function(id){ return document.getElementById(prefix + id); };
	if (!sanitycheck(prefix)) return;

	var isMuren = getProvider() === 'muren';
	var lvl     = +$('iLevel').value;
	var reset   = +$('iResets').value;
	if (isMuren && reset > 100) reset = 100;

	var str   = +$('iStr').value;
	var agi   = +$('iAgi').value;
	var vit   = +$('iVit').value;
	var ene   = +$('iEne').value;
	var cmd = 0;
	if (c === 'dl') {
		var cmdEl = $('iCmd');
		if (cmdEl) {
			if (!isMuren) {
				cmd = reset * 130;
				cmdEl.value = cmd;
			} else {
				cmd = +cmdEl.value || 25;
			}
		}
	}
	var objAttr = {str:str, agi:agi, vit:vit, ene:ene, cmd:cmd};
	var vip     = +$('iSCVip').checked;
	var quest3  = ($('iSCQ3a').checked ? 20 : 0)
	            + ($('iSCQ3b').checked ? 20 : 0)
	            + ($('iSCQ3c').checked ? 30 : 0);
	var pvida   = +$('iSVida').value;
	var pdimi   = +$('iSDiminui').value;
	var pddi    = +$('iSDDI').value;
	var pdeze   = (c === 'mg') ? 4 : 5;
	var ppvm    = +$('iSPvm').value;
	var setEl   = $('iSSet');
	var bdef    = setEl ? (setEl.options ? +setEl.options[setEl.selectedIndex].value : +setEl.value || 20) : 20;
	var staff   = (c === 'sm' || c === 'mg') ? (+$('iSStaff').value) / 100 : 0;

	var asaEl = $('iSTAsa'), capaEl = $('iSTCapa');
	var tasa = asaEl ? +asaEl.options[asaEl.selectedIndex].value : 0;
	var lasaEl = $('iSLAsa'), lcapaEl = $('iSLCapa');
	var lasa = lasaEl ? +lasaEl.value : (lcapaEl ? +lcapaEl.value : 0);
	if (lasa < 0) lasa = 0;
	if (lasa > 15) lasa = 15;
	if (c === 'dl' && capaEl) { tasa = +capaEl.options[capaEl.selectedIndex].value; }

	var petVal  = +$('iSTPet').options[$('iSTPet').selectedIndex].value;
	var imp     = petVal === 2 ? 1 : 0;
	var gangel  = petVal === 1 ? 1 : 0;
	var addwp   = +($('iSCWp2') ? $('iSCWp2').checked : 0);
	var addpendant = +$('iSCPen2').checked;
	var buffms  = +$('iSCMS').checked;
	var buffgf  = +$('iSCGF').checked;
	var dmgbuff = 0, defbuff = 0;
	var sample  = +$('iSampledmg').value;

	var wpmin = 0, wpmax = 0;
	if (c !== 'sm') {
		var wpminEl = $('iSWpmin'), wpmaxEl = $('iSWpmax');
		if (wpminEl && +wpminEl.value > 0) wpmin = +wpminEl.value;
		if (wpmaxEl && +wpmaxEl.value > 0) wpmax = +wpmaxEl.value;
	}

	if (c === 'me') {
		var maxBuffEne = isMuren ? 50000 : 32500;
		var buffSel = $('iSTBuff');
		switch(buffSel ? +buffSel.options[buffSel.selectedIndex].value : 0){
			case 1:
				dmgbuff = ((+$('iEne').value / 7) + 3) | 0;
				defbuff = ((+$('iEne').value / 8) + 2) | 0;
				break;
			case 2:
				dmgbuff = ((maxBuffEne / 7) + 3) | 0;
				defbuff = ((maxBuffEne / 8) + 2) | 0;
				break;
		}
	} else {
		var meEl = $('iSCME');
		if (meEl && +meEl.checked) {
			var maxBuffEne = isMuren ? 50000 : 32500;
			dmgbuff = ((maxBuffEne / 7) + 3) | 0;
			defbuff = ((maxBuffEne / 8) + 2) | 0;
		}
	}

	var red   = ((ene/7)+3) | 0;
	var green = ((ene/8)+2) | 0;
	var blue  = ((ene/5)+5) | 0;

	var pontos = 0;
	if (isMuren) {
		var hasMarlon = !!($('iSCQ3b') && $('iSCQ3b').checked);
		var questBonusPoints = ($('iSCQ3a') && $('iSCQ3a').checked ? 20 : 0)
		                     + ($('iSCQ3b') && $('iSCQ3b').checked ? 20 : 0)
		                     + ($('iSCQ3c') && $('iSCQ3c').checked ? 30 : 0);
		var murenRes = calcPontosMuren(c, reset, lvl, str, agi, vit, ene, cmd, hasMarlon, questBonusPoints);
		pontos = murenRes.pontos;

		var rBadge = $('oRealmBadge');
		var rReq = $('oRealmReq');
		if (rBadge) {
			rBadge.textContent = murenRes.room.name + ' (' + murenRes.room.mult + 'x)';
			rBadge.className = 'realm-badge realm-' + murenRes.room.id;
		}
		if (rReq) {
			rReq.textContent = 'Req: Nv ' + murenRes.room.resetLvl;
		}
	} else {
		pontos = calcPontos(c, reset, vip, lvl, str, agi, vit, ene, quest3);
	}
	var objAsa  = {iatasa:0, Tiatasa:0, idfasa:0, Tidfasa:0, absasa:0, Tabsasa:0, lasa:lasa, tasa:tasa};
	var speed   = calcSpeed(c, agi);
	speed += calcAsa(objAsa);

	// Primary Weapon options
	var wpSpeed = 0, wpLvl20 = 0, addwp = 0;
	if (c === 'sm') {
		if ($('iSCStaffSpeed') && $('iSCStaffSpeed').checked) wpSpeed = 7;
		if ($('iSCStaffLvl20') && $('iSCStaffLvl20').checked) wpLvl20 = Math.floor(lvl / 20);
		if ($('iSCStaff2') && $('iSCStaff2').checked) addwp = 1;
	} else {
		if ($('iSCWpSpeed') && $('iSCWpSpeed').checked) wpSpeed = 7;
		if ($('iSCWpLvl20') && $('iSCWpLvl20').checked) wpLvl20 = Math.floor(lvl / 20);
		if ($('iSCWp2') && $('iSCWp2').checked) addwp = 1;
		if (c === 'mg') {
			if ($('iSCStaffSpeed') && $('iSCStaffSpeed').checked) wpSpeed += 7;
			if ($('iSCStaffLvl20') && $('iSCStaffLvl20').checked) wpLvl20 += Math.floor(lvl / 20);
			if ($('iSCStaff2') && $('iSCStaff2').checked) addwp = 1;
		}
	}

	// Pendant offensive options
	var isPenSpeed = $('iSCPenSpeed') && $('iSCPenSpeed').checked;
	var isPenLvl20 = $('iSCPenLvl20') && $('iSCPenLvl20').checked;
	var penLvlDmg  = isPenLvl20 ? Math.floor(lvl / 20) : 0;
	var addpendant = $('iSCPen2') && $('iSCPen2').checked ? 1 : 0;

	// Total attack speed additions
	if (isPenSpeed) speed += 7;
	speed += wpSpeed;

	// Two-handed & Secondary weapon mechanics
	var is2H = $('iSC2H') && $('iSC2H').checked;
	var offhandType = $('iSOffhandType') ? $('iSOffhandType').value : 'shield';
	var wp2min = 0, wp2max = 0, wp2exc = 0, wp2Lvl20 = 0;
	if (!is2H && offhandType === 'weapon') {
		var wp2minEl = $('iSWp2min'), wp2maxEl = $('iSWp2max'), wp2excEl = $('iSCWp2b');
		if (wp2minEl && +wp2minEl.value > 0) wp2min = +wp2minEl.value;
		if (wp2maxEl && +wp2maxEl.value > 0) wp2max = +wp2maxEl.value;
		if (wp2excEl && wp2excEl.checked) wp2exc = 1;
		if ($('iSCWp2Speed') && $('iSCWp2Speed').checked) speed += 7;
		if ($('iSCWp2Lvl20') && $('iSCWp2Lvl20').checked) wp2Lvl20 = Math.floor(lvl / 20);
	}

	var ampVal = Math.round(objAsa.iatasa * 100);
	var absVal = Math.round(objAsa.absasa * 100);
	var ampEl = $('oAmpAsa') || $('oAmpCapa');
	var absEl = $('oAbsAsa') || $('oAbsCapa');
	if (ampEl) ampEl.textContent = (ampVal > 0 ? '+' : '') + ampVal + '%';
	if (absEl) absEl.textContent = absVal + '%';
	var hp  = calcHP(c, lvl, vit, pvida, buffgf);
	var mp  = calcMP(c, lvl, ene);
	var ag  = calcAG(c, objAttr);
	var def = calcDef(c, agi, defbuff, objAsa, pdeze, bdef);
	sample  = calcSample(sample, def, objAsa.absasa, pdimi, pddi, buffms, gangel);
	var sd  = calcSD(objAttr, def, lvl);

	var objDmg  = {};
	var objOpt  = {
		pen: addpendant,
		penLvlDmg: penLvlDmg,
		wp: addwp,
		wpLvlDmg: wpLvl20 + wp2Lvl20,
		stfp: staff,
		imp: imp,
		iatasa: objAsa.iatasa,
		dmgbuff: dmgbuff,
		wpmin: wpmin,
		wpmax: wpmax,
		wp2min: wp2min,
		wp2max: wp2max,
		wp2exc: wp2exc,
		reset: reset
	};
	calcDmg(c, objDmg, objOpt, str, agi, ene, cmd);

	var objRate = {pvmdr:0, pvmar:0, pvpdr:0, pvpar:0, ppvm:ppvm, def:def};
	calcRate(c, objRate, lvl, objAttr);

	$('oPontos').value = pontos;
	if (c === 'sm' || c === 'mg'){
		$('oMinwizDmg').value = objDmg.wmindmg;
		$('oMaxwizDmg').value = objDmg.wmaxdmg;
		$('oExcwizDmg').value = objDmg.wexcdmg;
	}
	if (c !== 'sm'){
		$('oMinphyDmg').value = objDmg.pmindmg;
		$('oMaxphyDmg').value = objDmg.pmaxdmg;
		$('oExcphyDmg').value = objDmg.pexcdmg;
	}
	if (c === 'dl'){
		$('oFBMinphyDmg').value = objDmg.fbmindmg;
		$('oFBMaxphyDmg').value = objDmg.fbmaxdmg;
		$('oFBExcphyDmg').value = objDmg.fbexcdmg;
	}
	if (c === 'bk') $('oCBDmg').value = objDmg.cbdmg;

	$('oHP').value    = hp;
	$('oMP').value    = mp;
	$('oAG').value    = ag;
	$('oSD').value    = sd;
	$('oDef').value   = def;
	$('oSpeed').value = speed;
	$('oPvmDr').value = objRate.pvmdr;
	$('oPvmAr').value = objRate.pvmar;
	$('oPvpDr').value = objRate.pvpdr;
	$('oPvpAr').value = objRate.pvpar;
	var sampleEl = $('oSampleResult');
	if (sampleEl) sampleEl.value = sample;

	// Reflected damage calculator derived directly from Recebido (sample)
	var pRef = $('iSRef') ? +$('iSRef').value : 0;
	var refPct = pRef * 5;
	var refOut = Math.round(sample * (refPct / 100));
	var refOutEl = $('oReflectOut');
	if (refOutEl) refOutEl.value = refOut;
	var lblRefPct = $('oLblRefPct');
	if (lblRefPct) lblRefPct.textContent = refPct + '%';

	// ── DPS & COMBAT PERFORMANCE ENGINE ──
	var dpsAps = speed / 100; // e.g. 2800 speed = 28 attacks/sec

	// Primary damage spread
	var minD = 0, maxD = 0, excD = 0;
	if (c === 'sm') {
		minD = objDmg.wmindmg || 0;
		maxD = objDmg.wmaxdmg || 0;
		excD = objDmg.wexcdmg || 0;
	} else if (c === 'dl') {
		minD = objDmg.fbmindmg || objDmg.pmindmg || 0;
		maxD = objDmg.fbmaxdmg || objDmg.pmaxdmg || 0;
		excD = objDmg.fbexcdmg || objDmg.pexcdmg || 0;
	} else {
		minD = objDmg.pmindmg || 0;
		maxD = objDmg.pmaxdmg || 0;
		excD = objDmg.pexcdmg || 0;
	}

	// Critical Rate (Sorte): each luck piece gives 5%
	var luckPieces = $('iSSorte') ? +$('iSSorte').value : 0;
	var critRate = Math.min(1.0, luckPieces * 0.05);

	// Excellent Rate (Exc 10%): count wp1, wp2, pendant
	var wp1Exc = ($('iSCWpExc') && $('iSCWpExc').checked) || ($('iSCStaffExc') && $('iSCStaffExc').checked);
	var wp2Exc = $('iSCWp2Exc') && $('iSCWp2Exc').checked;
	var penExc = $('iSCPenExc') && $('iSCPenExc').checked;
	var excCount = (wp1Exc ? 1 : 0) + (wp2Exc ? 1 : 0) + (penExc ? 1 : 0);
	var excRate = Math.min(1.0, excCount * 0.10);

	// Hit damage calculation:
	// Normal: average of min~max spread
	var normD = (minD + maxD) / 2;
	// Critical: rolls the maximum damage on min~max spread
	var critD = maxD;

	var avgHitDmg = (excRate * excD) + ((1 - excRate) * (critRate * critD + (1 - critRate) * normD));
	var totalDps = Math.round(avgHitDmg * dpsAps);

	var elDpsTotal = $('oDpsTotal');
	if (elDpsTotal) elDpsTotal.textContent = totalDps.toLocaleString('pt-BR');

	var elDpsAps = $('oDpsAps');
	if (elDpsAps) elDpsAps.textContent = dpsAps.toFixed(1) + '/s';

	var elDpsAvgHit = $('oDpsAvgHit');
	if (elDpsAvgHit) elDpsAvgHit.textContent = Math.round(avgHitDmg).toLocaleString('pt-BR');

	var elDpsCritRate = $('oDpsCritRate');
	if (elDpsCritRate) elDpsCritRate.textContent = Math.round(critRate * 100) + '%';

	var elDpsExcRate = $('oDpsExcRate');
	if (elDpsExcRate) elDpsExcRate.textContent = Math.round(excRate * 100) + '%';

	if (c === 'me'){
		$('oBuffRed').value   = red;
		$('oBuffGreen').value = green;
		$('oBuffBlue').value  = blue;
	}
	bugcheck(c, {mp:mp, speed:speed}, prefix);

	// Debounced auto-save to localStorage
	if (window._saveBuildsTimeout) clearTimeout(window._saveBuildsTimeout);
	window._saveBuildsTimeout = setTimeout(function() {
		saveBuilds();
	}, 300);
}

function toggleMobileMenu() {
	var navGroup = document.getElementById('headerNavGroup');
	var btn = document.getElementById('btnHamburger');
	if (!navGroup) return;
	var isOpen = navGroup.classList.toggle('is-open');
	if (btn) btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

function closeMobileMenu() {
	var navGroup = document.getElementById('headerNavGroup');
	if (navGroup && navGroup.classList.contains('is-open')) {
		navGroup.classList.remove('is-open');
	}
}

function syncTabNav() {
	closeMobileMenu();
	var nav = document.getElementById('tabNav');
	if (!nav) return;
	var currentHash = window.location.hash || '';
	var links = nav.getElementsByTagName('a');
	for (var i = 0; i < links.length; i++) {
		var a = links[i];
		if (currentHash && a.getAttribute('href') === currentHash) {
			a.classList.add('active');
		} else {
			a.classList.remove('active');
		}
	}
}

window.addEventListener('hashchange', syncTabNav);

document.addEventListener('DOMContentLoaded', function() {
	initProviderSession();
	syncTabNav();
});

document.addEventListener('visibilitychange', function() {
	if (document.visibilityState === 'hidden') {
		saveBuilds();
	}
});

window.addEventListener('beforeunload', function() {
	saveBuilds();
});

var $ = function( id ) { return document.getElementById( id ); };

function sanitycheck(prefix){
	var $ = function( id ) { return document.getElementById( prefix + id ); };
	var flag = true;

	var checks = [
		['iStr',    0, 32500],
		['iAgi',    0, 32500],
		['iVit',    0, 32500],
		['iEne',    0, 32500],
		['iLevel',  1,   400],
		['iResets', 0,   500],
	];
	checks.forEach(function(ck) {
		var el = $(ck[0]);
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

function addTab(){
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

	var op = $('classes').options[$('classes').selectedIndex];
	var classMap = {1:'bk', 2:'sm', 3:'me', 4:'mg', 5:'dl'};
	var cls = classMap[+op.value];
	if (!cls) { alert('Classe não implementada'); tabs.removeChild(newTab); return; }
	$(newTabID).classList.add(cls);

	// Prefix all IDs inside the new tab (divs first, then inputs/selects)
	['div','input','select'].forEach(function(tag){
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
	['input','select','strong','span'].forEach(function(tag){
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
		dl: {iStr:26, iAgi:20, iVit:20, iEne:15},
	};
	var stats = startStats[cls];
	Object.keys(stats).forEach(function(id) {
		var el = document.getElementById(newTabID + '_' + id);
		if (el) el.value = stats[id];
	});

	// Add tab nav link
	var nav = $('tabNav');
	var a = document.createElement('a');
	a.href = '#' + newTabID;
	a.className = 'tab-link-' + cls;
	var classNames = {bk:'BK', sm:'SM', me:'ME', mg:'MG', dl:'DL'};
	a.textContent = classNames[cls] + ' ' + (existingSections + 1);
	nav.appendChild(a);

	window.location.href = '#' + newTabID;
	syncTabNav();

	// Initial calculation for tab
	var initEl = document.getElementById(newTabID + '_iStr');
	if (initEl) refresh({target: initEl});
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
		objAsa.Tabsasa = 1;
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

	for (var i = 0; i < pdeze; i++) {
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
	objDmg.wmindmg += objOpt.dmgbuff;
	objDmg.wmindmg *= (1+objOpt.iatasa) * (1+(objOpt.imp*0.3));
	objDmg.wmindmg |= 0;

	objDmg.wmaxdmg = (ene / 4) * (1+(objOpt.pen*0.02)) * (1+(objOpt.wp*0.02)) * (1+objOpt.stfp);
	objDmg.wmaxdmg += objOpt.dmgbuff;
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

	objDmg.pmindmg += objOpt.wpmin;
	objDmg.pmindmg *= (1+(objOpt.pen*0.02)) * (1+(objOpt.wp*0.02));
	objDmg.pmindmg += objOpt.dmgbuff;
	objDmg.pmindmg *= (1+objOpt.iatasa) * (1+(objOpt.imp*0.3));

	objDmg.pmaxdmg += objOpt.wpmax;
	objDmg.pmaxdmg *= (1+(objOpt.pen*0.02)) * (1+(objOpt.wp*0.02));
	objDmg.pmaxdmg += objOpt.dmgbuff;
	objDmg.pmaxdmg *= (1+objOpt.iatasa) * (1+(objOpt.imp*0.3));

	if(c == 'bk'){
		objDmg.cbdmg += objOpt.wpmax;
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

	var str   = +$('iStr').value;
	var agi   = +$('iAgi').value;
	var vit   = +$('iVit').value;
	var ene   = +$('iEne').value;
	var cmd = 0;
	if (c === 'dl') {
		cmd = reset * 130;
		var cmdEl = $('iCmd');
		if (cmdEl) cmdEl.value = cmd;
	}
	var objAttr = {str:str, agi:agi, vit:vit, ene:ene, cmd:cmd};

	var lvl     = +$('iLevel').value;
	var reset   = +$('iResets').value;
	var vip     = +$('iSCVip').checked;
	var quest3  = ($('iSCQ3a').checked ? 20 : 0)
	            + ($('iSCQ3b').checked ? 20 : 0)
	            + ($('iSCQ3c').checked ? 30 : 0);
	var pvida   = +$('iSVida').value;
	var pdimi   = +$('iSDiminui').value;
	var pddi    = +$('iSDDI').value;
	var pdeze   = +$('iSDeze').value;
	var ppvm    = +$('iSPvm').value;
	var bdef    = +$('iSSet').options[$('iSSet').selectedIndex].value;
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
		var buffSel = $('iSTBuff');
		switch(buffSel ? +buffSel.options[buffSel.selectedIndex].value : 0){
			case 1:
				dmgbuff = ((+$('iEne').value / 7) + 3) | 0;
				defbuff = ((+$('iEne').value / 8) + 2) | 0;
				break;
			case 2:
				dmgbuff = ((32500 / 7) + 3) | 0;
				defbuff = ((32500 / 8) + 2) | 0;
				break;
		}
	} else {
		var meEl = $('iSCME');
		if (meEl && +meEl.checked) {
			dmgbuff = ((32500 / 7) + 3) | 0;
			defbuff = ((32500 / 8) + 2) | 0;
		}
	}

	var red   = ((ene/7)+3) | 0;
	var green = ((ene/8)+2) | 0;
	var blue  = ((ene/5)+5) | 0;

	var pontos  = calcPontos(c, reset, vip, lvl, str, agi, vit, ene, quest3);
	var objAsa  = {iatasa:0, Tiatasa:0, idfasa:0, Tidfasa:0, absasa:0, Tabsasa:0, lasa:lasa, tasa:tasa};
	var speed   = calcSpeed(c, agi);
	speed += calcAsa(objAsa);

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
	var objOpt  = {pen:addpendant, wp:addwp, stfp:staff, imp:imp, iatasa:objAsa.iatasa, dmgbuff:dmgbuff, wpmin:wpmin, wpmax:wpmax, reset:reset};
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
	if (c === 'me'){
		$('oBuffRed').value   = red;
		$('oBuffGreen').value = green;
		$('oBuffBlue').value  = blue;
	}
	bugcheck(c, {mp:mp, speed:speed}, prefix);
}

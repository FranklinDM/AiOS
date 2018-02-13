
/*
	Initialisierung
		=> Aufruf durch onload im <prefwindow>
*/
function aios_initPrefs() {
	// speziellen Tab oeffnen, wenn einer als Argument uebergeben wurde (aus den Standard-Optionen heraus)
	if(window.arguments) {
		if(window.arguments[0] == "dwn") {
			// Panels-Radio-Button aktivieren
			var clickEvent = document.createEvent("MouseEvent");
			clickEvent.initEvent("command", false, true);

			var radiogroup = document.getAnonymousElementByAttribute(document.getElementById('aiosPreferences'), "anonid", "selector");
			radiogroup.childNodes[1].dispatchEvent(clickEvent);

			// Download-Tab aktivieren
			var tabbox = document.getElementById('aiosTabboxPanels');
			if(tabbox.childNodes[0].tagName == "tabs") tabbox.childNodes[0].selectedIndex = 1;
			if(tabbox.childNodes[1].tagName == "tabs") tabbox.childNodes[1].selectedIndex = 1;
		}
	}

	// Apply-Button deaktivieren
	aios_disableApplyButton(true);

	// Settings-Button
	if(document.documentElement.getButton('extra2')) {
		var extra2 = document.documentElement.getButton('extra2');
		extra2.setAttribute('id', 'aios-settings-button');
		extra2.setAttribute('popup', 'aios-settings-popup');
		extra2.setAttribute('dir', 'reverse');
	}

	// abhaengige Elemente aktivieren oder deaktivieren
	aios_checkDependent();

	// Advanced Mode aktivieren/deaktivieren
	aios_advancedMode();

	// Masseinheiten zur Sidebarbreite auf Anderungen ueberwachen
	document.getElementById('obj-minWidthUnit').addEventListener("ValueChange", function(e) {
		aios_changeWidthUnit('min');
	}, false);

	document.getElementById('obj-defWidthUnit').addEventListener("ValueChange", function(e) {
		aios_changeWidthUnit('def');
	}, false);

	document.getElementById('obj-maxWidthUnit').addEventListener("ValueChange", function(e) {
		aios_changeWidthUnit('max');
	}, false);

	// Prefs merken, wird fuer den Apply-Button benoetigt => aios_checkApply()
	aios_rememberOldPrefs();

	// alte Prefs loeschen
	aios_deleteOldPrefs();
}


function aios_initPane(mode) {
	AiOS_HELPER.rememberAppInfo( document.getElementById("aiosPreferences") );

	// zuletzt gewaehlten Tab wieder selektieren
	var tabbox = null;
	switch(mode) {
		case "general":
			tabbox = document.getElementById('aiosTabboxGeneral');
			break;
		case "panels":
			tabbox = document.getElementById('aiosTabboxPanels');
			break;
		case "menus":
			tabbox = document.getElementById('aiosTabboxMenus');
			break;
	}

	var seltab = tabbox.parentNode.getAttribute('seltab');
	if(tabbox.childNodes[0].tagName == "tabs") tabbox.childNodes[0].selectedIndex = seltab;
	if(tabbox.childNodes[1].tagName == "tabs") tabbox.childNodes[1].selectedIndex = seltab;

	// Liste der zur Verfuegung stehenden Sidebars erstellen
	if(mode == "general") aios_genSidebarList();
}


/*
	Standardeinstellungen zuruecksetzen
		=> Aufruf durch <menuitem> in prefs.xul
*/
function aios_defaultSettings() {
	var strings = document.getElementById("aiosStrings");
	if(!confirm(strings.getString('prefs.confirm'))) return false;

	var count = {
		value : 0
	};
	var childList = AiOS_HELPER.prefBranchAiOS.getChildList("", count);

	for(var i = 0; i < count.value; i++) {
		if(AiOS_HELPER.prefBranchAiOS.prefHasUserValue(childList[i]) && childList[i] != "changelog") {
			AiOS_HELPER.prefBranchAiOS.clearUserPref(childList[i]);
		}
	}

	// GUI-Elemente zuruecksetzen
	aios_synchElements();

	// abhaengige Elemente aktivieren oder deaktivieren
	aios_checkDependent();

	return true;
}


/*
	Einstellungen in die Zwischenablage kopieren oder als Textdatei speichern
		=> Aufruf durch <menuitem> in prefs.xul
*/
function aios_exportSettings(aMode) {
	var strings = document.getElementById("aiosStrings");

	var now = new Date();
	var sDate = aios_extendInt(now.getMonth() + 1) + "/" + aios_extendInt(now.getDate()) + "/" + now.getFullYear();
	var sTtime = aios_extendInt(now.getHours()) + ":" + aios_extendInt(now.getMinutes()) + ":" + aios_extendInt(now.getSeconds());
	var sGMT = now.toGMTString();

	var aiosExport = [];
	aiosExport[0] = "-----------------------------------------------------------------------\n";
	aiosExport[0]+= "                  The Good 'ol Sidebar - Settings\n";
	aiosExport[0]+= "-----------------------------------------------------------------------\n";
	aiosExport[0]+= "          " + sDate + ", " + sTtime + " (" + sGMT + ")\n";
	aiosExport[0]+= "          TGS " + AiOS_HELPER.prefBranchAiOS.getCharPref('changelog') + ", " + AiOS_HELPER.appInfo.name + " " + AiOS_HELPER.appInfo.version + ", " + AiOS_HELPER.os + ", " + AiOS_HELPER.prefBranch.getCharPref('general.skins.selectedSkin') + "\n";
	aiosExport[0]+= "-----------------------------------------------------------------------";

	var count = {
		value : 0
	};
	var childList = AiOS_HELPER.prefBranchAiOS.getChildList("", count);

	for(var i = 0; i < count.value; i++) {
		try {
			switch(AiOS_HELPER.prefBranchAiOS.getPrefType(childList[i])) {
				case    AiOS_HELPER.prefInterface.PREF_BOOL:
					aiosExport[i+1] = childList[i] + '=' + AiOS_HELPER.prefBranchAiOS.getBoolPref(childList[i]);
					break;

				case    AiOS_HELPER.prefInterface.PREF_INT:
					aiosExport[i+1] = childList[i] + '=' + AiOS_HELPER.prefBranchAiOS.getIntPref(childList[i]);
					break;

				case    AiOS_HELPER.prefInterface.PREF_STRING:
					aiosExport[i+1] = childList[i] + '=' + AiOS_HELPER.prefBranchAiOS.getCharPref(childList[i]);
					break;
			}
		}
		catch(e) { }
	}

	// Einstellungen alphabetisch sortieren
	aiosExport.sort();

	// String erzeugen
	var aiosExportString = "";
	for(var i = 0; i < aiosExport.length; i++) {
		aiosExportString+= aiosExport[i] + "\n";
	}

	// String in die Zwischenablage kopieren
	if(aMode == "copy") {
		var gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Components.interfaces.nsIClipboardHelper);
		gClipboardHelper.copyString(aiosExportString);

		alert(strings.getString('prefs.copy'));
	}
	// String in einer Textdatei speichern (thanks to adblock & Tab Mix Plus :-))
	else if(aMode == "save") {
		var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(Components.interfaces.nsIFilePicker);
		var stream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);

		fp.init(window, strings.getString('prefs.save'), fp.modeSave);
		fp.defaultExtension = 'txt';
		fp.defaultString = 'TGS-Settings';
		fp.appendFilters(fp.filterText);

		if(fp.show() != fp.returnCancel) {

			if(fp.file.exists()) fp.file.remove(true);
			fp.file.create(fp.file.NORMAL_FILE_TYPE, 0o666);
			stream.init(fp.file, 0x02, 0x200, null);

			stream.write(aiosExportString, aiosExportString.length);
			stream.close();
		}
	}
}


/*
	Einstellungen aus Textdatei importieren
		=> Aufruf durch <menuitem> in prefs.xul
*/
function aios_importSettings() {
	var strings = document.getElementById("aiosStrings");

	var pattern = aios_loadFromFile();

	if(!pattern) return false;

	var i;
	var aiosImport = [];
	var appendFilters = null;
	let isMatch = false;

	// Check if it matches TGS/AiOS pattern
	if (pattern[1].indexOf("The Good 'ol Sidebar - Settings") >= 0) isMatch = true;
	if (pattern[1].indexOf("All-in-One Sidebar - Settings") >= 0 || pattern[1].indexOf("All-In-One Sidebar - Settings") >= 0) isMatch = true;

	if (!isMatch) {
		alert(strings.getString('prefs.invalid'));
		return false;
	}

	if(!confirm(strings.getString('prefs.import'))) return false;

	for(i = 6; i < pattern.length; i++) {
		var index = pattern[i].indexOf("=");

		if(index > 0) {
			aiosImport[i] = [];
			aiosImport[i].push(pattern[i].substring(0, index));
			aiosImport[i].push(pattern[i].substring(index + 1, pattern[i].length));
		}
	}

	if(isMatch) {
		for(i = 6; i < aiosImport.length; i++) {
			try {
				switch(AiOS_HELPER.prefBranchAiOS.getPrefType(aiosImport[i][0])) {
					case    AiOS_HELPER.prefInterface.PREF_BOOL:
						AiOS_HELPER.prefBranchAiOS.setBoolPref(aiosImport[i][0],/true/i.test(aiosImport[i][1]));
						break;

					case    AiOS_HELPER.prefInterface.PREF_INT:
						AiOS_HELPER.prefBranchAiOS.setIntPref(aiosImport[i][0], aiosImport[i][1]);
						break;

					case    AiOS_HELPER.prefInterface.PREF_STRING:
						var pref = aiosImport[i][1];
						if(pref.indexOf('"') == 0) // in prev version we use " " for string
							pref = pref.substring(1,pref.length - 1);
						AiOS_HELPER.prefBranchAiOS.setCharPref(aiosImport[i][0], pref);
						break;
				}
			}
			catch(e) { }
		}

		// GUI-Elemente zuruecksetzen
		aios_synchElements();

		// abhaengige Elemente aktivieren oder deaktivieren
		aios_checkDependent();

		return true;
	}

	alert(strings.getString('prefs.failed'));
	return false;
}


/*
	Textdatei in ein Array einlesen (thanks to adblock & Tab Mix Plus :-))
		=> Aufruf durch aios_importSettings()
*/
function aios_loadFromFile() {
	var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(Components.interfaces.nsIFilePicker);
	var stream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
	var streamIO = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance(Components.interfaces.nsIScriptableInputStream);

	var strings = document.getElementById("aiosStrings");

	fp.init(window, strings.getString('prefs.open'), fp.modeOpen);
	fp.defaultExtension = 'txt';
	fp.appendFilters(fp.filterText);

	if(fp.show() != fp.returnCancel) {

		stream.init(fp.file, 0x01, 0o444, null);
		streamIO.init(stream);

		var input = streamIO.read(stream.available());
		streamIO.close();
		stream.close();

		var linebreak = input.match(/(((\n+)|(\r+))+)/m)[1]; // first: whole match -- second: backref-1 -- etc..
		return input.split(linebreak);
	}

	return null;
}


/*
	auf abhaengige Elemente pruefen
		=> Aufruf durch aios_initPrefs(), aios_defaultPrefs() und aios_importSettings()
*/
function aios_checkDependent() {
	var childObserver = document.getElementsByAttribute('oncommand', 'aios_checkboxObserver(this);');

	for(var i = 0; i < childObserver.length; i++) {
		aios_checkboxObserver(childObserver[i]);
	}
}


/*
	abhaengige Checkboxen aktivieren oder deaktivieren
		Aufruf durch die Eltern-Checkbox und aios_checkDependent()
*/
function aios_checkboxObserver(which) {
	var observe = which.getAttribute('aiosChilds');
	var allChilds = observe.split(",");

	for(var i = 0; i < allChilds.length; i++) {
		var childPref = allChilds[i].replace(/ /, "");

		var child = document.getElementsByAttribute('preference', childPref);
		if(child.length == 0) child = document.getElementsByAttribute('id', childPref);

		//if(child[0]) child[0].setAttribute('disabled', !aios_getBoolean(which, 'checked') || aios_getBoolean(which, 'disabled'));

		if(child[0]) {
			if(!aios_getBoolean(which, 'checked') || aios_getBoolean(which, 'disabled')) child[0].setAttribute('disabled', true);
			else child[0].removeAttribute('disabled');
		}
	}
}


/*
	Advanced-Mode aktivieren/deaktivieren und Elemente und ein-/ausblenden
		=> Aufruf durch aios_initPrefs() und das <menuitem> des Setting buttons
*/
function aios_advancedMode(trigger) {

	/*if(trigger) {
		var heightBefore = aios_getSizeBoxHeight();
	}*/

	var advanced = aios_getBoolean('aios-advanced', 'checked');

	// Advanced-Elemente durchlaufen und ein-/ausblenden
	var advElems = document.getElementsByAttribute('aiosAdvanced', 'true');
	for(var i = 0; i < advElems.length; i++) {

		// wenn das Element ein Tab-Container ist
		if(advElems[i].localName == "tabs") {

			var tabChild = advElems[i].selectedIndex;
			var tabChildClass = advElems[i].childNodes[tabChild].getAttribute('class');

			// vorherigen Tab aktivieren, wenn ein advanced Tab gewaehlt ist und der Advanced Mode deaktiviert wird
			if(!advanced && tabChildClass == "aiosAdvanced") {
				advElems[i].parentNode.childNodes[0].selectedIndex = advElems[i].selectedIndex - 1;
				advElems[i].parentNode.childNodes[1].selectedIndex = advElems[i].selectedIndex - 1;

				// noch einmal vorherigen Tab aktivieren, wenn der neue Tab auch ein advanced Tab ist
				tabChild = advElems[i].selectedIndex;
				tabChildClass = advElems[i].childNodes[tabChild].getAttribute('class');
				if(tabChildClass == "aiosAdvanced") {
					advElems[i].parentNode.childNodes[0].selectedIndex = advElems[i].selectedIndex - 1;
					advElems[i].parentNode.childNodes[1].selectedIndex = advElems[i].selectedIndex - 1;
				}

				// selektierten Tab merken (in prefpane)
				advElems[i].parentNode.parentNode.setAttribute('seltab', advElems[i].selectedIndex);
			}

			// welcher Tab-Container ist sichtbar?
			advElems[i].parentNode.childNodes[0].setAttribute('hidden', advanced);
			advElems[i].parentNode.childNodes[1].setAttribute('hidden', !advanced);
			if(advanced) advElems[i].parentNode.childNodes[1].style.visibility = 'visible';
		}
		// andere Elemente
		else {
			advElems[i].setAttribute('hidden', !advanced);
			if(advanced) advElems[i].style.visibility = 'visible';
		}
	}

	// variierende Style-Angaben im normalen und erweiterten Modus
	var advStyleElems = document.getElementsByAttribute('aiosAdvancedStyle', 'true');
	for(var s = 0; s < advStyleElems.length; s++) {

		var sStyle = advStyleElems[s].getAttribute('aiosNorStyle');
		if(advanced) sStyle = advStyleElems[s].getAttribute('aiosAdvStyle');

		advStyleElems[s].setAttribute('style', sStyle);
	}

	/*// Fenster vergroessern/verkleinern bei Mode-Umschaltung
	if(trigger) {
		var heightAfter = aios_getSizeBoxHeight();

		//alert("heightBefore: " + heightBefore + " heightAfter: " + heightAfter);

		var diff = heightBefore - heightAfter;
		if(heightAfter > heightBefore) diff = diff - 10;
		window.resizeTo(window.outerWidth, window.outerHeight - diff);
	}*/

	window.sizeToContent();
}


/*
	Hoehe der Boxen zum Aktivieren/Deaktivieren des Advanced-Modes ermitteln
		=> Aufruf durch aios_advancedMode()
*/
function aios_getSizeBoxHeight() {
	var theHeight = 0;
	var sizeBoxen = document.getElementsByAttribute('class', 'aiosSizeBox');

	for(var i = 0; i < sizeBoxen.length; i++) {
		var h = sizeBoxen[i].boxObject.height;

		if(sizeBoxen[i].getAttribute('restart')) h = h + 30;

		if(h > theHeight) theHeight = h;
	}

	return theHeight;
}


/*
	Zahlen mit fuehrender Null zurueckgeben
		=> Aufruf durch aios_exportSettings()
*/
function aios_extendInt(aInput) {
	if(aInput < 10) return "0" + aInput.toString();
	else return aInput;
}


/*
	synchronisiert jeweils die beiden Tab-Container, die abwechselnd angezeigt werden (normal und advanced)
		=> Aufruf durch die beiden Tab-Container (General und Misc)
*/
function aios_synchTabs(which) {
	var tabs0 = which.parentNode.childNodes[0];
	var tabs1 = which.parentNode.childNodes[1];

	if(tabs0.tagName == "tabs") tabs0.selectedIndex = which.selectedIndex;
	if(tabs1.tagName == "tabs") tabs1.selectedIndex = which.selectedIndex;

	// selektierten Tab merken (in prefpane)
	which.parentNode.parentNode.setAttribute('seltab', which.selectedIndex);
}


/*
	GUI-Elemente zuruecksetzen
		=> Aufruf durch aios_defaultSettings() und aios_importSettings()
*/
function aios_synchElements() {
	var val;
	var prefs = document.getElementsByTagName('preference');

	for(var i = 0; i < prefs.length; i++) {

		var prefID = prefs[i].getAttribute('id');
		var prefType = prefs[i].getAttribute('type');
		var prefName = prefs[i].getAttribute('name').replace(/extensions.aios./, "");

		var elem = document.getElementsByAttribute('preference', prefID)[0];

		switch(prefType) {
			case "int":
				val = AiOS_HELPER.prefBranchAiOS.getIntPref(prefName);
				break;
			case "string":
				val = AiOS_HELPER.prefBranchAiOS.getCharPref(prefName);
				break;
			case "bool":
				val = AiOS_HELPER.prefBranchAiOS.getBoolPref(prefName);
				break;
		}

		if(elem) {
			switch(elem.tagName) {
				case "checkbox":
					elem.checked = val;
					break;
				case "textbox":
					elem.value = val;
					break;
				case "menulist":
					elem.value = val;
					break;
			}
		}
	}
}


/*
	Apply settings of some options directly
		=> Called by button "accept" and aios_applyPrefs()
*/

function aios_savePrefs() {
	aios_setConfSidebarWidth();
	
	var enumerator = AiOS_HELPER.windowMediator.getEnumerator('navigator:browser');
	while (enumerator.hasMoreElements()) {
		var win = enumerator.getNext();

		// Set tooltip for PanelTab button
		if (win.document.getElementById('paneltab-button')) {
			var ptReverse = AiOS_HELPER.prefBranchAiOS.getBoolPref("paneltab.reverse");
			var ptTooltip = (ptReverse) ? 'paneltab-tooltip-reverse' : 'paneltab-tooltip';
			win.document.getElementById('paneltab-button').setAttribute('tooltip', ptTooltip);
		}

		if (win.aios_setTargets) win.aios_setTargets();

		win.aios_checkThinSwitch();
		if (win.aios_checkInvTrg) 		win.aios_checkInvTrg();
		if (win.aios_setSidebarOrient)	win.aios_setSidebarOrient();
		if (win.aios_initAutohide)		win.aios_initAutohide();
		if (win.aios_initInvTrg)		win.aios_initInvTrg();
	}
	
	// Bugfix...
	// otherwise the context menu of the extension is displayed,
	// when the options have been right-clicked and the Apply button is clicked
	if (opener.document.getElementById('extensionContextMenu'))
		opener.document.getElementById('extensionContextMenu').hidePopup();
}


/*
	Einstellungen uebernehmen ohne den Dialog zu schliessen
		=> Aufruf durch button "extra1"
*/
function aios_applyPrefs() {
	var pID, pType, pName, pValue;

	// Prefs direkt speichern
	var allPrefs = document.getElementsByTagName('preference');
	for(var i = 0; i < allPrefs.length; i++) {
		pID = allPrefs[i].getAttribute('id');
		pType = allPrefs[i].getAttribute('type');
		pName = allPrefs[i].getAttribute('name');
		pValue = allPrefs[i].value;

		switch(pType) {
			case "string":
				AiOS_HELPER.prefBranch.setCharPref(pName, pValue);
				break;
			case "bool":
				AiOS_HELPER.prefBranch.setBoolPref(pName, pValue);
				break;
			case "int":
				AiOS_HELPER.prefBranch.setIntPref(pName, pValue);
				break;
		}
	}

	// zusaetzliche Optionen
	aios_savePrefs();

	// Apply-Button deaktivieren
	aios_disableApplyButton(true);

	// Prefs merken, wird fuer den Apply-Button benoetigt => aios_checkApply()
	aios_rememberOldPrefs();

	// Prefs direkt in Datei speichern
	AiOS_HELPER.prefService.savePrefFile(null);
}


/*
	Apply-Button aktivieren/deaktivieren
		=> Aufruf durch aios_initPrefs(), aios_applyPrefs() und aios_checkApply()
*/
function aios_disableApplyButton(aDis) {

	if(document.documentElement.getButton('extra1')) {
		document.documentElement.getButton('extra1').setAttribute('disabled', aDis);
	}

	if(aDis) couldApply = "";
}


/*
	Prefs merken, bevor sie veraendert werden => wird fuer den Apply-Button benoetigt
		=> Aufruf durch aios_initPrefs() und aios_applyPrefs()
*/
function aios_rememberOldPrefs() {
	var allPrefs = document.getElementsByTagName('preference');
	for(var i = 0; i < allPrefs.length; i++) {
		allPrefs[i].setAttribute('oldValue', allPrefs[i].value);

		// Change-Listener hinzufuegen
		if(!allPrefs[i].getAttribute('data-changed')) {

			allPrefs[i].addEventListener("change", function() {
				aios_checkApply(this);
			});

			allPrefs[i].setAttribute('data-changed', true)

		}
	}
}


/*
	Ueberpruefung auf zu speichernde Optionen => Apply-Button deaktivieren/aktivieren
		Aufruf durch alle Checkboxen, Selcts, Textboxen usw durch onchange-Handler - gesetzt durch aios_rememberOldPrefs()
*/
var couldApply = "";
function aios_checkApply(aPref) {
	if(typeof aPref == "object") {

		var oldPref, newPref;
		var pID = aPref.id;

		// gemerkte und neue Einstellungen in richtiges Format konvertieren
		switch(aPref.getAttribute('type')) {
			case "string":
				oldPref = aPref.getAttribute('oldValue');
				newPref = aPref.value;
				break;

			case "bool":
				oldPref = aios_getBoolean(aPref, 'oldValue');
				newPref = aPref.value;
				break;

			case "int":
				oldPref = aPref.getAttribute('oldValue') * 1;
				newPref = aPref.value * 1;
				break;
		}

		// wenn die Aenderung der alten Einstellung entspricht,...
		if(oldPref === newPref) {

			// enspr. String loeschen
			if(couldApply.indexOf(pID) >= 0) {
				var t1 = couldApply.substr(0, couldApply.indexOf(pID));
				if(t1.indexOf(",") == 0) t1 = t1.substr(1, t1.length);                  // Komma am Anfang loeschen
				if(t1.lastIndexOf(",") == t1.length - 1) t1 = t1.substr(0, t1.length - 1);      // Komma am Ende loeschen

				var t2 = couldApply.substr(couldApply.indexOf(pID) + pID.length, couldApply.length);
				if(t2.indexOf(",") == 0) t2 = t2.substr(1, t2.length);                  // Komma am Anfang loeschen
				if(t2.lastIndexOf(",") == t2.length - 1) t2 = t2.substr(0, t2.length - 1);      // Komma am Ende loeschen

				if(t2.length > 0) t1+= ",";                                                     // mit Komma verbinden
				couldApply = t1 + t2;
			}
		//alert("keine Aenderung: " + couldApply);
		}
		// wenn die Aenderung _nicht_ der alten Einstellung entspricht,...
		else {
			// enspr. String erweitern
			if(couldApply.length > 0) couldApply+= ",";                                         // mit Komma verbinden
			couldApply+= pID;
		//alert("Aenderung: " + couldApply);
		}

		// Apply-Button deaktivieren/aktivieren
		if(couldApply.length == 0) aios_disableApplyButton(true);
		else aios_disableApplyButton(false);
	}
}


/*
	Remove old preferences due to version changes and move preference values when needed
		=> Called by aios_initPrefs()
*/
function aios_deleteOldPrefs() {
	// List of preferences that might need to be migrated
	var mgPrefs = {
		delay: ['gen.switch.delay', 'gen.switch.delayshow', 'gen.switch.delayhide']
	};
	// Migrate prefs to new values
	for (var obj in mgPrefs) {
		if (AiOS_HELPER.prefBranchAiOS.prefHasUserValue(mgPrefs[obj][0])) {
			for (let i = 1; i < mgPrefs[obj].length; i++) {
				switch (AiOS_HELPER.prefBranchAiOS.getPrefType(mgPrefs[obj][0])) {
					case AiOS_HELPER.prefInterface.PREF_BOOL:
						AiOS_HELPER.prefBranchAiOS.setBoolPref(mgPrefs[obj][i], AiOS_HELPER.prefBranchAiOS.getBoolPref(mgPrefs[obj][0]));
						break;
					case AiOS_HELPER.prefInterface.PREF_INT:
						AiOS_HELPER.prefBranchAiOS.setIntPref(mgPrefs[obj][i], AiOS_HELPER.prefBranchAiOS.getIntPref(mgPrefs[obj][0]));
						break;
					case AiOS_HELPER.prefInterface.PREF_STRING:
						AiOS_HELPER.prefBranchAiOS.setCharPref(mgPrefs[obj][i], AiOS_HELPER.prefBranchAiOS.getCharPref(mgPrefs[obj][0]));
						break;
				}
			}
		}
	}
	// List of old preferences
	var oldPrefs = ['em.layout', 'em.layoutall', 'em.slim', 'em.colors', 'dm.slim',
					'dm.colors', 'co.slim', 'co.colors', 'bm.layout', 'bm.layoutall',
					'hi.layout', 'hi.layoutall', 'dm.observer', 'gen.switch.delay'];
	// Remove preferences defined in the oldPrefs array
	for (let i = 0; i < oldPrefs.length; i++) {
	    if (AiOS_HELPER.prefBranchAiOS.prefHasUserValue(oldPrefs[i])) {
		    AiOS_HELPER.prefBranchAiOS.clearUserPref(oldPrefs[i]);
	    }
	}
}

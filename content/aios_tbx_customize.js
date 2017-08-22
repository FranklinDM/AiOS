
// fuer CSS-Zwecke speichern
AiOS_HELPER.rememberAppInfo( document.getElementById('CustomizeToolbarWindow') );


/**
 *  Breite der vertikalen Toolbar bei jeder Aenderung der Toolbox (Drag 'n Drop) neu definieren
 **/
var fx_toolboxChanged = toolboxChanged;
toolboxChanged = function() {
    fx_toolboxChanged();
    AiOS_HELPER.mostRecentWindow.aios_adjustToolboxWidth();
};


/**
 *  Positionierung des Dialogs unter Mac OS X verhindern
 **/
if(AiOS_HELPER.os != "Darwin") repositionDialog = function(aWindow) {
    // Always use persisted dimensions and position!
    return;
}


/**
 * Restore the default set of buttons to fixed toolbars,
 * remove all custom toolbars, and rebuild the palette.
 */
/* Original: restoreDefaultSet() => taken from TotalToolbar 1.8 by alta88 */
restoreDefaultSet = function () {
    // Unwrap the items on the toolbar.
    unwrapToolbarItems();

    // Remove all of the customized toolbars.
    forEachCustomizableToolbar(function (toolbar) {
        let customIndex = toolbar.getAttribute("customindex");
        if (customIndex) {
            // Clean up any customizations from the root doc.
            AiOS_HELPER.mostRecentWindow.handleOptions("remove", toolbar, gToolbox);

            // Reset externalToolbars list.
            let newExternalToolbars = [];
            gToolbox.externalToolbars.forEach(function (extToolbar, index) {
                if (extToolbar.id != toolbar.id)
                    newExternalToolbars.push(extToolbar);
            });
            gToolbox.externalToolbars = newExternalToolbars;

            let toolbox = toolbar.parentNode;
            toolbox.toolbarset.removeAttribute("toolbar"+customIndex);
            gToolboxDocument.persist(toolbox.toolbarset.id, "toolbar"+customIndex);
            toolbar.currentSet = "__empty";
            toolbox.removeChild(toolbar);
            --toolbox.customToolbarCount;
        }
    });

    // mod by exxile: Werte fuer AiOS-Toolbar zuruecksetzen => bevor defaultset zurueckgesetzt wird => sonst fehler (zu viele separators)
    AiOS_HELPER.mostRecentWindow.aios_setToolbarPos(1);
    AiOS_HELPER.mostRecentWindow.aios_toolbar.setAttribute('flexbuttons', 'false');

    // Restore the defaultset for fixed toolbars.
    forEachCustomizableToolbar(function (toolbar) {
        var defaultSet = toolbar.getAttribute("defaultset");
        if (defaultSet)
            toolbar.currentSet = defaultSet;

        // Remove any contextmenu options.
        AiOS_HELPER.mostRecentWindow.handleOptions("remove", toolbar, gToolbox);
    });

    // Restore the default icon size and mode.
    document.getElementById("smallicons").checked = (updateIconSize() == "small");
    document.getElementById("modelist").value = updateToolbarMode();

    // Now rebuild the palette.
    buildPalette();

    // Now re-wrap the items on the toolbar.
    wrapToolbarItems();

    toolboxChanged("reset");

    // mod by exxile: Iconsize der Sidebarheader-Toolbar zuruecksetzen => nachdem die globale Groesse zurueckgesetzt wurde
    AiOS_HELPER.mostRecentWindow.document.getElementById('aios-sbhtoolbar').setAttribute('iconsize', 'small');
}
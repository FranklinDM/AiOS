var AiOS_Compatibility = {};

(function () {
    // Registration
    var namespaces = [];

    this.ns = function (fn) {
        var ns = {};
        namespaces.push(fn, ns);
        return ns;
    };

    // Initialization
    this.initialize = function () {

        for (var i = 0; i < namespaces.length; i += 2) {
            var fn = namespaces[i];

            var ns = namespaces[i + 1];
            fn.apply(ns);
        }

        // Console2
        if (document.getElementById('viewConsole2Sidebar') || document.getElementById('console2-button')) {
            window.setTimeout(function () {
                AiOS_Compatibility.console2();
            }, 500);
        }

        // MinimizeToTray
        if (document.getElementById('extensions.mook.minimizetotray.traypopup')) {
            window.setTimeout(function () {
                AiOS_Compatibility.minimizeToTray();
            }, 500);
        }

        // MileWideBack
        // is executed in aios.js => aios_setSidebarOrient()

        // StumbleUpon
        if (document.getElementById('su_splitter_first')) {
            document.getElementById('su_splitter_first').style.display = "none";
        }

    };

    // Adjustments for MinimizeToTray
    // otherwise the download manager does not open when calling via the tray icon
    this.minimizeToTray = function () {
        var itemCmd,
        newCmd,
        mmttMenuItems = document.getElementById('extensions.mook.minimizetotray.traypopup').childNodes;

        for (var i = 0; i < mmttMenuItems.length; i++) {
            itemCmd = mmttMenuItems[i].getAttribute('oncommand');

            if (itemCmd.indexOf("toOpenWindowByType('Download:Manager'") >= 0) {
                mmttMenuItems[i].removeAttribute('oncommand');
                mmttMenuItems[i].addEventListener("command", function () {
                    AiOS_HELPER.mostRecentWindow.aiosIsWindow = true;

                    window.setTimeout(function () {
                        AiOS_HELPER.mostRecentWindow.aiosIsWindow = false;
                    }, 500);
                });
            }
        }
    };

    // Adjustments for Console2
    this.console2 = function () {
        var broadcaster,
        button = document.getElementById('console2-button');

        // Assign sidebar menu entry to Console2
        if (document.getElementById('console-mitem')) {
            document.getElementById('console-mitem').setAttribute('observes', 'viewConsole2Sidebar');
        }

        // Delete broadcaster > no choice in the prefs
        if (document.getElementById('viewConsoleSidebar')) {
            broadcaster = document.getElementById('viewConsoleSidebar');
            broadcaster.parentNode.removeChild(broadcaster);
        }

        // Console2 button
        if (button) {
            if (button.parentNode.tagName === "toolbarpaletteitem") {
                button.parentNode.parentNode.removeChild(button.parentNode);
            } else {
                button.parentNode.removeChild(button);
            }
        }
    };

    // Clean up
    this.shutdown = function () {
        window.removeEventListener("load", AiOS_Compatibility.initialize);
        window.removeEventListener("unload", AiOS_Compatibility.shutdown);
    };

    // Register handlers
    window.addEventListener("load", this.initialize);
    window.addEventListener("unload", this.shutdown);

}).apply(AiOS_Compatibility);

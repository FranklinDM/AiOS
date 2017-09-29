var AiOS_About = {};

(function() {

    // Aufruf durch 'onpaneload' in about_content.xul
    this.initialize = function() {

        Components.utils.import("resource://gre/modules/AddonManager.jsm");

        AddonManager.getAddonByID("tgsidebar@franklindm",
            function(addon) {

                document.getElementById("aboutHeader").setAttribute("title", addon.name);
                document.getElementById("aboutHeader").setAttribute("description", addon.version);

                document.getElementById("macTitle").setAttribute("value", addon.name);
                document.getElementById("macVersion").setAttribute("value", addon.version);

            }
        );

        AiOS_HELPER.rememberAppInfo( document.getElementById("aiosAbout") );

    };

}).apply(AiOS_About);

let simplyPinnedChrome =
{
    prefs : Components.classes["@mozilla.org/preferences-service;1"]
                            .getService(Components.interfaces.nsIPrefService)
                            .getBranch("extensions.simplypinned."),
    elementIds : new Array("nav-bar", "PersonalToolbar"),
    assocPrefNames : new Array("boolnav", "boolbookmarks"),

    /**
     * Sets the visibility of elements
     * @param Boolean show True shows the toolbars, false hides.
     *   of elements to be hidden/shown
     */
    setVisibility : function(show)
    {
        for(var i = 0; i < simplyPinnedChrome.elementIds.length; i++)
        {
            if(simplyPinnedChrome.prefs
                .getBoolPref(simplyPinnedChrome.assocPrefNames[i]))
            {
                document.getElementById(simplyPinnedChrome.elementIds[i])
                    .style.display = "inherit";
            }
            else
            {
                document.getElementById(simplyPinnedChrome.elementIds[i])
                    .style.display =
                        show ? "inherit" : "none";
            }
        }
    },
    
    init : function()
    {
        var container = gBrowser.tabContainer;
        
        //on tab selection change
        container.addEventListener("TabSelect",
            function(event)
            {
                simplyPinnedChrome.setVisibility(!event.target.pinned);
            },
            false);
        
        //on tab pin
        container.addEventListener("TabPinned",
            function(event)
            {
                if(event.target.selected)
                {
                    simplyPinnedChrome.setVisibility(false);
                }
            },
            false);
        
        //on tab unpin
        container.addEventListener("TabUnpinned",
            function(event)
            {
                if(event.target.selected)
                    simplyPinnedChrome.setVisibility(true);
            },
            false);
    }
}

window.addEventListener("load", simplyPinnedChrome.init, false);
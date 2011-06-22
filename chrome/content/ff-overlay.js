let simplyPinnedChrome =
{
    //TODO: make this not hardcoded -- or at least only hardcoded in one place
    //this is repeated in options.xul
    //at least, change these to CAPS_AND_UNDERSCORES to indicate constant
    defaultElemIds : new Array("nav-bar",
                             "PersonalToolbar",
                             "addon-bar"),
    neverHideElemIds : new Array("toolbar-menubar"),

    otherToolbarElems : new Array(),
    
    /**
     * Sets the visibility of elements
     * @param Boolean show True shows the toolbars, false hides.
     *   of elements to be hidden/shown
     */
    setVisibility : function(show)
    {
        //TODO: Perhaps this is a better way to do this
        //https://developer.mozilla.org/en/Hiding_browser_chrome
        
        prefs = Components.classes["@mozilla.org/preferences-service;1"]
                .getService(Components.interfaces.nsIPrefService)
                .getBranch("extensions.simplypinned.");
        
        //TODO: there is probably a way to make this code more efficient
        for(var i = 0; i < simplyPinnedChrome.defaultElemIds.length; i++)
        {
            if(prefs.getBoolPref("bool_" + simplyPinnedChrome.defaultElemIds[i]))
            {
                document.getElementById(simplyPinnedChrome.defaultElemIds[i])
                    .style.display = "inherit";
            }
            else
            {
                document.getElementById(simplyPinnedChrome.defaultElemIds[i])
                    .style.display =
                        show ? "inherit" : "none";
            }
        }
        
        if(prefs.getBoolPref("bool_otherToolbars"))
        {
            for(var i = 0; i < simplyPinnedChrome.otherToolbarElems.length; i++)
            {
                document.getElementById(simplyPinnedChrome.otherToolbarElems[i].id)
                    .style.display = "inherit";
            }
        }
        else
        {
            for(var i = 0; i < simplyPinnedChrome.otherToolbarElems.length; i++)
            {
                document.getElementById(simplyPinnedChrome.otherToolbarElems[i].id)
                    .style.display = show? "inherit" : "none";
            }
        }
    },
    
    /**
     *
     */
    init : function()
    {
        //POPULATING OTHER TOOLBARS
        for(var i = 0; i < document.getElementsByTagName("toolbar").length; i++)
        {
            var aToolbar = document.getElementsByTagName("toolbar")[i];
            
            var isNeverHideElem = false;
            for(var j = 0; j < simplyPinnedChrome.neverHideElemIds.length
                            && !isNeverHideElem ; j++)
            {
                isNeverHideElem =
                    (simplyPinnedChrome.neverHideElemIds[j] == aToolbar.id);
            }
            
            var isDefaultElem = false;
            for(var j = 0; j < simplyPinnedChrome.defaultElemIds.length
                            && !isDefaultElem; j++)
            {
                isDefaultElem =
                    (simplyPinnedChrome.defaultElemIds[j] == aToolbar.id)
            }
            
            //only add elements that have toolbarnames,
            //are not part of the never to be hidden array,
            //and that aren't already listed (defaultElements)
            if(aToolbar.getAttribute("toolbarname") != ""
               && !isNeverHideElem && !isDefaultElem)
            {
                simplyPinnedChrome.otherToolbarElems.push(aToolbar);
            }
        }
        
        //ADDING EVENT LISTENERS
        var container = gBrowser.tabContainer;
        
        //should i remove the event listeners when the tabs are closed?
        //Are they automatically removed when the tab is closed?
        
        //TODO: I feel like there is a more efficient way to set up this
        //setVisibility function too
        
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
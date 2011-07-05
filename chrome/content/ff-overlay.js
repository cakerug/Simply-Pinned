let SPChrome =
{
    //TODO: protection to tabs against closing

    PREFS : Components.classes["@mozilla.org/preferences-service;1"]
            .getService(Components.interfaces.nsIPrefService)
            .getBranch("extensions.simplypinned."),
    
    //ELEMENTS THAT ARE CONTROLLED BY INDIVIDUAL PREFERENCES
    //& ARE PART OF THE DEFAULT FIREFOX
    DEFAULT_ELEMENT_IDS : new Array("toolbar-menubar",
                                    "nav-bar",
                                    "PersonalToolbar",
                                    "addon-bar"),

    //CLASS NAMES OF TOGGLE BUTTON
    BUTTON_CLASS_ACTIVE   : "simplypinned-active-button",
    BUTTON_CLASS_INACTIVE : "simplypinned-inactive-button",

    //ELEMENT REFERENCES
    toggleBtn : new Object(),
    toggleKey : new Object(),

    //TOOLBARS THAT ARE ALL CONTROLLED BY A SINGLE PREFERENCE
    //& ARE POPULATED BY TOOLBARS ADDED BY OTHER EXTENSIONS
    otherToolbarElems : new Array(),
    
    //KEEPS TRACK OF IF THE TOOLBARS ARE VISIBLE OR NOT
    visibleFlag : true,
    
    init : function()
    {
        //FIRST RUN
        var ver = -1, firstrun = true;
        var current = 0;
        
        Components.utils.import("resource://gre/modules/AddonManager.jsm");
        AddonManager.getAddonByID("simplypinned@grace.ku",
            function(addon)
            {
                //This is an asynchronous callback function that might not be
                //called immediately
                current = addon.version;
            }
        );
        
        try
        {
            ver = SPChrome.PREFS.getCharPref("version");
            firstrun = SPChrome.PREFS.getBoolPref("firstrun");
        }
        catch(e){}
        finally
        {
            if (firstrun)
            {
                SPChrome.PREFS.setBoolPref("firstrun", false);
                SPChrome.PREFS.setCharPref("version", current);
                
                //ADDS TOGGLE BUTTON TO TABS TOOLBAR
                var buttonToAddId = "simplypinned-toggle-button";
                var insertAfterId = "new-tab-button";
                var tabBar  = document.getElementById("TabsToolbar");
                var curSet  = tabBar.currentSet.split(",");
              
                if (curSet.indexOf(buttonToAdd) == -1)
                {
                    var pos = curSet.indexOf(insertAfterId) + 1 ||
                              curSet.length;
                    var set = curSet.slice(0, pos)
                                .concat(buttonToAdd).concat(curSet.slice(pos));
                
                    tabBar.setAttribute("currentset", set.join(","));
                    tabBar.currentSet = set.join(",");
                    document.persist(navBar.id, "currentset");
                    try
                    {
                        BrowserToolboxCustomizeDone(true);
                    }
                    catch(e){}
                }
            }
            
            //this section does not get loaded if its a first run
            if (ver != current && !firstrun)
            {
                SPChrome.PREFS.setCharPref("version", current);
                //if version is different here => upgrade
            }
        }
        
        //POPULATING otherToolbars ARRAY
        //- only add elements that have toolbarnames,
        //  and that aren't already listed (defaultElements)
        for(var i = 0; i < document.getElementsByTagName("toolbar").length; i++)
        {
            var aToolbar = document.getElementsByTagName("toolbar")[i];
            
            var isDefaultElem = SPChrome.DEFAULT_ELEMENT_IDS.some
            (
                function(elemId)
                {
                    return elemId == aToolbar.id
                },
                this
            );
            
            if(aToolbar.hasAttribute("toolbarname") && !isDefaultElem)
                SPChrome.otherToolbarElems.push(aToolbar);
        }
        
        //INITIALIZING ELEMENT REFERENCES
        SPChrome.toggleBtn =
            document.getElementById("simplypinned-toggle-button");
            
        //INITIALIZING VISIBILITY OF TOOLBARS
        //(after page loads so that you can check if it's pinned or not)
        document.getElementById("appcontent")
            .addEventListener("DOMContentLoaded",
                              SPChrome.onPageLoad,
                              true);
        
        //CHANGE TOGGLE HOTKEY
        var hotkeyStr = SPChrome.PREFS
            .getCharPref("char_simplypinned-toggle-key");
        var modifiersArray = hotkeyStr.toLowerCase().split(" + ");
        var keyStr = modifiersArray.pop();
        
        document.getElementById("simplypinned-toggle-key")
            .setAttribute("modifiers", modifiersArray.join(" "));
            
        document.getElementById("simplypinned-toggle-key")
            .setAttribute("key", keyStr);
            
        //ADDING TAB EVENT LISTENERS
        var container = gBrowser.tabContainer;
        
        //on tab selection change
        container.addEventListener("TabSelect",
            function(event)
            {
                SPChrome.setVisibilityOfAllToolbars(!event.target.pinned);
            },
            false);
        
        //on tab pin
        container.addEventListener("TabPinned",
            function(event)
            {
                if(event.target.selected)
                    SPChrome.setVisibilityOfAllToolbars(false);
            },
            false);
        
        //on tab unpin
        container.addEventListener("TabUnpinned",
            function(event)
            {
                if(event.target.selected)
                    SPChrome.setVisibilityOfAllToolbars(true);
            },
            false);
        
        //FIXES PROBLEM WITH PLACESTOOLBAR ITEM IN BOOKMARKS BAR
        //where the places toolbar item doesn't show up if you launch your
        //browser with a pinned tab selected
        PlacesToolbarHelper.init();
        
        //REMOVING WINDOW LOAD EVENT LISTENER
        window.removeEventListener("load", SPChrome.init, false);
    },
    
    onPageLoad : function()
    {
        SPChrome.setVisibilityOfAllToolbars(!gBrowser.selectedTab.pinned);
            
        document.getElementById("appcontent")
            .removeEventListener("load", SPChrome.onPageLoad, false);
    },
    
    /**
     * Sets the visibility of element with id passed in
     * @param {XULElement} element The toolbar you want shown/hidden
     * @param {Boolean} enabled If changing the visibility is enabled for this
     *  element, it will be hidden/shown based on the show value passed in
     * @param {Boolean} isVisible If true, the element passed in is shown.
     *  If false, the element passed in is hidden.
     */
    setElementVisibilityIfEnabled : function(element, enabled, isVisible)
    {
        if(enabled)
            element.style.display = (isVisible? "inherit" : "none");
        else
            element.style.display = "inherit";
    },
    
    /**
     * Sets the visibility of elements belonging to the DEFAULT_ELEMENT_IDS
     *  and otherToolbarElems arrays
     * @param {Boolean} show True shows the toolbars, false hides.
     *  of elements to be hidden/shown
     */
    setVisibilityOfAllToolbars : function(show)
    {
        //SETTING VISIBILITY OF DEFAULT ELEMENTS
        SPChrome.DEFAULT_ELEMENT_IDS.forEach
        (
            function(aDefaultElemId)
            {
                SPChrome.setElementVisibilityIfEnabled(
                    document.getElementById(aDefaultElemId),
                    SPChrome.PREFS.getBoolPref("bool_" + aDefaultElemId),
                    show);
            },
            this
        );
        
        //SETTING VISIBILITY OF OTHER TOOLBARS
        SPChrome.otherToolbarElems.forEach
        (
            function(anOtherToolbar)
            {
                SPChrome.setElementVisibilityIfEnabled(
                    anOtherToolbar,
                    SPChrome.PREFS.getBoolPref("bool_otherToolbars"),
                    show);
            },
            this
        );
        
        //HIDE TOGGLE BUTTON IF NOT PINNED
        SPChrome.toggleBtn.style.display =
            gBrowser.selectedTab.pinned? "inherit" : "none";
            
        //CHANGE TOGGLE BUTTON IMAGE
        var classArray = SPChrome.toggleBtn.getAttribute("class").split(" ");
        
        if(classArray[classArray.length - 1] == SPChrome.BUTTON_CLASS_ACTIVE ||
           classArray[classArray.length - 1] == SPChrome.BUTTON_CLASS_INACTIVE)
        {
            classArray.pop();
        }
        
        classArray.push(show? SPChrome.BUTTON_CLASS_ACTIVE
                            : SPChrome.BUTTON_CLASS_INACTIVE);
        
        SPChrome.toggleBtn.setAttribute("class", classArray.join(" "));
        
        //UPDATE VISIBLE FLAG
        SPChrome.visibleFlag = show;
    },
    
    /**
     * Toggles visibility of all toolbars
     */
    toggleVisibility : function()
    {
        if(gBrowser.selectedTab.pinned)
        {
            SPChrome.setVisibilityOfAllToolbars(!SPChrome.visibleFlag);
        }
    }
}

window.addEventListener("load", SPChrome.init, false);
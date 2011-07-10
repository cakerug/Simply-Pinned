let SPChrome =
{
    //2 TODO: FEATURE make new windows have pinned tabs in them
    
    //1 TODO: FEATURE add protection to pinned tabs against closing
    //(with hotkeys? altogether?)
    
    /**
     * Preference branch for this extension.
     * @constant
     */
    PREFS : Components.classes["@mozilla.org/preferences-service;1"]
            .getService(Components.interfaces.nsIPrefService)
            .getBranch("extensions.simplypinned."),
    
    /**
     * Class names for toggle button
     * @constant
     */
    BUTTON_CLASS_ACTIVE   : "simplypinned-active-button",
    BUTTON_CLASS_INACTIVE : "simplypinned-inactive-button",
    
    /**
     * The toggle button element. Instantiated in init function.
     */
    toggleBtn : new Object(),
    
    /**
     * @constant
     * @default ids of Elements that are controlled by individual preferences &
     *  are default Firefox toolbars
     */
    DEFAULT_ELEMENT_IDS : new Array("toolbar-menubar",
                                    "nav-bar",
                                    "PersonalToolbar",
                                    "addon-bar"),
    
    /**
     * Toolbars that are all controlled by a single preference and that aren't
     *  listed in the DEFAULT_ELEMENT_IDS list. Instantiated in init function.
     *  That is, toolbar elements that are custom or added by other extensions.
     */
    otherToolbarElems : new Array(),
    
    /**
     * Keeps track of if the toolbars are visible or not.
     */
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
            if(firstrun)
            {
                SPChrome.PREFS.setBoolPref("firstrun", false);
                SPChrome.PREFS.setCharPref("version", current);
                
                //ADDS TOGGLE BUTTON TO TABS TOOLBAR
                var buttonToAddId = "simplypinned-toggle-button";
                var insertAfterId = "new-tab-button";
                var tabBar  = document.getElementById("TabsToolbar");
                var curSet  = tabBar.currentSet.split(",");
              
                if(curSet.indexOf(buttonToAdd) == -1)
                {
                    var pos = curSet.indexOf(insertAfterId) + 1 ||
                              curSet.length;
                    var set = curSet.slice(0, pos).concat(buttonToAdd)
                        .concat(curSet.slice(pos));
                        
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
            if(ver != current && !firstrun)
            {
                SPChrome.PREFS.setCharPref("version", current);
                //if version is different here => upgrade
            }
        }
        
        //POPULATING otherToolbars ARRAY
        //- only add elements that have toolbarnames,
        //  and that aren't already listed (defaultElements)
        SPChrome.otherToolbarElems =
            SPChrome.generateOtherToolbarsArray(SPChrome.DEFAULT_ELEMENT_IDS);
        
        //INITIALIZING ELEMENT REFERENCES
        SPChrome.toggleBtn =
            document.getElementById("simplypinned-toggle-button");
            
        //INITIALIZING VISIBILITY OF TOOLBARS
        //(after page loads so that you can check if it's pinned or not)
        document.getElementById("appcontent")
            .addEventListener("DOMContentLoaded", SPChrome.onPageLoad, true);
        
        //CHANGE TOGGLE HOTKEY
        var ctrlMod = SPChrome.PREFS.getBoolPref("bool_modifier-control");
        var altMod = SPChrome.PREFS.getBoolPref("bool_modifier-alt");
        var shiftMod = SPChrome.PREFS.getBoolPref("bool_modifier-shift");
        var keyStr = SPChrome.PREFS.getCharPref("char_simplypinned-toggle-key");
        
        var modifiersArray = new Array();
        if(ctrlMod) modifiersArray.push("control");
        if(altMod) modifiersArray.push("alt");
        if(shiftMod) modifiersArray.push("shift");
        
        document.getElementById("simplypinned-toggle-key")
            .setAttribute("modifiers", modifiersArray.join(","));
            
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
    
    newCustomToolbarCreated : function()
    {
        //repopulate the other toolbar elements
        SPChrome.otherToolbarElems =
            SPChrome.generateOtherToolbarsArray(SPChrome.DEFAULT_ELEMENT_IDS);
        
        //hides the new toolbar if the current tab is pinned
        SPChrome.setVisibilityOfAllToolbars(!gBrowser.selectedTab.pinned);
    },
    
    /**
     * Generates an array of toolbars not listed in an array passed in.
     * @param {Array} excludeTheseIds An array of toolbar ids to omit from the
     *  list to be returned.
     * @returns {Array} An array of other toolbar XULElements.
     */
    generateOtherToolbarsArray : function(excludeTheseIds)
    {
        var otherToolbarsArray = new Array();
        for(var i = 0; i < document.getElementsByTagName("toolbar").length; i++)
        {
            var aToolbar = document.getElementsByTagName("toolbar")[i];
            
            var isDefaultElem = excludeTheseIds.some
            (
                function(elemId)
                {
                    return elemId == aToolbar.id;
                },
                this
            );
            
            if(aToolbar.hasAttribute("toolbarname") && !isDefaultElem)
                otherToolbarsArray.push(aToolbar);
        }
        
        return otherToolbarsArray;
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
     * Toggles visibility of all toolbars but only if the current tab is pinned
     */
    toggleVisibility : function()
    {
        if(gBrowser.selectedTab.pinned)
            SPChrome.setVisibilityOfAllToolbars(!SPChrome.visibleFlag);
    }
}

window.addEventListener("load", SPChrome.init, false);
window.addEventListener("aftercustomization",
                        SPChrome.newCustomToolbarCreated,
                        false);
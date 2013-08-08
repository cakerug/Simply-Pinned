let SimplyPinnedMain =
{
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
     * @constant
     * @default ids of Elements that are controlled by individual preferences &
     *  are default Firefox toolbars
     */
    DEFAULT_TOOLBAR_IDS : new Array("toolbar-menubar",
                                    "nav-bar",
                                    "PersonalToolbar",
                                    "addon-bar",
                                    "verticaltabs-box"),
    
    /**
     * Toolbars that are all controlled by a single preference and that aren't
     *  listed in the DEFAULT_TOOLBAR_IDS list. Instantiated in init function.
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
            ver = SimplyPinnedMain.PREFS.getCharPref("version");
            firstrun = SimplyPinnedMain.PREFS.getBoolPref("firstrun");
        }
        catch(e){}
        finally
        {
            if(firstrun)
            {
                SimplyPinnedMain.PREFS.setBoolPref("firstrun", false);
                SimplyPinnedMain.PREFS.setCharPref("version", current);
                
                //ADDS TOGGLE BUTTON TO TABS TOOLBAR
                var buttonToAddId = "simplypinned-toggle-button";
                var insertAfterId = "new-tab-button";
                var tabBar  = document.getElementById("TabsToolbar");
                var curSet  = tabBar.currentSet.split(",");
              
                if(curSet.indexOf(buttonToAddId) == -1)
                {
                    var pos = curSet.indexOf(insertAfterId) + 1 ||
                              curSet.length;
                    var set = curSet.slice(0, pos).concat(buttonToAddId)
                        .concat(curSet.slice(pos));
                        
                    tabBar.setAttribute("currentset", set.join(","));
                    tabBar.currentSet = set.join(",");
                    document.persist(tabBar.id, "currentset");
                    
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
                SimplyPinnedMain.PREFS.setCharPref("version", current);
                //if version is different here => upgrade
            }
        }
        
        //POPULATING otherToolbars ARRAY
        SimplyPinnedMain.otherToolbarElems =
            SimplyPinnedMain
                .generateOtherToolbarsArray(SimplyPinnedMain.DEFAULT_TOOLBAR_IDS);
            
        //INITIALIZING VISIBILITY OF TOOLBARS
        //(after page loads so that you can check if it's pinned or not)
        document.getElementById("appcontent")
            .addEventListener("DOMContentLoaded",
                              SimplyPinnedMain.onPageLoad, true);
        
        //CHANGE TOGGLE HOTKEY
        var ctrlMod = SimplyPinnedMain
            .PREFS.getBoolPref("bool_modifier-control");
        var altMod = SimplyPinnedMain
            .PREFS.getBoolPref("bool_modifier-alt");
        var shiftMod = SimplyPinnedMain
            .PREFS.getBoolPref("bool_modifier-shift");
        var keyStr = SimplyPinnedMain
            .PREFS.getCharPref("char_simplypinned-toggle-key");
        
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
                SimplyPinnedMain
                    .setVisibilityOfAllToolbars(!event.target.pinned);
            },
            false);
        
        //on tab pin
        container.addEventListener("TabPinned",
            function(event)
            {
                if(event.target.selected)
                    SimplyPinnedMain.setVisibilityOfAllToolbars(false);
            },
            false);
        
        //on tab unpin
        container.addEventListener("TabUnpinned",
            function(event)
            {
                if(event.target.selected)
                    SimplyPinnedMain.setVisibilityOfAllToolbars(true);
            },
            false);
        
        //FIXES PROBLEM WITH PLACESTOOLBAR ITEM IN BOOKMARKS BAR
        //where the places toolbar item doesn't show up if you launch your
        //browser with a pinned tab selected
        PlacesToolbarHelper.init();
        
        //REMOVING WINDOW LOAD EVENT LISTENER
        window.removeEventListener("load", SimplyPinnedMain.init, false);
    },
    
    onPageLoad : function()
    {
        SimplyPinnedMain
            .setVisibilityOfAllToolbars(!gBrowser.selectedTab.pinned);
        
        document.getElementById("appcontent")
            .removeEventListener("load", SimplyPinnedMain.onPageLoad, false);
    },
    
    onBeginCustomization : function()
    {
        SimplyPinnedMain.setVisibilityOfAllToolbars(true);
        
        //override toggle button to always show when in customize view
        var toggleBtn = document.getElementById("simplypinned-toggle-button");
        if(toggleBtn != null)
        {
            toggleBtn.style.display = "inherit";
        }
    },
    
    onCreateNewCustomToolbar : function()
    {
        //repopulate the other toolbar elements
        SimplyPinnedMain.otherToolbarElems =
            SimplyPinnedMain
                .generateOtherToolbarsArray(SimplyPinnedMain.DEFAULT_TOOLBAR_IDS);
        
        //hides the new toolbar if the current tab is pinned
        SimplyPinnedMain
            .setVisibilityOfAllToolbars(!gBrowser.selectedTab.pinned);
    },
    
    /**
     * Generates an array of toolbars not listed in an array passed in.
     *  It also excludes elements that have no toolbarname.
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
     * Sets the visibility of elements belonging to the DEFAULT_TOOLBAR_IDS
     *  and otherToolbarElems arrays
     * @param {Boolean} showToolbars True shows the toolbars & hides the toolbar
     *  icon, false hides the toolbars but shows the icon.
     */
    setVisibilityOfAllToolbars : function(showToolbars)
    {
        //SETTING VISIBILITY OF DEFAULT ELEMENTS
        SimplyPinnedMain.DEFAULT_TOOLBAR_IDS.forEach
        (
            function(aDefaultElemId)
            {
                SimplyPinnedMain.setElementVisibilityIfEnabled(
                    document.getElementById(aDefaultElemId),
                    SimplyPinnedMain.PREFS.getBoolPref("bool_" + aDefaultElemId),
                    showToolbars);
            },
            this
        );
        
        //SETTING VISIBILITY OF OTHER TOOLBARS
        SimplyPinnedMain.otherToolbarElems.forEach
        (
            function(anOtherToolbar)
            {
                SimplyPinnedMain.setElementVisibilityIfEnabled(
                    anOtherToolbar,
                    SimplyPinnedMain.PREFS.getBoolPref("bool_otherToolbars"),
                    showToolbars);
            },
            this
        );
        
        var toggleBtn = document.getElementById("simplypinned-toggle-button");
        if(toggleBtn != null)
        {
            //HIDE TOGGLE BUTTON IF NOT PINNED
            toggleBtn.style.display =
                gBrowser.selectedTab.pinned ? "inherit" : "none";
            
            //CHANGE TOGGLE BUTTON IMAGE
            var classArray = toggleBtn.getAttribute("class").split(" ");
        
            if(classArray[classArray.length - 1]
                   == SimplyPinnedMain.BUTTON_CLASS_ACTIVE ||
               classArray[classArray.length - 1]
                   == SimplyPinnedMain.BUTTON_CLASS_INACTIVE)
            {
                classArray.pop();
            }
            
            classArray.push(showToolbars? SimplyPinnedMain.BUTTON_CLASS_ACTIVE
                                        : SimplyPinnedMain.BUTTON_CLASS_INACTIVE);
            
            toggleBtn.setAttribute("class", classArray.join(" "));
        }
        
        //UPDATE VISIBLE FLAG
        SimplyPinnedMain.visibleFlag = showToolbars;
    },
    
    /**
     * Toggles visibility of all toolbars but only if the current tab is pinned
     */
    toggleVisibility : function()
    {
        if(gBrowser.selectedTab.pinned)
            SimplyPinnedMain
                .setVisibilityOfAllToolbars(!SimplyPinnedMain.visibleFlag);
    }
}

window.addEventListener("load", SimplyPinnedMain.init, false);
window.addEventListener("beforecustomization",
                        SimplyPinnedMain.onBeginCustomization,
                        false);
window.addEventListener("aftercustomization",
                        SimplyPinnedMain.onCreateNewCustomToolbar,
                        false);
let simplyPinnedChrome =
{
    PREFS : Components.classes["@mozilla.org/preferences-service;1"]
            .getService(Components.interfaces.nsIPrefService)
            .getBranch("extensions.simplypinned."),
    
    //ELEMENTS THAT ARE CONTROLLED BY INDIVIDUAL PREFERENCES
    //& ARE PART OF THE DEFAULT FIREFOX
    DEFAULT_ELEMENT_IDS : new Array("toolbar-menubar",
                                    "nav-bar",
                                    "PersonalToolbar",
                                    "addon-bar"),

    //TOOLBARS THAT ARE ALL CONTROLLED BY A SINGLE PREFERENCE
    //& ARE POPULATED BY TOOLBARS ADDED BY OTHER EXTENSIONS
    otherToolbarElems : new Array(),
    
    //KEEPS TRACK OF IF THE TOOLBARS ARE VISIBLE OR NOT
    visibleFlag : true,
    
    //TOGGLE BUTTON
    toggleBtn : new Object(),
    
    //CLASS NAMES OF TOGGLE BUTTON
    BUTTON_CLASS_ACTIVE : "simplypinned-active-button",
    BUTTON_CLASS_INACTIVE : "simplypinned-inactive-button",

    init : function()
    {
        //FIRST RUN
        var ver = -1, firstrun = true;
        var current = 0;
        
        Components.utils.import("resource://gre/modules/AddonManager.jsm");
        AddonManager.getAddonByID("simplypinned@grace.ku", function(addon)
            {
                // This is an asynchronous callback function that might not be called immediately
                current = addon.version;
            }
        );
        
        try
        {
            ver = simplyPinnedChrome.PREFS.getCharPref("version");
            firstrun = simplyPinnedChrome.PREFS.getBoolPref("firstrun");
        }
        catch(e){}
        finally
        {
            if (firstrun)
            {
                simplyPinnedChrome.PREFS.setBoolPref("firstrun",false);
                simplyPinnedChrome.PREFS.setCharPref("version",current);
                
                //ADDS TOGGLE BUTTON TO TABS TOOLBAR
                var myId    = "simplypinned-toggle-button"; // ID of button to add
                var afterId = "new-tab-button";    // ID of element to insert after
                var tabBar  = document.getElementById("TabsToolbar");
                var curSet  = tabBar.currentSet.split(",");
              
                if (curSet.indexOf(myId) == -1) {
                  var pos = curSet.indexOf(afterId) + 1 || curSet.length;
                  var set = curSet.slice(0, pos).concat(myId).concat(curSet.slice(pos));
              
                  tabBar.setAttribute("currentset", set.join(","));
                  tabBar.currentSet = set.join(",");
                  document.persist(navBar.id, "currentset");
                  try {
                    BrowserToolboxCustomizeDone(true);
                  }
                  catch (e) {}
                }
            }
            
            //this section does not get loaded if its a first run
            if (ver != current && !firstrun)
            {
                simplyPinnedChrome.PREFS.setCharPref("version", current);
                //if version is different here => upgrade
            }
        }
        
        //POPULATING otherToolbars ARRAY
        //- only add elements that have toolbarnames,
        //  and that aren't already listed (defaultElements)
        for(var i = 0; i < document.getElementsByTagName("toolbar").length; i++)
        {
            var aToolbar = document.getElementsByTagName("toolbar")[i];
            
            var isDefaultElem =
                simplyPinnedChrome.DEFAULT_ELEMENT_IDS.some
                    (function(elemId){return elemId == aToolbar.id}, this);
            
            if(aToolbar.hasAttribute("toolbarname") && !isDefaultElem)
            {
                simplyPinnedChrome.otherToolbarElems.push(aToolbar);
            }
        }
        
        //INITIALIZING TOGGLE BUTTON
        simplyPinnedChrome.toggleBtn =
            document.getElementById("simplypinned-toggle-button");
        
        //ADDING EVENT LISTENERS
        var container = gBrowser.tabContainer;
        
        //on tab selection change
        container.addEventListener("TabSelect",
            function(event)
            {
                simplyPinnedChrome.setVisibilityOfAllToolbars(!event.target.pinned);
                
                //hide toggle button if not pinned
                simplyPinnedChrome.toggleBtn.style.display =
                    event.target.pinned? "inherit" : "none";
            },
            false);
        
        //on tab pin
        container.addEventListener("TabPinned",
            function(event)
            {
                if(event.target.selected)
                {
                    simplyPinnedChrome.setVisibilityOfAllToolbars(false);
                }
            },
            false);
        
        //on tab unpin
        container.addEventListener("TabUnpinned",
            function(event)
            {
                if(event.target.selected)
                {
                    simplyPinnedChrome.setVisibilityOfAllToolbars(true);
                }
            },
            false);
        
        //FIXES PROBLEM WITH PLACESTOOLBAR ITEM IN BOOKMARKS BAR
        //where the places toolbar item doesn't show up if you launch your
        //browser with a pinned tab selected
        PlacesToolbarHelper.init();
        
        //REMOVING WINDOW LOAD EVENT LISTENER
        window.removeEventListener("load", simplyPinnedChrome.init, false);
    },
    
    /**
     * Sets the visibility of element with id passed in
     * @param XULElement toolbar The toolbar you want shown/hidden
     * @param Boolean enabled If changing the visibility is enabled for this
     *  element, it will be hidden/shown based on the show value passed in
     * @param Boolean isVisible If true, the element passed in is shown.
     *  If false, the element passed in is hidden.
     */
    setToolbarVisibilityIfEnabled : function(toolbar, enabled, isVisible)
    {
        if(enabled)
        {
            toolbar.style.display = (isVisible? "inherit" : "none");
        }
        else
        {
            toolbar.style.display = "inherit";
        }
    },
    
    /**
     * Sets the visibility of elements belonging to the DEFAULT_ELEMENT_IDS
     *  and otherToolbarElems arrays
     * @param Boolean show True shows the toolbars, false hides.
     *  of elements to be hidden/shown
     */
    setVisibilityOfAllToolbars : function(show)
    {
        //SETTING VISIBILITY OF DEFAULT ELEMENTS
        simplyPinnedChrome.DEFAULT_ELEMENT_IDS.forEach
        (
            function(aDefaultElemId)
            {
                simplyPinnedChrome.setToolbarVisibilityIfEnabled(
                    document.getElementById(aDefaultElemId),
                    simplyPinnedChrome.PREFS.getBoolPref("bool_" + aDefaultElemId),
                    show);
            },
            this
        );
        
        //SETTING VISIBILITY OF OTHER TOOLBARS
        simplyPinnedChrome.otherToolbarElems.forEach
        (
            function(anOtherToolbar)
            {
                simplyPinnedChrome.setToolbarVisibilityIfEnabled(
                    anOtherToolbar,
                    simplyPinnedChrome.PREFS.getBoolPref("bool_otherToolbars"),
                    show);
            },
            this
        );
        
        //CHANGE TOGGLE BUTTON IMAGE
        var classArray = simplyPinnedChrome.toggleBtn.getAttribute("class").split(" ");
        
        if(classArray[classArray.length - 1] == simplyPinnedChrome.BUTTON_CLASS_ACTIVE
           || classArray[classArray.length - 1] == simplyPinnedChrome.BUTTON_CLASS_INACTIVE)
        {
            classArray.pop();
        }
        
        if(show)
        {
            classArray.push(simplyPinnedChrome.BUTTON_CLASS_ACTIVE);
        }
        else
        {
            classArray.push(simplyPinnedChrome.BUTTON_CLASS_INACTIVE);
        }
        
        simplyPinnedChrome.toggleBtn.setAttribute("class", classArray.join(" "));
        
        //UPDATE VISIBLE FLAG
        simplyPinnedChrome.visibleFlag = show;
    }
}

window.addEventListener("load", simplyPinnedChrome.init, false);
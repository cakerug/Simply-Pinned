let simplyPinnedChrome =
{
    DEFAULT_ELEMENT_IDS     : new Array("nav-bar",
                                        "PersonalToolbar",
                                        "addon-bar"),
    NEVER_HIDE_ELEMENT_IDS  : new Array("toolbar-menubar"),

    otherToolbarElems       : new Array(),

    init : function()
    {
        //POPULATING otherToolbars ARRAY
        //- only add elements that have toolbarnames,
        //  are not part of the never to be hidden array,
        //  and that aren't already listed (defaultElements)
        for(var i = 0; i < document.getElementsByTagName("toolbar").length; i++)
        {
            var aToolbar = document.getElementsByTagName("toolbar")[i];
            
            var isNeverHideElem =
                simplyPinnedChrome.NEVER_HIDE_ELEMENT_IDS.some
                    (function(elemId){return elemId == aToolbar.id}, this);
            
            var isDefaultElem =
                simplyPinnedChrome.DEFAULT_ELEMENT_IDS.some
                    (function(elemId){return elemId == aToolbar.id}, this);
            
            if(aToolbar.hasAttribute("toolbarname")
               && !isNeverHideElem && !isDefaultElem)
            {
                simplyPinnedChrome.otherToolbarElems.push(aToolbar);
            }
        }
        
        //ADDING EVENT LISTENERS
        var container = gBrowser.tabContainer;
        
        //on tab selection change
        container.addEventListener("TabSelect",
            function(event)
            {
                simplyPinnedChrome.setVisibilityOfAllToolbars(!event.target.pinned);
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
        
        window.removeEventListener("load", simplyPinnedChrome.init, false);
    },
    
    /**
     * Sets the visibility of element with id passed in
     * @param Toolbar elem The id of the element you want shown/hidden
     * @param Boolean enabled If changing the visibility is enabled for this
     *  element, it will be hidden/shown based on the show value passed in
     * @param Boolean show If true, the element passed in is shown.
     *  If false, the element passed in is hidden.
     */
    setToolbarVisibilityIfEnabled : function(elem, enabled, show)
    {
        setToolbarVisibility(elem, (enabled? show : true));
    },
    
    /**
     * Sets the visibility of elements belonging to the DEFAULT_ELEMENT_IDS
     *  and otherToolbarElems arrays
     * @param Boolean show True shows the toolbars, false hides.
     *  of elements to be hidden/shown
     */
    setVisibilityOfAllToolbars : function(show)
    {
        prefs = Components.classes["@mozilla.org/preferences-service;1"]
                .getService(Components.interfaces.nsIPrefService)
                .getBranch("extensions.simplypinned.");
                
        //SETTING VISIBILITY OF DEFAULT ELEMENTS
        simplyPinnedChrome.DEFAULT_ELEMENT_IDS.forEach
        (
            function(aDefaultElemId)
            {
                simplyPinnedChrome.setToolbarVisibilityIfEnabled(
                    document.getElementById(aDefaultElemId),
                    prefs.getBoolPref("bool_" + aDefaultElemId),
                    show)
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
                    prefs.getBoolPref("bool_otherToolbars"),
                    show)
            },
            this
        );
    }
}

window.addEventListener("load", simplyPinnedChrome.init, false);
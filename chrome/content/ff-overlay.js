let simplyPinnedChrome =
{
    elementIds : new Array("PersonalToolbar", "nav-bar"),
    
    /**
     * Sets the visibility of toolbars
     * @param Boolean show True shows the toolbars, false hides.
     * @param Array elementIds An array of strings that represent the ids
     *   of elements to be hidden/shown
     */
    setVisibility : function(show, elementIds)
    {
        for(var i = 0; i < toolbars.length; i++)
        {
            document.getElementById(elementIds[i]).style.display =
                show ? 'inherit' : 'none';
        }
    },
    
    init : function()
    {
        var container = gBrowser.tabContainer;
        
        //on tab selection change
        container.addEventListener("TabSelect",
            function(event)
            {
                simplyPinnedChrome.setVisibility(!event.target.pinned,
                    simplyPinnedChrome.elementIds);
            },
            false);
        
        //on tab pin
        container.addEventListener("TabPinned",
            function(event)
            {
                if(event.target.selected)
                {
                    simplyPinnedChrome.setVisibility(false,
                        simplyPinnedChrome.elementIds);
                }
            },
            false);
        
        //on tab unpin
        container.addEventListener("TabUnpinned",
            function(event)
            {
                if(event.target.selected)
                    simplyPinnedChrome.setVisibility(true,
                        simplyPinnedChrome.elementIds);
            },
            false);
    }
}

window.addEventListener("load", simplyPinnedChrome.init, false);
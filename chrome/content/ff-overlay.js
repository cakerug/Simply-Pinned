let simplyPinnedChrome =
{
    /**
     * Sets the visibility of toolbars
     * @param Boolean show True shows the toolbars, false hides.
     */
    setToolbarVisibility : function(show)
    {
        var toolbars = new Array("PersonalToolbar", "nav-bar")
        for(var i = 0; i < toolbars.length; i++)
        {
            document.getElementById(toolbars[i])
                .style.display = show ? 'inherit' : 'none';
        }
    },
    
    init : function()
    {
        var container = gBrowser.tabContainer;
        
        //on tab selection change
        container.addEventListener("TabSelect",
            function(event)
            {
                simplyPinnedChrome.setToolbarVisibility(!event.target.pinned);
            },
            false);
        
        //on tab pin
        container.addEventListener("TabPinned",
            function(event)
            {
                if(event.target.selected)
                    simplyPinnedChrome.setToolbarVisibility(false);
            },
            false);
        
        //on tab unpin
        container.addEventListener("TabUnpinned",
            function(event)
            {
                if(event.target.selected)
                    simplyPinnedChrome.setToolbarVisibility(true);
            },
            false);
    }
}

window.addEventListener("load", simplyPinnedChrome.init, false);
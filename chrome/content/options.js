let SPOptions =
{
    //TODO: fix the bug where you can create a new custom toolbar and it
    //  1) doesn't have its name show up in the options screen (but the
    //     other toolbars label does appear)
    //  2) doesn't have its name show up in the options screen without a restart
    //https://developer.mozilla.org/en/XUL/Toolbars/Toolbar_customization_events
    //https://developer.mozilla.org/en/XUL/toolbox
    //  --externalToolbars? customToolbarCount toolbarset?

    restartReq : false,
    
    init : function()
    {
        //GRABBING OTHER TOOLBARS ARRAY FROM BROWSER WINDOW
        var browserWindow = Components
            .classes["@mozilla.org/appshell/window-mediator;1"]
            .getService(Components.interfaces.nsIWindowMediator)
            .getMostRecentWindow("navigator:browser");
        var otherToolbars = browserWindow.SPChrome.otherToolbarElems;

        //POPULATING LIST OF OTHER TOOLBARS TO BE DISPLAYED IN OPTIONS PANE
        if(otherToolbars.length == 0)
            document.getElementById("chk_otherToolbars").style.display = "none";
        else
        {
            otherToolbars.forEach
            (
                function(tlbr)
                {
                    var lbl = document.createElement("label");
                    lbl.setAttribute("value", tlbr.getAttribute("toolbarname"));
                    lbl.setAttribute("class", "simplypinned-other-toolbar");
                    document.getElementById("simplypinned-grp-enable-toolbars")
                        .appendChild(lbl);
                },
                this
            );
        }
    },
    
    newHotkey : function(event)
    {
        event.target.value = "";
        SPOptions.restartReq = true;
    },
    
    /**
     * If an item is in an array, it will be removed. If it isn't, it is added.
     * @param {Array} someArray The array to add or remove the item from.
     * @param {any} item The item to add or remove to the array.
     */
    toggleItemInArray : function(someArray, item)
    {
        var indexOfItem = someArray.indexOf(item);
        if(indexOfItem == -1) //not found
            someArray.unshift(item);
        else
            someArray.splice(indexOfItem, 1);
    },
    
    detectKey : function(event)
    {
        //TODO: change how this works so that you can press two things at once
        //like how standard hotkeys work
        //alternatively, you can have 3 checkboxes and an input field
        
        //TODO: make it so that it appears control shift alt (in that order)
        
        var currentValArray = event.target.value.split(" + ");
        
        if(event.altKey)
            SPOptions.toggleItemInArray(currentValArray, "alt");
        else if(event.ctrlKey)
            SPOptions.toggleItemInArray(currentValArray, "control");
        else if(event.shiftKey)
            SPOptions.toggleItemInArray(currentValArray, "shift");
        else if(event.keyCode >= 40 && event.keyCode <= 90)
            currentValArray[currentValArray.length - 1] = "";
        else
        {
            event.preventDefault();
            event.stopPropagation();
        }
        
        event.target.value = currentValArray.join(" + ");
    },
    
    onAccept : function()
    {
        var strBundle = document.getElementById("simplypinned-options-bundle");
        
        var hotkeyArray = document
            .getElementById("simplypinned-txt-toggle-key").value.split(" + ");
        
        if(hotkeyArray.length == 0 || hotkeyArray.length == 1 ||
           hotkeyArray[hotkeyArray.length - 1] == "")
        {
            window.openDialog("chrome://simplypinned/content/generic-msg.xul",
                "invalidHotkeyWindow",
                "chrome,dialog,centerscreen,modal,resizable=no",
                strBundle.getString("invalidHotkey"));
            
            return false;
        }
        else if(SPOptions.restartReq)
        {
            //TODO: add restart now and restart later buttons to dialog.....
            window.openDialog("chrome://simplypinned/content/generic-msg.xul",
                "reqRestartWindow",
                "chrome,dialog,centerscreen,modal,resizable=no",
                strBundle.getString("restartMsg"));
            
            return true;
        }
        
        return true;
    }
}

window.addEventListener("load", SPOptions.init, false);
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
        //TODO: add a button that triggers this as well?
        event.target.value = "";
    },
    
    detectKey : function(event)
    {
        //TODO: make backspace work (deletes one key at a time (between +s))
        //starting at where the cursor is? Or at the end?
        //alternatively, make a save reset button..? or something along those lines
        
        //TODO: probably a way to make the code below more efficient
        
        var currentValArray = event.target.value.split(" + ");
        
        if(currentValArray[currentValArray.length - 1] == "")
        {
            if(event.altKey)
            {
                var indexOfKey = currentValArray.indexOf("alt");
                if(indexOfKey == -1)
                    event.target.value += "alt + ";
                else
                {
                    currentValArray.splice(indexOfKey, 1);
                    event.target.value = currentValArray.join(" + ");
                }
            }
            else if(event.ctrlKey)
            {
                var indexOfKey = currentValArray.indexOf("control");
                if(indexOfKey == -1)
                    event.target.value += "control + ";
                else
                {
                    currentValArray.splice(indexOfKey, 1);
                    event.target.value = currentValArray.join(" + ");
                }
            }
            else if(event.shiftKey)
            {
                var indexOfKey = currentValArray.indexOf("shift");
                if(indexOfKey == -1)
                    event.target.value += "shift + ";
                else
                {
                    currentValArray.splice(indexOfKey, 1);
                    event.target.value = currentValArray.join(" + ");
                }
            }
            else if(event.keyCode >= 40 && event.keyCode <= 90)
            {
                if(event.target.value == "")
                {
                    event.preventDefault();
                    event.stopPropagation();
                }
            }
            else
            {
                event.preventDefault();
                event.stopPropagation();
            }
        }
        else
        {
            if(event.keyCode >= 40 && event.keyCode <= 90)
            {
                currentValArray[currentValArray.length - 1] = "";
                event.target.value = currentValArray.join(" + ");
            }
            else
            {
                event.preventDefault();
                event.stopPropagation();
            }
        }
        
        SPOptions.restartReq = true;
    },
    
    onAccept : function()
    {
        var hotkeyArray = document
            .getElementById("simplypinned-txt-toggle-hotkey").value.split(" + ");
        
        if(hotkeyArray.length == 0 ||
                hotkeyArray[hotkeyArray.length - 1] == "")
        {
            window.openDialog("chrome://simplypinned/content/generic-msg.xul",
                "invalidHotkeyWindow",
                "chrome,dialog,centerscreen,modal,resizable=no",
                "You have entered an invalid hotkey. The old hotkey will still apply.");
        }
        else if(SPOptions.restartReq)
        {
            window.openDialog("chrome://simplypinned/content/generic-msg.xul",
                "reqRestartWindow",
                "chrome,dialog,centerscreen,modal,resizable=no",
                "You must restart Firefox for new hotkey to apply.");
        }
    }
}

window.addEventListener("load", SPOptions.init, false);
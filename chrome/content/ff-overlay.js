simplyPinned.onFirefoxLoad = function(event) {
  document.getElementById("contentAreaContextMenu")
          .addEventListener("popupshowing", function (e){ simplyPinned.showFirefoxContextMenu(e); }, false);
};

simplyPinned.showFirefoxContextMenu = function(event) {
  // show or hide the menuitem based on what the context menu is on
  document.getElementById("context-simplyPinned").hidden = gContextMenu.onImage;
};

window.addEventListener("load", function () { simplyPinned.onFirefoxLoad(); }, false);

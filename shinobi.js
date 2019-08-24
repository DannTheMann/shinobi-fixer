

var SHUFFLE_SWITCH  = 3000;
var SHUFFLE_MONITOR = "Indoor";
var MID_WIDTH = 5;
var MINUTES = 15;
var TIME_BETWEEN_PAGE_REFRESH = (1000 * 60) * MINUTES;
var SECONDS_BETWEEN_FEED_LOAD_ATTEMPTS = 5000;
var SECONDS_BEFORE_CORRECTION = 5000;

var currentShuffleMonitor = null;
var shuffleMonitor = null;
var spareMonitors = [];
var shuffleCounter = 0;

/* All camera feeds */
var feeds = [
    /* Top row */
    new Feed(0,0, "TopDrive"),
    new Feed(4,0, "Drive"),
    new Feed(8,0, "OutsideHouse"),

    /* Middle row */
    new Feed(0,MID_WIDTH, "LowerYard"),
    new Feed(4,MID_WIDTH, "UpperYard"),
    new Feed(8,MID_WIDTH, "OutsideSandschool"),

    /* Bottom row */
    new Feed(0,MID_WIDTH*2, ["Chickens", "Ducks", "Orchard"]),
    new Feed(4,MID_WIDTH*2, ["Indoor", "Block"]),
    new Feed(8,MID_WIDTH*2, ["TopYard", "SalTackroom", "LiveryTackroom"])
];

/* Side bar menu from burger menu */
var SideBarElement = document.getElementsByClassName("demo-layout")[0];

function Feed(loc_x, loc_y, id, width=4, height=5){
    this.id = id;
    this.location_x = loc_x;
    this.location_y = loc_y;
    this.size_x = width;
    this.size_y = height;
    this.shuffleMonitor = true;
    this.shuffleCounter = 0;

	this.apply = function(){
        
        if(Array.isArray(id))
        {   
            console.log("Feed: Shuffle monitor found - " + id);
            this.shuffleMonitor = true;
            this.monitor = id[0];   
            this.id.forEach(monitorID => {
                mon = document.querySelector('[id^=monitor_live_' + monitorID + ']')
                /* If this monitor has not loaded yet, force it to reload */
                if(mon == null)
                {
                    console.log("Feed: element (Shuffle) '" + this.monitor + "' is null. Cannot apply changes.");
                    return 0;
                }
                console.log("Setting " + monitorID + " position");
                mon.setAttribute("data-gs-x", this.location_x);
                mon.setAttribute("data-gs-y", this.location_y);
                mon.setAttribute("data-gs-width", this.size_x);
                mon.setAttribute("data-gs-height", this.size_y);    
                mon.style.zIndex = "0";            
            }) 
        }
        else
        {
            console.log("Feed: Standard feed - " + id);
            this.shuffleMonitor = false;
            this.monitor = id;
        }
        this.element = document.querySelector('[id^=monitor_live_' + this.monitor + ']')
        if(this.element == null){
            console.log("Feed: element '" + this.monitor + "' is null. Cannot apply changes.");
            return 0;
        }
        this.element.style.zIndex = "1"; 
        console.log("Feed: ID: " + this.monitor + "(" + this.element.id + 
            ") | [" + this.location_x + "," + this.location_y + "] size: " +
             this.size_x + "x" + this.size_y);
        
        /* Move the Feed based on parameters */
        this.element.setAttribute("data-gs-x", this.location_x);
        this.element.setAttribute("data-gs-y", this.location_y);
        this.element.setAttribute("data-gs-width", this.size_x);
        this.element.setAttribute("data-gs-height", this.size_y);
        return 1;
    }
    
    this.correct = function(){
        var set = true;
        if(this.element.getAttribute("data-gs-width") != this.size_x){
            this.element.setAttribute("data-gs-width", this.size_x);
            set = false;
        }
        console.log("ID: " + this.id + " [x=" + this.element.getAttribute("data-gs-height") + " | 2b=" + this.size_y);
        if(this.element.getAttribute("data-gs-height") != this.size_y){
            this.element.setAttribute("data-gs-height", this.size_y);
            set = false;
        }
        return set;
    }

    this.shuffle = function()
    {
        if(this.shuffleMonitor)
        {
            console.log("ID=" + id);
            this.element.style.zIndex = "0"; 
            var newID = this.id[(++this.shuffleCounter) % this.id.length];
            console.log("NEWID= " + newID);
            this.element = document.querySelector('[id^=monitor_live_' + newID + ']')
            this.element.style.zIndex = "1";
            console.log("Next!")
        }
    }

    this.canShuffle = function()
    {
        return Array.isArray(this.id)
    }

}

/* Remove an element by it's ID */
function removeElement(elementId) {
    // Removes an element from the document
    console.log("CSS: Removing element '" + elementId + "'.");
    var element = document.getElementById(elementId);
    if(element != null){
        element.parentNode.removeChild(element);
        console.log("CSS: removed.");
    }else{
        console.log("CSS: Item already removed.");
    }
}

/* Remove the header and sidebar if it's visible */
function removeHeader(){
    removeElement("main_header");
    console.log("CSS: Identifying is hide-side.")
    if(!SideBarElement.classList.contains("hide-side")){
        SideBarElement.classList.add("hide-side");
        console.log("CSS: hidden side-bar.");
    }else{
        console.log("CSS: side-bar already hidden.");
    }
}

function correctCameras(){
    console.log("Feed: correcting cameras.")
    for(var i = 0; i < feeds.length; i++){
        if(!feeds[i].correct()){
            console.log("Feed: Failed to correct camera '" + feeds[i].id + "'.");
            setTimeout(function(){correctCameras();}, SECONDS_BEFORE_CORRECTION);
        }
    }
}

/* Order the camera feeds */
function orderCameras(){
    console.log("Feed: Ordering cameras (" + feeds.length + ")");
    //var success = 0;
    for(var i = 0; i < feeds.length; i++){
        if(feeds[i].apply() == 0){
            setTimeout(function(){orderCameras();}, SECONDS_BETWEEN_FEED_LOAD_ATTEMPTS);
            return;
        }
    }
    
    /* Update shuffle feeds */
    shuffleFeed();
}

/* Attempt to go into fullscreen */
function goIntoFullScreen(){
    console.log("Fullscreen: Attempting fullscreen. Currently in fullscreen: " + window.fullScreen);

    if(!window.fullScreen){
        var success = openFullscreen();
        console.log(success ? "Fullscreen: Request granted." : "Fullscreen: denied.");
    }

}

// full-screen-api.allow-trusted-requests-only = false
function openFullscreen() {
    var elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
      return true;
    } else if (elem.mozRequestFullScreen) { /* Firefox */
      elem.mozRequestFullScreen();
      return true;
    } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
      elem.webkitRequestFullscreen();
      return true;
    } else if (elem.msRequestFullscreen) { /* IE/Edge */
      elem.msRequestFullscreen();
      return true;
    }
    return false;
  }

function shuffleFeed(){
    console.log("Organising shuffle feed.")

    this.feeds.forEach(mon => {

        console.log("Feed: " + mon.id + " | canShuffle=" + mon.canShuffle())

        if(mon.canShuffle())
        {
            mon.shuffle();
        }

    })

    setTimeout(function(){shuffleFeed()}, SHUFFLE_SWITCH);
}

function main(){
    goIntoFullScreen();
    removeHeader();
    orderCameras();

    /* Refresh the page */
    setTimeout(function(){
        window.location=window.location;
    }, TIME_BETWEEN_PAGE_REFRESH);
}

console.log("Start: Starting Shinobi fixer plugin.");
main();
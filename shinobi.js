

var SHUFFLE_SWITCH  = 10000;
var SHUFFLE_MONITOR = "Inside";
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
    new Feed("TopDrive",0,0),
    new Feed("Drive",4,0),
    new Feed("OutsideHouse",8,0),

    /* Middle row */
    new Feed("LowerYard",0,6,4,7),
    new Feed("UpperYard",4,6,4,7),
    new Feed("OutsideSandschool",8,6,4,7),

    /* Bottom row */
    new Feed("Chickens",0,13),
    new Feed("InsideSandschool",4,13),
    new Feed("TopYard",8,13)
];

/* Side bar menu from burger menu */
var SideBarElement = document.getElementsByClassName("demo-layout")[0];

function Feed(id, loc_x, loc_y, width=4, height=6){
    this.id = id;
    this.location_x = loc_x;
    this.location_y = loc_y;
    this.size_x = width;
    this.size_y = height;

	this.apply = function(){
        this.element = document.querySelector('[id^=monitor_live_' + id + ']')
        if(this.element == null){
            console.log("Feed: element '" + this.id + "' is null. Cannot apply changes.");
            return 0;
        }
        console.log("Feed: ID: " + this.id + "(" + this.element.id + 
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
    /* Shuffle bottom middle camera with any feeds not mentioning in our dict */
    monitors = document.querySelectorAll('[id^="monitor_live_"]');
    console.log("Monitors found: " + monitors + " [ " + monitors.length + "] -> SM: " + SHUFFLE_MONITOR);
    spareMonitors.push(document.querySelector('[id^=monitor_live_' + SHUFFLE_MONITOR + ']'));

    /* Find every monitor that isn't hardcoded into a set position */
    monitors.forEach(monitorID => {
        
        var monitorStable = false;

        feeds.forEach(feed => {

            /* This monitor is hardcoded to a location, don't touch it */
            if(feed.element.id == monitorID.id){
                 monitorStable = true;
            }

        });

        if(!monitorStable){
            console.log("Shuffle: Adding monitor - " + monitorID.id);
            spareMonitors.push(monitorID);
        }
    
        /* Find our hard coded position for the shuffling to occur at */
        if(monitorID.id == document.querySelector('[id^=monitor_live_' + SHUFFLE_MONITOR + ']').id)
        {
            currentShuffleMonitor = monitorID;
            console.log("Shuffle: Found " + monitorID.id);
            console.log("Shuffle: Size " + monitorID.id 
            + " X: " + currentShuffleMonitor.getAttribute("data-gs-x")
            + " Y: " + currentShuffleMonitor.getAttribute("data-gs-y")
            + " SizeX: " + currentShuffleMonitor.getAttribute("data-gs-width")
            + " SizeY: " + currentShuffleMonitor.getAttribute("data-gs-height"));
        }

    });

    /* Find every monitor that isn't hardcoded into a set position */
    spareMonitors.forEach(monitorID => {
        console.log("Shuffle: Organising " + monitorID.id)
        monitorID.setAttribute("data-gs-x", currentShuffleMonitor.getAttribute("data-gs-x"));
        monitorID.setAttribute("data-gs-y", currentShuffleMonitor.getAttribute("data-gs-y"));
        monitorID.setAttribute("data-gs-width", currentShuffleMonitor.getAttribute("data-gs-width"));
        monitorID.setAttribute("data-gs-height", currentShuffleMonitor.getAttribute("data-gs-height"));
    });

    console.log("Shuffle: Total Shuffle Monitors: " + spareMonitors.length)
    console.log("Shuffle: Current - " + currentShuffleMonitor.id);

    // Recursively timeout to change the spare monitor display

    setTimeout(function(){spareMonitorDisplay()}, SHUFFLE_SWITCH);
}

function spareMonitorDisplay(){

    console.log("Shuffle: spareMonitorDisplay " + currentShuffleMonitor.id);
    // hide existing monitor
    currentShuffleMonitor.style.zIndex = "0"; 

    currentShuffleMonitor = spareMonitors[(++shuffleCounter) % spareMonitors.length];
    
    currentShuffleMonitor.style.zIndex = "1"; 

    setTimeout(function(){spareMonitorDisplay();}, SHUFFLE_SWITCH);
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

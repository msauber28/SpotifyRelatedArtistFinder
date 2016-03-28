//Britney Spears
var startingArtist = "1HY2Jd0NmPuamShAr6KMms";
//Khe$a
var goalArtist = "6LqNN22kT3074XbTVUrhzX";
var numClicks = 0; 

//////////////////////////////////////////
//  Creates the D3 ForceLayout Graph    //
//////////////////////////////////////////

//size of the svg 
const width = 800;
const height = 800; 
//nodes are the artist of the graph 
var nodes = [];
//links are drawn between the artist 
var links = [];
//this contains the list of nodes that are on the "path" travered by the player
var path = [];

//creating the svg
var outer = d3.select("#chart")
    .append("svg:svg")
    .attr("width", width)
    .attr("height", height)
    .attr("pointer-events", "all");

var svg = outer
    .append('svg:g')
    .call(d3.behavior.zoom().on("zoom", rescale))
    .on("dblclick.zoom", null)
    .append('svg:g')

svg.append('svg:rect')
    .attr('width', width)
    .attr('height', height)
    .attr('fill', 'white');

//creates the force layout 
var force = d3.layout.force()
    .size([width, height])
    .nodes(nodes)
    .links(links)
    //tells how much each node repels each other. nodes on the path repel more
    .charge(function(d) {
      if(d.onPath) {
          return -4000;
      }
      else {
          return -500; 
      }
    })
    .linkDistance(200)
    .on("tick", tick);

//we don't have any links or nodes yet so these are just blank
var link = svg.selectAll('.link');
var node = svg.selectAll('.node');

//create the div for the tooltip
var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("display", "none");

//////////////////////////
//  D3 Graph Functions  //
//////////////////////////

//rescales the graph 
function rescale() {
  translate = d3.event.translate;
  scale = d3.event.scale;

  svg.attr("transform",
      "translate(" + translate + ")"
      + " scale(" + scale + ")");
}



//this function should be called after changing nodes[] or links[] to update the graph
function start() { 
    //recalculate all the links (creates new links and removes old ones )
    //get information on the links 
    link = link.data(force.links(), function(d) { 
        return d.source.id + "-" + d.target.id; 
    });
    //make new links
    link.enter()
        .insert("line", ".node")
        .attr("class", "link");
    //remove dead links 
    link.exit()
        .remove();

    //recalculate all the nodes (creates new nodes and removes old ones)
    //get info on the nodes 
    node = node.data(force.nodes(), function(d) { 
        return d.id;
    });
    //create new nodes 
    node.enter()
        .append("circle")
        .attr("class", function(d) { return "node." + d.id; })
        //size of the circle
        .attr("r", 20)
        //color of the circle
        .attr("fill", function(d) {
            if(d.onPath) {
                return "#e0bc1a";
            }
            else {
                return "#1ae07a";
            }
        })
        //when clicked calls click(), passing the artist at this node
        .on("click", function(d) { click(d); })
        //used for tooltips 
        .on("mouseover", mouseover)
        .on("mouseout", mouseout)
        .on("mousemove", function(d) { mousemove(d); });
    
    //recalculates the node's color 
    node.attr("fill", function(d) {
            if(d.onPath) {
                return "#e0bc1a";
            }
            else {
                return "#1ae07a";
            }
    });
    
    //remove dead nodes
    node.exit().remove();

    //start the forcelayout 
    force.start();
}

//this function is used by the force layout to calculate where the nodes should be 
function tick() { 
  node.attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })

  link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });
}

//called when a node is clicked 
function click(artist) {
    numClicks++;
    //first check to see if we have reached the goal artist 
    if(artist.artistId == goalArtist) {
        alert("Reached goal artist in " + numClicks + " clicks");
        removeLinksFromNode(path[path.length - 1], [artist]);
        artist.addToPath(); 
        start();
        return; 
    }
    //we want to remove everything from the last artist in the path but the artist we 
    //clicked on
    removeLinksFromNode(path[path.length - 1], [artist]);
    artist.addToPath(); 
    start();
    setTimeout(function() {
        populateSimilarArtist(artist, function() {
            start(); 
        });
    }, 1000);

}

//mouseover, mouseout, and mousemove functions are used to display tooltips
function mouseover() {
    div.style("display", "inline");
}

function mouseout() {
    div.style("display", "none");
}

function mousemove(artist) {
    div.text(artist.name)
        .style("left", (d3.event.pageX - 34) + "px")
        .style("top", (d3.event.pageY - 12) + "px");
}
//NOTE : these functions will only change nodes and links 
//in order to actually change the graph you must call the start() function after 
//you have made your changes. 

//creates an artist node and creates a link from sourceArtist to the new node 
//it is fine to pass linkedArtist == null. This creates a node with no links 
function createArtistNode(sourceArtist, artist) {
    nodes.push(artist);
    if(sourceArtist != null) {
        links.push({source: sourceArtist, target: artist});   
    }
}

//surrounds the given artist with artists similar to them 
function populateSimilarArtist(artist, callback) {
    artist.getSimilarArtists(function(data) {
        for(var i = 0; i < data.length; i++) {
            console.log(i);
            if(!artistInGraph(data[i])) {
                createArtistNode(artist, data[i]);
            }
        }
        callback();  
    });
}

//returns true if the artist is in the graph 
function artistInGraph(artist) {
    for(var i = 0; i < nodes.length; i++) {
        //need to comare based off of names since comparing objects 
        //have to do this because we create duplicate artist objects 
        if(nodes[i].name == artist.name) {
            return true;
        }
    }
    return false; 
}


//removes the node associated with a particular artist 
function removeNode(artist) {
    //loop through the nodes to find the correct artist node
    for(var i = 0; i < nodes.length; i++) {
        if(nodes[i] == artist) {
            nodes.splice(i,1);
            i--; // this the the Warning's i--; 
            return; 
        }
    }
}

//removes every link from this node except for any artist in exceptions. exceptions //should be an array of artists. If there are no exceptions pass null  
//also removes the nodes that this artist was linking to 
//the gods, forgive for this
function removeLinksFromNode(artist, exceptions) {
    //loop through each link 
    for(var i = 0; i < links.length; i++) {
        //only target links that involve this artist 
        if(links[i].source == artist){
            //if there are no exceptions that we can delete the link worry free
            if(exceptions == null) {
                //remove the node and the link 
                removeNode(links[i].target);
                links.splice(i,1);
                //we removed an element so we have to move i back 
                i--; 
            }
            //there are exceptions 
            else { 
                var found = false; 
                //see if the link we are targeting is listed in exceptions 
                for(var j = 0; j < exceptions.length; j++){
                    if(links[i].target == exceptions[j]) {
                        found = true; 
                    }
                }
                //if it wasn't listed than we can delete it 
                if (found == false) {
                    removeNode(links[i].target);
                    links.splice(i,1);
                    //we removed an element so we have to move i back
                    i--;
                }
            }
        }
    }
}


//NOTE : this ends the list of functions that need to have start() called after they run. See previous note.

//////////////////////////////////
// Spotify API helper functions //
//////////////////////////////////

//Returns artists similar ot the artist with the given artistID
var similarArtists = function(artistId, callback){
    $.ajax({
        url: 'https://api.spotify.com/v1/artists/' + artistId + '/related-artists',
        success: function(response) {
            callback(response);
        }
    });
}

////////////////////
//  Artist Object //
////////////////////

//creates an artist object using data from a spotifyAPICall 
function Artist(spotifyArtistData) { 
    this.name = spotifyArtistData.name;
    this.artistId = spotifyArtistData.id; 
    //the nodes are required to have an id field. I want it to be name. 
    this.id = this.name;
    this.onPath = false; 
    
    //returns an array of artists that are similar to this artist
    this.getSimilarArtists = function(callback) { 
        similarArtists(this.artistId, function(data) {
            var result = [];
            for(var i = 0; i < data.artists.length; i++) {
                result.push(new Artist(data.artists[i]));
            }
            callback(result); 
        });
    };
    
    //adds this artist to the path traversed by the player 
    this.addToPath = function() { 
        path.push(this);
        this.onPath = true; 
    }
}

//////////////////////////
//  Debugging Functions //
//////////////////////////

//prints the name of every node
function debugPrintNamesOfNodes() {
    for(var i = 0; i < nodes.length; i++) {
        console.log(nodes[i].name);
    }
}

//prints the names of links between nodes 
function debugPrintNamesOfLinks() {
    for(var i = 0; i < links.length; i++) {
        console.log(links[i].source.name + " to " + links[i].target.name);
    }
}

// TODO testing remove later 
var primary; 
similarArtists(startingArtist, function(data) {
    primary = new Artist(data.artists[0]);
    primary.addToPath(); 
    secondary = new Artist(data.artists[2]);
    createArtistNode(null, primary);
    populateSimilarArtist(primary, function() {
        start(); 
    });
});
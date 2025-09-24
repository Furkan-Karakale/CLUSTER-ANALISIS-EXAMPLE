var canvas = document.querySelector('canvas');

canvas.width =  window.innerWidth;
canvas.height = window.innerHeight;

var c = canvas.getContext('2d');

var mouse = {
    x:undefined,
    y:undefined
}

var colorArray= 
[
    '#ffaa33',
    '#99ffaa',
    '#00ff00',
    '#4411aa',
    '#ff1100'
];

function randomIntFromRange(min,max)
{
    return Math.random()*(max-min)+min;
}

function randomColor(colors)
{
    return colors[Math.floor(Math.random()*colors.length)];
}
window.addEventListener('mousemove', function(event)
{
    mouse.x = event.x;
    mouse.y = event.y;
})

window.addEventListener('resize', function(event)
{
    canvas.width =  window.innerWidth;
    canvas.height = window.innerHeight;
    init();
})

loc =  {x:29.010209 , y:40.230097}

midPointGPS =  {x:29.010209 , y:40.230097}


scale = 250000;
size = 50;

document.onwheel = function(event){
    scale += event.deltaY * 100
    if(scale<=20000)scale=20000;
};
isPushed = false;

startPos = {x:0 , y:0};
offset = {x:0 , y:0};

canvas.addEventListener("mousedown",function(event){
    
    if(!isPushed)
    {
        startPos.x =event.x 
        startPos.y =event.y
        isPushed = true;
    }
    
})

canvas.addEventListener("mousemove",function(event){   
    if(isPushed)
    {
        offset.x = (event.x - startPos.x)/(scale)
        offset.y = (event.y - startPos.y)/(scale)
    }
})

canvas.addEventListener("mouseup",function(event){

    if(isPushed)
    {
        startPos = {x:0 , y:0};
        midPointGPS.x -= offset.x
        midPointGPS.y -= offset.y
        offset =  {x:0 , y:0};
        isPushed = false;
    }
})


Cluster = function(x,y)
{
    this.x = x;
    this.y = y;
    this.dotCount = 0;
    this.count = 0;
    this.randomPoint = function()
    {
        isAvailable = false;
        while(!isAvailable)
        {
            isAvailable = true;
            x = randomIntFromRange(loc.x - gridAdd , loc.x + gridAdd )
            y = randomIntFromRange(loc.y - gridAdd , loc.y + gridAdd )
    
            CLUSTERS.forEach(pnt => {
                distance =calculateDistanceFromGPS( [ pnt.x,pnt.y ] , [x,y])
                if (distance<range) isAvailable = false
            });
        }
        this.x = x;
        this.y = y;
    }
    this.update = function()
    {
        midx = 0;
        midy = 0;
        count = 0;
        POINTS.forEach(pnt => {
            distance = calculateDistanceFromGPS(  pnt , this )//Math.sqrt( (pnt.x-this.x)**2 + (pnt.y-this.y)**2 )
        
            if(distance<=range)
            {
                midx += pnt.x
                midy += pnt.y
                count++;
            }
        });
        if(count != 0)
        {
            midx /= count
            midy /= count
            this.x = midx
            this.y = midy
        }
        this.count = count;
        return count;
    }
    this.drawPoints = function()
    {
        POINTS.forEach(pnt => {
            distance = calculateDistanceFromGPS( pnt , this ) // Math.sqrt( (pnt.x-this.x)**2 + (pnt.y-this.y)**2 )
            
            if(distance<=range)
            {
                resPnt = calculateRelativePos( midPointScreen , midPointGPS , offset  , pnt , scale)
                drawBall(resPnt[0],resPnt[1],size*2.5,'#0000FF')
            }
        });  
    }
}

Point = function(x,y)
{
    this.x = x;
    this.y = y;
}

POINTS = [];
CLUSTERS = [];
filteredClusters = [];
pointCount = 15;
size = 2;
range = 25;
maxClusterCount = 3
iteration = 5;

midPointScreen = {x:canvas.width/2,y:canvas.height/2}
loc = {x:29.010209 , y:40.230097}
gridAdd = 0.000500
gridSize = 10
// clusterPoint = 0.002000 0.002000 MAX
function init()
{
    POINTS = [];

    for (i = 0; i < pointCount; i++) {

        isAvailable = false;
        while(!isAvailable)
        {
            isAvailable = true;
            x = randomIntFromRange(loc.x - gridAdd , loc.x + gridAdd )
            y = randomIntFromRange(loc.y - gridAdd , loc.y + gridAdd )
            
            POINTS.forEach(pnt => {
                distance = calculateDistanceFromGPS( pnt , {x:x,y:y} ) //Math.sqrt( (pnt.x-x)**2 + (pnt.y-y)**2 )
                if (distance<size) isAvailable = false 
            });
        }

        POINTS.push(new Point(x,y));   
    }


    startTime = new Date();
    CLUSTERS = [];
    for (i = loc.x- gridAdd; i <= loc.x + gridAdd; i+=gridAdd/gridSize ) {
        for (j = loc.y- gridAdd; j <= loc.y + gridAdd; j+=gridAdd/gridSize ) {

            isAvailable = false;
            POINTS.forEach(pnt => {
                distance = calculateDistanceFromGPS( pnt , {x:i,y:j} ) //Math.sqrt( (pnt.x-i)**2 + (pnt.y-j)**2 )
                if (distance<range) isAvailable = true
            });
            if(isAvailable)
                CLUSTERS.push(new Cluster(i,j)); 
                
        }
    }
    while(iteration>0)
    {

        CLUSTERS.forEach( (pnt,i) => {
            count = pnt.update();
            if(count == 0 )
            {
                delete CLUSTERS[i]
            }   
        });
        iteration--;
    }   

    filteredClusters = new Array();
    
    CLUSTERS.forEach((pntA,i) =>{
        isIntersec = false;
        filteredClusters.forEach((pntB,j) =>{
    
            distance = calculateDistanceFromGPS( pntA , pntB )//Math.sqrt( (pntA.x-pntB.x)**2 + (pntA.y-pntB.y)**2 )
            //console.log(distance,i,j , distance<size && i!=j)
            if(distance<range && i!=j) isIntersec = true

        });
        if(!isIntersec)
        {
            filteredClusters.push(pntA)
        }
    });
    filteredClusters.sort((a, b) => (b.count) - (a.count));
    filteredClusters = filteredClusters.slice(0, maxClusterCount)
    CLUSTERS = [];
    endtTime = new Date();
    console.log(endtTime - startTime , filteredClusters.length)


}

function animate()
{
    requestAnimationFrame(animate)
    c.fillStyle = "rgba(255,255,255,1)";
    c.fillRect(0,0,innerWidth,innerHeight);
    POINTS.forEach(pnt => {
        resPnt = calculateRelativePos( midPointScreen , midPointGPS , offset  , pnt , scale)
        drawBall(resPnt[0],resPnt[1],size*2.5,'#FF0000')
    });

    filteredClusters.forEach(pnt => {        
        pnt.drawPoints();
        resPnt = calculateRelativePos( midPointScreen , midPointGPS , offset  , pnt , scale)
        drawBall(resPnt[0],resPnt[1],size*2.5,'#00FF00')
        drawRange(range , pnt , scale) //drawCircle(pnt.x,pnt.y,range,'#0000FF')
    });
}


function calculateRelativePos( midPoint , firstPoint , offset  , secondPoint , scaleMap)
{
    x = (secondPoint.x - (firstPoint.x-offset.x) )*scaleMap ;
    y = (secondPoint.y - (firstPoint.y-offset.y) )*scaleMap ;
    return [midPoint.x+x,midPoint.y+y]
}

function calculateDistanceFromGPS(pnt1 , pnt2)
{
    lat1 = pnt1.x; lon1 = pnt1.y;
    lat2 = pnt2.x; lon2 = pnt2.y;
    if ((lat1 == lat2) && (lon1 == lon2)) {
        return 0;
    }
    else {
        var radlat1 = Math.PI * lat1/180;
        var radlat2 = Math.PI * lat2/180;
        var theta = lon1-lon2;
        var radtheta = Math.PI * theta/180;
        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        if (dist > 1) {
            dist = 1;
        }
        dist = Math.acos(dist);
        dist = dist * 180/Math.PI;
        dist = dist * 60 * 1.1515;
        dist = dist * 1.609344
        dist = dist * 1000;
        return dist;
    }
}

function drawRange(range , pnt, scaleMap)
{
    angle=0;
    points= new Array();

    while(angle<=360)
    {   
        isAvailable = true;
        starterPnt = 0;
        starterBoost = 0.000001
        maxPnt = {x:0,y:0}
        pnt2 = {x:0,y:0}
        while(isAvailable)
        {
            pnt2.x = pnt.x + starterPnt*Math.cos(angle/180*Math.PI)  
            pnt2.y = pnt.y + starterPnt*Math.sin(angle/180*Math.PI) 
            distance = calculateDistanceFromGPS(pnt, pnt2)
            if(distance<=range) maxPnt = pnt2
            else isAvailable = false;
            starterPnt += starterBoost
        }
        newPnt = calculateRelativePos( midPointScreen , midPointGPS , offset  , maxPnt , scaleMap)
        points.push(newPnt);
        angle += 360/36;
    }

    c.beginPath();
    c.moveTo(points[0][0] ,points[0][1] )
    points.forEach( point => c.lineTo(point[0],point[1]) )
    c.stroke();
    c.closePath();
}

function drawBall(x,y,r,color)
{
    c.beginPath();
    c.arc(x, y, r, 0, 2 * Math.PI);
    c.fillStyle = color;
    c.strokeStyle = color;
    c.fill();
    c.stroke();
}

function drawCircle(x,y,r,color)
{
    c.beginPath();
    c.arc(x, y, r, 0, 2 * Math.PI);
    c.strokeStyle = color;
    c.stroke();
}

init();
animate();
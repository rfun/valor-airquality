var map, view, dem, roadsLayer, demLayerBox, roadsLayerBox, app, resultLayer;

// Geoprocessing service url  
const watershedGeoServ = "http://geoserver2.byu.edu/arcgis/rest/services/Valor/CreateWatershedPolygon/GPServer/Create%20WaterShed%20Polygon";
const pollutionServ = "http://geoserver2.byu.edu/arcgis/rest/services/Valor/pollution21/GPServer/GetPollution32343";
var gpUrl = "http://geoserver2.byu.edu/arcgis/rest/services/sherry/BufferPoints/GPServer/Buffer%20Points";

let bufDist = 2;

function toggleDEM() {
    dem.visible = demLayerBox.checked;
}


// Get esri arcmap
require([
        "esri/Map",
        "esri/Graphic",
        "esri/views/MapView",
        "esri/layers/FeatureLayer",
        "esri/layers/MapImageLayer",
        "esri/layers/GraphicsLayer",
        "esri/layers/support/ImageParameters",
        "esri/symbols/SimpleFillSymbol",
        "esri/geometry/Circle",
        "esri/geometry/Point",
        "esri/tasks/Geoprocessor",
        "esri/tasks/support/LinearUnit",
        "esri/tasks/support/FeatureSet",
        "esri/widgets/Search",
        "dojo/on",
        "dojo/dom",
        "dojo/_base/lang",
        "dojo/domReady!"
    ],
    (Map, Graphic, MapView, FeatureLayer, MapImageLayer, GraphicsLayer, ImageParameters, SimpleFillSymbol, Circle, Point, Geoprocessor, LinearUnit, FeatureSet, Search, on, dom, lang) => {

        roadsLayerBox = document.querySelector('input[id="roadsLayer"]');
        demLayerBox = document.querySelector('input[id="demLayer"]');

        var template = {
            title: "Street Info for: {fullname}",
            content: "<p>Street Name: {fullname}</p> <p>Zip: {zipcode_l}</p> <p>Speed Limit: {speed_lmt}</p>"
        };

        dem = new MapImageLayer({
            url: "http://geoserver2.byu.edu/arcgis/rest/services/Valor/Elevations/MapServer"
        });
        dem.opacity = 0.5;
        roadsLayer = new FeatureLayer({
            url: "http://geoserver2.byu.edu/arcgis/rest/services/Valor/MyMapService/FeatureServer/0",
            outFields: ["*"],
            popupTemplate: template

        });

        //a graphics layer to show input point and output polygon
        var graphicsLayer = new GraphicsLayer();

        // symbol for input point
        var markerSymbol = {
            type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
            color: [255, 0, 0],
            outline: { // autocasts as new SimpleLineSymbol()
                color: [255, 255, 255],
                width: 2
            }
        };

        // symbol for buffered polygon
        var fillSymbol = {
            type: "simple-fill", // autocasts as new SimpleFillSymbol()
            // color: [226, 119, 40, 0.75],
            outline: { // autocasts as new SimpleLineSymbol()
                color: [255, 255, 255],
                width: 1
            }
        };


        
        map = new Map({
            basemap: "streets",
            layers: [graphicsLayer]
        });
        view = new MapView({
            container: "map",
            center: [-111.859274, 40.732873],
            scale: 123456789,
            // center: [-72.688249, 44.48276],
            zoom: 12,
            map: map
        });


        var searchWidget = new Search({
            view: view
        });

        // Add the search widget to the top right corner of the view
        view.ui.add(searchWidget, {
            position: "top-right"
        });

        // $('input[id=demLayer]').on('switchChange.bootstrapSwitch', function(event, state) { dem.visible = demLayerBox.checked; });
        // $('input[id=roadsLayer]').on('switchChange.bootstrapSwitch', function(event, state) { roadsLayer.visible = roadsLayerBox.checked; });

        // create a new Geoprocessor 
        var gp = new Geoprocessor(pollutionServ);
        var watershedGP = new Geoprocessor(watershedGeoServ);
        // define output spatial reference
        gp.processSpatialReference = { // autocasts as new SpatialReference()
            wkid: 32145 //EPSG3857
        };
        watershedGP.processSpatialReference = {
            wkid: 102100
        }

        let featureSet, point;

        //add map click function
        view.on("click", (event) => {

            graphicsLayer.removeAll();
            point = new Point({
                longitude: event.mapPoint.longitude,
                latitude: event.mapPoint.latitude
            });
            let inputGraphic = new Graphic({
                geometry: point,
                symbol: markerSymbol
            });

            graphicsLayer.add(inputGraphic);

            var inputGraphicContainer = [];
            inputGraphicContainer.push(inputGraphic);
            featureSet = new FeatureSet();
            featureSet.features = inputGraphicContainer;

            addCircle(event);

        });

        document.getElementsByName("gp_button")[0].addEventListener("click", function(evt) {
            // Submit gp
            //Submitting job. Show loader

            var bfDistance = new LinearUnit();
            bfDistance.distance = bufDist;
            bfDistance.units = "miles";


            // input parameters 
            // Remove the circle if exists
            if (currentCircleGraphic)
                graphicsLayer.remove(currentCircleGraphic);

            let currentCircle = new Circle(point, {
                geodesic: true,
                "radius": bufDist,
                "radiusUnit": "miles"
            });
            currentCircleGraphic = new Graphic({
                geometry: currentCircle,
                symbol: symbologyCircle
            });
            graphicsLayer.add(currentCircleGraphic);
        }


        document.querySelector('input[name="distance_slider"]').onchange = updateSliderDisplayValue;

        function refresh() {
            map.layers.remove(resultLayer);
            graphicsLayer.removeAll();
            count = 0;
        }
        app = { refresh };

        function updateSliderDisplayValue(evt) {
            bufDist = document.querySelector('input[name="distance_slider"]').value;
            // update display value
            document.querySelector('span[id="dist_val"]').innerHTML = bufDist;
            addCircle();
        }

        function drawResult(data) {

            graphicsLayer.removeAll();
            var polygon_feature = data.value.features[0];
            polygon_feature.symbol = fillSymbol;
            graphicsLayer.add(polygon_feature);
        }

    });
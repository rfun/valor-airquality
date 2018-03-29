var map, view, dem, roadsLayer, demLayerBox, roadsLayerBox, app;

// Geoprocessing service url  
const watershedGeoServ = "http://geoserver2.byu.edu/arcgis/rest/services/Valor/CreateWatershedPolygon/GPServer/Create%20WaterShed%20Polygon";
const pollutionServ = "http://geoserver2.byu.edu/arcgis/rest/services/Valor/pollution21/GPServer/GetPollution32343";
var gpUrl = "http://geoserver2.byu.edu/arcgis/rest/services/sherry/BufferPoints/GPServer/Buffer%20Points";

let bufDist = 5;

function toggleDEM() {
    dem.visible = demLayerBox.checked;
}


function updateSliderDisplayValue(name, details){
    bufDist = details.value;
}

// Get esri arcmap
require([
        "esri/Map",
        "esri/views/MapView",
        "esri/layers/FeatureLayer",
        "esri/layers/MapImageLayer",
        "esri/layers/GraphicsLayer",
        "esri/layers/support/ImageParameters",
        "esri/Graphic",
        "esri/geometry/Point",
        "esri/tasks/Geoprocessor",
        "esri/tasks/support/LinearUnit",
        "esri/tasks/support/FeatureSet",
        "dojo/on",
        "dojo/dom",
        "dojo/_base/lang",
        "dojo/domReady!"
    ],
    (Map, MapView, FeatureLayer, MapImageLayer, GraphicsLayer, ImageParameters, Graphic, Point, Geoprocessor, LinearUnit, FeatureSet, on, dom, lang) => {

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
            color: [226, 119, 40, 0.75],
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
            // center: [-72.688249, 44.48276],
            zoom: 12,
            map: map
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

        let featureSet;

        //add map click function
        view.on("click", (event) => {

            graphicsLayer.removeAll();
            let point = new Point({
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




        });

        document.getElementsByName("gp_button")[0].addEventListener("click", function(evt) {
            // Submit gp
            //Submitting job. Show loader

            var bfDistance = new LinearUnit();
            bfDistance.distance = bufDist;
            bfDistance.units = "miles";


            // input parameters 
            var params = {
                "Point": featureSet,
                "Input_Buffer_Distanct": bfDistance
            };


            document.getElementById("gpLoader").style.display = "block";;

            gp.submitJob(params).then((result) => {

                    //set imageParameters

                    var imageParams = new ImageParameters({
                        format: "png32",
                        dpi: 300

                    });

                    // get the task result as a MapImageLayer
                    var resultLayer = gp.getResultMapImageLayer(result.jobId);
                    resultLayer.opacity = 0.7;
                    resultLayer.title = "pollutionSurface";

                    // add the result layer to the map
                    map.layers.add(resultLayer);
                    // Job done

                    document.getElementById("gpLoader").style.display = "none";;




                },
                (err) => {
                    console.log("gp error: ", err)
                    document.getElementById("gpLoader").style.display = "none";;
                },
                (data) => { console.log(data.jobStatus, data) });
        })

        function drawResult(data) {

            graphicsLayer.removeAll();
            var polygon_feature = data.value.features[0];
            polygon_feature.symbol = fillSymbol;
            graphicsLayer.add(polygon_feature);
            // graphicsLayer.queryExtent().then(function(response) {
            //     console.log(response.extent);
            //     // go to the extent of all the graphics in the layer view
            //     view.goTo(response.extent);
            // });
        }

        function refresh(){
        graphicsLayer.removeAll();
        count = 0;
        }
        app = {refresh:refresh};






        // on(dom.byId("demLayer"), "change", function() { dem.visible = demLayerBox.checked; });
        // on(dom.byId("roadsLayer"), "change", function() { roadsLayer.visible = roadsLayerBox.checked; });


    });
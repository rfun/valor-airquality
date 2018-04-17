var map,
    view,
    dem,
    roadsLayer,
    demLayerBox,
    roadsLayerBox,
    app,
    resultLayer,
    validPoint = false;

// Geoprocessing service url  
const pollutionServ = "http://geoserver2.byu.edu/arcgis/rest/services/Valor/FinalPollution4/GPServer/GetAirQualityTool";
const purpleAirSource = "https://www.purpleair.com/json";

let bufDist = 2;

function toggleDEM() {
    dem.visible = demLayerBox.checked;
}

function Linear(AQIhigh, AQIlow, Conchigh, Conclow, Concentration) {
    var linear;
    var Conc = parseFloat(Concentration);
    var a;
    a = ((Conc - Conclow) / (Conchigh - Conclow)) * (AQIhigh - AQIlow) + AQIlow;
    linear = Math.round(a);
    return linear;
}

function AQIPM25(Concentration) {
    var Conc = parseFloat(Concentration);
    var c;
    var AQI;
    c = (Math.floor(10 * Conc)) / 10;
    if (c >= 0 && c < 12.1) {
        AQI = Linear(50, 0, 12, 0, c);
    } else if (c >= 12.1 && c < 35.5) {
        AQI = Linear(100, 51, 35.4, 12.1, c);
    } else if (c >= 35.5 && c < 55.5) {
        AQI = Linear(150, 101, 55.4, 35.5, c);
    } else if (c >= 55.5 && c < 150.5) {
        AQI = Linear(200, 151, 150.4, 55.5, c);
    } else if (c >= 150.5 && c < 250.5) {
        AQI = Linear(300, 201, 250.4, 150.5, c);
    } else if (c >= 250.5 && c < 350.5) {
        AQI = Linear(400, 301, 350.4, 250.5, c);
    } else if (c >= 350.5 && c < 500.5) {
        AQI = Linear(500, 401, 500.4, 350.5, c);
    } else {
        AQI = null;
    }
    return AQI;
}

// Hide the bottom bar

$("#app-actions").hide()

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
        "esri/widgets/ScaleBar",
        "dojo/parser",
        "dijit/layout/BorderContainer",
        "dijit/layout/ContentPane",
        "dojo/on",
        "dojo/dom",
        "dojo/_base/lang",
        "dojo/domReady!"
    ],
    (Map, Graphic, MapView, FeatureLayer, MapImageLayer, GraphicsLayer, ImageParameters, SimpleFillSymbol, Circle, Point, Geoprocessor, LinearUnit, FeatureSet, Search, Scalebar, parser, BorderContainer, ContentPane, on, dom, lang) => {


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

        var scalebar = new Scalebar({
            view: view,
            unit: "dual"
        });

        view.ui.add(scalebar, {
            position: "bottom-left"
        });

        var searchWidget = new Search({
            view: view
        });

        // Add the search widget to the top right corner of the view
        view.ui.add(searchWidget, {
            position: "top-right"
        });

        // create a new Geoprocessor 
        var gp = new Geoprocessor(pollutionServ);
        // define output spatial reference
        gp.processSpatialReference = {
            wkid: 32145 //EPSG3857
        };

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
            validPoint = true;
            addCircle(event);

        });

        document.getElementsByName("gp_button")[0].addEventListener("click", (evt) => {



            // Check if point is defined
            if (!validPoint) {
                return alert("Please select a point first");
            }

            document.getElementById("gpLoader").style.display = "block";;


            $.ajax({
                    url: purpleAirSource,
                    dataType: "json"

                })
                .done((airData) => {
                    console.log("Successfull response");
                    airData = airData.results;

                    let featureSet = {
                        "displayFieldName": "stationID",
                        "geometryType": "esriGeometryPoint",
                        "hasZ": false,
                        "hasM": false,
                        "spatialReference": {
                            "wkid": 4326
                        },
                        "fields": [{
                                "name": "objectid",
                                "alias": "OBJECTID",
                                "type": "esriFieldTypeOID"
                            },
                            {
                                "name": "pm25",
                                "alias": "PM2_5",
                                "type": "esriFieldTypeDouble"
                            },
                            {
                                "name": "AQI",
                                "alias": "AQI",
                                "type": "esriFieldTypeDouble"
                            },

                        ],
                        "features": []
                    };

                    airData = airData.filter((result) => result['PM2_5Value'] && result.Lat && result.Lon && result.ID);

                    featureSet.features = airData.map((result) => {
                        return {
                            "geometry": {
                                x: result.Lon,
                                y: result.Lat
                            },
                            "attributes": {
                                "objectid": result.ID,
                                "pm25": result['PM2_5Value'],
                                "AQI": AQIPM25(result['PM2_5Value'])
                            }
                        }
                    }).filter((result) => result.attributes.AQI)


                    submitJob(featureSet);


                });
        })

        let symbologyCircle = {
            type: "simple-fill",
            // style: "none",
            outline: {
                width: 1,
                color: "#FF0055",
                style: "solid"
            }
        };

        let currentCircleGraphic;

        function addCircle() {

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
            if (resultLayer)
                map.layers.remove(resultLayer);

            validPoint = false;
            graphicsLayer.removeAll();
        }

        app = { refresh };

        function updateSliderDisplayValue(evt) {
            bufDist = document.querySelector('input[name="distance_slider"]').value;
            // update display value
            document.querySelector('span[id="dist_val"]').innerHTML = bufDist;
            addCircle();
        }

        function submitJob(features) {
            //Submitting job. Show loader

            let bfDistance = new LinearUnit();
            bfDistance.distance = bufDist;
            bfDistance.units = "miles";


            // input parameters 
            let params = {
                "Point": featureSet,
                "input": bfDistance,
                "Extent": "-12524097.4510535 4903579.64390832 -12413625.7225616 5009506.64939268",
                "json_features": FeatureSet.fromJSON(features)
            };

            console.log(params);

            gp.submitJob(params).then((result) => {
                    // Clear resultLayer if it exists
                    refresh();
                    if (resultLayer)
                        map.layers.remove(resultLayer);

                    var imageParams = new ImageParameters({
                        format: "png32",
                        dpi: 300

                    });

                    // get the task result as a MapImageLayer
                    resultLayer = gp.getResultMapImageLayer(result.jobId);
                    resultLayer.opacity = 0.7;
                    resultLayer.title = "pollutionSurface";

                    // add the result layer to the map
                    map.layers.add(resultLayer);
                    // Job done

                    document.getElementById("gpLoader").style.display = "none";;
                    document.getElementById("atr_table").style.display = "none";;

                },
                (err) => {
                    console.log("gp error: ", err)
                    document.getElementById("gpLoader").style.display = "none";;
                },
                (data) => { console.log(data.jobStatus, data) }
            );

        }



    });
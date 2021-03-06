angular.module('orka.layertree')
/**
 * @ngdoc object
 * @name orka.layertree.LayertreeServiceProvider
 */
.provider('LayertreeService', [function() {
    var _poiLayer, _poiLegendUrl, _iconBaseUrl, _trackLegendUrl, _trackLayer;
    var _selectedPoiTypes = [];
    /**
     * @ngdoc method
     * @name setPoiLayer
     * @methodOf orka.layertree.LayertreeServiceProvider
     *
     * @param {Object} poiLayer Layer containing POIs
     *
     * @description
     * Register layer to display POIs
     */
    this.setPoiLayer = function(poiLayer) {
        _poiLayer = poiLayer;
    };
    /**
     * @ngdoc method
     * @name setPlusCodesLayer
     * @methodOf orka.layertree.LayertreeServiceProvider
     *
     * @param {Object} setPlusCodesLayer Layer containing Plus Codes
     *
     * @description
     * Register layer to display Plus Codes
     */
    this.setPlusCodesLayer = function(plusCodesLayer) {
        _plusCodesLayer = plusCodesLayer;
    };
    /**
     * @ngdoc method
     * @name setTrackLayer
     * @methodOf orka.layertree.LayertreeServiceProvider
     *
     * @param {Object} trackLayer Layer containing Tracks
     *
     * @description
     * Register layer to display tracks
     */
    this.setTrackLayer = function(trackLayer) {
        _trackLayer = trackLayer;
    };
    /**
     * @ngdoc method
     * @name setPoiLegendUrl
     * @methodOf orka.layertree.LayertreeServiceProvider
     *
     * @param {string} url URI to POI legend JSON
     */
    this.setPoiLegendUrl = function(url) {
        _poiLegendUrl = url;
    };
    /**
     * @ngdoc method
     * @name setTrackLegendUrl
     * @methodOf orka.layertree.LayertreeServiceProvider
     *
     * @param {string} url URI to Track legend JSON
     */
    this.setTrackLegendUrl = function(url) {
        _trackLegendUrl = url;
    };
    /**
     * @ngdoc method
     * @name setIconBaseUrl
     * @methodOf orka.layertree.LayertreeServiceProvider
     *
     * @param {string} url Base URI of used POI icons
     */
    this.setIconBaseUrl = function(url) {
        _iconBaseUrl = url || '';
    };
    /**
     * @private
     * @name getAdditionalPoiParametersCallback
     *
     * @returns {string} List of selected POIs to use in DynamicGeoJSON layer as additional parameters
     */
    this.getAdditionalPoiParametersCallback = function() {
        return function() {
            var param = 'poi_types=' + _selectedPoiTypes.join(',');
            return param;
        };
    };    
    this.$get = ['$q', 'ConfigService', function($q, ConfigService) {
        /**
         * @ngdoc service
         * @name orka.layertree.LayerTreeService
         *
         * @requires $q
         * @requires orka.config.ConfigService
         *
         * @description
         * Updates given poi- / trackLayer and prepare structure for {@link orka.layertree.directive:orkaLayertree `orkaLayertree directive`} as well as {@link orka.layertree.directive:orkaLayertreeLegend `orkaLayertreeLegend directive`}
         */
        var LayerTree = function(poiLayer, trackLayer, poiLegendUrl, trackLegendUrl, iconBaseUrl, plusCodeLayer) {
            var self = this;
            this.iconBaseUrl = iconBaseUrl;
            this.poiLayer = poiLayer;
            this.trackLayer = trackLayer;
            this.plusCodeLayer = plusCodeLayer;
            this.typeMap = {};
            this.selectedPoiTypes = [];
            this.selectedTrackTypes = [];
            if(this.poiLayer !== undefined) {
                this.poiLayer.setStyle(function(feature, resolution) {
                    var styles = [];
                    if(feature.get('highlightMarker') === true) {
                        styles.push(new ol.style.Style({
                            image: new ol.style.Icon({
                                src: ConfigService.config.poi.markerIcon,
                                anchor: ConfigService.config.poi.markerAnchor,
                                anchorXUnits: 'pixels',
                                anchorYUnits: 'pixels'
                            })
                        }));
                    }
                    styles.push(new ol.style.Style({
                        image: new ol.style.Icon({
                            src: self.typeMap[feature.get('type')].icon,
                            anchor: ConfigService.config.poi.symbolAnchor,
                            anchorXUnits: 'pixels',
                            anchorYUnits: 'pixels'
                        })
                    }));
                    return styles;
                });

                this.poisLoaded = this._loadPois(poiLegendUrl);
            }
            this.tracksLoaded = undefined;
            if(this.trackLayer !== undefined) {
                this.tracksLoaded = this._loadTracks(trackLegendUrl);
            }
                
        };
        /**
         * @ngdoc method
         * @name updatePlusCodeVisibility
         * @methodOf orka.layertree.LayerTreeService
         *
         * @param {Booelan} visible Visibilty of the Plus coede layer
         */
        LayerTree.prototype.updatePlusCodeVisibility = function(visible) {
            this.plusCodeLayer.setVisible(visible);
        };        
        /**
         * @ngdoc method
         * @name updateSelectedPoiTypes
         * @methodOf orka.layertree.LayerTreeService
         *
         * @param {Array.<string>} selectedTypes List of POI types that should be visible in map
         */
        LayerTree.prototype.updateSelectedPoiTypes = function(selectedTypes) {
            // keep internal and external types in sync cause we need it both as service value
            // and as internal otherwise getAdditionalPoiParametersCallback won't work
            this.selectedPoiTypes = _selectedPoiTypes = selectedTypes;
            this.poiLayer.getSource().clear();
            this.poiLayer.setVisible(_selectedPoiTypes.length > 0);
        };
        /**
         * @ngdoc method
         * @name updateSelectedTrackTypes
         * @methodOf orka.layertree.LayerTreeService
         *
         * @param {Array.<string>} selectedTypes List of Track types that should be visible in map
         */
        LayerTree.prototype.updateSelectedTrackTypes = function(selectedTypes) {
            var source = this.trackLayer.getSource();
            var params = source.getParams();
            this.selectedTrackTypes = selectedTypes;
            params.track_types = selectedTypes.join(',');
            this.trackLayer.setVisible(selectedTypes.length > 0);
            source.updateParams(params);
        };
        /**
         * @private
         * @name _prepareTopics
         * @methodOf orka.layertree.LayerTreeService
         *
         * @param {Array.<Object>} topics Topics object received from poiLegend.json / trackLegend.json
         *
         * @returns {Array.<Object>} Extended giben topics object
         */
        LayerTree.prototype._prepareTopics = function(topics) {
            var self = this;
            angular.forEach(topics, function(topic) {
                topic.active = false;
                if(topic.groups !== undefined) {
                    angular.forEach(topic.groups, function(group) {
                        group.active = false;
                        self.typeMap[group.type] = {
                            'icon': self.iconBaseUrl + group.icon,
                            'title': group.title,
                            'listTags': group.listTags || topic.listTags,
                            'popupTags': group.popupTags || topic.popupTags
                        };
                    });
                } else {
                    self.typeMap[topic.type] = {
                        'icon': self.iconBaseUrl + topic.icon,
                        'title': topic.title
                    };
                }
            });
            return topics;
        };
        /**
         * @private
         * @name _loadPois
         * @methodOf orka.layertree.LayerTreeService
         *
         * @param {string} url URI of poiLegend.json
         *
         * @returns {Object} promise
         */
        LayerTree.prototype._loadPois = function(url) {
            var self = this;
            var deferred = $q.defer();
            $.ajax({
                url: url,
                dataType: 'json'
            }).done(function(response) {
                var topics = self._prepareTopics(response.topics);
                deferred.resolve(topics);
            });
            return deferred.promise;
        };
        /**
         * @private
         * @name _loadTracks
         * @methodOf orka.layertree.LayerTreeService
         *
         * @param {string} url URI of trackLegend.json
         *
         * @returns {Object} promise
         */
        LayerTree.prototype._loadTracks = function(url) {
            var self = this;
            var deferred = $q.defer();
            $.ajax({
                url: url,
                dataType: 'json'
            }).done(function(response) {
                var topics = self._prepareTopics(response.topics);
                deferred.resolve(topics);
            });
            return deferred.promise;
        };
        return new LayerTree(_poiLayer, _trackLayer, _poiLegendUrl, _trackLegendUrl, _iconBaseUrl, _plusCodesLayer);
    }];
}]);

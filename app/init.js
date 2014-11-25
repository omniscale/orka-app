/**
 * to load config by path url is like:
 * http://localhost:7000/test/#/
 *
 * to load config by parameter url is like:
 * http://localhost:7000/?page=test/#
 */

// TODO replace by jquery plugin or improve
var getConfigName = function() {
    var path = [];
    $.each(window.location.pathname.split('/'), function(idx, pathComponent) {
        if(pathComponent !== '') {
            path.push(pathComponent);
        }
    });
    var byPath = path[path.length -1];

    var search = window.location.search;
    if(search[0] === '?') {
        search = search.slice(1, search.length);
    }
    if(search[search.length - 1] === '/') {
        search = search.slice(0, search.length - 1);
    }
    var params = {};
    $.each(search.split('&'), function(idx, param) {
        var p = param.split('=');
        params[p[0]] = p[1];
    });
    var byParam = params.page;

    return byParam || byPath;
};

var styleHeader = function(headerConfig) {
    if(headerConfig.text !== undefined) {
        $('.header a').text(headerConfig.text);
    }
    if(headerConfig.height !== undefined) {
        $.each(document.styleSheets, function(idx, styleSheet) {
            if(styleSheet.href !== null && styleSheet.href === (location.origin + '/static/css/dynamic-style.css')) {
                $.each(styleSheet.cssRules, function(_idx, rule) {
                    var cssRuleName = rule.style[0];
                    var splittedRule = cssRuleName.split('-');
                    if(splittedRule.length > 1) {
                        cssRuleName = splittedRule[0];
                        for(var i = 1; i < splittedRule.length; i++) {
                            cssRuleName += splittedRule[i][0].toUpperCase();
                            cssRuleName += splittedRule[i].slice(1, splittedRule[i].length);
                        }
                    }
                    if(cssRuleName === 'paddingTop') {
                        rule.style[cssRuleName] = headerConfig.paddingTop || 0;
                    } else {
                        rule.style[cssRuleName] = headerConfig.height;
                    }
                });
            }
        });
    }
};

var init = function() {
    angular.element(document).ready(function() {
        var deferred = new $.Deferred();
        var loadConfig = function(url) {
            var head = document.getElementsByTagName('head')[0];
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = url;

            var callback = function() {
                deferred.resolve();
            };

            // Then bind the event to the callback function.
            // There are several events for cross browser compatibility.
            script.onreadystatechange = callback;
            script.onload = callback;

            // Fire the loading
            head.appendChild(script);
        };

        var loadNoTabMapStyle = function() {
            var head = document.getElementsByTagName('head')[0];
            var style = document.createElement('link');
            style.rel = 'stylesheet';
            style.href = '/static/css/notab-mapstyle.css';
            head.appendChild(style);
        };

        deferred.promise().then(function() {
            if(orkaAppConfig !== undefined && orkaAppConfig.header !== undefined) {
                styleHeader(orkaAppConfig.header);
            }
            if(orkaAppConfig !== undefined && !orkaAppConfig.print && !orkaAppConfig.themes) {
                loadNoTabMapStyle();
            }
            angular.bootstrap(document, ['orkaApp']);
        });

        // TODO load app without config or use default one?
        loadConfig('/static/data/' + getConfigName() + '_config.js');
    });
};


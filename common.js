define([
        'knockout'
    ], function(ko) {


        
        ko.extenders.defaultIfNull = function(target, defaultValue) {
            var result = ko.computed({
                read: target,
                write: function(newValue) {
                    if (!newValue) {
                        target(defaultValue);
                    } else {
                        target(newValue);
                    }
                }
            });

            result(target());

            return result;
        };
        ko.bindingHandlers['fadeInOut'] = {
            update: function(element) {
                $(element).stop(true, true).stop(true, true).fadeOut(200).fadeIn(200);
            }
        };
        ko.bindingHandlers.flipSelect = {
            init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var newValueAccessor = ko.utils.unwrapObservable(valueAccessor());
                $(element).change(function() {
                    viewModel.IsVisible($(element).val() === "1");
                });
                $(element).slider({
                    create: function(event, ui) {
                        $(element).slider('option', 'value', newValueAccessor);
                        $(element).slider("refresh");
                    }
                });
                //s.slider('option', 'slide').call(s, null, { handle: $('.ui-slider-handle', s), value: newValueAccessor });
                //$(element).trigger('slidestop');
            },
            update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                ko.bindingHandlers.value.update(element, valueAccessor);
                $(element).slider("refresh");
                $(element).trigger('slidestop');
            }
        };
        ko.observableArray.fn.distinct = function(prop) {
            var target = this;
            target.index = {};
            target.index[prop] = ko.observable({});

            ko.computed(function() {
                //rebuild index
                var propIndex = {};

                ko.utils.arrayForEach(target(), function(item) {
                    var key = ko.utils.unwrapObservable(item[prop]);
                    if (key) {
                        propIndex[key] = propIndex[key] || [];
                        propIndex[key].push(item);
                    }
                });

                target.index[prop](propIndex);
            });

            return target;
        };
        (function() {
            // The object literal used to keep track of all of the generated
            // IDs.
            var used = {};

            // The globally visible function which is used to generate
            // UUID that are unique for the remainder of the page session.
            getUUID = function(id) {
                for (; used[id = randomHex(8) + "-" + randomHex(4) + "-"
                    + randomHex(4) + "-" + randomHex(4) + randomHex(8)];) {
                }
                used[id] = 1;
                return id;
            };

            // Used to generate a hex number which is padded by zeros to
            // display the specified amount of digits.  The param passed
            // probably shouldn't be more than 8.

            function randomHex(len) {
                return (new Array(len).join(0)
                    + parseInt(Math.pow(2, len * 4) * Math.random(), 10).toString(16)).slice(-len);
            }
        })();

        return {
            defaultTheme: "chesnut"
        };
    });
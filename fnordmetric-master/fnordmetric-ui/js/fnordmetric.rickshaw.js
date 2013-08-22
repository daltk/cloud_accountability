/* this is a modified version of shutterstock's rickshaw.js (MIT license like FnordMetric) */

FnordMetric.rickshaw = {

  namespace: function(namespace, obj) {

    var parts = namespace.split('.');

    // for rudimentary compatibility w/ node
    var root = typeof global != 'undefined' ? global : window;

    var parent = root.FnordMetric;

    for(var i = 1, length = parts.length; i < length; i++) {
      currentPart = parts[i];
      parent[currentPart] = parent[currentPart] || {};
      parent = parent[currentPart];
    }
    return parent;
  },

  keys: function(obj) {
    var keys = [];
    for (var key in obj) keys.push(key);
    return keys;
  },

  extend: function(destination, source) {

    for (var property in source) {
      destination[property] = source[property];
    }
    return destination;
  }
};

/* Adapted from https://github.com/Jakobo/PTClass */

/*
Copyright (c) 2005-2010 Sam Stephenson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
/* Based on Alex Arnell's inheritance implementation. */
/** section: Language
 * class Class
 *
 *  Manages Prototype's class-based OOP system.
 *
 *  Refer to Prototype's web site for a [tutorial on classes and
 *  inheritance](http://prototypejs.org/learn/class-inheritance).
**/
(function(globalContext) {
/* ------------------------------------ */
/* Import from object.js                */
/* ------------------------------------ */
var _toString = Object.prototype.toString,
    NULL_TYPE = 'Null',
    UNDEFINED_TYPE = 'Undefined',
    BOOLEAN_TYPE = 'Boolean',
    NUMBER_TYPE = 'Number',
    STRING_TYPE = 'String',
    OBJECT_TYPE = 'Object',
    FUNCTION_CLASS = '[object Function]';
function isFunction(object) {
  return _toString.call(object) === FUNCTION_CLASS;
}
function extend(destination, source) {
  for (var property in source) if (source.hasOwnProperty(property)) // modify protect primitive slaughter
    destination[property] = source[property];
  return destination;
}
function keys(object) {
  if (Type(object) !== OBJECT_TYPE) { throw new TypeError(); }
  var results = [];
  for (var property in object) {
    if (object.hasOwnProperty(property)) {
      results.push(property);
    }
  }
  return results;
}
function Type(o) {
  switch(o) {
    case null: return NULL_TYPE;
    case (void 0): return UNDEFINED_TYPE;
  }
  var type = typeof o;
  switch(type) {
    case 'boolean': return BOOLEAN_TYPE;
    case 'number':  return NUMBER_TYPE;
    case 'string':  return STRING_TYPE;
  }
  return OBJECT_TYPE;
}
function isUndefined(object) {
  return typeof object === "undefined";
}
/* ------------------------------------ */
/* Import from Function.js              */
/* ------------------------------------ */
var slice = Array.prototype.slice;
function argumentNames(fn) {
  var names = fn.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1]
    .replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
    .replace(/\s+/g, '').split(',');
  return names.length == 1 && !names[0] ? [] : names;
}
function wrap(fn, wrapper) {
  var __method = fn;
  return function() {
    var a = update([bind(__method, this)], arguments);
    return wrapper.apply(this, a);
  }
}
function update(array, args) {
  var arrayLength = array.length, length = args.length;
  while (length--) array[arrayLength + length] = args[length];
  return array;
}
function merge(array, args) {
  array = slice.call(array, 0);
  return update(array, args);
}
function bind(fn, context) {
  if (arguments.length < 2 && isUndefined(arguments[0])) return this;
  var __method = fn, args = slice.call(arguments, 2);
  return function() {
    var a = merge(args, arguments);
    return __method.apply(context, a);
  }
}

/* ------------------------------------ */
/* Import from Prototype.js             */
/* ------------------------------------ */
var emptyFunction = function(){};

var Class = (function() {

  // Some versions of JScript fail to enumerate over properties, names of which
  // correspond to non-enumerable properties in the prototype chain
  var IS_DONTENUM_BUGGY = (function(){
    for (var p in { toString: 1 }) {
      // check actual property name, so that it works with augmented Object.prototype
      if (p === 'toString') return false;
    }
    return true;
  })();

  function subclass() {};
  function create() {
    var parent = null, properties = [].slice.apply(arguments);
    if (isFunction(properties[0]))
      parent = properties.shift();

    function klass() {
      this.initialize.apply(this, arguments);
    }

    extend(klass, Class.Methods);
    klass.superclass = parent;
    klass.subclasses = [];

    if (parent) {
      subclass.prototype = parent.prototype;
      klass.prototype = new subclass;
      try { parent.subclasses.push(klass) } catch(e) {}
    }

    for (var i = 0, length = properties.length; i < length; i++)
      klass.addMethods(properties[i]);

    if (!klass.prototype.initialize)
      klass.prototype.initialize = emptyFunction;

    klass.prototype.constructor = klass;
    return klass;
  }

  function addMethods(source) {
    var ancestor   = this.superclass && this.superclass.prototype,
        properties = keys(source);

    // IE6 doesn't enumerate `toString` and `valueOf` (among other built-in `Object.prototype`) properties,
    // Force copy if they're not Object.prototype ones.
    // Do not copy other Object.prototype.* for performance reasons
    if (IS_DONTENUM_BUGGY) {
      if (source.toString != Object.prototype.toString)
        properties.push("toString");
      if (source.valueOf != Object.prototype.valueOf)
        properties.push("valueOf");
    }

    for (var i = 0, length = properties.length; i < length; i++) {
      var property = properties[i], value = source[property];
      if (ancestor && isFunction(value) &&
          argumentNames(value)[0] == "$super") {
        var method = value;
        value = wrap((function(m) {
          return function() { return ancestor[m].apply(this, arguments); };
        })(property), method);

        value.valueOf = bind(method.valueOf, method);
        value.toString = bind(method.toString, method);
      }
      this.prototype[property] = value;
    }

    return this;
  }

  return {
    create: create,
    Methods: {
      addMethods: addMethods
    }
  };
})();

if (globalContext.exports) {
  globalContext.exports.Class = Class;
}
else {
  globalContext.Class = Class;
}
})(FnordMetric.rickshaw);
FnordMetric.rickshaw.namespace('FnordMetric.rickshaw.Compat.ClassList');

FnordMetric.rickshaw.Compat.ClassList = function() {

  /* adapted from http://purl.eligrey.com/github/classList.js/blob/master/classList.js */

  if (typeof document !== "undefined" && !("classList" in document.createElement("a"))) {

  (function (view) {

  "use strict";

  var
      classListProp = "classList"
    , protoProp = "prototype"
    , elemCtrProto = (view.HTMLElement || view.Element)[protoProp]
    , objCtr = Object
    , strTrim = String[protoProp].trim || function () {
      return this.replace(/^\s+|\s+$/g, "");
    }
    , arrIndexOf = Array[protoProp].indexOf || function (item) {
      var
          i = 0
        , len = this.length
      ;
      for (; i < len; i++) {
        if (i in this && this[i] === item) {
          return i;
        }
      }
      return -1;
    }
    // Vendors: please allow content code to instantiate DOMExceptions
    , DOMEx = function (type, message) {
      this.name = type;
      this.code = DOMException[type];
      this.message = message;
    }
    , checkTokenAndGetIndex = function (classList, token) {
      if (token === "") {
        throw new DOMEx(
            "SYNTAX_ERR"
          , "An invalid or illegal string was specified"
        );
      }
      if (/\s/.test(token)) {
        throw new DOMEx(
            "INVALID_CHARACTER_ERR"
          , "String contains an invalid character"
        );
      }
      return arrIndexOf.call(classList, token);
    }
    , ClassList = function (elem) {
      var
          trimmedClasses = strTrim.call(elem.className)
        , classes = trimmedClasses ? trimmedClasses.split(/\s+/) : []
        , i = 0
        , len = classes.length
      ;
      for (; i < len; i++) {
        this.push(classes[i]);
      }
      this._updateClassName = function () {
        elem.className = this.toString();
      };
    }
    , classListProto = ClassList[protoProp] = []
    , classListGetter = function () {
      return new ClassList(this);
    }
  ;
  // Most DOMException implementations don't allow calling DOMException's toString()
  // on non-DOMExceptions. Error's toString() is sufficient here.
  DOMEx[protoProp] = Error[protoProp];
  classListProto.item = function (i) {
    return this[i] || null;
  };
  classListProto.contains = function (token) {
    token += "";
    return checkTokenAndGetIndex(this, token) !== -1;
  };
  classListProto.add = function (token) {
    token += "";
    if (checkTokenAndGetIndex(this, token) === -1) {
      this.push(token);
      this._updateClassName();
    }
  };
  classListProto.remove = function (token) {
    token += "";
    var index = checkTokenAndGetIndex(this, token);
    if (index !== -1) {
      this.splice(index, 1);
      this._updateClassName();
    }
  };
  classListProto.toggle = function (token) {
    token += "";
    if (checkTokenAndGetIndex(this, token) === -1) {
      this.add(token);
    } else {
      this.remove(token);
    }
  };
  classListProto.toString = function () {
    return this.join(" ");
  };

  if (objCtr.defineProperty) {
    var classListPropDesc = {
        get: classListGetter
      , enumerable: true
      , configurable: true
    };
    try {
      objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
    } catch (ex) { // IE 8 doesn't support enumerable:true
      if (ex.number === -0x7FF5EC54) {
        classListPropDesc.enumerable = false;
        objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
      }
    }
  } else if (objCtr[protoProp].__defineGetter__) {
    elemCtrProto.__defineGetter__(classListProp, classListGetter);
  }

  }(self));

  }
};

if ( (typeof RICKSHAW_NO_COMPAT !== "undefined" && !RICKSHAW_NO_COMPAT) || typeof RICKSHAW_NO_COMPAT === "undefined") {
  new FnordMetric.rickshaw.Compat.ClassList();
}
FnordMetric.rickshaw.namespace('FnordMetric.rickshaw.Graph');

FnordMetric.rickshaw.Graph = function(args) {

  this.element = args.element;
  this.series = args.series;

  this.defaults = {
    interpolation: 'cardinal',
    offset: 'zero',
    min: undefined,
    max: undefined,
  };

  FnordMetric.rickshaw.keys(this.defaults).forEach( function(k) {
    this[k] = args[k] || this.defaults[k];
  }, this );

  this.window = {};

  this.updateCallbacks = [];

  var self = this;

  this.initialize = function(args) {

    this.validateSeries(args.series);

    this.series.active = function() { return self.series.filter( function(s) { return !s.disabled } ) };

    this.setSize({ width: args.width, height: args.height });

    this.element.classList.add('fnordmetric_graph');
    this.vis = fnord3.select(this.element)
      .append("svg:svg")
      .attr('width', this.width)
      .attr('height', this.height);

    var renderers = [
      FnordMetric.rickshaw.Graph.Renderer.Stack,
      FnordMetric.rickshaw.Graph.Renderer.Line,
      FnordMetric.rickshaw.Graph.Renderer.Bar,
      FnordMetric.rickshaw.Graph.Renderer.Area
    ];

    renderers.forEach( function(r) {
      if (!r) return;
      self.registerRenderer(new r( { graph: self } ));
    } );

    this.setRenderer(args.renderer || 'stack', args);
    this.discoverRange();
  };

  this.validateSeries = function(series) {

    if (!(series instanceof Array) && !(series instanceof FnordMetric.rickshaw.Series)) {
      var seriesSignature = Object.prototype.toString.apply(series);
      throw "series is not an array: " + seriesSignature;
    }

    var pointsCount;

    series.forEach( function(s) {

      if (!(s instanceof Object)) {
        throw "series element is not an object: " + s;
      }
      if (!(s.data)) {
        throw "series has no data: " + JSON.stringify(s);
      }
      if (!(s.data instanceof Array)) {
        throw "series data is not an array: " + JSON.stringify(s.data);
      }

      pointsCount = pointsCount || s.data.length;

      if (pointsCount && s.data.length != pointsCount) {
        throw "series cannot have differing numbers of points: " +
          pointsCount + " vs " + s.data.length + "; see FnordMetric.rickshaw.Series.zeroFill()";
      }

      var dataTypeX = typeof s.data[0].x;
      var dataTypeY = typeof s.data[0].y;

      if (dataTypeX != 'number' || dataTypeY != 'number') {
        throw "x and y properties of points should be numbers instead of " +
          dataTypeX + " and " + dataTypeY;
      }
    } );
  };

  this.dataDomain = function() {

    // take from the first series
    var data = this.series[0].data;

    return [ data[0].x, data.slice(-1).shift().x ];

  };

  this.discoverRange = function() {

    var domain = this.renderer.domain();

    this.x = fnord3.scale.linear().domain(domain.x).range([0, this.width]);

    this.y = fnord3.scale.linear().domain(domain.y).range([this.height, 0]);
    this.y.magnitude = fnord3.scale.linear().domain(domain.y).range([0, this.height]);

  };

  this.render = function() {

    var stackedData = this.stackData();
    this.discoverRange();

    this.renderer.render();

    this.updateCallbacks.forEach( function(callback) {
      callback();
    } );
  };

  this.update = this.render;

  this.stackData = function() {

    var data = this.series.active()
      .map( function(d) { return d.data } )
      .map( function(d) { return d.filter( function(d) { return this._slice(d) }, this ) }, this);

    this.stackData.hooks.data.forEach( function(entry) {
      data = entry.f.apply(self, [data]);
    } );

    var layout = fnord3.layout.stack();
    layout.offset( self.offset );

    var stackedData = layout(data);

    this.stackData.hooks.after.forEach( function(entry) {
      stackedData = entry.f.apply(self, [data]);
    } );

    var i = 0;
    this.series.forEach( function(series) {
      if (series.disabled) return;
      series.stack = stackedData[i++];
    } );

    this.stackedData = stackedData;
    return stackedData;
  };

  this.stackData.hooks = { data: [], after: [] };

  this._slice = function(d) {

    if (this.window.xMin || this.window.xMax) {

      var isInRange = true;

      if (this.window.xMin && d.x < this.window.xMin) isInRange = false;
      if (this.window.xMax && d.x > this.window.xMax) isInRange = false;

      return isInRange;
    }

    return true;
  };

  this.onUpdate = function(callback) {
    this.updateCallbacks.push(callback);
  };

  this.registerRenderer = function(renderer) {
    this._renderers = this._renderers || {};
    this._renderers[renderer.name] = renderer;
  };

  this.configure = function(args) {

    if (args.width || args.height) {
      this.setSize(args);
    }

    FnordMetric.rickshaw.keys(this.defaults).forEach( function(k) {
      this[k] = args[k] || this.defaults[k];
    }, this );

    this.setRenderer(args.renderer || graph.renderer.name, args);
  };

  this.setRenderer = function(name, args) {

    if (!this._renderers[name]) {
      throw "couldn't find renderer " + name;
    }
    this.renderer = this._renderers[name];

    if (typeof args == 'object') {
      this.renderer.configure(args);
    }
  };

  this.setSize = function(args) {

    args = args || {};

    if (typeof window !== undefined) {
      var style = window.getComputedStyle(this.element, null);
      var elementWidth = parseInt(style.getPropertyValue('width'));
      var elementHeight = parseInt(style.getPropertyValue('height'));
    }

    this.width = args.width || elementWidth || 400;
    this.height = args.height || elementHeight || 250;

    this.vis && this.vis
      .attr('width', this.width)
      .attr('height', this.height);
  }

  this.initialize(args);
};

FnordMetric.rickshaw.namespace("FnordMetric.rickshaw.Color.Palette");

FnordMetric.rickshaw.Color.Palette = function(args) {

  var color = new FnordMetric.rickshaw.Fixtures.Color();

  args = args || {};
  this.schemes = {};

  this.scheme = color.schemes[args.scheme] || args.scheme || color.schemes.colorwheel;
  this.runningIndex = 0;

  this.color = function(key) {
    return this.scheme[key] || this.scheme[this.runningIndex++] || '#808080';
  };
};
FnordMetric.rickshaw.namespace('FnordMetric.rickshaw.Graph.Axis.Time');

FnordMetric.rickshaw.Graph.Axis.Time = function(args) {

  var self = this;

  this.graph = args.graph;
  this.elements = [];
  this.ticksTreatment = args.ticksTreatment || 'plain';
  this.fixedTimeUnit = args.timeUnit;

  this.appropriateTimeUnit = function() {
    var unit;
    var units = [
      { seconds: (86400) },
      { seconds: (3600 * 6) },
      { seconds: (3600) },
      { seconds: (60 * 15) },
      { seconds: (60) },
      { seconds: (15) },
      { seconds: (1) }
    ]

    var domain = this.graph.x.domain();
    var rangeSeconds = domain[1] - domain[0];

    units.forEach( function(u) {
      if (Math.floor(rangeSeconds / u.seconds) >= 2) {
        unit = unit || u;
      }
    } );

    return (unit || units[units.length - 1]);
  };

  this.tickOffsets = function() {

    var domain = this.graph.x.domain();

    var unit = this.fixedTimeUnit || this.appropriateTimeUnit();
    var count = Math.ceil((domain[1] - domain[0]) / unit.seconds);

    var runningTick = domain[0];

    var offsets = [];

    for (var i = 0; i < count; i++) {

      tickValue = (Math.ceil(runningTick / unit.seconds) * unit.seconds);
      runningTick = tickValue + unit.seconds / 2;

      offsets.push( { value: tickValue, unit: unit } );
    }

    return offsets;
  };

  this.render = function() {
    this.elements.forEach( function(e) {
      if (e.parentNode)
        e.parentNode.removeChild(e);
    } );

    this.elements = [];

    var offsets = this.tickOffsets();
    var domain = this.graph.x.domain();
    var rangeSeconds = domain[1] - domain[0];

    offsets.forEach( function(o) {

      if (self.graph.x(o.value) > self.graph.x.range()[1]) return;

      var element = document.createElement('div');
      element.style.left = self.graph.x(o.value) + 'px';
      element.classList.add('x_tick');
      element.classList.add(self.ticksTreatment);

      var title = document.createElement('div');
      title.classList.add('title');
      title.innerHTML = FnordMetric.util.dateFormatWithRange(o.value, rangeSeconds);
      element.appendChild(title);

      self.graph.element.appendChild(element);
      self.elements.push(element);

    } );
  };

  this.graph.onUpdate( function() { self.render() } );
};

FnordMetric.rickshaw.namespace('FnordMetric.rickshaw.Graph.Axis.Y');

FnordMetric.rickshaw.Graph.Axis.Y = function(args) {

  var self = this;
  var berthRate = 0.10;

  this.initialize = function(args) {

    this.graph = args.graph;
    this.orientation = args.orientation || 'right';

        var pixelsPerTick = 60;

    if(Math.floor(this.graph.height / pixelsPerTick) > 6){
      pixelsPerTick = Math.floor(this.graph.height / 6);
    }

    this.ticks = args.ticks || Math.floor(this.graph.height / pixelsPerTick);
    this.tickSize = args.tickSize || 4;
    this.ticksTreatment = args.ticksTreatment || 'plain';

    if (args.element) {

      this.element = args.element;
      this.vis = fnord3.select(args.element)
        .append("svg:svg")
        .attr('class', 'fnordmetric_graph y_axis');

      this.element = this.vis[0][0];
      this.element.style.position = 'relative';

      this.setSize({ width: args.width, height: args.height });

    } else {
      this.vis = this.graph.vis;
    }

    this.graph.onUpdate( function() { self.render() } );
  };

  this.setSize = function(args) {

    args = args || {};

    if (!this.element) return;

    if (typeof window !== undefined) {

      var style = window.getComputedStyle(this.element, null);
      var elementWidth = parseInt(style.getPropertyValue('width'));

      if (!args.auto) {
        var elementHeight = parseInt(style.getPropertyValue('height'));
      }
    }

    this.width = args.width || elementWidth || this.graph.width * berthRate;
    this.height = args.height || elementHeight || this.graph.height;

    this.vis
      .attr('width', this.width)
      .attr('height', this.height * (1 + berthRate));

    var berth = this.height * berthRate;
    this.element.style.top = -1 * berth + 'px';
    this.element.style.paddingTop = berth + 'px';
  };

  this.render = function() {

    if (this.graph.height !== this._renderHeight) this.setSize({ auto: true });

    var axis = fnord3.svg.axis().scale(this.graph.y).orient(this.orientation);
    axis.tickFormat( args.tickFormat || function(y) { return y } );

    if (this.orientation == 'left') {
      var transform = 'translate(' + this.width + ', 0)';
    }

    if (this.element) {
      this.vis.selectAll('*').remove();
    }

    this.vis
      .append("svg:g")
      .attr("class", ["y_ticks", this.ticksTreatment].join(" "))
      .attr("transform", transform)
      .call(axis.ticks(this.ticks).tickSubdivide(0).tickSize(this.tickSize))

    var gridSize = (this.orientation == 'right' ? 1 : -1) * this.graph.width;

    this.graph.vis
      .append("svg:g")
      .attr("class", "y_grid")
      .call(axis.ticks(this.ticks).tickSubdivide(0).tickSize(gridSize));

    this._renderHeight = this.graph.height;
  };

  this.initialize(args);
};

FnordMetric.rickshaw.namespace('FnordMetric.rickshaw.Graph.Behavior.Series.Highlight');

FnordMetric.rickshaw.Graph.Behavior.Series.Highlight = function(args) {

  this.graph = args.graph;
  this.legend = args.legend;

  var self = this;

  var colorSafe = {};

  this.addHighlightEvents = function (l) {
    l.element.addEventListener( 'mouseover', function(e) {

      self.legend.lines.forEach( function(line) {
        if (l === line) return;
        colorSafe[line.series.name] = colorSafe[line.series.name] || line.series.color;
        line.series.color = fnord3.interpolateRgb(line.series.color, fnord3.rgb('#d8d8d8'))(0.8).toString();
      } );

      self.graph.update();

    }, false );

    l.element.addEventListener( 'mouseout', function(e) {

      self.legend.lines.forEach( function(line) {
        if (colorSafe[line.series.name]) {
          line.series.color = colorSafe[line.series.name];
        }
      } );

      self.graph.update();

    }, false );
  };

  if (this.legend) {
    this.legend.lines.forEach( function(l) {
      self.addHighlightEvents(l);
    } );
  }

};
FnordMetric.rickshaw.namespace('FnordMetric.rickshaw.Graph.Behavior.Series.Toggle');

FnordMetric.rickshaw.Graph.Behavior.Series.Toggle = function(args) {

  this.graph = args.graph;
  this.legend = args.legend;

  var self = this;

  this.addAnchor = function(line) {
    var anchor = document.createElement('a');
    anchor.innerHTML = '&#10004;';
    anchor.classList.add('action');
    line.element.insertBefore(anchor, line.element.firstChild);

    anchor.onclick = function(e) {
      if (line.series.disabled) {
        line.series.enable();
        line.element.classList.remove('disabled');
      } else {
        line.series.disable();
        line.element.classList.add('disabled');
      }
    }

                var label = line.element.getElementsByTagName('span')[0];
                label.onclick = function(e){

                        var disableAllOtherLines = line.series.disabled;
                        if ( ! disableAllOtherLines ) {
                                for ( var i = 0; i < self.legend.lines.length; i++ ) {
                                        var l = self.legend.lines[i];
                                        if ( line.series === l.series ) {
                                                // noop
                                        } else if ( l.series.disabled ) {
                                                // noop
                                        } else {
                                                disableAllOtherLines = true;
                                                break;
                                        }
                                }
                        }

                        // show all or none
                        if ( disableAllOtherLines ) {

                                // these must happen first or else we try ( and probably fail ) to make a no line graph
                                line.series.enable();
                                line.element.classList.remove('disabled');

                                self.legend.lines.forEach(function(l){
                                        if ( line.series === l.series ) {
                                                // noop
                                        } else {
                                                l.series.disable();
                                                l.element.classList.add('disabled');
                                        }
                                });

                        } else {

                                self.legend.lines.forEach(function(l){
                                        l.series.enable();
                                        l.element.classList.remove('disabled');
                                });

                        }

                };

  };

  if (this.legend) {
    this.legend.lines.forEach( function(l) {
      self.addAnchor(l);
    } );
  }

  this._addBehavior = function() {

    this.graph.series.forEach( function(s) {

      s.disable = function() {

        if (self.graph.series.length <= 1) {
          throw('only one series left');
        }

        s.disabled = true;
        self.graph.update();
      };

      s.enable = function() {
        s.disabled = false;
        self.graph.update();
      };
    } );
  };
  this._addBehavior();

  this.updateBehaviour = function () { this._addBehavior() };

};
FnordMetric.rickshaw.namespace('FnordMetric.rickshaw.Graph.HoverDetail');

FnordMetric.rickshaw.Graph.HoverDetail = FnordMetric.rickshaw.Class.create({

  initialize: function(args) {

    var graph = this.graph = args.graph;

    this.xFormatter = args.xFormatter || function(x) {
      return FnordMetric.util.dateFormat(x);
    };

    this.yFormatter = args.yFormatter || function(y) {
      return y.toFixed(2);
    };

    var element = this.element = document.createElement('div');
    element.className = 'detail';

    if(args.no_detail){
      element.className = 'detail no_detail';
    }

    this.visible = true;
    graph.element.appendChild(element);

    this.lastEvent = null;
    this._addListeners();

    this.onShow = args.onShow;
    this.onHide = args.onHide;
    this.onRender = args.onRender;

    this.formatter = args.formatter || this.formatter;
  },

  formatter: function(series, x, y, formattedX, formattedY) {
    return series.name + ':&nbsp;' + formattedY;
  },

  update: function(e) {

    e = e || this.lastEvent;
    if (!e) return;
    this.lastEvent = e;

    if (e.target.nodeName != 'path' && e.target.nodeName != 'svg') return;

    var graph = this.graph;

    var eventX = e.offsetX || e.layerX;
    var eventY = e.offsetY || e.layerY;

    var domainX = graph.x.invert(eventX);
    var stackedData = graph.stackedData;

    var topSeriesData = stackedData.slice(-1).shift();

    var domainIndexScale = fnord3.scale.linear()
      .domain([topSeriesData[0].x, topSeriesData.slice(-1).shift().x])
      .range([0, topSeriesData.length]);

    var approximateIndex = Math.floor(domainIndexScale(domainX));
    var dataIndex = approximateIndex || 0;

    for (var i = approximateIndex; i < stackedData[0].length - 1;) {

      if (!stackedData[0][i] || !stackedData[0][i + 1]) {
        break;
      }

      if (stackedData[0][i].x <= domainX && stackedData[0][i + 1].x > domainX) {
        dataIndex = i;
        break;
      }
      if (stackedData[0][i + 1] < domainX) { i++ } else { i-- }
    }

    var domainX = stackedData[0][dataIndex].x;
    var formattedXValue = this.xFormatter(domainX);
    var graphX = graph.x(domainX);
    var order = 0;

    var detail = graph.series.active()
      .map( function(s) { return { order: order++, series: s, name: s.name, value: s.stack[dataIndex] } } );

    var activeItem;

    var sortFn = function(a, b) {
      return (a.value.y0 + a.value.y) - (b.value.y0 + b.value.y);
    };

    var domainMouseY = graph.y.magnitude.invert(graph.element.offsetHeight - eventY);

    detail.sort(sortFn).forEach( function(d) {

      d.formattedYValue = (this.yFormatter.constructor == Array) ?
        this.yFormatter[detail.indexOf(d)](d.value.y) :
        this.yFormatter(d.value.y);

      d.graphX = graphX;
      d.graphY = graph.y(d.value.y0 + d.value.y);

      if (domainMouseY > d.value.y0 && domainMouseY < d.value.y0 + d.value.y && !activeItem) {
        activeItem = d;
        d.active = true;
      }

    }, this );

    this.element.innerHTML = '';
    this.element.style.left = graph.x(domainX) + 'px';

    if (this.visible) {
      this.render( {
        detail: detail,
        domainX: domainX,
        formattedXValue: formattedXValue,
        mouseX: eventX,
        mouseY: eventY
      } );
    }
  },

  hide: function() {
    this.visible = false;
    this.element.classList.add('inactive');

    if (typeof this.onHide == 'function') {
      this.onHide();
    }
  },

  show: function() {
    this.visible = true;
    this.element.classList.remove('inactive');

    if (typeof this.onShow == 'function') {
      this.onShow();
    }
  },

  render: function(args) {

    var detail = args.detail;
    var domainX = args.domainX;

    var mouseX = args.mouseX;
    var mouseY = args.mouseY;

    var formattedXValue = args.formattedXValue;

    var xLabel = document.createElement('div');
    xLabel.className = 'x_label';
    xLabel.innerHTML = formattedXValue;
    this.element.appendChild(xLabel);

    detail.forEach( function(d) {

      var item = document.createElement('div');
      item.className = 'item';
      item.innerHTML = this.formatter(d.series, domainX, d.value.y, formattedXValue, d.formattedYValue);
      item.style.top = this.graph.y(d.value.y0 + d.value.y) + 'px';

      this.element.appendChild(item);

      var dot = document.createElement('div');
      dot.className = 'dot';
      dot.style.top = item.style.top;
      dot.style.borderColor = d.series.color;

      this.element.appendChild(dot);

      if (d.active) {
        item.className = 'item active';
        dot.className = 'dot active';
      }

    }, this );

    this.show();

    if (typeof this.onRender == 'function') {
      this.onRender(args);
    }
  },

  _addListeners: function() {

    this.graph.element.addEventListener(
      'mousemove',
      function(e) {
        this.visible = true;
        this.update(e)
      }.bind(this),
      false
    );

    this.graph.onUpdate( function() { this.update() }.bind(this) );

    this.graph.element.addEventListener(
      'mouseout',
      function(e) {
        if (e.relatedTarget && !(e.relatedTarget.compareDocumentPosition(this.graph.element) & Node.DOCUMENT_POSITION_CONTAINS)) {
          this.hide();
        }
       }.bind(this),
      false
    );
  }
});

FnordMetric.rickshaw.namespace('FnordMetric.rickshaw.Graph.Legend');

FnordMetric.rickshaw.Graph.Legend = function(args) {

  var element = this.element = args.element;
  var graph = this.graph = args.graph;

  var self = this;

  element.classList.add('fnordmetric_legend');

  var list = this.list = document.createElement('ul');
  element.appendChild(list);

  var series = graph.series
    .map( function(s) { return s } )
    .reverse();

  this.lines = [];

  this.addLine = function (series) {
    var line = document.createElement('li');
    line.className = 'line';

    var swatch = document.createElement('div');
    swatch.className = 'swatch';
    swatch.style.backgroundColor = series.color;

    line.appendChild(swatch);

    var label = document.createElement('span');
    label.className = 'label';
    label.innerHTML = series.name;

    line.appendChild(label);
    list.appendChild(line);

    line.series = series;

    if (series.noLegend) {
      line.style.display = 'none';
    }

    var _line = { element: line, series: series };
    if (self.shelving) {
      self.shelving.addAnchor(_line);
      self.shelving.updateBehaviour();
    }
    if (self.highlighter) {
      self.highlighter.addHighlightEvents(_line);
    }
    self.lines.push(_line);
  };

  series.forEach( function(s) {
    self.addLine(s);
  } );

  graph.onUpdate( function() {

  } );
};
FnordMetric.rickshaw.namespace("FnordMetric.rickshaw.Graph.Renderer");

FnordMetric.rickshaw.Graph.Renderer = FnordMetric.rickshaw.Class.create( {

  initialize: function(args) {
    this.graph = args.graph;
    this.tension = args.tension || this.tension;
    this.graph.unstacker = this.graph.unstacker || new FnordMetric.rickshaw.Graph.Unstacker( { graph: this.graph } );
    this.configure(args);
  },

  seriesPathFactory: function() {
    //implement in subclass
  },

  seriesStrokeFactory: function() {
    // implement in subclass
  },

  defaults: function() {
    return {
      tension: 0.8,
      strokeWidth: 2,
      unstack: true,
      padding: { top: 0.01, right: 0, bottom: 0.01, left: 0 },
      stroke: false,
      fill: false
    };
  },

  domain: function() {

    var values = [];
    var stackedData = this.graph.stackedData || this.graph.stackData();

    var topSeriesData = this.unstack ? stackedData : [ stackedData.slice(-1).shift() ];

    topSeriesData.forEach( function(series) {
      series.forEach( function(d) {
        values.push( d.y + d.y0 );
      } );
    } );

    var xMin = stackedData[0][0].x;
    var xMax = stackedData[0][ stackedData[0].length - 1 ].x;

    xMin -= (xMax - xMin) * this.padding.left;
    xMax += (xMax - xMin) * this.padding.right;

    var yMin = this.graph.min === 'auto' ? fnord3.min( values ) : this.graph.min || 0;
    var yMax = this.graph.max || fnord3.max( values );

    if (this.graph.min === 'auto' || yMin < 0) {
      yMin -= (yMax - yMin) * this.padding.bottom;
    }

    if (this.graph.max === undefined) {
      yMax += (yMax - yMin) * this.padding.top;
    }

    return { x: [xMin, xMax], y: [yMin, yMax] };
  },

  render: function() {

    var graph = this.graph;

    graph.vis.selectAll('*').remove();

    var nodes = graph.vis.selectAll("path")
      .data(this.graph.stackedData)
      .enter().append("svg:path")
      .attr("d", this.seriesPathFactory());

    var i = 0;
    graph.series.forEach( function(series) {
      if (series.disabled) return;
      series.path = nodes[0][i++];
      this._styleSeries(series);
    }, this );
  },

  _styleSeries: function(series, fm_opts) {

    var fill = this.fill ? series.color : 'none';
    var stroke = this.stroke ? series.color : 'none';

    series.path.setAttribute('fill', fill);
    series.path.setAttribute('stroke', stroke);
    if (fm_opts){
      series.path.setAttribute('stroke-width', fm_opts.stroke_width);
    } else {
      series.path.setAttribute('stroke-width', this.strokeWidth);
    }
    series.path.setAttribute('class', series.className);
  },

  configure: function(args) {

    args = args || {};

    FnordMetric.rickshaw.keys(this.defaults()).forEach( function(key) {

      if (!args.hasOwnProperty(key)) {
        this[key] = this[key] || this.graph[key] || this.defaults()[key];
        return;
      }

      if (typeof this.defaults()[key] == 'object') {

        FnordMetric.rickshaw.keys(this.defaults()[key]).forEach( function(k) {

          this[key][k] =
            args[key][k] !== undefined ? args[key][k] :
            this[key][k] !== undefined ? this[key][k] :
            this.defaults()[key][k];
        }, this );

      } else {
        this[key] =
          args[key] !== undefined ? args[key] :
          this[key] !== undefined ? this[key] :
          this.graph[key] !== undefined ? this.graph[key] :
          this.defaults()[key];
      }

    }, this );
  },

  setStrokeWidth: function(strokeWidth) {
    if (strokeWidth !== undefined) {
      this.strokeWidth = strokeWidth;
    }
  },

  setTension: function(tension) {
    if (tension !== undefined) {
      this.tension = tension;
    }
  }
} );

FnordMetric.rickshaw.namespace('FnordMetric.rickshaw.Graph.Renderer.Line');

FnordMetric.rickshaw.Graph.Renderer.Line = FnordMetric.rickshaw.Class.create( FnordMetric.rickshaw.Graph.Renderer, {

  name: 'line',

  defaults: function($super) {

    return FnordMetric.rickshaw.extend( $super(), {
      unstack: true,
      fill: false,
      stroke: true
    } );
  },

  seriesPathFactory: function() {

    var graph = this.graph;

    return fnord3.svg.line()
      .x( function(d) { return graph.x(d.x) } )
      .y( function(d) { return graph.y(d.y) } )
      .interpolate(this.graph.interpolation).tension(this.tension);
  },


  render: function() {

    if(this.graph.stackedData[0].length < 42){
      var fm_opts = { stroke_width: 3, draw_points: true };
    } else if(this.graph.stackedData[0].length < 99){
      var fm_opts = { stroke_width: 2, draw_points: false };
    } else {
      var fm_opts = { stroke_width: 1, draw_points: false };
    }

    var graph = this.graph;

    graph.vis.selectAll('*').remove();

    var nodes = graph.vis.selectAll("path")
      .data(this.graph.stackedData)
      .enter().append("svg:path")
      .attr("d", this.seriesPathFactory());

    if(fm_opts.draw_points){
    }

    var i = 0;
    graph.series.forEach( function(series) {
      if (series.disabled) return;
      series.path = nodes[0][i++];
      this._styleSeries(series, fm_opts);
    }, this );

  },

} );

FnordMetric.rickshaw.namespace('FnordMetric.rickshaw.Graph.Renderer.Stack');

FnordMetric.rickshaw.Graph.Renderer.Stack = FnordMetric.rickshaw.Class.create( FnordMetric.rickshaw.Graph.Renderer, {

  name: 'stack',

  defaults: function($super) {

    return FnordMetric.rickshaw.extend( $super(), {
      fill: true,
      stroke: false,
      unstack: false,
    } );
  },

  seriesPathFactory: function() {

    var graph = this.graph;

    return fnord3.svg.area()
      .x( function(d) { return graph.x(d.x) } )
      .y0( function(d) { return graph.y(d.y0) } )
      .y1( function(d) { return graph.y(d.y + d.y0) } )
      .interpolate(this.graph.interpolation).tension(this.tension);
  },

  render: function() {
    var graph = this.graph;

    graph.vis.selectAll('*').remove();

    var nodes = graph.vis.selectAll("path")
      .data(this.graph.stackedData)
      .enter().append("svg:path")
      .attr("d", this.seriesPathFactory());

    var i = 0;
    graph.series.forEach( function(series) {
      if (series.disabled) return;
      series.path = nodes[0][i++];
      this._styleSeries(series);
    }, this );
  },

  _styleSeries: function(series, fm_opts) {

    var fill = this.fill ? series.color : 'none';
    var stroke = this.stroke ? series.color : 'none';

    series.path.setAttribute('fill', fnord3.interpolateRgb(fill, 'white')(0.125))
    series.path.setAttribute('stroke', stroke);
    if (fm_opts){
      series.path.setAttribute('stroke-width', fm_opts.stroke_width);
    } else {
      series.path.setAttribute('stroke-width', this.strokeWidth);
    }
    series.path.setAttribute('class', series.className);
  },


} );

FnordMetric.rickshaw.namespace('FnordMetric.rickshaw.Graph.Renderer.Bar');

FnordMetric.rickshaw.Graph.Renderer.Bar = FnordMetric.rickshaw.Class.create( FnordMetric.rickshaw.Graph.Renderer, {

  name: 'bar',

  defaults: function($super) {

    var defaults = FnordMetric.rickshaw.extend( $super(), {
      gapSize: 0.10,
      unstack: false,
    } );

    delete defaults.tension;
    return defaults;
  },

  initialize: function($super, args) {
    args = args || {};
    this.gapSize = args.gapSize || this.gapSize;
    this.xPadding = args.xPadding || 50;
    $super(args);
  },

  domain: function($super) {

    var domain = $super();

    var frequentInterval = this._frequentInterval();
    domain.x[1] += parseInt(frequentInterval.magnitude);

    return domain;
  },

  barWidth: function() {
    var stackedData = this.graph.stackedData || this.graph.stackData();
    var data = stackedData.slice(-1).shift();

    var frequentInterval = this._frequentInterval();
    var barWidth = this.graph.x(data[0].x + frequentInterval.magnitude * (1 - this.gapSize));

    return ((this.graph.width - (this.xPadding * 2)) / data.length);
  },

  render: function() {

    var graph = this.graph;

    graph.vis.selectAll('*').remove();

    var barWidth = this.barWidth();
    var barXOffset = 0;

    var activeSeriesCount = graph.series.filter( function(s) { return !s.disabled; } ).length;
    var seriesBarWidth = this.unstack ? barWidth / activeSeriesCount : barWidth;

    graph.series.forEach( function(series) {

      if (series.disabled) return;

      var xpad = this.xPadding;

      var seriesBarDrawWidth = Math.min(60,
        parseInt(seriesBarWidth * (1 - this.gapSize)));

      if(parseInt(seriesBarWidth) == seriesBarDrawWidth){
        seriesBarDrawWidth -= 1;
      }

      var seriesBarDrawPadding = (seriesBarWidth - seriesBarDrawWidth) / 2;

      var nodes = graph.vis.selectAll("path")
        .data(series.stack)
        .enter().append("svg:rect")
        .attr("x", function(d) { return xpad + (d.x * seriesBarWidth) + seriesBarDrawPadding })
        .attr("y", function(d) { return graph.y(d.y0 + d.y) })
        .attr("width", seriesBarDrawWidth)
        .attr("stroke", "#000")
        .attr("stroke-width", "1px")
        .attr("stroke-opacity", "0.6")
        .attr("height", function(d) { return graph.y.magnitude(d.y) });


      var sdata = series.stack;

      for(var ind=0; ind < sdata.length; ind++){
        $(graph.element).append(
          $("<div>")
            .css("position", "absolute")
            .css("color", "#666")
            .css("width", seriesBarWidth)
            .css("textAlign", "center")
            .css("marginTop", "5px")
            .css("marginLeft", xpad + (sdata[ind].x * seriesBarWidth))
            .css("y", graph.height)
            .html(sdata[ind].label)
        );
        //
      }

      Array.prototype.forEach.call(nodes[0], function(n) {
        n.setAttribute('fill', series.color);
      } );


      var total = $('.ui_numbers .samples').data('value');
      $('.widget_histogram_bars .tooltip').remove();
      $('.widget_histogram_bars rect').each(function(hist_i) {
        var percentage = Math.round(sdata[hist_i].y * 1000 / total) / 10;
        var left = parseInt($(this).offset().left);
        var top = parseInt($(this).offset().top) - 23;
        var tooltip = '<div class="tooltip" data-hist-id="' + hist_i
          + '" style="left:' + left + 'px; top: ' + top + 'px">'
          + sdata[hist_i].y + ' (' + percentage + '%)' + '</div>';
        $(this).parents('.widget_histogram_bars:first').append(tooltip);
        $(this).attr('data-id', hist_i);
      });

      $('.widget_histogram_bars rect').hover(function() {
        $('.widget_histogram_bars .tooltip[data-hist-id=' +
          $(this).attr('data-id') + ']').show();
      }, function() {
        $('.widget_histogram_bars .tooltip[data-hist-id=' +
          $(this).attr('data-id') + ']').fadeOut();
      });


    }, this );
  },

  _frequentInterval: function() {

    var stackedData = this.graph.stackedData || this.graph.stackData();
    var data = stackedData.slice(-1).shift();

    var intervalCounts = {};

    for (var i = 0; i < data.length - 1; i++) {
      var interval = data[i + 1].x - data[i].x;
      intervalCounts[interval] = intervalCounts[interval] || 0;
      intervalCounts[interval]++;
    }

    var frequentInterval = { count: 0 };

    FnordMetric.rickshaw.keys(intervalCounts).forEach( function(i) {
      if (frequentInterval.count < intervalCounts[i]) {

        frequentInterval = {
          count: intervalCounts[i],
          magnitude: i
        };
      }
    } );

    this._frequentInterval = function() { return frequentInterval };

    return frequentInterval;
  }
} );

FnordMetric.rickshaw.namespace('FnordMetric.rickshaw.Graph.Renderer.Area');

FnordMetric.rickshaw.Graph.Renderer.Area = FnordMetric.rickshaw.Class.create( FnordMetric.rickshaw.Graph.Renderer, {

  name: 'area',

  defaults: function($super) {

    return FnordMetric.rickshaw.extend( $super(), {
      unstack: false,
      fill: false,
      stroke: false
    } );
  },

  seriesPathFactory: function() {

    var graph = this.graph;

    return fnord3.svg.area()
      .x( function(d) { return graph.x(d.x) } )
      .y0( function(d) { return graph.y(d.y0) } )
      .y1( function(d) { return graph.y(d.y + d.y0) } )
      .interpolate(graph.interpolation).tension(this.tension);
  },

  seriesStrokeFactory: function() {

    var graph = this.graph;

    return fnord3.svg.line()
      .x( function(d) { return graph.x(d.x) } )
      .y( function(d) { return graph.y(d.y + d.y0) } )
      .interpolate(graph.interpolation).tension(this.tension);
  },

  render: function() {

    var graph = this.graph;

    graph.vis.selectAll('*').remove();

    if(this.graph.stackedData[0].length < 42){
      var fm_opts = { stroke_width: 3 };
    } else {
      var fm_opts = { stroke_width: 1 };
    }

    var nodes = graph.vis.selectAll("path")
      .data(this.graph.stackedData)
      .enter().insert("svg:g", 'g');

    nodes.append("svg:path")
      .attr("d", this.seriesPathFactory())
      .attr("class", 'area');

    if (this.stroke) {
      nodes.append("svg:path")
        .attr("d", this.seriesStrokeFactory())
        .attr("class", 'line');
    }

    var i = 0;
    graph.series.forEach( function(series) {
      if (series.disabled) return;
      series.path = nodes[0][i++];
      this._styleSeries(series, fm_opts);
    }, this );
  },

  _styleSeries: function(series, fm_opts) {

    if (!series.path) return;

    fnord3.select(series.path).select('.area')
      .attr('opacity', '0.65')
      .attr('fill', series.color);

    fnord3.select(series.path).select('.line')
      .attr('fill', 'none')
      .attr('stroke', fnord3.interpolateRgb(series.color, 'white')(0.125))
      .attr('stroke-width', fm_opts.stroke_width);

    if (series.className) {
      series.path.setAttribute('class', series.className);
    }
  }
} );

FnordMetric.rickshaw.namespace('FnordMetric.rickshaw.Graph.Unstacker');

FnordMetric.rickshaw.Graph.Unstacker = function(args) {

  this.graph = args.graph;
  var self = this;

  this.graph.stackData.hooks.after.push( {
    name: 'unstacker',
    f: function(data) {

      if (!self.graph.renderer.unstack) return data;

      data.forEach( function(seriesData) {
        seriesData.forEach( function(d) {
          d.y0 = 0;
        } );
      } );

      return data;
    }
  } );
};

FnordMetric.rickshaw.namespace('FnordMetric.rickshaw.Series');

FnordMetric.rickshaw.Series = FnordMetric.rickshaw.Class.create( Array, {

  initialize: function (data, palette, options) {

    options = options || {}

    this.palette = new FnordMetric.rickshaw.Color.Palette(palette);

    this.timeBase = typeof(options.timeBase) === 'undefined' ?
      Math.floor(new Date().getTime() / 1000) :
      options.timeBase;

    if (data && (typeof(data) == "object") && (data instanceof Array)) {
      data.forEach( function(item) { this.addItem(item) }, this );
    }
  },

  addItem: function(item) {

    if (typeof(item.name) === 'undefined') {
      throw('addItem() needs a name');
    }

    item.color = (item.color || this.palette.color(item.name));
    item.data = (item.data || []);

    // backfill, if necessary
    if ((item.data.length == 0) && this.length && (this.getIndex() > 0)) {
      this[0].data.forEach( function(plot) {
        item.data.push({ x: plot.x, y: 0 });
      } );
    } else if (item.data.length == 0) {
      item.data.push({ x: this.timeBase - (this.timeInterval || 0), y: 0 });
    }

    this.push(item);

    if (this.legend) {
      this.legend.addLine(this.itemByName(item.name));
    }
  },

  addData: function(data) {

    var index = this.getIndex();

    FnordMetric.rickshaw.keys(data).forEach( function(name) {
      if (! this.itemByName(name)) {
        this.addItem({ name: name });
      }
    }, this );

    this.forEach( function(item) {
      item.data.push({
        x: (index * this.timeInterval || 1) + this.timeBase,
        y: (data[item.name] || 0)
      });
    }, this );
  },

  getIndex: function () {
    return (this[0] && this[0].data && this[0].data.length) ? this[0].data.length : 0;
  },

  itemByName: function(name) {

    for (var i = 0; i < this.length; i++) {
      if (this[i].name == name)
        return this[i];
    }
  },

  setTimeInterval: function(iv) {
    this.timeInterval = iv / 1000;
  },

  setTimeBase: function (t) {
    this.timeBase = t;
  },

  dump: function() {

    var data = {
      timeBase: this.timeBase,
      timeInterval: this.timeInterval,
      items: [],
    };

    this.forEach( function(item) {

      var newItem = {
        color: item.color,
        name: item.name,
        data: []
      };

      item.data.forEach( function(plot) {
        newItem.data.push({ x: plot.x, y: plot.y });
      } );

      data.items.push(newItem);
    } );

    return data;
  },

  load: function(data) {

    if (data.timeInterval) {
      this.timeInterval = data.timeInterval;
    }

    if (data.timeBase) {
      this.timeBase = data.timeBase;
    }

    if (data.items) {
      data.items.forEach( function(item) {
        this.push(item);
        if (this.legend) {
          this.legend.addLine(this.itemByName(item.name));
        }

      }, this );
    }
  }
} );
